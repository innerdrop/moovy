// Merchant Confirm Order — PENDING → PREPARING + start driver assignment
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { startAssignmentCycle } from "@/lib/assignment-engine";
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

        // Find order and verify ownership
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                status: true,
                merchantId: true,
                userId: true,
                orderNumber: true,
                total: true,
                createdAt: true,
                merchant: { select: { name: true } },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Verify merchant owns this order (skip for ADMIN)
        if (!hasAnyRole(session, ["ADMIN"]) && order.merchantId !== merchant?.id) {
            return NextResponse.json({ error: "Pedido no pertenece a tu comercio" }, { status: 403 });
        }

        if (order.status !== "PENDING") {
            return NextResponse.json(
                { error: `No se puede confirmar un pedido en estado ${order.status}` },
                { status: 400 }
            );
        }

        // Validar que no haya expirado el tiempo de confirmación
        const timeoutConfig = await prisma.moovyConfig.findUnique({
            where: { key: "merchant_confirm_timeout_seconds" },
        });
        const timeoutSeconds = parseInt(timeoutConfig?.value ?? "300", 10);
        const deadline = new Date(order.createdAt).getTime() + timeoutSeconds * 1000;

        if (Date.now() > deadline) {
            return NextResponse.json(
                { error: "El tiempo para confirmar este pedido ha expirado" },
                { status: 400 }
            );
        }

        // Update status to PREPARING
        await prisma.order.update({
            where: { id: orderId },
            data: { status: "PREPARING" },
        });

        // Notify buyer
        notifyBuyer(order.userId, "PREPARING", order.orderNumber, {
            total: order.total,
            merchantName: order.merchant?.name,
            orderId: order.id,
        }).catch(console.error);

        // Start driver assignment cycle
        startAssignmentCycle(orderId).catch((err) =>
            console.error("[Confirm] Error starting assignment:", err)
        );

        // Socket notifications
        const socketData = { orderId, status: "PREPARING", orderNumber: order.orderNumber };
        emitSocket("order_status_changed", `merchant_${order.merchantId}`, socketData).catch(console.error);
        emitSocket("order_status_changed", "admin_orders", socketData).catch(console.error);
        if (order.userId) {
            emitSocket("order_status_changed", `customer_${order.userId}`, socketData).catch(console.error);
        }

        return NextResponse.json({ success: true, status: "PREPARING" });
    } catch (error) {
        console.error("[Merchant Confirm] Error:", error);
        return NextResponse.json({ error: "Error al confirmar el pedido" }, { status: 500 });
    }
}
