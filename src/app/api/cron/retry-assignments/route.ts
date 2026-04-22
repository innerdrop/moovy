// Cron: Automatic retry for stuck orders
// Finds orders in CONFIRMED status with no driver and no active assignment
// Restarts assignment cycle with max 3 retries before escalating to admin
// ISSUE-010: También detecta órdenes en DRIVER_ASSIGNED/DRIVER_ARRIVED/PICKED_UP
// cuyo driver se desconectó o dejó de actualizar GPS hace más de 15min y escala a admin.
// Should run every 5 minutes via external scheduler

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startAssignmentCycle, startSubOrderAssignmentCycle } from "@/lib/assignment-engine";
import { verifyBearerToken } from "@/lib/env-validation";
import { cronLogger } from "@/lib/logger";
import { createRefund } from "@/lib/mercadopago";
import { recordPointsTransaction, reverseOrderPoints } from "@/lib/points";
import { notifyBuyerOrderAutoCancelled } from "@/lib/notifications";

// ISSUE-010: Umbrales para detección de driver offline mid-delivery
const DRIVER_OFFLINE_THRESHOLD_MINUTES = 15;
const DRIVER_OFFLINE_ACTIVE_STATES = ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP"] as const;

// ISSUE-015: Umbrales de auto-cancelación por falta de repartidor
// MAX_RETRIES (3) marca el momento en que empezamos a escalar a admin.
// AUTO_CANCEL_THRESHOLD (6) marca el momento en que tiramos la toalla:
// ~30min con cron cada 5min (3 retries propios + 3 retries admin-notified) sin
// lograr asignar. El buyer merece un cierre limpio + refund + bonus compensatorio.
const AUTO_CANCEL_THRESHOLD = 6;
const AUTO_CANCEL_REASON = "No conseguimos repartidor disponible para tu pedido";
const AUTO_CANCEL_BONUS_POINTS = 500;

const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

async function emitSocket(event: string, room: string, data: Record<string, unknown>): Promise<void> {
    await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ event, room, data }),
    }).catch((err) => cronLogger.error({ error: err }, "Socket emit error"));
}

async function notifyAdminOfStuckOrder(orderId: string, orderNumber: string, reason: string): Promise<void> {
    // Leemos ADMIN desde el campo legacy User.role. No derivamos desde UserRole
    // porque ADMIN no depende de domain state (no tiene Merchant/Driver/Seller asociado).
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN", deletedAt: null },
        select: { id: true },
    });

    for (const { id: userId } of admins) {
        // Send via socket to admin
        emitSocket("stuck_order_alert", `admin:${userId}`, {
            orderId,
            orderNumber,
            reason,
            timestamp: new Date().toISOString(),
        }).catch((err) => cronLogger.error({ error: err }, "Failed to notify admin of stuck order"));
    }

    // Also emit to admin_orders room
    emitSocket("stuck_order_alert", "admin:orders", {
        orderId,
        orderNumber,
        reason,
        timestamp: new Date().toISOString(),
    }).catch((err) => cronLogger.error({ error: err }, "Failed to notify admin_orders"));
}

/**
 * ISSUE-010: Notifica a admin cuando un driver se desconecta con un pedido en curso.
 * A diferencia de `notifyAdminOfStuckOrder`, este evento incluye datos del driver
 * (id, nombre, último GPS) para que el admin pueda reasignar manualmente o contactarlo.
 * No reasignamos automáticamente porque el driver puede tener el paquete en mano
 * (PICKED_UP) y la reasignación requiere coordinación humana.
 */
async function notifyAdminOfOfflineDriver(params: {
    orderId: string;
    orderNumber: string;
    subOrderId?: string;
    driverId: string;
    driverName: string | null;
    deliveryStatus: string;
    minutesOffline: number;
    driverIsOnline: boolean;
    lastLocationAt: Date | null;
}): Promise<void> {
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN", deletedAt: null },
        select: { id: true },
    });

    const payload = {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        subOrderId: params.subOrderId ?? null,
        driverId: params.driverId,
        driverName: params.driverName,
        deliveryStatus: params.deliveryStatus,
        minutesOffline: params.minutesOffline,
        driverIsOnline: params.driverIsOnline,
        lastLocationAt: params.lastLocationAt?.toISOString() ?? null,
        reason: `Driver offline mid-delivery (${params.deliveryStatus}, ${params.minutesOffline}min sin señal). Reasignación manual puede ser necesaria.`,
        timestamp: new Date().toISOString(),
    };

    for (const { id: userId } of admins) {
        emitSocket("driver_offline_mid_delivery", `admin:${userId}`, payload).catch((err) =>
            cronLogger.error({ error: err }, "Failed to notify admin of offline driver")
        );
    }

    // Emit to both admin:orders and admin:drivers rooms so cualquier panel que escuche
    // alguno de los dos pueda renderizar el incidente.
    emitSocket("driver_offline_mid_delivery", "admin:orders", payload).catch((err) =>
        cronLogger.error({ error: err }, "Failed to notify admin_orders of offline driver")
    );
    emitSocket("driver_offline_mid_delivery", "admin:drivers", payload).catch((err) =>
        cronLogger.error({ error: err }, "Failed to notify admin_drivers of offline driver")
    );
}

/**
 * ISSUE-015: Auto-cancela un pedido stuck después de AUTO_CANCEL_THRESHOLD intentos
 * fallidos de asignación. Hace todo lo que haría un merchant/reject manual:
 * (1) marca Order + SubOrders como CANCELLED dentro de un $transaction atómico,
 * (2) restaura stock de cada item,
 * (3) libera driver si por alguna razón quedó colgado (defensivo),
 * (4) limpia PendingAssignment,
 * (5) dispara refund MP si el pedido fue PAID,
 * (6) revierte puntos REDEEM si el buyer los canjeó al crear,
 * (7) otorga bonus compensatorio de AUTO_CANCEL_BONUS_POINTS,
 * (8) envía push al buyer + sockets a merchant/admin/buyer.
 *
 * Cada paso side-effect va en try/catch porque el cron no debe caer si una
 * notificación o un refund falla: el $transaction ya garantiza que el pedido
 * quedó CANCELLED (lo importante), los side effects se loguean y admin los
 * resuelve manualmente si algo no ocurrió.
 *
 * Scope: single-vendor Orders. Multi-vendor SubOrder auto-cancel queda para
 * una fase 2 porque el refund parcial (cancelar 1 de 3 vendedores) requiere
 * lógica de prorrateo que no existe aún.
 */
async function autoCancelStuckOrder(
    orderBrief: { id: string; orderNumber: string; userId: string },
    attempts: number
): Promise<{ success: boolean; refunded: boolean; bonusAwarded: number }> {
    // Fetch full order details needed for the cascade
    const fullOrder = await prisma.order.findUnique({
        where: { id: orderBrief.id },
        select: {
            id: true,
            orderNumber: true,
            userId: true,
            status: true,
            driverId: true,
            paymentMethod: true,
            paymentStatus: true,
            merchantId: true,
            items: { select: { productId: true, listingId: true, quantity: true } },
        },
    });

    if (!fullOrder) {
        cronLogger.warn({ orderId: orderBrief.id }, "Auto-cancel: order not found, skipping");
        return { success: false, refunded: false, bonusAwarded: 0 };
    }

    if (fullOrder.status === "CANCELLED" || fullOrder.status === "DELIVERED") {
        cronLogger.warn(
            { orderId: fullOrder.id, status: fullOrder.status },
            "Auto-cancel: order already finalized, skipping"
        );
        return { success: false, refunded: false, bonusAwarded: 0 };
    }

    // (1-4) Atomic cancel + sub-orders + stock + driver release + pending cleanup
    await prisma.$transaction(async (tx) => {
        await tx.order.update({
            where: { id: fullOrder.id },
            data: {
                status: "CANCELLED",
                cancelReason: AUTO_CANCEL_REASON,
                adminNotes: `[${new Date().toISOString()}] Auto-cancelado por cron: ${attempts} intentos fallidos de asignación (~${attempts * 5}min).`,
                driverId: null,
                pendingDriverId: null,
            },
        });

        await tx.subOrder.updateMany({
            where: { orderId: fullOrder.id, status: { not: "CANCELLED" } },
            data: { status: "CANCELLED" },
        });

        for (const item of fullOrder.items) {
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

        await tx.pendingAssignment.deleteMany({ where: { orderId: fullOrder.id } });
    });

    cronLogger.info(
        { orderId: fullOrder.id, orderNumber: fullOrder.orderNumber, attempts },
        "Auto-cancel: order + sub-orders + stock transaction committed"
    );

    // (5) Refund MP if paid
    let refunded = false;
    if (fullOrder.paymentMethod === "mercadopago" && fullOrder.paymentStatus === "PAID") {
        try {
            const payment = await prisma.payment.findFirst({
                where: { orderId: fullOrder.id, mpStatus: "approved" },
                select: { mpPaymentId: true },
            });

            if (payment?.mpPaymentId) {
                const refundResult = await createRefund(payment.mpPaymentId);
                if (refundResult) {
                    await prisma.order.update({
                        where: { id: fullOrder.id },
                        data: { paymentStatus: "REFUNDED" },
                    });
                    await prisma.payment.update({
                        where: { mpPaymentId: payment.mpPaymentId },
                        data: {
                            mpStatus: "refunded",
                            mpStatusDetail: `Refund ID: ${refundResult.id} — Auto-cancelación sin repartidor disponible`,
                        },
                    });
                    refunded = true;
                    cronLogger.info(
                        { orderId: fullOrder.id, orderNumber: fullOrder.orderNumber, refundId: refundResult.id },
                        "Auto-cancel: refund successful"
                    );
                } else {
                    cronLogger.error(
                        { orderId: fullOrder.id, orderNumber: fullOrder.orderNumber },
                        "Auto-cancel: REFUND FAILED. Manual refund required."
                    );
                    emitSocket("refund_failed", "admin:orders", {
                        orderId: fullOrder.id,
                        orderNumber: fullOrder.orderNumber,
                        reason: "Auto-cancelación sin repartidor — refund MP falló",
                    }).catch(() => {});
                }
            }
        } catch (err) {
            cronLogger.error(
                { error: err instanceof Error ? err.message : String(err), orderId: fullOrder.id },
                "Auto-cancel: refund exception"
            );
            emitSocket("refund_failed", "admin:orders", {
                orderId: fullOrder.id,
                orderNumber: fullOrder.orderNumber,
                reason: "Auto-cancelación sin repartidor — excepción en refund",
            }).catch(() => {});
        }
    }

    // (6) Reverse points — REDEEM si el buyer canjeó al crear, idempotente vía pointsEarned/pointsUsed
    try {
        const result = await reverseOrderPoints(
            fullOrder.id,
            `auto-cancelación sin repartidor (pedido #${fullOrder.orderNumber})`
        );
        if (result.redeemReverted > 0 || result.earnReverted > 0) {
            cronLogger.info(
                { orderId: fullOrder.id, ...result },
                "Auto-cancel: points reverted"
            );
        }
    } catch (err) {
        cronLogger.error(
            { error: err instanceof Error ? err.message : String(err), orderId: fullOrder.id },
            "Auto-cancel: points reverse error"
        );
    }

    // (7) Bonus compensatorio de 500 pts
    let bonusAwarded = 0;
    try {
        const ok = await recordPointsTransaction(
            fullOrder.userId,
            "BONUS",
            AUTO_CANCEL_BONUS_POINTS,
            `Compensación por pedido sin repartidor disponible (#${fullOrder.orderNumber})`,
            fullOrder.id
        );
        if (ok) {
            bonusAwarded = AUTO_CANCEL_BONUS_POINTS;
            cronLogger.info(
                { orderId: fullOrder.id, userId: fullOrder.userId, bonus: bonusAwarded },
                "Auto-cancel: compensation bonus awarded"
            );
        }
    } catch (err) {
        cronLogger.error(
            { error: err instanceof Error ? err.message : String(err), orderId: fullOrder.id, userId: fullOrder.userId },
            "Auto-cancel: bonus award error"
        );
    }

    // (8a) Push al buyer
    try {
        await notifyBuyerOrderAutoCancelled(
            fullOrder.userId,
            fullOrder.orderNumber,
            fullOrder.id,
            bonusAwarded,
            refunded
        );
    } catch (err) {
        cronLogger.error(
            { error: err instanceof Error ? err.message : String(err), orderId: fullOrder.id },
            "Auto-cancel: push notification error"
        );
    }

    // (8b) Sockets a merchant + admin + buyer
    const socketData = {
        orderId: fullOrder.id,
        orderNumber: fullOrder.orderNumber,
        status: "CANCELLED",
        cancelReason: AUTO_CANCEL_REASON,
        auto: true,
        attempts,
        refunded,
        bonusAwarded,
    };

    if (fullOrder.merchantId) {
        emitSocket("order_cancelled", `merchant:${fullOrder.merchantId}`, socketData).catch(() => {});
    }
    emitSocket("order_cancelled", "admin:orders", socketData).catch(() => {});
    emitSocket("order_cancelled", `customer:${fullOrder.userId}`, socketData).catch(() => {});

    return { success: true, refunded, bonusAwarded };
}

export async function POST(req: NextRequest) {
    try {
        // Auth: CRON_SECRET
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const MAX_RETRIES = 3;

        // Find orders in CONFIRMED status with no driver and no active PendingAssignment
        // These are orders that completed merchant confirmation but assignment failed/timed out
        const stuckOrders = await prisma.order.findMany({
            where: {
                status: "CONFIRMED",
                driverId: null,
                deletedAt: null,
                // Must not have an active PendingAssignment (either WAITING or COMPLETED recently)
                pendingAssignment: null,
            },
            select: {
                id: true,
                orderNumber: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                merchant: {
                    select: {
                        id: true,
                        name: true,
                        latitude: true,
                        longitude: true,
                    },
                },
            },
        });

        // ISSUE-010: NO hacemos early return si stuckOrders.length === 0 porque
        // el check de driver offline mid-delivery (más abajo) debe correr siempre.

        let retried = 0;
        let escalated = 0;
        let autoCancelled = 0;

        for (const order of stuckOrders) {
            // Count assignment log entries to track total attempts (initial + retries)
            // We treat each log entry as a driver notification attempt
            const assignmentLogs = await prisma.assignmentLog.findMany({
                where: { orderId: order.id },
            });

            // ISSUE-015: Si superamos el umbral final, auto-cancelamos con
            // refund + bonus compensatorio. Este check VA ANTES del de MAX_RETRIES
            // porque cuando attempts >= AUTO_CANCEL_THRESHOLD también se cumple
            // attempts >= MAX_RETRIES, pero el cierre definitivo tiene prioridad.
            if (assignmentLogs.length >= AUTO_CANCEL_THRESHOLD) {
                cronLogger.warn(
                    { orderId: order.id, orderNumber: order.orderNumber, attempts: assignmentLogs.length },
                    `Order has reached AUTO_CANCEL_THRESHOLD. Auto-cancelling with refund + bonus.`
                );

                try {
                    const result = await autoCancelStuckOrder(
                        { id: order.id, orderNumber: order.orderNumber, userId: order.userId },
                        assignmentLogs.length
                    );

                    if (result.success) {
                        autoCancelled++;

                        // Escalate visibility al panel de admin también — por si quedó un refund
                        // fallido u otra anomalía que necesite mirada humana.
                        await notifyAdminOfStuckOrder(
                            order.id,
                            order.orderNumber,
                            `AUTO-CANCELADO después de ${assignmentLogs.length} intentos fallidos (~${assignmentLogs.length * 5}min). Refund: ${result.refunded ? "OK" : "N/A o FALLÓ"}. Bonus: ${result.bonusAwarded}pts.`
                        );
                    } else {
                        // autoCancelStuckOrder determinó que la orden ya estaba finalizada u otro edge case
                        cronLogger.warn(
                            { orderId: order.id, orderNumber: order.orderNumber },
                            "Auto-cancel skipped (order already finalized or not found)"
                        );
                    }
                } catch (err) {
                    cronLogger.error(
                        { error: err instanceof Error ? err.message : String(err), orderId: order.id, orderNumber: order.orderNumber },
                        "Auto-cancel threw unexpectedly — cron continues with next order"
                    );
                    // No matamos el cron: seguimos con el resto de órdenes
                }

                continue;
            }

            // If we've already attempted this order MAX_RETRIES times via this cron, escalate
            // Count only recent attempts (from when it became CONFIRMED and stuck)
            if (assignmentLogs.length >= MAX_RETRIES) {
                cronLogger.warn(
                    { orderId: order.id, orderNumber: order.orderNumber, attempts: assignmentLogs.length },
                    `Order has reached max retries. Escalating to admin.`
                );

                // Notify admin
                const minutesStuck = Math.round((Date.now() - order.updatedAt.getTime()) / 60000);
                await notifyAdminOfStuckOrder(
                    order.id,
                    order.orderNumber,
                    `Order stuck for ${minutesStuck} minutes after merchant confirmation. Manual assignment required. (Attempts: ${assignmentLogs.length})`
                );

                escalated++;
                continue;
            }

            // Attempt to restart the assignment cycle
            cronLogger.info(
                { orderId: order.id, orderNumber: order.orderNumber, attempt: assignmentLogs.length + 1, maxRetries: MAX_RETRIES },
                `Retrying assignment for order`
            );

            const result = await startAssignmentCycle(order.id);

            if (result.success) {
                cronLogger.info(
                    { orderId: order.id, orderNumber: order.orderNumber, driverId: result.driverId },
                    `Successfully restarted assignment`
                );
                retried++;
            } else {
                cronLogger.error(
                    { orderId: order.id, orderNumber: order.orderNumber, error: result.error },
                    `Failed to restart assignment`
                );

                // If no drivers are available even on retry, escalate immediately
                if (result.error?.includes("repartidores disponibles")) {
                    cronLogger.warn(
                        { orderId: order.id, orderNumber: order.orderNumber },
                        `No drivers available. Escalating to admin.`
                    );

                    await notifyAdminOfStuckOrder(
                        order.id,
                        order.orderNumber,
                        "No drivers available in the zone. Manual assignment may be needed."
                    );

                    escalated++;
                }
            }
        }

        // --- Multi-vendor: retry stuck SubOrders without drivers ---
        let subOrderRetried = 0;
        const stuckSubOrders = await prisma.subOrder.findMany({
            where: {
                status: { in: ["PENDING", "PREPARING"] },
                driverId: null,
                pendingDriverId: null,
                assignmentAttempts: { lt: MAX_RETRIES },
                order: {
                    isMultiVendor: true,
                    status: { in: ["PENDING", "CONFIRMED", "PREPARING"] },
                    deletedAt: null,
                },
            },
            select: {
                id: true,
                assignmentAttempts: true,
                order: { select: { id: true, orderNumber: true } },
                merchant: { select: { name: true } },
            },
            take: 20, // Limit to prevent overload
        });

        for (const so of stuckSubOrders) {
            cronLogger.info(
                { subOrderId: so.id, orderId: so.order.id, orderNumber: so.order.orderNumber, attempt: so.assignmentAttempts + 1 },
                "Retrying SubOrder assignment"
            );

            const result = await startSubOrderAssignmentCycle(so.id);
            if (result.success) {
                subOrderRetried++;
                cronLogger.info({ subOrderId: so.id, driverId: result.driverId }, "SubOrder assignment retry succeeded");
            } else {
                cronLogger.warn({ subOrderId: so.id, error: result.error }, "SubOrder assignment retry failed");
            }
        }

        // --- ISSUE-010: Detectar driver offline mid-delivery ---
        // Órdenes con driver asignado pero sin señal / desconectado hace más de 15min.
        // No reasignamos automáticamente (el driver puede tener el paquete en mano);
        // solo escalamos a admin para que decida contacto/reasignación manual.
        const offlineThresholdDate = new Date(Date.now() - DRIVER_OFFLINE_THRESHOLD_MINUTES * 60 * 1000);
        let driverOfflineAlerts = 0;

        // Single-vendor orders (Order.driverId directo)
        const offlineSingleVendorOrders = await prisma.order.findMany({
            where: {
                driverId: { not: null },
                deletedAt: null,
                deliveryStatus: { in: [...DRIVER_OFFLINE_ACTIVE_STATES] },
                status: { notIn: ["CANCELLED", "DELIVERED"] },
                // Driver está FUERA_DE_SERVICIO o su último GPS tiene >15min.
                OR: [
                    { driver: { isOnline: false } },
                    { driver: { lastLocationAt: null } },
                    { driver: { lastLocationAt: { lt: offlineThresholdDate } } },
                ],
            },
            select: {
                id: true,
                orderNumber: true,
                deliveryStatus: true,
                driverId: true,
                driver: {
                    select: {
                        id: true,
                        isOnline: true,
                        lastLocationAt: true,
                        user: { select: { name: true } },
                    },
                },
            },
            take: 50, // safety cap — una ciudad de 80k hab no debería tener >50 órdenes mid-delivery simultáneas
        });

        for (const order of offlineSingleVendorOrders) {
            if (!order.driver || !order.driverId || !order.deliveryStatus) continue;

            const lastSeen = order.driver.lastLocationAt;
            const minutesOffline = lastSeen
                ? Math.round((Date.now() - lastSeen.getTime()) / 60000)
                : DRIVER_OFFLINE_THRESHOLD_MINUTES; // sin lastLocationAt, lo tratamos como el umbral mínimo

            cronLogger.warn(
                {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    driverId: order.driverId,
                    deliveryStatus: order.deliveryStatus,
                    minutesOffline,
                    isOnline: order.driver.isOnline,
                },
                "Driver offline mid-delivery. Escalating to admin."
            );

            await notifyAdminOfOfflineDriver({
                orderId: order.id,
                orderNumber: order.orderNumber,
                driverId: order.driverId,
                driverName: order.driver.user?.name ?? null,
                deliveryStatus: order.deliveryStatus,
                minutesOffline,
                driverIsOnline: order.driver.isOnline,
                lastLocationAt: lastSeen,
            });

            driverOfflineAlerts++;
        }

        // Multi-vendor SubOrders (SubOrder.driverId propio por vendor)
        const offlineSubOrders = await prisma.subOrder.findMany({
            where: {
                driverId: { not: null },
                deliveryStatus: { in: [...DRIVER_OFFLINE_ACTIVE_STATES] },
                status: { notIn: ["CANCELLED", "DELIVERED"] },
                order: { deletedAt: null, status: { notIn: ["CANCELLED", "DELIVERED"] } },
                OR: [
                    { driver: { isOnline: false } },
                    { driver: { lastLocationAt: null } },
                    { driver: { lastLocationAt: { lt: offlineThresholdDate } } },
                ],
            },
            select: {
                id: true,
                deliveryStatus: true,
                driverId: true,
                order: { select: { id: true, orderNumber: true } },
                driver: {
                    select: {
                        id: true,
                        isOnline: true,
                        lastLocationAt: true,
                        user: { select: { name: true } },
                    },
                },
            },
            take: 50,
        });

        for (const so of offlineSubOrders) {
            if (!so.driver || !so.driverId || !so.deliveryStatus) continue;

            const lastSeen = so.driver.lastLocationAt;
            const minutesOffline = lastSeen
                ? Math.round((Date.now() - lastSeen.getTime()) / 60000)
                : DRIVER_OFFLINE_THRESHOLD_MINUTES;

            cronLogger.warn(
                {
                    subOrderId: so.id,
                    orderId: so.order.id,
                    orderNumber: so.order.orderNumber,
                    driverId: so.driverId,
                    deliveryStatus: so.deliveryStatus,
                    minutesOffline,
                    isOnline: so.driver.isOnline,
                },
                "Driver offline mid-delivery on SubOrder. Escalating to admin."
            );

            await notifyAdminOfOfflineDriver({
                orderId: so.order.id,
                orderNumber: so.order.orderNumber,
                subOrderId: so.id,
                driverId: so.driverId,
                driverName: so.driver.user?.name ?? null,
                deliveryStatus: so.deliveryStatus,
                minutesOffline,
                driverIsOnline: so.driver.isOnline,
                lastLocationAt: lastSeen,
            });

            driverOfflineAlerts++;
        }

        return NextResponse.json({
            success: true,
            retried,
            escalated,
            subOrderRetried,
            driverOfflineAlerts,
            total: stuckOrders.length,
            totalSubOrders: stuckSubOrders.length,
            message: `Processed ${stuckOrders.length} stuck orders (retried: ${retried}, escalated: ${escalated}) + ${stuckSubOrders.length} stuck SubOrders (retried: ${subOrderRetried}) + ${driverOfflineAlerts} driver-offline alerts`,
        });
    } catch (error) {
        cronLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Retry assignments cron failed"
        );
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
      