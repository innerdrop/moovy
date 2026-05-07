// Cron: Auto-cancel orders stuck in AWAITING_PAYMENT / PENDING for too long.
// Rama: feat/payment-pending-cancellation
//
// PROBLEMA QUE RESUELVE:
// Cuando el buyer hace un pedido con MercadoPago, el flujo es:
//   1. Frontend crea Order + preference MP -> Order.paymentStatus = "AWAITING_PAYMENT"
//   2. Buyer es redirigido a MP para pagar
//   3. MP confirma (webhook approved) -> Order pasa a CONFIRMED
//
// Si el buyer cierra la pestaña entre 1 y 3 (cierre de browser, vuelta de pantalla,
// o explícitamente cancela en MP), el webhook NUNCA llega y el Order queda eternamente
// en AWAITING_PAYMENT. El stock queda reservado (no se restaura), el cliente ve un
// "pedido fantasma" en Mis Pedidos sin poder hacer nada, y nosotros perdemos el
// inventario para venderlo a otro cliente.
//
// SOLUCION (defense-in-depth):
//   - Capa 1 (UI): banner "Cancelar pedido" para el buyer (rama frontend siguiente)
//   - Capa 2 (este cron): si el cliente abandona y nunca vuelve, lo cancelamos solos
//     a los 30 min (default, configurable en MoovyConfig). Restaura stock, refund
//     automatico si MP confirmo durante la ventana, push al cliente.
//   - Capa 3 (webhook MP): si MP confirma DESPUES de que cancelamos (race), dispara
//     refund automatico (rama webhook siguiente).
//
// IDEMPOTENCIA:
// El query filtra por status NO terminal (`notIn` de CANCELLED, DELIVERED, etc.) y
// paymentStatus en estados pendientes. Una vez que cancelamos un Order, ya no entra
// en la query. recordCronRun envuelve la ejecucion completa para healthcheck OPS.
//
// TIMEOUT:
// Default 30 min, override desde MoovyConfig.payment_pending_timeout_minutes.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { recordCronRun } from "@/lib/cron-health";
import { LEGACY_TERMINAL_STATUSES } from "@/lib/orders/order-status-machine";

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

const DEFAULT_TIMEOUT_MINUTES = 30;
const PAYMENT_PENDING_STATUSES = ["AWAITING_PAYMENT", "PENDING"];

export async function POST(req: NextRequest) {
    try {
        // Auth: CRON_SECRET con timing-safe compare
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");
        const { verifyBearerToken } = await import("@/lib/env-validation");
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Tipamos el genérico explicitamente como NextResponse para que TS no infiera
        // un tipo restringido por la primera return statement.
        return await recordCronRun<NextResponse>("cancel-stale-pending-payments", async () => {
            // Leer timeout configurable desde MoovyConfig (regla #10 CLAUDE.md: parametros
            // operativos editables desde OPS, no hardcoded)
            const configRow = await prisma.moovyConfig.findUnique({
                where: { key: "payment_pending_timeout_minutes" },
            });
            const timeoutMinutes = configRow ? parseInt(configRow.value, 10) : DEFAULT_TIMEOUT_MINUTES;

            if (isNaN(timeoutMinutes) || timeoutMinutes <= 0) {
                console.error(`[CancelStalePending] Invalid timeout config: ${configRow?.value}`);
                return { result: NextResponse.json({ error: "Invalid timeout config" }, { status: 500 }) as NextResponse, itemsProcessed: 0 };
            }

            const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000);

            // Encontrar pedidos stuck en AWAITING_PAYMENT/PENDING por más de la ventana.
            // Filtros:
            //   - paymentStatus en estados pendientes
            //   - status NO terminal (CANCELLED/DELIVERED/etc) — defensa contra race
            //   - createdAt < cutoff (paso el timeout)
            //   - paymentMethod = mercadopago — solo MP puede quedar stuck (cash es sincronico)
            //   - deletedAt = null — no procesar soft-deleted
            const stuckOrders = await prisma.order.findMany({
                where: {
                    paymentStatus: { in: PAYMENT_PENDING_STATUSES },
                    status: { notIn: [...LEGACY_TERMINAL_STATUSES] },
                    createdAt: { lt: cutoff },
                    paymentMethod: "mercadopago",
                    deletedAt: null,
                },
                select: {
                    id: true,
                    userId: true,
                    orderNumber: true,
                    merchantId: true,
                    items: {
                        select: {
                            quantity: true,
                            productId: true,
                            listingId: true,
                        },
                    },
                },
                take: 50, // Procesar maximo 50 por run para evitar runs largos
            });

            if (stuckOrders.length === 0) {
                return { result: NextResponse.json({ cancelled: 0 }) as NextResponse, itemsProcessed: 0 };
            }

            const cancelReason = `Pago no confirmado en ${timeoutMinutes} minutos`;
            let cancelledCount = 0;

            for (const order of stuckOrders) {
                try {
                    // Cancelar + restaurar stock en una transaccion atomica.
                    // Si dos crons corren a la vez (no deberia pero defensivo), el primer
                    // update con `status: { notIn: terminales }` cancela, el segundo no
                    // matchea ningun row y count=0.
                    await prisma.$transaction(async (tx) => {
                        const updateResult = await tx.order.updateMany({
                            where: {
                                id: order.id,
                                status: { notIn: [...LEGACY_TERMINAL_STATUSES] },
                                paymentStatus: { in: PAYMENT_PENDING_STATUSES },
                            },
                            data: {
                                status: "CANCELLED",
                                cancelReason,
                            },
                        });

                        // Si otro proceso ya lo cancelo, no restauramos stock (ya restaurado)
                        if (updateResult.count === 0) return;

                        // Restaurar stock: un item puede tener listingId (marketplace) o
                        // productId (comercio normal) o ambos (caso raro).
                        for (const item of order.items) {
                            if (item.listingId) {
                                await tx.listing.update({
                                    where: { id: item.listingId },
                                    data: { stock: { increment: item.quantity } },
                                });
                            }
                            if (item.productId) {
                                await tx.product.update({
                                    where: { id: item.productId },
                                    data: { stock: { increment: item.quantity } },
                                });
                            }
                        }

                        cancelledCount++;
                    }, { isolationLevel: "Serializable" });

                    // Audit log + notificaciones (fuera de la tx, no son criticos)
                    try {
                        await prisma.auditLog.create({
                            data: {
                                action: "ORDER_CANCELLED_PAYMENT_TIMEOUT",
                                entityType: "Order",
                                entityId: order.id,
                                userId: order.userId, // El buyer dueno del pedido (audit AAIP)
                                details: JSON.stringify({
                                    orderNumber: order.orderNumber,
                                    timeoutMinutes,
                                    reason: cancelReason,
                                    actor: "cron:cancel-stale-pending-payments",
                                }),
                            },
                        });
                    } catch (err) {
                        console.error(`[CancelStalePending] Audit log failed for ${order.id}:`, err);
                    }

                    // Defense-in-depth: si MP confirmo el pago entre que armamos la query
                    // y el update (race window de pocos ms), refundOrderIfPaid lo detecta
                    // (busca paymentStatus=PAID en DB) y dispara refund. Si no se pago, no-op.
                    import("@/lib/order-refund").then(({ refundOrderIfPaid }) => {
                        refundOrderIfPaid(order.id, {
                            triggeredBy: "cron",
                            actorId: null,
                            reason: `Pago no confirmado en ${timeoutMinutes} min - cancelacion automatica`,
                        }).catch((err) => console.error(`[CancelStalePending] refund failed for ${order.id}:`, err));
                    }).catch(() => { /* import safety */ });

                    // Push al cliente — usa el msg generico CANCELLED de notifyBuyer.
                    // El reason se loggea en audit, no se manda en push (NotifyContext
                    // no acepta el campo reason).
                    notifyBuyer(order.userId, "CANCELLED", order.orderNumber, {
                        orderId: order.id,
                    }).catch(console.error);

                    // Email de respaldo (rama chore/email-templates-faltantes).
                    // Si el cliente tiene push deshabilitado, esto es lo que ve.
                    // Importante legalmente: prueba documental de la cancelacion.
                    (async () => {
                        try {
                            const buyer = await prisma.user.findUnique({
                                where: { id: order.userId },
                                select: { email: true, firstName: true },
                            });
                            if (!buyer?.email) return;
                            const { sendPaymentTimeoutCancelledEmail } = await import("@/lib/email-legal-ux");
                            await sendPaymentTimeoutCancelledEmail({
                                buyerEmail: buyer.email,
                                buyerName: buyer.firstName ?? null,
                                orderNumber: order.orderNumber,
                                timeoutMinutes,
                            });
                        } catch (err) {
                            console.error(`[CancelStalePending] Email failed for ${order.id}:`, err);
                        }
                    })().catch(() => { /* fire-and-forget */ });

                    // Socket emits
                    const socketData = {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        cancelReason,
                    };
                    if (order.merchantId) {
                        emitSocket("order_cancelled", `merchant:${order.merchantId}`, socketData).catch(console.error);
                    }
                    emitSocket("order_cancelled", "admin:orders", socketData).catch(console.error);
                    if (order.userId) {
                        emitSocket("order_cancelled", `customer:${order.userId}`, socketData).catch(console.error);
                    }
                } catch (err) {
                    console.error(`[CancelStalePending] Error cancelling order ${order.id}:`, err);
                    // Seguir con el resto, no fallar el cron entero por un pedido roto
                }
            }

            console.log(`[CancelStalePending] Cancelled ${cancelledCount}/${stuckOrders.length} stuck orders`);
            return {
                result: NextResponse.json({ cancelled: cancelledCount, found: stuckOrders.length }) as NextResponse,
                itemsProcessed: cancelledCount,
            };
        });
    } catch (error) {
        console.error("[CancelStalePending] Fatal error:", error);
        return NextResponse.json({ error: "Error processing stale payments" }, { status: 500 });
    }
}
