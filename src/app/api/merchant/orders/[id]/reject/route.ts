// Merchant Reject Order — Cancel with reason + notify buyer
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";

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
        notifyBuyer(order.userId, "CANCELLED", order.orderNumber).catch(console.error);

        // Socket notifications
        const socketData = { orderId, orderNumber: order.orderNumber };
        emitSocket("order_cancelled", `merchant_${order.merchantId}`, socketData).catch(console.error);
        emitSocket("order_cancelled", "admin_orders", socketData).catch(console.error);
        if (order.userId) {
            emitSocket("order_cancelled", `customer_${order.userId}`, socketData).catch(console.error);
        }

        // TODO: If paid via MercadoPago, trigger refund
        // if (order.paymentMethod === "mercadopago" && order.paymentStatus === "PAID") {
        //     triggerRefund(orderId).catch(console.error);
        // }

        return NextResponse.json({ success: true, status: "CANCELLED" });
    } catch (error) {
        console.error("[Merchant Reject] Error:", error);
        return NextResponse.json({ error: "Error al rechazar el pedido" }, { status: 500 });
    }
}
