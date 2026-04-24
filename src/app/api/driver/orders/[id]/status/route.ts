// API Route: Update Driver Delivery Status
// Allows a driver to update the delivery status of their order
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyBuyer, notifyBuyerDeliveryPin } from "@/lib/notifications";
import { socketEmitToRooms } from "@/lib/socket-emit";
import { awardOrderPointsIfDelivered } from "@/lib/points";
import { sendOrderOnTheWayEmail, sendPointsEarnedEmail } from "@/lib/email-legal-ux";
import { getUserLevel } from "@/lib/points";
import { requireDriverApi } from "@/lib/driver-auth";
import logger from "@/lib/logger";

const statusLogger = logger.child({ context: "driver-delivery-status" });

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { driver, isAdmin } = authResult;

        const { id: orderId } = await params;
        const { deliveryStatus } = await request.json();

        if (!driver && !isAdmin) {
            return NextResponse.json({ error: "No sos conductor registrado" }, { status: 403 });
        }

        // Verify order belongs to this driver
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (driver && order.driverId !== driver.id && !isAdmin) {
            return NextResponse.json({ error: "Este pedido no está asignado a vos" }, { status: 403 });
        }

        // ISSUE-001: PIN doble de entrega — bloquear transiciones sin PIN verificado.
        // Admin puede saltar el chequeo (para casos de emergencia manual).
        const isAdminOverride = isAdmin;
        if (!isAdminOverride && !order.isPickup) {
            // PICKED_UP requiere pickupPin verificado (driver retiró del comercio)
            if (deliveryStatus === "PICKED_UP" && order.pickupPin && !order.pickupPinVerifiedAt) {
                statusLogger.warn(
                    { orderId, driverId: driver?.id },
                    "Blocked PICKED_UP transition: pickup PIN not verified"
                );
                return NextResponse.json(
                    {
                        error: "Ingresá el PIN de retiro del comercio antes de marcar como retirado",
                        errorCode: "PICKUP_PIN_REQUIRED",
                    },
                    { status: 409 }
                );
            }

            // DELIVERED requiere deliveryPin verificado (driver entregó al comprador)
            if (deliveryStatus === "DELIVERED" && order.deliveryPin && !order.deliveryPinVerifiedAt) {
                statusLogger.warn(
                    { orderId, driverId: driver?.id },
                    "Blocked DELIVERED transition: delivery PIN not verified"
                );
                return NextResponse.json(
                    {
                        error: "Ingresá el PIN de entrega del comprador antes de marcar como entregado",
                        errorCode: "DELIVERY_PIN_REQUIRED",
                    },
                    { status: 409 }
                );
            }
        }

        // Validate state transitions for deliveryStatus
        const validTransitions: Record<string, string[]> = {
            DRIVER_ASSIGNED: ["DRIVER_ARRIVED"],  // ISSUE-007: secuencia estricta, sin skip
            DRIVER_ARRIVED: ["PICKED_UP"],
            PICKED_UP: ["DELIVERED"],
            DELIVERED: [],
        };

        // Use deliveryStatus field; fallback to DRIVER_ASSIGNED if not set
        const currentDeliveryStatus = order.deliveryStatus || "DRIVER_ASSIGNED";
        const allowedNextStates = validTransitions[currentDeliveryStatus] || [];

        statusLogger.info({
            orderId,
            orderStatus: order.status,
            currentDeliveryStatus,
            rawDeliveryStatus: order.deliveryStatus,
            requestedNext: deliveryStatus,
            allowed: allowedNextStates,
        }, "Delivery status transition attempt");

        if (!allowedNextStates.includes(deliveryStatus)) {
            statusLogger.warn({
                orderId,
                orderStatus: order.status,
                currentDeliveryStatus,
                rawDeliveryStatus: order.deliveryStatus,
                requestedNext: deliveryStatus,
                allowed: allowedNextStates,
            }, "Invalid delivery status transition");
            return NextResponse.json(
                {
                    error: `Transición inválida: ${currentDeliveryStatus} → ${deliveryStatus}`,
                    current: currentDeliveryStatus,
                    allowed: allowedNextStates,
                },
                { status: 400 }
            );
        }

        // Update delivery status AND sync order.status to match
        const updateData: any = { deliveryStatus };

        // Keep order.status in sync with deliveryStatus for consistency
        if (deliveryStatus === "DRIVER_ARRIVED") {
            updateData.status = "DRIVER_ARRIVED";
        } else if (deliveryStatus === "PICKED_UP") {
            updateData.status = "PICKED_UP";
        } else if (deliveryStatus === "DELIVERED") {
            updateData.status = "DELIVERED";
            updateData.deliveredAt = new Date();

            // Increment driver's delivery count (only if it's a driver, not admin override)
            if (driver) {
                await prisma.driver.update({
                    where: { id: driver.id },
                    data: { totalDeliveries: { increment: 1 } },
                });
            }
        }

        await prisma.order.update({
            where: { id: orderId },
            data: updateData,
        });

        // FIX 2026-04-15: otorgar puntos MOOVER s\u00f3lo ahora que pas\u00f3 a DELIVERED (Biblia v3).
        // Idempotente: si ya se otorgaron (Order.pointsEarned !== null), no hace nada.
        if (deliveryStatus === "DELIVERED") {
            try {
                const result = await awardOrderPointsIfDelivered(orderId);
                statusLogger.info({
                    orderId,
                    awarded: result.awarded,
                    skipped: result.skipped,
                    reason: result.reason,
                }, "Points award on DELIVERED");

                // Email UX: confirmacion de puntos acreditados (solo si se otorgaron).
                if (result.awarded > 0) {
                    (async () => {
                        try {
                            const buyer = await prisma.user.findUnique({
                                where: { id: order.userId },
                                select: { email: true, firstName: true, pointsBalance: true },
                            });
                            if (!buyer?.email) return;
                            const { level } = await getUserLevel(order.userId);
                            await sendPointsEarnedEmail({
                                buyerEmail: buyer.email,
                                buyerName: buyer.firstName ?? null,
                                pointsEarned: result.awarded,
                                orderNumber: order.orderNumber,
                                newBalance: buyer.pointsBalance ?? result.awarded,
                                tierName: level,
                            });
                        } catch (err) {
                            statusLogger.error({ err, orderId }, "Error sending points-earned email");
                        }
                    })();
                }
            } catch (pointsError) {
                statusLogger.error({ orderId, error: pointsError }, "Error awarding points on DELIVERED");
                // No fallar la transici\u00f3n por error en puntos
            }
        }

        // Notify buyer of status change
        if (deliveryStatus === "DELIVERED") {
            notifyBuyer(order.userId, "DELIVERED", order.orderNumber, { orderId: order.id })
                .catch(err => console.error("[Push] Buyer notification error:", err));
        } else if (deliveryStatus === "DRIVER_ARRIVED") {
            notifyBuyer(order.userId, "DRIVER_ARRIVED", order.orderNumber, { orderId: order.id })
                .catch(err => console.error("[Push] Buyer notification error:", err));
        } else if (deliveryStatus === "PICKED_UP") {
            // ISSUE-001: al retirar del comercio, avisar al comprador Y enviar el PIN de entrega
            // en un push dedicado. Dos notificaciones: una de estado, una de código.
            notifyBuyer(order.userId, "PICKED_UP", order.orderNumber, { orderId: order.id })
                .catch(err => console.error("[Push] Buyer notification error:", err));
            if (order.deliveryPin) {
                notifyBuyerDeliveryPin(order.userId, order.orderNumber, order.deliveryPin, order.id)
                    .catch(err => console.error("[Push] Delivery PIN notification error:", err));

                // Email UX: pedido en camino + PIN destacado (solo delivery, no pickup)
                if (!order.isPickup) {
                    (async () => {
                        try {
                            const buyer = await prisma.user.findUnique({
                                where: { id: order.userId },
                                select: { email: true, firstName: true },
                            });
                            if (!buyer?.email || !order.deliveryPin) return;
                            await sendOrderOnTheWayEmail({
                                buyerEmail: buyer.email,
                                buyerName: buyer.firstName ?? null,
                                orderNumber: order.orderNumber,
                                deliveryPin: order.deliveryPin,
                            });
                        } catch (err) {
                            statusLogger.error({ err, orderId }, "Error sending on-the-way email");
                        }
                    })();
                }
            }
        }

        // Emit socket events to all interested rooms.
        // Use order.driverId as fallback for admin overrides (driver may be null).
        const effectiveDriverId = driver?.id ?? order.driverId ?? null;
        const eventData = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: deliveryStatus === "DELIVERED" ? "DELIVERED" : order.status,
            deliveryStatus,
            driverId: effectiveDriverId,
        };

        const rooms = [
            `order:${order.id}`,
            ...(order.merchantId ? [`merchant:${order.merchantId}`] : []),
            `customer:${order.userId}`,
            ...(effectiveDriverId ? [`driver:${effectiveDriverId}`] : []),
            "admin:orders",
        ];

        socketEmitToRooms(rooms, "order_status_changed", eventData).catch(console.error);

        // Emit driver_arrived event to merchant when driver arrives
        if (deliveryStatus === "DRIVER_ARRIVED" && order.merchantId) {
            socketEmitToRooms([`merchant:${order.merchantId}`], "driver_arrived", {
                orderId: order.id,
                orderNumber: order.orderNumber,
                driverId: effectiveDriverId,
            }).catch(console.error);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        statusLogger.error({ error }, "Error updating delivery status");
        return NextResponse.json(
            { error: "Error al actualizar el estado del pedido" },
            { status: 500 }
        );
    }
}
