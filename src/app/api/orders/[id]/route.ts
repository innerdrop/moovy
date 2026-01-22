// API Route: Single Order Operations
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
                driver: { select: { id: true, user: { select: { name: true, phone: true } } } },
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

        // Check authorization
        if (!isAdmin && !isMerchant) {
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

        const data = await request.json();
        const updateData: any = {};

        if (data.status) updateData.status = data.status;
        if (data.paymentStatus) updateData.paymentStatus = data.paymentStatus;
        if (data.driverId) updateData.driverId = data.driverId;
        if (data.deliveryStatus) updateData.deliveryStatus = data.deliveryStatus;
        if (data.adminNotes !== undefined) updateData.adminNotes = data.adminNotes;
        if (data.estimatedTime !== undefined) updateData.estimatedTime = data.estimatedTime;

        // Handle delivered status
        if (data.status === "DELIVERED" || data.deliveryStatus === "DELIVERED") {
            updateData.deliveredAt = new Date();
        }

        const order = await prisma.order.update({
            where: { id },
            data: updateData,
            include: {
                items: true,
                address: true,
                user: { select: { name: true, email: true, phone: true } },
            },
        });

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
        });

        return NextResponse.json({ success: true, message: "Pedido cancelado" });
    } catch (error) {
        console.error("Error cancelling order:", error);
        return NextResponse.json({ error: "Error al cancelar el pedido" }, { status: 500 });
    }
}
