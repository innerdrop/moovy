// Cron: Auto-cancel orders that merchants didn't confirm within timeout
// Reads merchant_confirm_timeout_seconds from MoovyConfig
// Should run every 1-2 minutes via external scheduler

import { NextRequest, NextResponse } from "next/server";
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

export async function POST(req: NextRequest) {
    try {
        // Auth: CRON_SECRET
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");
        // V-028 FIX: timing-safe comparison
        const { verifyBearerToken } = await import("@/lib/env-validation");
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Read timeout from MoovyConfig
        const configRow = await prisma.moovyConfig.findUnique({
            where: { key: "merchant_confirm_timeout_seconds" },
        });
        const timeoutSeconds = configRow ? parseInt(configRow.value, 10) : 300; // default 5 min

        if (isNaN(timeoutSeconds) || timeoutSeconds <= 0) {
            return NextResponse.json({ error: "Invalid timeout config" }, { status: 500 });
        }

        const cutoff = new Date(Date.now() - timeoutSeconds * 1000);

        // Find PENDING IMMEDIATE orders past the timeout
        const expiredOrders = await prisma.order.findMany({
            where: {
                status: "PENDING",
                deliveryType: "IMMEDIATE",
                createdAt: { lt: cutoff },
            },
            select: {
                id: true,
                userId: true,
                orderNumber: true,
                merchantId: true,
            },
        });

        if (expiredOrders.length === 0) {
            return NextResponse.json({ cancelled: 0 });
        }

        // Cancel each expired order
        const cancelReason = "El comercio no confirmó el pedido a tiempo";

        for (const order of expiredOrders) {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: "CANCELLED",
                    cancelReason,
                },
            });

            // Notify buyer
            notifyBuyer(order.userId, "CANCELLED", order.orderNumber, { orderId: order.id }).catch(console.error);

            // Socket notifications
            const socketData = { orderId: order.id, orderNumber: order.orderNumber };
            if (order.merchantId) {
                emitSocket("order_cancelled", `merchant:${order.merchantId}`, socketData).catch(console.error);
            }
            emitSocket("order_cancelled", "admin:orders", socketData).catch(console.error);
            if (order.userId) {
                emitSocket("order_cancelled", `customer:${order.userId}`, socketData).catch(console.error);
            }
        }

        console.log(`[MerchantTimeout] Cancelled ${expiredOrders.length} expired orders`);
        return NextResponse.json({ cancelled: expiredOrders.length });
    } catch (error) {
        console.error("[MerchantTimeout] Error:", error);
        return NextResponse.json({ error: "Error processing timeouts" }, { status: 500 });
    }
}
