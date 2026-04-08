// API Route: Single Order Operations
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { startAssignmentCycle, startSubOrderAssignmentCycle } from "@/lib/assignment-engine";
import { sendOrderReadyNotification } from "@/lib/push";
import { notifyBuyer } from "@/lib/notifications";
import { UpdateOrderSchema, validateInput } from "@/lib/validations";
import { orderLogger } from "@/lib/logger";

// GET - Get single order details
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const isAdmin = hasAnyRole(session, ["ADMIN"]);

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                address: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                driver: { select: { id: true, latitude: true, longitude: true, user: { select: { name: true, phone: true } } } },
                merchant: { select: { name: true, latitude: true, longitude: true, address: true } },
                subOrders: {
                    include: {
                        merchant: { select: { id: true, name: true, latitude: true, longitude: true, address: true } },
                        seller: { select: { id: true, displayName: true } },
                        driver: { select: { id: true, latitude: true, longitude: true, user: { select: { name: true, phone: true } } } },
                        items: { select: { id: true, name: true, quantity: true, price: true } },
                    },
                },
            },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Only allow access to own orders or if admin
        if (!isAdmin && order.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        return NextResponse.json(order);
    } catch (error) {
        orderLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Error fetching order"
        );
        return NextResponse.json({ success: false, error: "Error al obtener el pedido" }, { status: 500 });
    }
}

// PATCH - Update order (status, driver assignment, etc.)
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const isAdmin = hasAnyRole(session, ["ADMIN"]);
        const isMerchant = hasAnyRole(session, ["MERCHANT"]);
        const isDriver = hasAnyRole(session, ["DRIVER"]);

        // Check authorization
        if (!isAdmin && !isMerchant && !isDriver) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // If merchant, verify the order belongs to their store
        if (isMerchant) {
            const merchant = await prisma.merchant.findFirst({
                where: { ownerId: session.user.id },
            });

            if (!merchant) {
                return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
            }

            const order = await prisma.order.findFirst({
                where: { id, merchantId: merchant.id },
            });

            if (!order) {
                return NextResponse.json({ error: "Pedido no encontrado o no pertenece a tu comercio" }, { status: 403 });
            }
        }

        // If driver, verify they are assigned to this order
        if (isDriver) {
            const driver = await prisma.driver.findUnique({
                where: { userId: session.user.id }
            });

            if (!driver) {
                return NextResponse.json({ error: "Perfil de conductor no encontrado" }, { status: 404 });
            }

            const order = await prisma.order.findUnique({ where: { id } });

            if (!order) {
                return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
            }

            // Only allow update if driver IS assigned to this order OR if they are assigning themselves (via specific accept logic, but normally accept uses separate API)
            // Ideally, the PATCH here is for status updates (Picked up, Delivered)
            // So we strictly enforce: Must be assigned driver.
            if (order.driverId !== driver.id) {
                return NextResponse.json({ error: "No estás asignado a este pedido" }, { status: 403 });
            }
        }

        const rawData = await request.json();

        // Validate input with Zod
        const validation = validateInput(UpdateOrderSchema, rawData);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const data = validation.data!;
        const updateData: any = {};

        if (data.status) updateData.status = data.status;
        if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
        if (data.driverId) updateData.driverId = data.driverId;
        if (data.deliveryStatus) updateData.deliveryStatus = data.deliveryStatus;
        if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
        if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime;

        // Handle cancellation reason
        if (data.cancelReason) updateData.cancelReason = data.cancelReason;

        // Handle delivered status
        if (data.status === "DELIVERED" || data.deliveryStatus === "DELIVERED") {
            updateData.deliveredAt = new Date();
        }

        // Get current order to check status change AND get merchantId/userId for socket rooms
        const existingOrder = await prisma.order.findUnique({
            where: { id },
            select: {
                id: true, status: true, merchantId: true, userId: true, driverId: true, orderNumber: true,
                isMultiVendor: true,
                subOrders: { select: { id: true, status: true, driverId: true, merchantId: true } },
            },
        });

        const order = await prisma.order.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
                address: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                merchant: { select: { id: true, name: true } },
                driver: { select: { userId: true } },
            },
        });

        // --- REAL-TIME NOTIFICATIONS ---
        // Emit status change to ALL relevant rooms for any status update
        if (data.status && existingOrder?.status !== data.status) {
            try {
                const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

                // Rooms to notify: order tracking, merchant, customer, admin, and drivers for relevant statuses
                const rooms = [
                    `order:${id}`,
                    existingOrder?.merchantId ? `merchant:${existingOrder.merchantId}` : null,
                    existingOrder?.userId ? `customer:${existingOrder.userId}` : null,
                    "admin:orders",
                    ["PREPARING", "READY"].includes(data.status) ? "driver:available" : null
                ].filter(Boolean);

                // Emit to each room
                for (const room of rooms) {
                    await fetch(`${socketUrl}/emit`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                        body: JSON.stringify({
                            event: "order_status_changed",
                            room,
                            data: {
                                orderId: id,
                                status: data.status,
                                previousStatus: existingOrder?.status,
                                order: {
                                    id: order.id,
                                    orderNumber: order.orderNumber,
                                    status: order.status,
                                    total: order.total,
                                    merchantId: order.merchantId,
                                    userId: order.userId,
                                }
                            }
                        })
                    });
                }
                orderLogger.info({ status: data.status, rooms: rooms.length }, "Status broadcasted to rooms");
            } catch (e) {
                orderLogger.error({ error: e instanceof Error ? e.message : String(e) }, "Failed to broadcast status change");
            }

            // Push notification to buyer (fire-and-forget)
            if (existingOrder?.userId) {
                notifyBuyer(existingOrder.userId, data.status, existingOrder.orderNumber || '', { orderId: existingOrder.id })
                    .catch(err => orderLogger.error({ error: err }, "Buyer push notification error"));
            }
        }

        // Legacy: Notify when order is picked up (keep for backwards compatibility)
        if (data.status === "PICKED_UP") {
            try {
                const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                    body: JSON.stringify({
                        event: "order_status_update",
                        room: `order:${id}`,
                        data: { orderId: id, status: "PICKED_UP", message: "¡Tu pedido está en camino!" }
                    })
                });
            } catch (e) {
                orderLogger.error({ error: e instanceof Error ? e.message : String(e) }, "Failed to emit PICKED_UP status");
            }
        }

        if (data.status === "DELIVERED") {
            try {
                // Notify socket server to show rating popup to customer
                const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
                    body: JSON.stringify({
                        event: "pedido_entregado",
                        room: `order:${id}`,
                        data: { orderId: id }
                    })
                });

                // FREE THE DRIVER
                if (order.driverId) {
                    await prisma.driver.update({
                        where: { id: order.driverId },
                        data: { availabilityStatus: "DISPONIBLE" }
                    });
                    orderLogger.info({ driverId: order.driverId, orderNumber: order.orderNumber }, "Driver freed after delivery");
                }
            } catch (e) {
                orderLogger.error({ error: e instanceof Error ? e.message : String(e) }, "Failed to notify delivery or free driver");
            }
        }

        // Trigger auto-assignment when status changes to PREPARING
        if (data.status === "PREPARING" && existingOrder?.status !== "PREPARING") {
            if (existingOrder?.isMultiVendor && existingOrder.subOrders?.length > 0) {
                // Multi-vendor: assign per SubOrder
                for (const so of existingOrder.subOrders) {
                    if (!so.driverId) {
                        startSubOrderAssignmentCycle(so.id).then((result) => {
                            if (result.success) {
                                orderLogger.info({ orderId: id, subOrderId: so.id, driverId: result.driverId }, "SubOrder offered to driver");
                            } else {
                                orderLogger.warn({ orderId: id, subOrderId: so.id, error: result.error }, "SubOrder assignment failed");
                            }
                        });
                    }
                }
            } else {
                // Single-vendor: legacy Order-level assignment
                startAssignmentCycle(id).then((result) => {
                    if (result.success) {
                        orderLogger.info({ orderId: id, orderNumber: order.orderNumber, driverId: result.driverId }, "Order offered to driver");
                    } else {
                        orderLogger.warn({ orderId: id, orderNumber: order.orderNumber, error: result.error }, "Assignment failed");
                    }
                });
            }
        }

        // Safety net: if order reaches READY without a driver, re-attempt assignment
        if (data.status === "READY" && existingOrder?.status !== "READY" && !order.driverId) {
            if (existingOrder?.isMultiVendor && existingOrder.subOrders?.length > 0) {
                // Multi-vendor: retry per SubOrder without driver
                for (const so of existingOrder.subOrders) {
                    if (!so.driverId) {
                        startSubOrderAssignmentCycle(so.id).then((result) => {
                            if (result.success) {
                                orderLogger.info({ orderId: id, subOrderId: so.id, driverId: result.driverId }, "READY safety net: SubOrder offered to driver");
                            } else {
                                orderLogger.warn({ orderId: id, subOrderId: so.id, error: result.error }, "READY safety net: SubOrder assignment failed");
                            }
                        });
                    }
                }
            } else {
                // Check if there's already an active PendingAssignment before re-triggering
                const activePending = await prisma.pendingAssignment.findUnique({ where: { orderId: id } });
                if (!activePending || activePending.status !== "WAITING") {
                    startAssignmentCycle(id).then((result) => {
                        if (result.success) {
                            orderLogger.info({ orderId: id, orderNumber: order.orderNumber, driverId: result.driverId }, "READY safety net: Order offered to driver");
                        } else {
                            orderLogger.warn({ orderId: id, orderNumber: order.orderNumber, error: result.error }, "READY safety net: Assignment failed");
                        }
                    });
                }
            }
        }

        // Push notification: notify assigned driver that order is ready for pickup
        if (data.status === "READY" && existingOrder?.status !== "READY" && order.driverId && order.driver?.userId) {
            sendOrderReadyNotification(
                order.driver.userId,
                order.merchant?.name || 'Comercio',
                order.orderNumber,
                id
            ).catch(err => orderLogger.error({ error: err }, "Order ready push notification error"));
        }

        return NextResponse.json(order);
    } catch (error) {
        orderLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Error updating order"
        );
        return NextResponse.json({ success: false, error: "Error al actualizar el pedido" }, { status: 500 });
    }
}

// DELETE - Cancel order
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const isAdmin = hasAnyRole(session, ["ADMIN"]);

        const order = await prisma.order.findUnique({ where: { id } });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Only allow cancellation of own order or if admin
        if (!isAdmin && order.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Can only cancel pending or confirmed orders
        if (!["PENDING", "CONFIRMED"].includes(order.status)) {
            return NextResponse.json(
                { error: "Solo se pueden cancelar pedidos pendientes o confirmados" },
                { status: 400 }
            );
        }

        // Restore stock for cancelled orders
        const orderItems = await prisma.orderItem.findMany({ where: { orderId: id } });

        await prisma.$transaction(async (tx) => {
            for (const item of orderItems) {
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

            await tx.order.update({
                where: { id },
                data: { status: "CANCELLED" },
            });

            // FREE THE DRIVER IF ASSIGNED
            if (order.driverId) {
                await tx.driver.update({
                    where: { id: order.driverId },
                    data: { availabilityStatus: "DISPONIBLE" }
                });
            }

            // ALSO CLEAR PENDING DRIVER IF APPLICABLE
            // (Standard practice: if cancelled, they aren't busy anymore with THIS)
            // Note: If they were just "pending offer", they aren't marked as BUSY yet, 
            // but we clear the relationship in the order anyway.
        });

        // Push notification to buyer about cancellation (fire-and-forget)
        if (order.userId) {
            notifyBuyer(order.userId, 'CANCELLED', order.orderNumber, { orderId: order.id })
                .catch(err => orderLogger.error({ error: err }, "Buyer cancel push notification error"));
        }

        return NextResponse.json({ success: true, message: "Pedido cancelado" });
    } catch (error) {
        orderLogger.error(
            { error: error instanceof Error ? error.message : String(error) },
            "Error cancelling order"
        );
        return NextResponse.json({ success: false, error: "Error al cancelar el pedido" }, { status: 500 });
    }
}
