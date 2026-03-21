// API Route: Cancel order (buyer or admin)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { applyRateLimit } from "@/lib/rate-limit";

// Statuses that allow buyer cancellation
const BUYER_CANCELLABLE = ["PENDING", "AWAITING_PAYMENT", "SCHEDULED"];
// Statuses that allow admin cancellation (broader)
const ADMIN_CANCELLABLE = ["PENDING", "AWAITING_PAYMENT", "SCHEDULED", "CONFIRMED", "PREPARING"];

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const limited = applyRateLimit(request, "orders:cancel", 10, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: orderId } = await params;
    const body = await request.json().catch(() => ({}));
    const cancelReason = body.reason || "Cancelado por el usuario";

    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
            items: { select: { productId: true, listingId: true, quantity: true } },
            merchant: { select: { id: true, ownerId: true, name: true } },
            subOrders: { select: { merchantId: true, sellerId: true } },
        },
    });

    if (!order || order.deletedAt) {
        return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const isAdmin = hasAnyRole(session, ["ADMIN"]);
    const isOwner = order.userId === session.user.id;

    if (!isOwner && !isAdmin) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Check if cancellation is allowed based on role
    const allowedStatuses = isAdmin ? ADMIN_CANCELLABLE : BUYER_CANCELLABLE;
    if (!allowedStatuses.includes(order.status)) {
        const message = order.status === "IN_DELIVERY"
            ? "No podés cancelar un pedido que ya está en camino. Contactá a soporte."
            : `No se puede cancelar un pedido en estado "${order.status}"`;
        return NextResponse.json({ error: message }, { status: 400 });
    }

    // Cancel order + restore stock in a transaction
    await prisma.$transaction(async (tx) => {
        // Update order status
        await tx.order.update({
            where: { id: orderId },
            data: {
                status: "CANCELLED",
                cancelReason,
                paymentStatus: order.paymentStatus === "APPROVED" ? "REFUNDED" : order.paymentStatus,
                adminNotes: isAdmin
                    ? `${order.adminNotes || ""}\n[${new Date().toISOString()}] Cancelado por admin: ${cancelReason}`.trim()
                    : order.adminNotes,
            },
        });

        // Cancel sub-orders if any
        await tx.subOrder.updateMany({
            where: { orderId, status: { not: "CANCELLED" } },
            data: { status: "CANCELLED" },
        });

        // Restore stock for all items
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

        // Release assigned driver if any
        if (order.driverId) {
            await tx.order.update({
                where: { id: orderId },
                data: { driverId: null, pendingDriverId: null },
            });
            // Clean up pending assignment
            await tx.pendingAssignment.deleteMany({ where: { orderId } });
        }
    });

    // Refund points if used (non-blocking)
    if (order.discount > 0) {
        try {
            const { processOrderPoints } = await import("@/lib/points");
            // Negative spend = refund
            await processOrderPoints(order.userId, orderId, 0, -(order.discount * 100));
        } catch (e) {
            console.error("[Cancel] Failed to refund points:", e);
        }
    }

    // Notify buyer via push (non-blocking)
    notifyBuyer(order.userId, "CANCELLED", order.orderNumber, {
        orderId: order.id,
        merchantName: order.merchant?.name,
    }).catch(console.error);

    // Notify via socket (non-blocking)
    try {
        const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
        const headers = { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` };
        const data = { orderId, orderNumber: order.orderNumber, status: "CANCELLED", cancelReason };

        // Notify merchant
        if (order.merchantId) {
            fetch(`${socketUrl}/emit`, {
                method: "POST", headers,
                body: JSON.stringify({ event: "order_cancelled", room: `merchant:${order.merchantId}`, data }),
            }).catch(console.error);
        }

        // Notify sellers
        for (const sub of order.subOrders) {
            if (sub.sellerId) {
                fetch(`${socketUrl}/emit`, {
                    method: "POST", headers,
                    body: JSON.stringify({ event: "order_cancelled", room: `seller:${sub.sellerId}`, data }),
                }).catch(console.error);
            }
        }

        // Notify admin
        fetch(`${socketUrl}/emit`, {
            method: "POST", headers,
            body: JSON.stringify({ event: "order_cancelled", room: "admin:orders", data }),
        }).catch(console.error);
    } catch (e) {
        console.error("[Socket] Failed to notify cancellation:", e);
    }

    return NextResponse.json({
        success: true,
        message: "Pedido cancelado exitosamente",
        refundNote: order.paymentStatus === "APPROVED"
            ? "El reembolso será procesado en las próximas 48hs"
            : undefined,
    });
}
