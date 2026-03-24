// Merchant Reject Order — Cancel with reason + notify buyer + refund if paid
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { createRefund } from "@/lib/mercadopago";

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

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["MERCHANT", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id: orderId } = await params;
        const body = await req.json().catch(() => ({}));
        const reason = typeof body.reason === "string" ? body.reason.trim() : "";

        if (!reason) {
            return NextResponse.json({ error: "Motivo de rechazo requerido" }, { status: 400 });
        }

        if (reason.length > 500) {
            return NextResponse.json({ error: "Motivo demasiado largo (máx 500 caracteres)" }, { status: 400 });
        }

        // Find merchant owned by this user
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: { id: true },
        });

        if (!merchant && !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        // Find order and verify ownership
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                merchantId: true,
                userId: true,
                orderNumber: true,
                paymentMethod: true,
                paymentStatus: true,
                mpPaymentId: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (!hasAnyRole(session, ["ADMIN"]) && order.merchantId !== merchant?.id) {
            return NextResponse.json({ error: "Pedido no pertenece a tu comercio" }, { status: 403 });
        }

        // Only reject active orders
        const rejectableStatuses = ["PENDING", "CONFIRMED", "PREPARING"];
        if (!rejectableStatuses.includes(order.status)) {
            return NextResponse.json(
                { error: `No se puede rechazar un pedido en estado ${order.status}` },
                { status: 400 }
            );
        }

        // Update order to CANCELLED with reason
        await prisma.order.update({
            where: { id: orderId },
            data: {
                status: "CANCELLED",
                cancelReason: reason,
            },
        });

        // Notify buyer
        notifyBuyer(order.userId, "CANCELLED", order.orderNumber, { orderId: order.id }).catch(console.error);

        // Socket notifications
        const socketData = { orderId, orderNumber: order.orderNumber };
        emitSocket("order_cancelled", `merchant:${order.merchantId}`, socketData).catch(console.error);
        emitSocket("order_cancelled", "admin:orders", socketData).catch(console.error);
        if (order.userId) {
            emitSocket("order_cancelled", `customer:${order.userId}`, socketData).catch(console.error);
        }

        // AUDIT FIX 2.3: Refund MercadoPago payment when merchant rejects
        if (order.paymentMethod === "mercadopago" && order.paymentStatus === "PAID") {
            try {
                // Find the MP payment ID for this order
                const payment = await prisma.payment.findFirst({
                    where: { orderId: order.id, mpStatus: "approved" },
                    select: { mpPaymentId: true },
                });

                if (payment?.mpPaymentId) {
                    const refundResult = await createRefund(payment.mpPaymentId);
                    if (refundResult) {
                        // Update order payment status to reflect refund
                        await prisma.order.update({
                            where: { id: orderId },
                            data: { paymentStatus: "REFUNDED" },
                        });
                        // Update payment record
                        await prisma.payment.update({
                            where: { mpPaymentId: payment.mpPaymentId },
                            data: {
                                mpStatus: "refunded",
                                mpStatusDetail: `Refund ID: ${refundResult.id} — Merchant rejection: ${reason}`,
                            },
                        });
                        console.log(`[Merchant Reject] Refund successful for order ${order.orderNumber}: refund ID ${refundResult.id}`);
                    } else {
                        // Refund failed — log for manual intervention
                        console.error(`[Merchant Reject] CRITICAL: Refund FAILED for order ${order.orderNumber}. Manual refund required.`);
                        // Notify admin via socket
                        emitSocket("refund_failed", "admin:orders", {
                            orderId,
                            orderNumber: order.orderNumber,
                            reason: "Merchant rejection — automatic refund failed",
                        }).catch(console.error);
                    }
                }
            } catch (refundError) {
                console.error(`[Merchant Reject] Refund error for order ${order.orderNumber}:`, refundError);
                // Don't fail the reject — the cancellation already happened
                // Admin will need to handle refund manually
                emitSocket("refund_failed", "admin:orders", {
                    orderId,
                    orderNumber: order.orderNumber,
                    reason: "Merchant rejection — refund exception",
                }).catch(console.error);
            }
        }

        // AUDIT FIX: Restore stock when merchant rejects
        try {
            const orderItems = await prisma.orderItem.findMany({
                where: { orderId },
                select: { productId: true, listingId: true, quantity: true },
            });

            for (const item of orderItems) {
                if (item.listingId) {
                    await prisma.listing.update({
                        where: { id: item.listingId },
                        data: { stock: { increment: item.quantity } },
                    });
                } else if (item.productId) {
                    await prisma.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.quantity } },
                    });
                }
            }
        } catch (stockError) {
            console.error(`[Merchant Reject] Stock restore error for order ${order.orderNumber}:`, stockError);
        }

        return NextResponse.json({ success: true, status: "CANCELLED" });
    } catch (error) {
        console.error("[Merchant Reject] Error:", error);
        return NextResponse.json({ error: "Error al rechazar el pedido" }, { status: 500 });
    }
}
