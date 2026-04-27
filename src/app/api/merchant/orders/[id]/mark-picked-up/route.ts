// Merchant Mark Picked Up — Pickup self-contained
//
// fix/merchant-flow-pedidos (2026-04-26): cierra la operación de un pedido pickup
// cuando el cliente vino al local y retiró. Transición READY → DELIVERED, sin driver.
//
// Solo aplica si Order.isPickup === true. Para delivery normal el driver es quien
// marca DELIVERED via /api/driver/orders/[id]/status.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { logUserActivity, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";
import { awardOrderPointsIfDelivered } from "@/lib/points";

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

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: { id: true },
        });

        if (!merchant && !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                merchantId: true,
                userId: true,
                orderNumber: true,
                total: true,
                isPickup: true,
                merchant: { select: { name: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (!hasAnyRole(session, ["ADMIN"]) && order.merchantId !== merchant?.id) {
            return NextResponse.json({ error: "Pedido no pertenece a tu comercio" }, { status: 403 });
        }

        if (!order.isPickup) {
            return NextResponse.json(
                { error: "Este pedido no es de retiro en local. Lo entrega un repartidor." },
                { status: 400 }
            );
        }

        if (order.status !== "READY") {
            return NextResponse.json(
                { error: `No se puede marcar como entregado un pedido en estado ${order.status}. Tiene que estar en READY (Listo).` },
                { status: 400 }
            );
        }

        // Update atómico — guard contra race conditions
        const now = new Date();
        const updateResult = await prisma.order.updateMany({
            where: { id: orderId, status: "READY", isPickup: true },
            data: {
                status: "DELIVERED",
                deliveryStatus: "DELIVERED",
                deliveredAt: now,
            },
        });

        if (updateResult.count === 0) {
            return NextResponse.json(
                { error: "El pedido cambió de estado mientras procesábamos la solicitud. Refrescá la lista." },
                { status: 409 }
            );
        }

        // Award points (idempotente via Order.pointsEarned — ver src/lib/points.ts)
        try {
            await awardOrderPointsIfDelivered(orderId);
        } catch (err) {
            console.error("[mark-picked-up] awardOrderPointsIfDelivered failed:", err);
        }

        // Notify buyer
        notifyBuyer(order.userId, "DELIVERED", order.orderNumber, {
            total: order.total,
            merchantName: order.merchant?.name,
            orderId: order.id,
        }).catch(console.error);

        // Socket emit
        const socketData = {
            orderId,
            status: "DELIVERED",
            orderNumber: order.orderNumber,
            isPickup: true,
        };
        emitSocket("order_status_changed", `merchant:${order.merchantId}`, socketData).catch(console.error);
        emitSocket("order_status_changed", `customer:${order.userId}`, socketData).catch(console.error);
        emitSocket("order_status_changed", "admin:orders", socketData).catch(console.error);
        emitSocket("pedido_entregado", `customer:${order.userId}`, socketData).catch(console.error);

        // Audit log
        const { ipAddress, userAgent } = extractRequestInfo(req);
        logUserActivity({
            userId: session.user.id,
            action: ACTIVITY_ACTIONS.ORDER_DELIVERED ?? "ORDER_DELIVERED",
            entityType: "Order",
            entityId: orderId,
            metadata: { orderNumber: order.orderNumber, isPickup: true, deliveredBy: "merchant" },
            ipAddress,
            userAgent,
        }).catch((err) => console.error("[mark-picked-up] activity log failed:", err));

        return NextResponse.json({
            success: true,
            status: "DELIVERED",
            deliveredAt: now.toISOString(),
        });
    } catch (error) {
        console.error("[MerchantMarkPickedUp] Error:", error);
        return NextResponse.json(
            { error: "Error al cerrar el pedido" },
            { status: 500 }
        );
    }
}
