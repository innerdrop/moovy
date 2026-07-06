// Cron: Auto-cancel orders that merchants didn't confirm within timeout
// Reads merchant_confirm_timeout_seconds from MoovyConfig
// Should run every 1-2 minutes via external scheduler
// Rama chore/cron-monitoring-completo: envuelto con recordCronRun.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { recordCronRun } from "@/lib/cron-health";

const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

async function emitSocket(event: string, room: string, data: Record<string, unknown>): Promise<void> {
    await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ event, room, data }),
    }).catch((err) => console.error("[Socket] emit error:", err));
}

export async function POST(req: NextRequest) {
    try {
        // Auth: CRON_SECRET
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");
        // V-028 FIX: timing-safe comparison
        const { verifyBearerToken } = await import("@/lib/env-validation");
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return await recordCronRun<NextResponse>("merchant-timeout", async () => {
            // Read timeout from MoovyConfig
            const configRow = await prisma.moovyConfig.findUnique({
                where: { key: "merchant_confirm_timeout_seconds" },
            });
            const timeoutSeconds = configRow ? parseInt(configRow.value, 10) : 300; // default 5 min

            if (isNaN(timeoutSeconds) || timeoutSeconds <= 0) {
                return {
                    result: NextResponse.json({ error: "Invalid timeout config" }, { status: 500 }) as NextResponse,
                    itemsProcessed: 0,
                };
            }

            const cutoff = new Date(Date.now() - timeoutSeconds * 1000);

            // Find PENDING IMMEDIATE orders past the timeout
            const expiredOrders = await prisma.order.findMany({
                where: {
                    status: "PENDING",
                    deliveryType: "IMMEDIATE",
                    createdAt: { lt: cutoff },
                },
                select: {
                    id: true,
                    userId: true,
                    orderNumber: true,
                    merchantId: true,
                    total: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    user: { select: { email: true, name: true } },
                },
            });

            if (expiredOrders.length === 0) {
                return {
                    result: NextResponse.json({ cancelled: 0 }) as NextResponse,
                    itemsProcessed: 0,
                };
            }

            // Cancel each expired order
            const cancelReason = "El comercio no confirmó el pedido a tiempo";
            let cancelledCount = 0;

            for (const order of expiredOrders) {
                // fix/auditoria-estados-crons: guard de idempotencia (regla #12).
                // updateMany condicionado a que SIGA en PENDING: si dos corridas del
                // cron se solapan, solo UNA gana la transición (count === 1) y dispara
                // los side effects (refund, emails, sockets). La otra saltea el pedido.
                const claim = await prisma.order.updateMany({
                    where: { id: order.id, status: "PENDING" },
                    data: {
                        status: "CANCELLED",
                        cancelReason,
                    },
                });
                if (claim.count !== 1) continue; // otra corrida ya lo canceló
                cancelledCount++;

                // Notify buyer
                // fix/refund-automatico: refund + reversión de puntos cuando el cron auto-cancela.
                import("@/lib/order-refund").then(({ refundOrderIfPaid }) => {
                    refundOrderIfPaid(order.id, {
                        triggeredBy: "cron",
                        actorId: null,
                        reason: "El comercio no confirmó tu pedido a tiempo",
                    }).catch((err) => console.error("[merchant-timeout] refund failed:", err));
                }).catch(() => { /* import safety */ });
                import("@/lib/points").then(({ reverseOrderPoints }) => {
                    reverseOrderPoints(order.id, "merchant_timeout_auto_cancel").catch((err) =>
                        console.error("[merchant-timeout] reverse points failed:", err)
                    );
                }).catch(() => { /* import safety */ });

                notifyBuyer(order.userId, "CANCELLED", order.orderNumber, { orderId: order.id }).catch(console.error);

                // Email al comprador: cancelación por sistema. Solo para pedidos NO pagados
                // con MP (los pagados reciben el email de reembolso vía refundOrderIfPaid,
                // no duplicamos). Estado pagado canónico = "PAID". Fire-and-forget.
                (async () => {
                    try {
                        if (!order.user.email) return;
                        const isPaidMp = order.paymentMethod === "mercadopago" && order.paymentStatus === "PAID";
                        if (isPaidMp) return;
                        const { sendOrderCancelledBySystemEmail } = await import("@/lib/email-p0");
                        await sendOrderCancelledBySystemEmail({
                            email: order.user.email,
                            customerName: order.user.name ?? "Cliente",
                            orderNumber: order.orderNumber,
                            total: order.total,
                            reason: cancelReason,
                            willRefund: false,
                        });
                    } catch (err) {
                        console.error("[merchant-timeout] Failed to send system-cancel email:", err);
                    }
                })();

                // Socket notifications
                const socketData = { orderId: order.id, orderNumber: order.orderNumber };
                if (order.merchantId) {
                    emitSocket("order_cancelled", `merchant:${order.merchantId}`, socketData).catch(console.error);
                }
                emitSocket("order_cancelled", "admin:orders", socketData).catch(console.error);
                if (order.userId) {
                    emitSocket("order_cancelled", `customer:${order.userId}`, socketData).catch(console.error);
                }
            }

            console.log(`[MerchantTimeout] Cancelled ${cancelledCount} expired orders (${expiredOrders.length} candidates)`);
            return {
                result: NextResponse.json({ cancelled: cancelledCount }) as NextResponse,
                itemsProcessed: cancelledCount,
            };
        });
    } catch (error) {
        console.error("[MerchantTimeout] Error:", error);
        return NextResponse.json({ error: "Error processing timeouts" }, { status: 500 });
    }
}
