// API Route: Seller confirms a scheduled order
// POST /api/seller/orders/[id]/confirm-scheduled
// Protected: requires SELLER role

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { startAssignmentCycle } from "@/lib/assignment-engine";
import { sendPushToUser } from "@/lib/push";

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
    });
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
                    },
                },
            },
        });

        if (!subOrder) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        const order = subOrder.order;

        if (order.deliveryType !== "SCHEDULED") {
            return NextResponse.json({ error: "Este pedido no es programado" }, { status: 400 });
        }

        if (order.scheduledConfirmedAt) {
            return NextResponse.json({ error: "Este pedido ya fue confirmado" }, { status: 400 });
        }

        if (order.status === "CANCELLED") {
            return NextResponse.json({ error: "Este pedido fue cancelado" }, { status: 400 });
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
            console.error("[ConfirmScheduled] Buyer push error:", err)
        );

        // Notify admin via socket
        emitSocket("order_status_changed", "admin:orders", {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: "SCHEDULED_CONFIRMED",
        }).catch((err) => console.error("[ConfirmScheduled] Admin socket error:", err));

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
                console.warn(`[ConfirmScheduled] Assignment failed for ${order.orderNumber}: ${result.error}`);
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
    } catch (error) {
        console.error("[ConfirmScheduled] Error:", error);
        return NextResponse.json(
            { error: "Error al confirmar el pedido programado" },
            { status: 500 }
        );
    }
}
