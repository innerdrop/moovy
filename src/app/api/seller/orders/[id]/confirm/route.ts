// API Route: Seller confirms an order (immediate or scheduled)
// POST /api/seller/orders/[id]/confirm
// Protected: requires SELLER role

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { startAssignmentCycle, startSubOrderAssignmentCycle } from "@/lib/assignment-engine";

/** Emit a socket event (fire-and-forget) */
async function emitSocket(event: string, room: string, data: Record<string, unknown>): Promise<void> {
    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
    await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ event, room, data }),
    }).catch(() => {});
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["SELLER"])) {
            return NextResponse.json({ error: "Se requiere rol SELLER" }, { status: 403 });
        }

        const { id: subOrderId } = await params;

        // Find seller profile
        const sellerProfile = await prisma.sellerProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });

        if (!sellerProfile) {
            return NextResponse.json({ error: "Perfil de vendedor no encontrado" }, { status: 404 });
        }

        // Find the SubOrder and verify ownership
        const subOrder = await prisma.subOrder.findFirst({
            where: {
                id: subOrderId,
                sellerId: sellerProfile.id,
            },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        userId: true,
                        deliveryType: true,
                        scheduledConfirmedAt: true,
                        scheduledSlotStart: true,
                        scheduledSlotEnd: true,
                        status: true,
                        isMultiVendor: true,
                        subOrders: {
                            select: {
                                id: true,
                                status: true,
                                sellerId: true,
                                merchantId: true,
                            },
                        },
                    },
                },
            },
        });

        if (!subOrder) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        const order = subOrder.order;

        // Check if order is cancelled
        if (order.status === "CANCELLED") {
            return NextResponse.json({ error: "Este pedido fue cancelado" }, { status: 400 });
        }

        // CASE 1: SCHEDULED order
        if (order.deliveryType === "SCHEDULED") {
            if (order.scheduledConfirmedAt) {
                return NextResponse.json({ error: "Este pedido ya fue confirmado" }, { status: 400 });
            }

            const now = new Date();
            const slotStart = order.scheduledSlotStart!;
            const msUntilSlot = slotStart.getTime() - now.getTime();
            const minutesUntilSlot = msUntilSlot / (60 * 1000);

            // Update order: mark as confirmed by seller
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    scheduledConfirmedAt: now,
                    status: "SCHEDULED_CONFIRMED",
                },
            });

            // Format slot time for notification
            const slotTime = slotStart.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });
            const slotDate = slotStart.toLocaleDateString("es-AR", {
                weekday: "short",
                day: "numeric",
                month: "short",
            });

            // Notify buyer
            notifyBuyer(order.userId, "SCHEDULED_CONFIRMED", order.orderNumber, { orderId: order.id }).catch((err) =>
                console.error("[SellerConfirm] Buyer push error:", err)
            );

            // Notify admin via socket
            emitSocket("order_status_changed", "admin:orders", {
                orderId: order.id,
                orderNumber: order.orderNumber,
                status: "SCHEDULED_CONFIRMED",
            }).catch((err) => console.error("[SellerConfirm] Admin socket error:", err));

            // If slot is within 45 minutes, start assignment cycle immediately
            let assignmentStarted = false;
            if (minutesUntilSlot <= 45) {
                // Move to PENDING and start assignment
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: "PENDING" },
                });

                const result = await startAssignmentCycle(order.id);
                assignmentStarted = result.success;

                if (!result.success) {
                    console.warn(`[SellerConfirm] Assignment failed for ${order.orderNumber}: ${result.error}`);
                }
            }

            return NextResponse.json({
                success: true,
                orderNumber: order.orderNumber,
                scheduledConfirmedAt: now.toISOString(),
                assignmentStarted,
                message: assignmentStarted
                    ? `Pedido confirmado. Se está buscando un repartidor para las ${slotTime}.`
                    : `Pedido confirmado para el ${slotDate} a las ${slotTime}. El repartidor se asignará más cerca del horario.`,
            });
        }

        // CASE 2: IMMEDIATE order
        if (order.deliveryType === "IMMEDIATE" && order.status === "PENDING") {
            // BUG #10 FIX: Use conditional update to prevent race condition on SubOrder status
            const updateResult = await prisma.subOrder.updateMany({
                where: {
                    id: subOrderId,
                    status: "PENDING",  // Only update if currently PENDING
                },
                data: { status: "CONFIRMED" },
            });

            if (updateResult.count === 0) {
                return NextResponse.json(
                    { error: "Este pedido ya fue confirmado o está en otro estado" },
                    { status: 400 }
                );
            }

            // Check if ALL SubOrders are now confirmed to advance parent Order
            // Note: merchant SubOrders go to "PREPARING", seller SubOrders go to "CONFIRMED"
            // Both mean the vendor has acknowledged the order
            const allConfirmed = order.subOrders.every((sub) =>
                sub.id === subOrderId || sub.status === "CONFIRMED" || sub.status === "PREPARING"
            );

            if (allConfirmed) {
                // Move parent order to CONFIRMED
                await prisma.order.update({
                    where: { id: order.id },
                    data: { status: "CONFIRMED" },
                });

                // Notify buyer
                notifyBuyer(order.userId, "CONFIRMED", order.orderNumber, { orderId: order.id }).catch((err) =>
                    console.error("[SellerConfirm] Buyer push error:", err)
                );

                // Start assignment cycle for immediate delivery
                let assignmentStarted = false;
                try {
                    if (order.isMultiVendor && order.subOrders.length > 1) {
                        // Multi-vendor: assign per SubOrder independently
                        const results = await Promise.all(
                            order.subOrders.map((so) => startSubOrderAssignmentCycle(so.id))
                        );
                        assignmentStarted = results.some((r) => r.success);
                        results.filter((r) => !r.success).forEach((r) => {
                            console.warn(`[SellerConfirm] SubOrder assignment failed: ${r.error}`);
                        });
                    } else {
                        const result = await startAssignmentCycle(order.id);
                        assignmentStarted = result.success;
                        if (!result.success) {
                            console.warn(`[SellerConfirm] Assignment failed for ${order.orderNumber}: ${result.error}`);
                        }
                    }
                } catch (err) {
                    console.error("[SellerConfirm] Error starting assignment:", err);
                }

                // Notify admin via socket
                emitSocket("order_status_changed", "admin:orders", {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    status: "CONFIRMED",
                }).catch((err) => console.error("[SellerConfirm] Admin socket error:", err));
            }

            return NextResponse.json({
                success: true,
                orderNumber: order.orderNumber,
                message: allConfirmed
                    ? "Pedido confirmado. Se está buscando un repartidor..."
                    : "Tu parte del pedido ha sido confirmada. Esperando confirmación de otros vendedores...",
            });
        }

        return NextResponse.json(
            { error: `No se puede confirmar un pedido en estado ${order.status}` },
            { status: 400 }
        );

    } catch (error) {
        console.error("[SellerConfirm] Error:", error);
        return NextResponse.json(
            { error: "Error al confirmar el pedido" },
            { status: 500 }
        );
    }
}
