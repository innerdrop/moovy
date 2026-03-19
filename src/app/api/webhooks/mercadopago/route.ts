// API Route: MercadoPago Webhook
// Receives payment notifications, validates HMAC, updates order state
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { paymentApi, verifyWebhookSignature } from "@/lib/mercadopago";
import { sendOrderConfirmationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const xSignature = request.headers.get("x-signature") || "";
        const xRequestId = request.headers.get("x-request-id") || "";

        const { type, data } = body as {
            type?: string;
            data?: { id?: string };
        };

        // Only process payment notifications
        if (type !== "payment" || !data?.id) {
            return NextResponse.json({ received: true });
        }

        const dataId = String(data.id);

        // V-012 FIX: ALWAYS validate HMAC signature — reject if secret not configured
        if (!process.env.MP_WEBHOOK_SECRET) {
            console.error("[MP-Webhook] CRITICAL: MP_WEBHOOK_SECRET is not configured. Rejecting webhook.");
            return NextResponse.json({ error: "Webhook validation not configured" }, { status: 500 });
        }
        if (xSignature) {
            const valid = verifyWebhookSignature(xSignature, xRequestId, dataId);
            if (!valid) {
                console.error("[MP-Webhook] Invalid HMAC signature");
                return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
            }
        } else {
            console.warn("[MP-Webhook] Missing x-signature header — rejecting");
            return NextResponse.json({ error: "Missing signature" }, { status: 401 });
        }

        // V-015 FIX: Idempotency — use crypto UUID as fallback instead of Date.now()
        const crypto = await import("crypto");
        const eventId = xRequestId || `payment-${dataId}-${crypto.randomUUID()}`;
        const existing = await prisma.mpWebhookLog.findUnique({
            where: { eventId },
        });
        if (existing?.processed) {
            return NextResponse.json({ received: true, already_processed: true });
        }

        // Create webhook log entry
        await prisma.mpWebhookLog.upsert({
            where: { eventId },
            create: { eventId, eventType: type, resourceId: dataId },
            update: {},
        });

        // Fetch payment from MP API
        const mpPayment = await paymentApi.get({ id: dataId });

        if (!mpPayment || !mpPayment.external_reference) {
            console.error("[MP-Webhook] Payment not found or missing external_reference:", dataId);
            return NextResponse.json({ received: true });
        }

        // Find order by external_reference (= order.id)
        const orderId = mpPayment.external_reference;
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: { select: { id: true, productId: true, name: true, price: true, quantity: true } },
                subOrders: { select: { id: true, merchantId: true, sellerId: true } },
                user: { select: { name: true, email: true } },
                address: { select: { street: true, number: true, apartment: true, city: true } },
            },
        });

        if (!order) {
            console.error("[MP-Webhook] Order not found:", orderId);
            return NextResponse.json({ received: true });
        }

        const paymentStatus = mpPayment.status || "unknown";
        const mpPaymentId = String(mpPayment.id || dataId);

        // Create Payment record
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
                rawPayload: body,
            },
            update: {
                mpStatus: paymentStatus,
                mpStatusDetail: mpPayment.status_detail || null,
                rawPayload: body,
            },
        });

        // Handle payment status
        if (paymentStatus === "approved") {
            await handleApproved(order, mpPaymentId, paymentStatus);
        } else if (paymentStatus === "rejected") {
            await handleRejected(order, mpPaymentId, paymentStatus);
        } else {
            // pending, in_process, etc — just update mpStatus
            await prisma.order.update({
                where: { id: order.id },
                data: { mpStatus: paymentStatus },
            });
        }

        // Mark webhook as processed
        await prisma.mpWebhookLog.update({
            where: { eventId },
            data: { processed: true },
        });

        return NextResponse.json({ received: true });
    } catch (error) {
        console.error("[MP-Webhook] Error processing webhook:", error);
        // Return 200 to prevent MP from retrying on server errors we already logged
        return NextResponse.json({ received: true, error: "internal" });
    }
}

// ─── Approved Payment ────────────────────────────────────────────────────────

interface OrderWithRelations {
    id: string;
    orderNumber: string;
    total: number;
    subtotal: number;
    deliveryFee: number;
    discount: number;
    status: string;
    paymentMethod: string | null;
    isPickup: boolean;
    items: Array<{ id: string; productId: string | null; listingId?: string | null; name: string; price: number; quantity: number }>;
    subOrders: Array<{ id: string; merchantId: string | null; sellerId: string | null }>;
    user: { name: string | null; email: string | null };
    address: { street: string; number: string; apartment: string | null; city: string | null } | null;
}

async function handleApproved(
    order: OrderWithRelations,
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

    // Socket emit to vendors and admin
    await emitPaymentEvent("payment_confirmed", order);

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
        console.error("[MP-Webhook] Failed to send confirmation email:", emailError);
    }
}

// ─── Rejected Payment ────────────────────────────────────────────────────────

async function handleRejected(
    order: OrderWithRelations,
    mpPaymentId: string,
    mpStatus: string
) {
    // Restore stock and cancel order in transaction
    await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
            if (item.listingId) {
                await tx.listing.update({
                    where: { id: item.listingId },
                    data: { stock: { increment: item.quantity } },
                });
            } else if (item.productId) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }
        }

        await tx.order.update({
            where: { id: order.id },
            data: {
                paymentStatus: "FAILED",
                status: "CANCELLED",
                mpPaymentId,
                mpStatus,
                cancelReason: "Pago rechazado por MercadoPago",
            },
        });
    });

    // Socket emit
    await emitPaymentEvent("payment_failed", order);
}

// ─── Socket Helper ───────────────────────────────────────────────────────────

async function emitPaymentEvent(event: string, order: OrderWithRelations) {
    try {
        const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        };

        const payload = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            total: order.total,
            status: order.status,
        };

        // Emit to each vendor
        for (const sub of order.subOrders) {
            if (sub.merchantId) {
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ event, room: `merchant:${sub.merchantId}`, data: payload }),
                });
            }
            if (sub.sellerId) {
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({ event, room: `seller:${sub.sellerId}`, data: payload }),
                });
            }
        }

        // Emit to admin
        await fetch(`${socketUrl}/emit`, {
            method: "POST",
            headers,
            body: JSON.stringify({ event, room: "admin:orders", data: payload }),
        });

        // Emit to order room (for client polling/realtime)
        await fetch(`${socketUrl}/emit`, {
            method: "POST",
            headers,
            body: JSON.stringify({ event, room: `order:${order.id}`, data: payload }),
        });

        console.log(`[MP-Webhook] Socket emit ${event} for order ${order.orderNumber}`);
    } catch (e) {
        console.error("[MP-Webhook] Socket emit failed:", e);
    }
}
