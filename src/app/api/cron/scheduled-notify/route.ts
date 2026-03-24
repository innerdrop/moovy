// API Route: Process scheduled orders — notify sellers, auto-cancel, trigger assignment
// POST /api/cron/scheduled-notify
// Protected with CRON_SECRET Bearer token — no fallback
// Recommended frequency: every 5 minutes

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPushToUser } from "@/lib/push";
import { notifyBuyer } from "@/lib/notifications";
import { startAssignmentCycle } from "@/lib/assignment-engine";
import { cronLogger } from "@/lib/logger";

/** Read a MoovyConfig value by key with default fallback */
async function getConfigValue(key: string, defaultValue: string): Promise<string> {
    const config = await prisma.moovyConfig.findUnique({ where: { key } });
    return config?.value ?? defaultValue;
}

/** Emit a socket event (fire-and-forget) */
async function emitSocket(event: string, room: string, data: Record<string, unknown>): Promise<void> {
    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
    await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ event, room, data }),
    });
}

export async function POST(request: Request) {
    try {
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        // V-028 FIX: timing-safe comparison
        const { verifyBearerToken } = await import("@/lib/env-validation");
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const now = new Date();
        let notified = 0;
        let cancelled = 0;
        let assigned = 0;

        // ─── 1. Read config values ────────────────────────────────────────
        const notifyBeforeStr = await getConfigValue("scheduled_notify_before_minutes", "30");
        const cancelIfNoConfirmStr = await getConfigValue("scheduled_cancel_if_no_confirm_minutes", "10");
        const notifyBeforeMs = parseInt(notifyBeforeStr, 10) * 60 * 1000;
        const cancelIfNoConfirmMs = parseInt(cancelIfNoConfirmStr, 10) * 60 * 1000;
        const assignBeforeMs = 45 * 60 * 1000; // Trigger assignment 45min before slot

        // ─── 2. NOTIFY sellers about upcoming scheduled orders ────────────
        const notifyThreshold = new Date(now.getTime() + notifyBeforeMs);
        const ordersToNotify = await prisma.order.findMany({
            where: {
                deliveryType: "SCHEDULED",
                status: "SCHEDULED",
                scheduledConfirmedAt: null,
                scheduledSlotStart: {
                    gt: now,
                    lte: notifyThreshold,
                },
            },
            include: {
                subOrders: {
                    select: {
                        sellerId: true,
                        merchantId: true,
                        seller: { select: { userId: true } },
                        merchant: { select: { ownerId: true } },
                    },
                },
            },
        });

        for (const order of ordersToNotify) {
            const slotTime = order.scheduledSlotStart!.toLocaleTimeString("es-AR", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
            });

            for (const sub of order.subOrders) {
                const vendorUserId = sub.seller?.userId || sub.merchant?.ownerId;
                if (vendorUserId) {
                    sendPushToUser(vendorUserId, {
                        title: "📅 Pedido programado pendiente",
                        body: `Tenés un pedido programado para las ${slotTime}. Confirmalo ahora.`,
                        url: "/vendedor/pedidos",
                        tag: `scheduled-remind-${order.id}`,
                    }).catch((err) => cronLogger.error({ error: err }, "Push error notifying seller"));

                    const room = sub.sellerId
                        ? `seller:${sub.sellerId}`
                        : `merchant:${sub.merchantId}`;
                    emitSocket("scheduled_order_reminder", room, {
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        scheduledSlotStart: order.scheduledSlotStart?.toISOString(),
                    }).catch((err) => cronLogger.error({ error: err }, "Socket error notifying seller"));
                }
            }

            notified++;
        }

        // ─── 3. AUTO-CANCEL unconfirmed orders too close to slot ──────────
        const cancelThreshold = new Date(now.getTime() + cancelIfNoConfirmMs);
        const ordersToCancel = await prisma.order.findMany({
            where: {
                deliveryType: "SCHEDULED",
                status: "SCHEDULED",
                scheduledConfirmedAt: null,
                scheduledSlotStart: {
                    lte: cancelThreshold,
                },
            },
            select: {
                id: true,
                orderNumber: true,
                userId: true,
                paymentMethod: true,
            },
        });

        for (const order of ordersToCancel) {
            await prisma.order.update({
                where: { id: order.id },
                data: {
                    status: "CANCELLED",
                    cancelReason: "El vendedor no confirmó el pedido programado",
                },
            });

            // Notify buyer
            notifyBuyer(order.userId, "SCHEDULED_CANCELLED", order.orderNumber, { orderId: order.id }).catch((err) =>
                cronLogger.error({ error: err }, "Buyer push error")
            );

            // Notify admin
            emitSocket("order_cancelled", "admin:orders", {
                orderId: order.id,
                orderNumber: order.orderNumber,
                reason: "Vendedor no confirmó pedido programado",
            }).catch((err) => cronLogger.error({ error: err }, "Admin socket error"));

            // TODO: If paymentMethod === "mercadopago" and payment was captured, trigger refund via MP API

            cancelled++;
        }

        // ─── 4. TRIGGER ASSIGNMENT for confirmed orders approaching slot ──
        const assignThreshold = new Date(now.getTime() + assignBeforeMs);
        const ordersToAssign = await prisma.order.findMany({
            where: {
                deliveryType: "SCHEDULED",
                status: "SCHEDULED_CONFIRMED",
                scheduledConfirmedAt: { not: null },
                driverId: null,
                scheduledSlotStart: {
                    gt: now,
                    lte: assignThreshold,
                },
            },
            select: {
                id: true,
                orderNumber: true,
            },
        });

        for (const order of ordersToAssign) {
            // Move to PENDING so assignment engine can work with it
            await prisma.order.update({
                where: { id: order.id },
                data: { status: "PENDING" },
            });

            const result = await startAssignmentCycle(order.id);
            if (result.success) {
                cronLogger.info({ orderNumber: order.orderNumber }, "Assignment started for scheduled order");
            } else {
                cronLogger.warn({ orderNumber: order.orderNumber, error: result.error }, "Assignment failed for scheduled order");
            }

            assigned++;
        }

        return NextResponse.json({
            success: true,
            notified,
            cancelled,
            assigned,
            timestamp: now.toISOString(),
        });
    } catch (error) {
        cronLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Error processing scheduled orders"
        );
        return NextResponse.json(
            { success: false, error: "Error al procesar pedidos programados" },
            { status: 500 }
        );
    }
}
