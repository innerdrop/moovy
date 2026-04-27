// Merchant Confirm Scheduled — SCHEDULED → SCHEDULED_CONFIRMED
//
// fix/merchant-flow-pedidos (2026-04-26): equivalente del endpoint del seller
// para que el merchant también pueda confirmar pedidos programados. Si el slot
// está dentro de los próximos 45 min, dispara el assignment cycle inmediato
// (mismo criterio que el cron scheduled-notify y el endpoint del seller).

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { startAssignmentCycle } from "@/lib/assignment-engine";

async function emitSocket(event: string, room: string, data: Record<string, unknown>): Promise<void> {
    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
    await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ event, room, data }),
    }).catch((err) => console.error("[Socket] emit error:", err));
}

export async function POST(
    _request: Request,
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
                orderNumber: true,
                userId: true,
                merchantId: true,
                isPickup: true,
                deliveryType: true,
                scheduledConfirmedAt: true,
                scheduledSlotStart: true,
                scheduledSlotEnd: true,
                status: true,
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (!hasAnyRole(session, ["ADMIN"]) && order.merchantId !== merchant?.id) {
            return NextResponse.json({ error: "Pedido no pertenece a tu comercio" }, { status: 403 });
        }

        if (order.deliveryType !== "SCHEDULED") {
            return NextResponse.json({ error: "Este pedido no es programado" }, { status: 400 });
        }

        if (order.scheduledConfirmedAt) {
            return NextResponse.json({ error: "Este pedido ya fue confirmado" }, { status: 400 });
        }

        if (order.status === "CANCELLED") {
            return NextResponse.json({ error: "Este pedido fue cancelado" }, { status: 400 });
        }

        if (!order.scheduledSlotStart) {
            return NextResponse.json({ error: "El pedido no tiene horario programado" }, { status: 400 });
        }

        const now = new Date();
        const slotStart = order.scheduledSlotStart;
        const msUntilSlot = slotStart.getTime() - now.getTime();
        const minutesUntilSlot = msUntilSlot / (60 * 1000);

        // Update atómico — guard contra race entre seller (multi-vendor) y merchant
        const updateResult = await prisma.order.updateMany({
            where: {
                id: order.id,
                status: "SCHEDULED",
                scheduledConfirmedAt: null,
            },
            data: {
                scheduledConfirmedAt: now,
                status: "SCHEDULED_CONFIRMED",
            },
        });

        if (updateResult.count === 0) {
            return NextResponse.json(
                { error: "El pedido cambió de estado mientras procesábamos la solicitud. Refrescá la lista." },
                { status: 409 }
            );
        }

        const slotTime = slotStart.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        });
        const slotDate = slotStart.toLocaleDateString("es-AR", {
            weekday: "short",
            day: "numeric",
            month: "short",
        });

        notifyBuyer(order.userId, "SCHEDULED_CONFIRMED", order.orderNumber, { orderId: order.id }).catch((err) =>
            console.error("[ConfirmScheduled merchant] Buyer push error:", err)
        );

        emitSocket("order_status_changed", "admin:orders", {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: "SCHEDULED_CONFIRMED",
        }).catch(console.error);
        emitSocket("order_status_changed", `merchant:${order.merchantId}`, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: "SCHEDULED_CONFIRMED",
        }).catch(console.error);
        emitSocket("order_status_changed", `customer:${order.userId}`, {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: "SCHEDULED_CONFIRMED",
        }).catch(console.error);

        // Si el slot está dentro de los próximos 45min, arrancar assignment ya
        // (excepto pickup — no necesita driver)
        let assignmentStarted = false;
        if (!order.isPickup && minutesUntilSlot <= 45) {
            await prisma.order.update({
                where: { id: order.id },
                data: { status: "PENDING" },
            });
            const result = await startAssignmentCycle(order.id);
            assignmentStarted = result.success;
            if (!result.success) {
                console.warn(`[ConfirmScheduled merchant] Assignment failed for ${order.orderNumber}: ${result.error}`);
            }
        }

        return NextResponse.json({
            success: true,
            orderNumber: order.orderNumber,
            scheduledConfirmedAt: now.toISOString(),
            assignmentStarted,
            message: assignmentStarted
                ? `Pedido confirmado. Se está buscando un repartidor para las ${slotTime}.`
                : `Pedido confirmado para el ${slotDate} a las ${slotTime}.`,
        });
    } catch (error) {
        console.error("[ConfirmScheduled merchant] Error:", error);
        return NextResponse.json(
            { error: "Error al confirmar el pedido programado" },
            { status: 500 }
        );
    }
}
