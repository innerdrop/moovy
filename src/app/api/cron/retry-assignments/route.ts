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

// ISSUE-010: Umbrales para detección de driver offline mid-delivery
const DRIVER_OFFLINE_THRESHOLD_MINUTES = 15;
const DRIVER_OFFLINE_ACTIVE_STATES = ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP"] as const;

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

        for (const order of stuckOrders) {
            // Count assignment log entries to track total attempts (initial + retries)
            // We treat each log entry as a driver notification attempt
            const assignmentLogs = await prisma.assignmentLog.findMany({
                where: { orderId: order.id },
            });

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
      