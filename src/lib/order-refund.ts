// src/lib/order-refund.ts
//
// Helper canónico para disparar refund automático cuando se cancela un pedido
// pagado vía MercadoPago.
//
// Antes de esta rama:
//   - 2 endpoints disparaban refund (merchant reject + cron retry-assignments).
//   - 5 endpoints NO lo hacían (admin cancel, admin cleanup, buyer self-cancel,
//     cron merchant-timeout, cron scheduled-notify) → riesgo legal: el buyer
//     paga, admin/cron cancela, y el dinero queda en Moovy sin refund.
//
// Este helper consolida la lógica para que TODO endpoint nuevo de cancelación
// pueda llamarlo en una línea y obtenga refund + audit + socket alert + email.
//
// Decisión deliberada: NO migramos los 2 endpoints que ya tienen refund inline
// (merchant reject + retry-assignments). Están battle-tested desde 2026-04-21
// (rama retry-cron-escalation ISSUE-015) y migrarlos agrega riesgo sin beneficio.
// El helper es para los endpoints NUEVOS o los que NO tenían refund todavía.

import { prisma } from "@/lib/prisma";
import { createRefund } from "@/lib/mercadopago";
import { auditLog } from "@/lib/security";

interface RefundOptions {
    /** Quién disparó la cancelación. Solo para audit log + email. */
    triggeredBy: "admin" | "buyer" | "merchant" | "cron";
    /** Detalle adicional para audit log (orderId del cron, adminId, etc). */
    actorId?: string | null;
    /** Razón legible para audit log y email al buyer. */
    reason?: string | null;
    /** Si false, no manda email al buyer. Default true (admin/buyer/merchant cancel
     *  sí avisa; admin cleanup batch puede pasar false para no spamear). */
    sendEmail?: boolean;
}

interface RefundResult {
    /** El refund se ejecutó OK en MP y se actualizó la DB. */
    refunded: boolean;
    /** El pedido ya estaba REFUNDED (idempotencia). */
    alreadyRefunded: boolean;
    /** El pedido NO se podía refundear (no era MP, no estaba PAID, etc). */
    notApplicable: boolean;
    /** El refund a MP falló — admin tiene que resolver manual. Socket alert disparado. */
    failed: boolean;
    /** Monto refundeado (si aplica). */
    amount?: number;
    /** Razón de notApplicable o failed para logging. */
    reason?: string;
}

/**
 * Refund automático para una orden ya cancelada. Llamar DESPUÉS de marcar
 * la Order como CANCELLED. Idempotente, fire-and-forget safe.
 *
 * Casos:
 *   - Order.paymentMethod !== "mercadopago" → notApplicable (efectivo, etc).
 *   - Order.paymentStatus !== "PAID" → notApplicable (nunca cobró).
 *   - Order.paymentStatus === "REFUNDED" → alreadyRefunded (idempotente).
 *   - mpPaymentId no existe → notApplicable (no hay payment a refundear).
 *   - createRefund() OK → refunded=true. Update DB + audit log + email opcional.
 *   - createRefund() falla → failed=true. Socket emit `refund_failed` para admin.
 *
 * Nunca throwea — el caller hace fire-and-forget. El refund es nice-to-have
 * en términos de flow (la cancelación de la orden YA está confirmada). Si
 * falla, queda registrado en logs + admin recibe alerta socket para resolver.
 */
export async function refundOrderIfPaid(
    orderId: string,
    options: RefundOptions
): Promise<RefundResult> {
    const { triggeredBy, actorId = null, reason = null, sendEmail = true } = options;

    try {
        // Leer estado actual de la orden
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                orderNumber: true,
                userId: true,
                paymentMethod: true,
                paymentStatus: true,
                mpPaymentId: true,
                total: true,
                user: { select: { name: true, email: true } },
            },
        });

        if (!order) {
            return { refunded: false, alreadyRefunded: false, notApplicable: true, failed: false, reason: "order_not_found" };
        }

        // Idempotencia
        if (order.paymentStatus === "REFUNDED") {
            return { refunded: false, alreadyRefunded: true, notApplicable: false, failed: false, reason: "already_refunded" };
        }

        // No aplica refund automático
        if (order.paymentMethod !== "mercadopago") {
            return { refunded: false, alreadyRefunded: false, notApplicable: true, failed: false, reason: "not_mercadopago" };
        }
        if (order.paymentStatus !== "PAID") {
            return { refunded: false, alreadyRefunded: false, notApplicable: true, failed: false, reason: `payment_status_${order.paymentStatus}` };
        }
        if (!order.mpPaymentId) {
            return { refunded: false, alreadyRefunded: false, notApplicable: true, failed: false, reason: "no_mp_payment_id" };
        }

        // Disparar refund en MP
        const refundResult = await createRefund(order.mpPaymentId);

        if (!refundResult) {
            // Falló el refund — emitir socket alert al admin para resolver manual
            console.error(`[order-refund] createRefund failed for order ${orderId}, mpPaymentId=${order.mpPaymentId}`);

            try {
                const { socketEmitToRooms } = await import("@/lib/socket-emit");
                socketEmitToRooms(["admin:orders"], "refund_failed", {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    mpPaymentId: order.mpPaymentId,
                    amount: order.total,
                    triggeredBy,
                    reason,
                    timestamp: new Date().toISOString(),
                }).catch(() => { /* fire-and-forget */ });
            } catch { /* socket-emit may not be available */ }

            try {
                auditLog({
                    timestamp: new Date().toISOString(),
                    userId: actorId ?? order.userId,
                    action: "ORDER_REFUND_FAILED",
                    resource: "Order",
                    resourceId: order.id,
                    details: { triggeredBy, reason, mpPaymentId: order.mpPaymentId, amount: order.total },
                });
            } catch { /* audit log nice-to-have */ }

            return { refunded: false, alreadyRefunded: false, notApplicable: false, failed: true, reason: "mp_api_failure" };
        }

        // Refund OK — actualizar Order + Payment
        await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: "REFUNDED" },
        }).catch(err => console.error("[order-refund] Failed to update order paymentStatus:", err));

        await prisma.payment.updateMany({
            where: { orderId, mpPaymentId: order.mpPaymentId },
            data: { mpStatus: "refunded", mpStatusDetail: `Refund automático: ${reason || triggeredBy}` },
        }).catch(err => console.error("[order-refund] Failed to update payment:", err));

        // Audit log
        try {
            auditLog({
                timestamp: new Date().toISOString(),
                userId: actorId ?? order.userId,
                action: "ORDER_REFUND_TRIGGERED",
                resource: "Order",
                resourceId: order.id,
                details: {
                    triggeredBy,
                    reason,
                    mpPaymentId: order.mpPaymentId,
                    refundId: refundResult.id,
                    amount: refundResult.amount ?? order.total,
                },
            });
        } catch { /* audit log nice-to-have */ }

        // Email al buyer si corresponde
        if (sendEmail && order.user?.email) {
            try {
                const { sendOrderRefundedEmail } = await import("@/lib/email-legal-ux");
                sendOrderRefundedEmail({
                    buyerEmail: order.user.email,
                    buyerName: order.user.name,
                    orderNumber: order.orderNumber,
                    orderId: order.id,
                    refundAmount: refundResult.amount ?? order.total,
                    reason: reason ?? "Tu pedido fue cancelado.",
                }).catch((err) => console.error("[order-refund] sendOrderRefundedEmail failed:", err));
            } catch (err) {
                console.error("[order-refund] Failed to import refund email:", err);
            }
        }

        return {
            refunded: true,
            alreadyRefunded: false,
            notApplicable: false,
            failed: false,
            amount: refundResult.amount ?? order.total,
        };
    } catch (error: any) {
        console.error(`[order-refund] Unexpected error for order ${orderId}:`, error);
        return { refunded: false, alreadyRefunded: false, notApplicable: false, failed: true, reason: error?.message ?? "unexpected_error" };
    }
}
