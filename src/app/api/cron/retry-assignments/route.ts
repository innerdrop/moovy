// Cron: Automatic retry for stuck orders
// Finds orders in CONFIRMED status with no driver and no active assignment
// Restarts assignment cycle with max 3 retries before escalating to admin
// Should run every 5 minutes via external scheduler

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startAssignmentCycle, startSubOrderAssignmentCycle } from "@/lib/assignment-engine";
import { verifyBearerToken } from "@/lib/env-validation";
import { cronLogger } from "@/lib/logger";

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

        if (stuckOrders.length === 0) {
            return NextResponse.json({
                success: true,
                retried: 0,
                escalated: 0,
                message: "No stuck orders found",
            });
        }

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

        return NextResponse.json({
            success: true,
            retried,
            escalated,
            subOrderRetried,
            total: stuckOrders.length,
            totalSubOrders: stuckSubOrders.length,
            message: `Processed ${stuckOrders.length} stuck orders (retried: ${retried}, escalated: ${escalated}) + ${stuckSubOrders.length} stuck SubOrders (retried: ${subOrderRetried})`,
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
      