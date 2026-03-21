// Cron: Automatic retry for stuck orders
// Finds orders in CONFIRMED status with no driver and no active assignment
// Restarts assignment cycle with max 3 retries before escalating to admin
// Should run every 5 minutes via external scheduler

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startAssignmentCycle } from "@/lib/assignment-engine";
import { verifyBearerToken } from "@/lib/env-validation";

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

async function notifyAdminOfStuckOrder(orderId: string, orderNumber: string, reason: string): Promise<void> {
    const adminRoles = await prisma.userRole.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { userId: true },
    });

    for (const { userId } of adminRoles) {
        // Send via socket to admin
        emitSocket("stuck_order_alert", `admin:${userId}`, {
            orderId,
            orderNumber,
            reason,
            timestamp: new Date().toISOString(),
        }).catch(console.error);
    }

    // Also emit to admin_orders room
    emitSocket("stuck_order_alert", "admin:orders", {
        orderId,
        orderNumber,
        reason,
        timestamp: new Date().toISOString(),
    }).catch(console.error);
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
                console.log(
                    `[RetryAssignments] Order ${order.orderNumber} has reached max retries (${assignmentLogs.length} attempts). Escalating to admin.`
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
            console.log(
                `[RetryAssignments] Retrying assignment for order ${order.orderNumber} (attempt ${assignmentLogs.length + 1}/${MAX_RETRIES})`
            );

            const result = await startAssignmentCycle(order.id);

            if (result.success) {
                console.log(
                    `[RetryAssignments] Successfully restarted assignment for order ${order.orderNumber} with driver ${result.driverId}`
                );
                retried++;
            } else {
                console.log(
                    `[RetryAssignments] Failed to restart assignment for order ${order.orderNumber}: ${result.error}`
                );

                // If no drivers are available even on retry, escalate immediately
                if (result.error?.includes("repartidores disponibles")) {
                    console.log(
                        `[RetryAssignments] No drivers available for order ${order.orderNumber}. Escalating to admin.`
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

        return NextResponse.json({
            success: true,
            retried,
            escalated,
            total: stuckOrders.length,
            message: `Processed ${stuckOrders.length} stuck orders. Retried: ${retried}, Escalated: ${escalated}`,
        });
    } catch (error) {
        console.error("[RetryAssignments] Error:", error);
        return NextResponse.json(
            { error: "Error processing assignment retries", details: String(error) },
            { status: 500 }
        );
    }
}
