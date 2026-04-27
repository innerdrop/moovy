/**
 * Admin: Cancel any order from any state
 * POST /api/admin/orders/:id/cancel
 * Requires ADMIN role + admin password confirmation
 *
 * - Cancels the order regardless of current status
 * - Frees the assigned driver (if any)
 * - Restores stock for order items
 * - Returns used points to buyer
 * - Logs the cancellation in audit
 * - Notifies all parties via Socket.IO + Push
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { socketEmitToRooms } from "@/lib/socket-emit";
import logger from "@/lib/logger";
import bcrypt from "bcryptjs";

const cancelLogger = logger.child({ context: "admin-order-cancel" });

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: orderId } = await params;

    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json();
        const { password, reason } = body;

        if (!password) {
            return NextResponse.json({ error: "Se requiere contraseña de administrador" }, { status: 400 });
        }

        // Verify admin password
        const adminUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, password: true, name: true },
        });

        if (!adminUser?.password) {
            return NextResponse.json({ error: "Error de autenticación" }, { status: 401 });
        }

        const passwordValid = await bcrypt.compare(password, adminUser.password);
        if (!passwordValid) {
            cancelLogger.warn({ adminId: session.user.id, orderId }, "Admin cancel: wrong password");
            return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 403 });
        }

        // Fetch the order with all needed relations
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { select: { productId: true, quantity: true, listingId: true } },
                merchant: { select: { id: true, name: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.status === "CANCELLED" || order.status === "REJECTED") {
            return NextResponse.json({ error: "El pedido ya está cancelado/rechazado" }, { status: 400 });
        }

        const previousStatus = order.status;

        // Use transaction for atomicity
        await prisma.$transaction(async (tx) => {
            // 1. Cancel the order
            await tx.order.update({
                where: { id: orderId },
                data: {
                    status: "CANCELLED",
                    deliveryStatus: null,
                    adminNotes: [
                        order.adminNotes,
                        `[CANCELADO POR ADMIN] ${adminUser.name} - ${new Date().toLocaleString("es-AR")}${reason ? ` - Motivo: ${reason}` : ""}`,
                    ].filter(Boolean).join("\n"),
                },
            });

            // 2. Cancel all sub-orders
            await tx.subOrder.updateMany({
                where: { orderId },
                data: { status: "CANCELLED" },
            });

            // 3. Free the driver if assigned
            if (order.driverId) {
                // Check if driver has other active orders
                const otherActiveOrders = await tx.order.count({
                    where: {
                        driverId: order.driverId,
                        id: { not: orderId },
                        status: { in: ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP", "READY"] },
                    },
                });
                if (otherActiveOrders === 0) {
                    await tx.driver.update({
                        where: { id: order.driverId },
                        data: { availabilityStatus: "DISPONIBLE" },
                    });
                }
            }

            // 4. Restore stock for product items
            for (const item of order.items) {
                if (item.productId) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
                if (item.listingId) {
                    await tx.listing.update({
                        where: { id: item.listingId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
            }

            // 5. Return points if discount was from points (check PointsTransaction)
            if (order.discount && order.discount > 0) {
                const pointsTx = await tx.pointsTransaction.findFirst({
                    where: { orderId, type: "REDEEM" },
                    select: { amount: true },
                });
                if (pointsTx && pointsTx.amount < 0) {
                    const pointsToRestore = Math.abs(pointsTx.amount);
                    await tx.user.update({
                        where: { id: order.userId },
                        data: { pointsBalance: { increment: pointsToRestore } },
                    });
                    // Log reversal
                    await tx.pointsTransaction.create({
                        data: {
                            userId: order.userId,
                            orderId,
                            type: "REFUND",
                            amount: pointsToRestore,
                            balanceAfter: 0, // Will be recalculated
                            description: `Devolución por cancelación admin de pedido #${order.orderNumber}`,
                        },
                    });
                    cancelLogger.info({ orderId, userId: order.userId, points: pointsToRestore }, "Points restored on admin cancel");
                }
            }

            // 6. Clean up pending assignments
            await tx.pendingAssignment.deleteMany({
                where: { orderId },
            });
        });

        // Audit log
        cancelLogger.info({
            orderId,
            orderNumber: order.orderNumber,
            previousStatus,
            adminId: session.user.id,
            adminName: adminUser.name,
            reason: reason || "Sin motivo especificado",
        }, "Order cancelled by admin");

        // Notify buyer
        // fix/refund-automatico: refund automático si el pedido estaba pagado.
        import("@/lib/order-refund").then(({ refundOrderIfPaid }) => {
            refundOrderIfPaid(orderId, {
                triggeredBy: "admin",
                actorId: session.user?.id ?? null,
                reason: reason || "Cancelado por administrador",
            }).catch((err) => console.error("[admin-cancel] refund failed:", err));
        }).catch(() => { /* import safety */ });

        notifyBuyer(order.userId, "CANCELLED", order.orderNumber, { orderId })
            .catch(err => cancelLogger.error({ err: err instanceof Error ? err.message : String(err) }, "Push notification error"));

        // Socket notifications to all parties
        const socketData = {
            orderId,
            orderNumber: order.orderNumber,
            status: "CANCELLED",
            cancelledBy: "admin",
            reason: reason || undefined,
        };

        const rooms = [
            `order:${orderId}`,
            `customer:${order.userId}`,
            ...(order.merchantId ? [`merchant:${order.merchantId}`] : []),
            ...(order.driverId ? [`driver:${order.driverId}`] : []),
            "admin:orders",
        ];

        socketEmitToRooms(rooms, "order_status_changed", socketData).catch(console.error);

        return NextResponse.json({
            success: true,
            message: `Pedido #${order.orderNumber} cancelado correctamente`,
        });
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        cancelLogger.error({ error: errMsg, orderId }, "Error cancelling order");
        return NextResponse.json({ error: "Error al cancelar el pedido" }, { status: 500 });
    }
}
