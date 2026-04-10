// Merchant Confirm Order — PENDING → PREPARING + start driver assignment
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { startAssignmentCycle, startSubOrderAssignmentCycle } from "@/lib/assignment-engine";
import { notifyBuyer } from "@/lib/notifications";
import { logUserActivity, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";

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
                isMultiVendor: true,
                merchant: { select: { name: true } },
                subOrders: {
                    where: { merchantId: merchant?.id ?? undefined },
                    select: { id: true, status: true, merchantId: true },
                },
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

        // BUG FIX #6: Use conditional update to prevent race condition
        const updateResult = await prisma.order.updateMany({
            where: {
                id: orderId,
                status: "PENDING"  // Only update if currently PENDING
            },
            data: { status: "PREPARING" },
        });

        if (updateResult.count === 0) {
            return NextResponse.json(
                { error: "Order already confirmed or cancelled" },
                { status: 400 }
            );
        }

        // Notify buyer
        notifyBuyer(order.userId, "PREPARING", order.orderNumber, {
            total: order.total,
            merchantName: order.merchant?.name,
            orderId: order.id,
        }).catch(console.error);

        // BUG FIX #2: Don't silently swallow assignment errors
        let assignmentError: Error | null = null;
        try {
            if (order.isMultiVendor && order.subOrders.length > 0) {
                // Multi-vendor: assign per SubOrder for this merchant
                const subOrder = order.subOrders.find(so => so.merchantId === merchant?.id);
                if (subOrder) {
                    // Update SubOrder status to PREPARING
                    await prisma.subOrder.update({
                        where: { id: subOrder.id },
                        data: { status: "PREPARING" },
                    });

                    const result = await startSubOrderAssignmentCycle(subOrder.id);
                    if (!result.success) {
                        assignmentError = new Error(result.error || "Unknown assignment error");
                        console.error("[Confirm] SubOrder assignment failed:", result.error);

                        emitSocket("assignment_failed", "admin:orders", {
                            orderId,
                            subOrderId: subOrder.id,
                            orderNumber: order.orderNumber,
                            reason: result.error,
                            timestamp: new Date().toISOString(),
                        }).catch(console.error);
                    }
                }
            } else {
                // Single-vendor: use legacy Order-level assignment
                const assignmentResult = await startAssignmentCycle(orderId);
                if (!assignmentResult.success) {
                    assignmentError = new Error(assignmentResult.error || "Unknown assignment error");
                    console.error("[Confirm] Assignment failed:", assignmentResult.error);

                    emitSocket("assignment_failed", "admin:orders", {
                        orderId,
                        orderNumber: order.orderNumber,
                        reason: assignmentResult.error,
                        timestamp: new Date().toISOString(),
                    }).catch(console.error);
                }
            }
        } catch (err) {
            assignmentError = err instanceof Error ? err : new Error(String(err));
            console.error("[Confirm] Error starting assignment cycle:", assignmentError);

            emitSocket("assignment_failed", "admin:orders", {
                orderId,
                orderNumber: order.orderNumber,
                reason: assignmentError.message,
                timestamp: new Date().toISOString(),
            }).catch(console.error);
        }

        // Socket notifications
        const socketData = { orderId, status: "PREPARING", orderNumber: order.orderNumber };
        emitSocket("order_status_changed", `merchant:${order.merchantId}`, socketData).catch(console.error);
        emitSocket("order_status_changed", "admin:orders", socketData).catch(console.error);
        if (order.userId) {
            emitSocket("order_status_changed", `customer:${order.userId}`, socketData).catch(console.error);
        }

        // Log order confirmation activity (fire-and-forget)
        const { ipAddress, userAgent } = extractRequestInfo(_req);
        logUserActivity({
            userId: session.user.id,
            action: ACTIVITY_ACTIONS.ORDER_CONFIRMED,
            entityType: "Order",
            entityId: orderId,
            metadata: { orderNumber: order.orderNumber },
            ipAddress,
            userAgent,
        }).catch((err) => console.error("[Confirm] Failed to log order confirmation activity:", err));

        // Still return 200 to merchant (order IS confirmed, assignment is pending)
        return NextResponse.json({
            success: true,
            status: "PREPARING",
            assignmentPending: assignmentError != null,
        });
    } catch (error) {
        console.error("[MerchantConfirm] Error:", error);
        return NextResponse.json(
            { error: "Error al confirmar el pedido" },
            { status: 500 }
        );
    }
}