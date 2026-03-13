// Merchant Mark Order Ready — PREPARING → READY + notify driver
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";

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
    _req: NextRequest,
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

        // Find merchant owned by this user
        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: { id: true },
        });

        if (!merchant && !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        // Find order with driver info
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                merchantId: true,
                userId: true,
                orderNumber: true,
                driverId: true,
                driver: {
                    select: {
                        userId: true,
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (!hasAnyRole(session, ["ADMIN"]) && order.merchantId !== merchant?.id) {
            return NextResponse.json({ error: "Pedido no pertenece a tu comercio" }, { status: 403 });
        }

        // Allow PREPARING or DRIVER_ASSIGNED → READY
        const readyableStatuses = ["PREPARING", "DRIVER_ASSIGNED"];
        if (!readyableStatuses.includes(order.status)) {
            return NextResponse.json(
                { error: `No se puede marcar como listo un pedido en estado ${order.status}` },
                { status: 400 }
            );
        }

        // Update status to READY
        await prisma.order.update({
            where: { id: orderId },
            data: { status: "READY" },
        });

        // Notify assigned driver if exists
        if (order.driver?.userId) {
            sendPushToUser(order.driver.userId, {
                title: "📦 Pedido listo para retirar",
                body: `El pedido ${order.orderNumber} está listo para retirar en el comercio`,
                url: "/repartidor",
                tag: `order-ready-${orderId}`,
            }).catch(console.error);
        }

        // Socket notifications
        const socketData = { orderId, status: "READY", orderNumber: order.orderNumber };
        emitSocket("order_status_changed", `merchant_${order.merchantId}`, socketData).catch(console.error);
        emitSocket("order_status_changed", "admin_orders", socketData).catch(console.error);
        if (order.driverId) {
            emitSocket("order_status_changed", `driver_${order.driverId}`, socketData).catch(console.error);
        }
        if (order.userId) {
            emitSocket("order_status_changed", `customer_${order.userId}`, socketData).catch(console.error);
        }

        return NextResponse.json({ success: true, status: "READY" });
    } catch (error) {
        console.error("[Merchant Ready] Error:", error);
        return NextResponse.json({ error: "Error al marcar el pedido como listo" }, { status: 500 });
    }
}
