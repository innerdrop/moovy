// API Route: Single Order Operations
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assignOrderToNearestDriver } from "@/lib/logistics";

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
        const isAdmin = (session.user as any).role === "ADMIN";

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: { include: { product: true } },
                address: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                driver: { select: { id: true, latitude: true, longitude: true, user: { select: { name: true, phone: true } } } },
                merchant: { select: { name: true, latitude: true, longitude: true, address: true } },
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
        console.error("Error fetching order:", error);
        return NextResponse.json({ error: "Error al obtener el pedido" }, { status: 500 });
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
        const role = (session.user as any).role;
        const isAdmin = role === "ADMIN";
        const isMerchant = role === "MERCHANT";

        const isDriver = role === "DRIVER";

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

        const data = await request.json();
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
            select: { status: true, merchantId: true, userId: true },
        });

        const order = await prisma.order.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
                address: true,
                user: { select: { id: true, name: true, email: true, phone: true } },
                merchant: { select: { id: true, name: true } },
            },
        });

        // --- REAL-TIME NOTIFICATIONS ---
        // Emit status change to ALL relevant rooms for any status update
        if (data.status && existingOrder?.status !== data.status) {
            try {
                const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";

                // Rooms to notify: order tracking, merchant, customer, admin
                const rooms = [
                    `order:${id}`,
                    existingOrder?.merchantId ? `merchant:${existingOrder.merchantId}` : null,
                    existingOrder?.userId ? `customer:${existingOrder.userId}` : null,
                    "admin:orders"
                ].filter(Boolean);

                // Emit to each room
                for (const room of rooms) {
                    await fetch(`${socketUrl}/emit`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
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
                console.log(`[Socket-Emit] Status ${data.status} broadcasted to ${rooms.length} rooms`);
            } catch (e) {
                console.error("[Socket-Emit] Failed to broadcast status change:", e);
            }
        }

        // Legacy: Notify when order is picked up (keep for backwards compatibility)
        if (data.status === "PICKED_UP") {
            try {
                const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event: "order_status_update",
                        room: `order:${id}`,
                        data: { orderId: id, status: "PICKED_UP", message: "¡Tu pedido está en camino!" }
                    })
                });
            } catch (e) {
                console.error("[Socket-Emit] Failed to notify picked up:", e);
            }
        }

        if (data.status === "DELIVERED") {
            try {
                // Notify socket server to show rating popup to customer
                const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
                await fetch(`${socketUrl}/emit`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
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
                    console.log(`[Order] Driver ${order.driverId} freed after delivery of ${order.orderNumber}`);
                }
            } catch (e) {
                console.error("[Socket-Emit] Failed to notify delivery or free driver:", e);
            }
        }

        // Trigger auto-assignment when status changes to PREPARING
        if (data.status === "PREPARING" && existingOrder?.status !== "PREPARING") {
            // Fire and forget - don't block the response
            assignOrderToNearestDriver(id).then((result) => {
                if (result.success) {
                    console.log(`[Auto-assign] Order ${order.orderNumber} offered to driver ${result.driverId}`);
                } else {
                    console.log(`[Auto-assign] Order ${order.orderNumber}: ${result.error}`);
                }
            });
        }

        return NextResponse.json(order);
    } catch (error) {
        console.error("Error updating order:", error);
        return NextResponse.json({ error: "Error al actualizar el pedido" }, { status: 500 });
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
        const isAdmin = (session.user as any).role === "ADMIN";

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
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
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

        return NextResponse.json({ success: true, message: "Pedido cancelado" });
    } catch (error) {
        console.error("Error cancelling order:", error);
        return NextResponse.json({ error: "Error al cancelar el pedido" }, { status: 500 });
    }
}
