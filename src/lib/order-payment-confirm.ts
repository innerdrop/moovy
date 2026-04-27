// src/lib/order-payment-confirm.ts
//
// Helper canónico para confirmar el pago MP de una orden.
//
// Reusable desde:
//   - El webhook MP (cuando MP nos avisa) — pasa el `mpPaymentRaw` ya fetched.
//   - El endpoint /api/payments/[orderId]/status (polling del client) — sin
//     payment raw, hace search a MP API por external_reference.
//   - Cualquier path futuro de "reconciliar" (cron, OPS button, etc).
//
// Idempotente:
//   - Si la orden ya está PAID/COMPLETED → retorna alreadyConfirmed.
//   - Update final usa updateMany WHERE paymentStatus IN [AWAITING_PAYMENT,PENDING]
//     para que dos requests concurrentes (webhook + polling) no doblen el
//     side effect — solo el primero gana count===1, el otro retorna alreadyConfirmed.
//
// Side effects on confirm (mismos que handleApproved del webhook):
//   - Order: paymentStatus=PAID, status=CONFIRMED, mpPaymentId, mpStatus, paidAt.
//   - Payment record (upsert por mpPaymentId).
//   - Socket emit `payment_confirmed` a merchant/seller/admin/order rooms.
//   - Email de confirmación al buyer.
//
// Validación de monto: tolerancia $1 (mismo criterio que webhook). Si MP reporta
// un monto distinto al order.total → marca mpStatus="amount_mismatch" y NO confirma.

import { prisma } from "@/lib/prisma";
import { paymentApi } from "@/lib/mercadopago";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { paymentLogger } from "@/lib/logger";

interface OrderForConfirm {
    id: string;
    orderNumber: string;
    total: number;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    paymentMethod: string | null;
    paymentStatus: string;
    mpStatus: string | null;
    paidAt: Date | null;
    isPickup: boolean;
    items: Array<{ id: string; productId: string | null; listingId: string | null; name: string; price: number; quantity: number }>;
    subOrders: Array<{ id: string; merchantId: string | null; sellerId: string | null }>;
    user: { id: string; name: string | null; email: string | null };
    address: { street: string; number: string; apartment: string | null; city: string | null } | null;
}

export interface ConfirmResult {
    confirmed: boolean;
    alreadyConfirmed: boolean;
    notApplicable: boolean;
    failed: boolean;
    paymentStatus: string;
    mpStatus?: string | null;
    paidAt?: Date | null;
    amount?: number;
    reason?: string;
}

export async function confirmOrderPaymentFromMp(
    orderId: string,
    options?: { mpPaymentRaw?: any }
): Promise<ConfirmResult> {
    const order = (await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: { select: { id: true, productId: true, listingId: true, name: true, price: true, quantity: true } },
            subOrders: { select: { id: true, merchantId: true, sellerId: true } },
            user: { select: { id: true, name: true, email: true } },
            address: { select: { street: true, number: true, apartment: true, city: true } },
        },
    })) as OrderForConfirm | null;

    if (!order) {
        return { confirmed: false, alreadyConfirmed: false, notApplicable: true, failed: false, paymentStatus: "unknown", reason: "order_not_found" };
    }

    if (order.paymentStatus === "PAID" || order.paymentStatus === "COMPLETED") {
        return {
            confirmed: false, alreadyConfirmed: true, notApplicable: false, failed: false,
            paymentStatus: order.paymentStatus, mpStatus: order.mpStatus, paidAt: order.paidAt,
        };
    }

    if (order.paymentStatus === "FAILED" || order.paymentStatus === "REFUNDED") {
        return {
            confirmed: false, alreadyConfirmed: false, notApplicable: true, failed: false,
            paymentStatus: order.paymentStatus, mpStatus: order.mpStatus, reason: `terminal_state_${order.paymentStatus}`,
        };
    }

    if (order.paymentMethod !== "mercadopago") {
        return {
            confirmed: false, alreadyConfirmed: false, notApplicable: true, failed: false,
            paymentStatus: order.paymentStatus, reason: "not_mercadopago",
        };
    }

    // Obtener el payment de MP — del webhook (ya fetched) o vía REST API search.
    // Importante: NO usamos paymentApi.search() del SDK — el SDK v2 no traduce
    // bien el filtro `external_reference`. Usamos fetch directo a /v1/payments/search
    // (mismo approach que el cron mp-reconcile, battle-tested).
    let mpPayment: any = options?.mpPaymentRaw ?? null;

    if (!mpPayment) {
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) {
            paymentLogger.error({ orderId }, "[order-payment-confirm] MP_ACCESS_TOKEN not configured");
            return {
                confirmed: false, alreadyConfirmed: false, notApplicable: false, failed: true,
                paymentStatus: order.paymentStatus, reason: "mp_access_token_missing",
            };
        }

        try {
            const searchUrl = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(orderId)}&sort=date_created&criteria=desc&limit=10`;
            const searchRes = await fetch(searchUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!searchRes.ok) {
                paymentLogger.warn(
                    { orderId, status: searchRes.status },
                    "[order-payment-confirm] MP search returned non-OK"
                );
                return {
                    confirmed: false, alreadyConfirmed: false, notApplicable: false, failed: true,
                    paymentStatus: order.paymentStatus, reason: `mp_search_${searchRes.status}`,
                };
            }

            const searchData: any = await searchRes.json();
            const results: any[] = searchData?.results || [];

            // Preferir el approved más reciente; si no hay, el más reciente cualquiera
            const approvedHit = results.find((p) => p?.status === "approved");
            const headHit = results[0];
            const lite = approvedHit || headHit || null;

            if (lite?.id) {
                // El search devuelve un payment "lite" pero igualmente trae transaction_amount/status.
                // Para máxima precisión hacemos GET del payment completo via SDK.
                try {
                    mpPayment = await paymentApi.get({ id: String(lite.id) });
                } catch {
                    // Si el GET falla, usar el lite del search — tiene los campos críticos
                    mpPayment = lite;
                }
            }
        } catch (err: any) {
            paymentLogger.error({ orderId, error: err?.message ?? String(err) }, "[order-payment-confirm] MP search threw");
            return {
                confirmed: false, alreadyConfirmed: false, notApplicable: false, failed: true,
                paymentStatus: order.paymentStatus, reason: "mp_search_failed",
            };
        }
    }

    if (!mpPayment) {
        return {
            confirmed: false, alreadyConfirmed: false, notApplicable: true, failed: false,
            paymentStatus: order.paymentStatus, reason: "no_mp_payment_found",
        };
    }

    const mpStatus = mpPayment.status || "unknown";
    const mpPaymentId = String(mpPayment.id || "");
    const mpAmount = mpPayment.transaction_amount;

    if (mpStatus !== "approved") {
        if (mpStatus !== "rejected") {
            await prisma.order.update({
                where: { id: orderId },
                data: { mpStatus, ...(mpPaymentId ? { mpPaymentId } : {}) },
            }).catch(() => { /* nice-to-have */ });
        }
        return {
            confirmed: false, alreadyConfirmed: false, notApplicable: false, failed: false,
            paymentStatus: order.paymentStatus, mpStatus, reason: `mp_status_${mpStatus}`,
        };
    }

    // Validación de monto (tolerancia $1)
    if (typeof mpAmount === "number" && mpAmount > 0) {
        const amountDiff = Math.abs(mpAmount - order.total);
        if (amountDiff > 1) {
            paymentLogger.error(
                { orderId, orderTotal: order.total, mpAmount, diff: amountDiff, mpPaymentId },
                "[order-payment-confirm] CRITICAL: amount_mismatch — order NOT confirmed"
            );
            await prisma.order.update({
                where: { id: orderId },
                data: { mpStatus: "amount_mismatch", mpPaymentId },
            }).catch(() => {});
            return {
                confirmed: false, alreadyConfirmed: false, notApplicable: false, failed: true,
                paymentStatus: order.paymentStatus, reason: "amount_mismatch", amount: mpAmount,
            };
        }
    } else {
        paymentLogger.error({ orderId, mpAmount, mpPaymentId }, "[order-payment-confirm] approved without valid transaction_amount");
        return {
            confirmed: false, alreadyConfirmed: false, notApplicable: false, failed: true,
            paymentStatus: order.paymentStatus, reason: "missing_mp_amount",
        };
    }

    await prisma.payment.upsert({
        where: { mpPaymentId },
        create: {
            orderId: order.id,
            mpPaymentId,
            mpStatus,
            mpStatusDetail: mpPayment.status_detail || null,
            amount: mpAmount,
            currency: mpPayment.currency_id || "ARS",
            payerEmail: mpPayment.payer?.email || null,
            paymentMethod: mpPayment.payment_type_id || null,
            rawPayload: mpPayment as any,
        },
        update: {
            mpStatus,
            mpStatusDetail: mpPayment.status_detail || null,
            rawPayload: mpPayment as any,
        },
    }).catch((err) => {
        paymentLogger.error({ orderId, error: err?.message }, "[order-payment-confirm] Payment upsert failed");
    });

    const now = new Date();
    const updateResult = await prisma.order.updateMany({
        where: {
            id: order.id,
            paymentStatus: { in: ["AWAITING_PAYMENT", "PENDING"] },
        },
        data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            mpPaymentId,
            mpStatus,
            paidAt: now,
        },
    });

    if (updateResult.count === 0) {
        const fresh = await prisma.order.findUnique({
            where: { id: orderId },
            select: { paymentStatus: true, mpStatus: true, paidAt: true },
        });
        return {
            confirmed: false, alreadyConfirmed: true, notApplicable: false, failed: false,
            paymentStatus: fresh?.paymentStatus || "PAID",
            mpStatus: fresh?.mpStatus,
            paidAt: fresh?.paidAt,
            amount: mpAmount,
        };
    }

    emitPaymentConfirmedSocket(order).catch((err) => {
        paymentLogger.error({ orderId, error: err?.message }, "[order-payment-confirm] socket emit failed");
    });

    sendConfirmationEmailSafe(order).catch((err) => {
        paymentLogger.error({ orderId, error: err?.message }, "[order-payment-confirm] email failed");
    });

    paymentLogger.info({ orderId, orderNumber: order.orderNumber, mpPaymentId, amount: mpAmount }, "[order-payment-confirm] payment confirmed");

    return {
        confirmed: true, alreadyConfirmed: false, notApplicable: false, failed: false,
        paymentStatus: "PAID", mpStatus, paidAt: now, amount: mpAmount,
    };
}

// ─── Side effects ─────────────────────────────────────────────────────────────

async function emitPaymentConfirmedSocket(order: OrderForConfirm) {
    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.CRON_SECRET}`,
    };
    const payload = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: "CONFIRMED",
    };

    const emit = (room: string) =>
        fetch(`${socketUrl}/emit`, {
            method: "POST",
            headers,
            body: JSON.stringify({ event: "payment_confirmed", room, data: payload }),
        }).catch(() => { /* fire-and-forget */ });

    const promises: Array<Promise<unknown>> = [];
    for (const sub of order.subOrders) {
        if (sub.merchantId) promises.push(emit(`merchant:${sub.merchantId}`));
        if (sub.sellerId) promises.push(emit(`seller:${sub.sellerId}`));
    }
    promises.push(emit("admin:orders"));
    promises.push(emit(`order:${order.id}`));
    promises.push(emit(`customer:${order.user.id}`));

    await Promise.allSettled(promises);
}

async function sendConfirmationEmailSafe(order: OrderForConfirm) {
    if (!order.user.email) return;
    const addr = order.address;
    const addressString = addr
        ? `${addr.street} ${addr.number}${addr.apartment ? `, ${addr.apartment}` : ""}, ${addr.city || "Ushuaia"}`
        : "Dirección no especificada";

    sendOrderConfirmationEmail({
        email: order.user.email,
        customerName: order.user.name || "Cliente",
        orderNumber: order.orderNumber,
        items: order.items as any,
        total: order.total,
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        paymentMethod: order.paymentMethod || "mercadopago",
        address: addressString,
        isPickup: order.isPickup,
    });
}
