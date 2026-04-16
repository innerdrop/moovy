/**
 * Cron: Reconciliación de pagos MercadoPago pendientes
 *
 * Busca órdenes que están en AWAITING_PAYMENT con un mpPaymentId
 * (o mpPreferenceId) asignado pero que nunca recibieron el webhook.
 * Consulta la API de MP directamente para verificar si el pago
 * fue aprobado, y de ser así, ejecuta la misma lógica que el webhook.
 *
 * Frecuencia recomendada: cada 10 minutos
 * Protected by CRON_SECRET
 *
 * Escenarios que cubre:
 *   1. Webhook perdido por timeout/error de red
 *   2. Webhook procesado pero MP reintenta con ID diferente
 *   3. Pago aprobado mientras el servidor estaba caído
 *
 * Alerta admin si hay órdenes >1h en AWAITING_PAYMENT con pago aprobado en MP
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentApi } from "@/lib/mercadopago";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { paymentLogger } from "@/lib/logger";
import { socketEmitToRooms } from "@/lib/socket-emit";

const reconcileLogger = paymentLogger.child({ context: "cron-mp-reconcile" });

export async function POST(req: NextRequest) {
    try {
        // Auth: CRON_SECRET timing-safe comparison
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        const { verifyBearerToken } = await import("@/lib/env-validation");
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            reconcileLogger.warn({}, "Unauthorized cron request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Find orders stuck in AWAITING_PAYMENT for more than 5 minutes
        // that have an mpPaymentId (meaning MP sent a preference at least)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

        const stuckOrders = await prisma.order.findMany({
            where: {
                status: "AWAITING_PAYMENT",
                paymentMethod: "mercadopago",
                deletedAt: null,
                updatedAt: { lt: fiveMinutesAgo },
                // Either has a payment ID (webhook came but didn't process)
                // or has a preference ID (user initiated payment via MP)
                OR: [
                    { mpPaymentId: { not: null } },
                    { mpPreferenceId: { not: null } },
                ],
            },
            include: {
                items: {
                    select: {
                        id: true,
                        productId: true,
                        listingId: true,
                        name: true,
                        price: true,
                        quantity: true,
                    },
                },
                subOrders: {
                    select: { id: true, merchantId: true, sellerId: true },
                },
                user: {
                    select: { id: true, name: true, email: true },
                },
                address: {
                    select: {
                        street: true,
                        number: true,
                        apartment: true,
                        city: true,
                    },
                },
                payments: {
                    select: { mpPaymentId: true, mpStatus: true },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
            take: 50, // Process max 50 per run to avoid timeout
            orderBy: { updatedAt: "asc" }, // Oldest first
        });

        if (stuckOrders.length === 0) {
            return NextResponse.json({
                success: true,
                reconciled: 0,
                message: "No stuck orders found",
            });
        }

        reconcileLogger.info(
            { count: stuckOrders.length },
            "Found stuck AWAITING_PAYMENT orders, starting reconciliation"
        );

        let reconciled = 0;
        let alerted = 0;
        let skipped = 0;
        const errors: string[] = [];

        for (const order of stuckOrders) {
            try {
                // Strategy 1: If order has mpPaymentId, query that payment directly
                if (order.mpPaymentId) {
                    const result = await reconcileByPaymentId(order, order.mpPaymentId);
                    if (result === "reconciled") reconciled++;
                    else if (result === "skipped") skipped++;
                    continue;
                }

                // Strategy 2: If order has payments recorded but order wasn't updated
                if (order.payments.length > 0 && order.payments[0].mpPaymentId) {
                    const result = await reconcileByPaymentId(
                        order,
                        order.payments[0].mpPaymentId
                    );
                    if (result === "reconciled") reconciled++;
                    else if (result === "skipped") skipped++;
                    continue;
                }

                // Strategy 3: Search MP payments by external_reference (order.id)
                // This catches cases where webhook never arrived at all
                try {
                    const searchResult = await searchMpPaymentByReference(order.id);
                    if (searchResult) {
                        const result = await reconcileByPaymentId(order, String(searchResult.id));
                        if (result === "reconciled") reconciled++;
                        else if (result === "skipped") skipped++;
                        continue;
                    }
                } catch (searchErr) {
                    reconcileLogger.warn(
                        { orderId: order.id, error: searchErr },
                        "MP payment search failed, skipping"
                    );
                }

                // If order is older than 1 hour and still no payment found, alert admin
                if (order.updatedAt < oneHourAgo) {
                    await alertAdminStuckOrder(order);
                    alerted++;
                }

                skipped++;
            } catch (orderErr) {
                const errMsg = `Order ${order.orderNumber}: ${orderErr instanceof Error ? orderErr.message : "Unknown error"}`;
                errors.push(errMsg);
                reconcileLogger.error(
                    { orderId: order.id, error: orderErr },
                    "Error reconciling order"
                );
            }
        }

        reconcileLogger.info(
            { reconciled, skipped, alerted, errors: errors.length, total: stuckOrders.length },
            "MP reconciliation complete"
        );

        return NextResponse.json({
            success: true,
            total: stuckOrders.length,
            reconciled,
            skipped,
            alerted,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        reconcileLogger.error({ error }, "Critical error in MP reconciliation cron");
        return NextResponse.json(
            { error: "Internal error" },
            { status: 500 }
        );
    }
}

// ─── Reconcile by Payment ID ─────────────────────────────────────────────────

type ReconcileResult = "reconciled" | "skipped";

async function reconcileByPaymentId(
    order: OrderWithIncludes,
    mpPaymentId: string
): Promise<ReconcileResult> {
    // Query MP API for the payment status
    const mpPayment = await paymentApi.get({ id: mpPaymentId });

    if (!mpPayment) {
        reconcileLogger.warn(
            { orderId: order.id, mpPaymentId },
            "MP payment not found"
        );
        return "skipped";
    }

    const paymentStatus = mpPayment.status || "unknown";

    reconcileLogger.info(
        {
            orderId: order.id,
            orderNumber: order.orderNumber,
            mpPaymentId,
            mpStatus: paymentStatus,
        },
        "MP payment status fetched for reconciliation"
    );

    if (paymentStatus === "approved") {
        // Verify amount matches (same $1 tolerance as webhook)
        const mpAmount = mpPayment.transaction_amount;
        if (typeof mpAmount === "number" && mpAmount > 0) {
            const amountDiff = Math.abs(mpAmount - order.total);
            if (amountDiff > 1) {
                reconcileLogger.error(
                    {
                        orderId: order.id,
                        orderTotal: order.total,
                        mpAmount,
                        diff: amountDiff,
                        mpPaymentId,
                    },
                    "RECONCILE: Payment amount mismatch — NOT confirming"
                );
                // Flag but don't confirm
                await prisma.order.update({
                    where: { id: order.id },
                    data: { mpStatus: "amount_mismatch", mpPaymentId },
                });
                return "skipped";
            }
        } else {
            reconcileLogger.error(
                { orderId: order.id, mpAmount, mpPaymentId },
                "RECONCILE: Approved payment without valid transaction_amount"
            );
            return "skipped";
        }

        // Idempotency: check webhook log to avoid double-processing
        const eventId = `reconcile-${mpPaymentId}`;
        const existingLog = await prisma.mpWebhookLog.findFirst({
            where: {
                OR: [
                    { eventId },
                    { resourceId: mpPaymentId, processed: true },
                ],
            },
        });

        if (existingLog?.processed) {
            // Webhook already processed this payment — just update the order status
            // if it's still stuck (race condition: webhook processed but order update failed)
            const freshOrder = await prisma.order.findUnique({
                where: { id: order.id },
                select: { status: true },
            });
            if (freshOrder?.status === "AWAITING_PAYMENT") {
                reconcileLogger.warn(
                    { orderId: order.id, mpPaymentId },
                    "Payment was processed by webhook but order still AWAITING_PAYMENT — fixing"
                );
                await confirmOrder(order, mpPaymentId, paymentStatus);
                return "reconciled";
            }
            return "skipped";
        }

        // Create webhook log for idempotency tracking
        await prisma.mpWebhookLog.upsert({
            where: { eventId },
            create: {
                eventId,
                eventType: "payment",
                resourceId: mpPaymentId,
            },
            update: {},
        });

        // Create/update Payment record
        await prisma.payment.upsert({
            where: { mpPaymentId },
            create: {
                orderId: order.id,
                mpPaymentId,
                mpStatus: paymentStatus,
                mpStatusDetail: mpPayment.status_detail || null,
                amount: mpPayment.transaction_amount || order.total,
                currency: mpPayment.currency_id || "ARS",
                payerEmail: mpPayment.payer?.email || null,
                paymentMethod: mpPayment.payment_type_id || null,
                rawPayload: { source: "reconciliation", mpPaymentId },
            },
            update: {
                mpStatus: paymentStatus,
                mpStatusDetail: mpPayment.status_detail || null,
            },
        });

        // Confirm the order
        await confirmOrder(order, mpPaymentId, paymentStatus);

        // Mark webhook log as processed
        await prisma.mpWebhookLog.update({
            where: { eventId },
            data: { processed: true },
        });

        reconcileLogger.info(
            { orderId: order.id, orderNumber: order.orderNumber, mpPaymentId },
            "Order reconciled successfully — payment confirmed"
        );

        return "reconciled";
    } else if (paymentStatus === "rejected") {
        // Payment was rejected — update order but don't restore stock here
        // (the original webhook handler does that; if we're here, the webhook missed it)
        reconcileLogger.info(
            { orderId: order.id, mpPaymentId, mpStatus: paymentStatus },
            "Reconciliation found rejected payment — updating order"
        );

        await prisma.order.update({
            where: { id: order.id },
            data: {
                mpStatus: paymentStatus,
                mpPaymentId,
                // Don't cancel automatically — let user retry or admin handle
            },
        });

        return "skipped";
    }

    // pending, in_process, etc. — just update mpStatus
    await prisma.order.update({
        where: { id: order.id },
        data: { mpStatus: paymentStatus, mpPaymentId },
    });

    return "skipped";
}

// ─── Confirm Order (mirrors webhook handleApproved) ──────────────────────────

async function confirmOrder(
    order: OrderWithIncludes,
    mpPaymentId: string,
    mpStatus: string
) {
    // Update order to CONFIRMED + PAID
    await prisma.order.update({
        where: { id: order.id },
        data: {
            paymentStatus: "PAID",
            status: "CONFIRMED",
            mpPaymentId,
            mpStatus,
            paidAt: new Date(),
        },
    });

    // Notify vendors via socket
    const eventData = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: "CONFIRMED",
        source: "reconciliation",
    };

    const rooms: string[] = [
        `order:${order.id}`,
        `customer:${order.user.id}`,
        "admin:orders",
    ];

    for (const sub of order.subOrders) {
        if (sub.merchantId) rooms.push(`merchant:${sub.merchantId}`);
        if (sub.sellerId) rooms.push(`seller:${sub.sellerId}`);
    }

    socketEmitToRooms(rooms, "payment_confirmed", eventData).catch((err) => {
        reconcileLogger.error(
            { orderId: order.id, error: err },
            "Socket emit failed during reconciliation"
        );
    });

    // Send confirmation email
    try {
        const addr = order.address;
        const addressString = addr
            ? `${addr.street} ${addr.number}${addr.apartment ? `, ${addr.apartment}` : ""}, ${addr.city || "Ushuaia"}`
            : "Dirección no especificada";

        sendOrderConfirmationEmail({
            email: order.user.email || "",
            customerName: order.user.name || "Cliente",
            orderNumber: order.orderNumber,
            items: order.items,
            total: order.total,
            subtotal: order.subtotal,
            deliveryFee: order.deliveryFee,
            discount: order.discount,
            paymentMethod: order.paymentMethod || "mercadopago",
            address: addressString,
            isPickup: order.isPickup,
        });
    } catch (emailError) {
        reconcileLogger.error(
            { orderId: order.id, error: emailError },
            "Failed to send confirmation email during reconciliation"
        );
    }
}

// ─── Search MP Payment by external_reference ─────────────────────────────────

async function searchMpPaymentByReference(
    orderId: string
): Promise<{ id: number | string; status: string } | null> {
    try {
        const accessToken = process.env.MP_ACCESS_TOKEN;
        if (!accessToken) return null;

        const res = await fetch(
            `https://api.mercadopago.com/v1/payments/search?external_reference=${orderId}&sort=date_created&criteria=desc&limit=1`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            }
        );

        if (!res.ok) {
            reconcileLogger.warn(
                { orderId, status: res.status },
                "MP payment search API returned error"
            );
            return null;
        }

        const data = await res.json();
        if (data.results && data.results.length > 0) {
            return {
                id: data.results[0].id,
                status: data.results[0].status,
            };
        }

        return null;
    } catch (err) {
        reconcileLogger.error(
            { orderId, error: err },
            "Error searching MP payments"
        );
        return null;
    }
}

// ─── Alert Admin ─────────────────────────────────────────────────────────────

async function alertAdminStuckOrder(order: OrderWithIncludes) {
    const minutesStuck = Math.round(
        (Date.now() - order.updatedAt.getTime()) / 60000
    );

    reconcileLogger.warn(
        {
            orderId: order.id,
            orderNumber: order.orderNumber,
            minutesStuck,
            total: order.total,
        },
        "ALERT: Order stuck in AWAITING_PAYMENT for over 1 hour"
    );

    // Emit to admin room for OPS panel visibility
    socketEmitToRooms(
        ["admin:orders"],
        "payment_alert",
        {
            type: "stuck_payment",
            orderId: order.id,
            orderNumber: order.orderNumber,
            minutesStuck,
            total: order.total,
            message: `Pedido ${order.orderNumber} lleva ${minutesStuck} min esperando pago`,
        }
    ).catch(console.error);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface OrderWithIncludes {
    id: string;
    orderNumber: string;
    total: number;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    status: string;
    paymentMethod: string | null;
    isPickup: boolean;
    mpPaymentId: string | null;
    mpPreferenceId: string | null;
    updatedAt: Date;
    items: Array<{
        id: string;
        productId: string | null;
        listingId?: string | null;
        name: string;
        price: number;
        quantity: number;
    }>;
    subOrders: Array<{ id: string; merchantId: string | null; sellerId: string | null }>;
    user: { id: string; name: string | null; email: string | null };
    address: {
        street: string;
        number: string;
        apartment: string | null;
        city: string | null;
    } | null;
    payments: Array<{ mpPaymentId: string; mpStatus: string | null }>;
}
