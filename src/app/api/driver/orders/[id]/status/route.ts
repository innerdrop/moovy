// API Route: Update Driver Delivery Status
// Allows a driver to update the delivery status of their order
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";
import { socketEmitToRooms } from "@/lib/socket-emit";

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id: orderId } = await params;
        const { deliveryStatus } = await request.json();

        // Get driver record
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

        if (!driver) {
            return NextResponse.json({ error: "No sos conductor registrado" }, { status: 403 });
        }

        // Verify order belongs to this driver
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.driverId !== driver.id && !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Este pedido no está asignado a vos" }, { status: 403 });
        }

        // Update status
        const updateData: any = { deliveryStatus };

        // If marked as delivered, update order status and timestamp
        if (deliveryStatus === "DELIVERED") {
            updateData.status = "DELIVERED";
            updateData.deliveredAt = new Date();

            // Increment driver's delivery count
            await prisma.driver.update({
                where: { id: driver.id },
                data: { totalDeliveries: { increment: 1 } },
            });
        }

        await prisma.order.update({
            where: { id: orderId },
            data: updateData,
        });

        // Notify buyer of status change
        if (deliveryStatus === "DELIVERED") {
            notifyBuyer(order.userId, "DELIVERED", order.orderNumber, { orderId: order.id })
                .catch(err => console.error("[Push] Buyer notification error:", err));
        }

        // Emit socket events to all interested rooms
        const eventData = {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: deliveryStatus === "DELIVERED" ? "DELIVERED" : order.status,
            deliveryStatus,
            driverId: driver.id,
        };

        const rooms = [
            `order:${order.id}`,
            ...(order.merchantId ? [`merchant:${order.merchantId}`] : []),
            `customer:${order.userId}`,
            `driver:${driver.id}`,
            "admin:orders",
        ];

        socketEmitToRooms(rooms, "order_status_changed", eventData).catch(console.error);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating delivery status:", error);
        return NextResponse.json(
            { error: "Error al actualizar el estado" },
            { status: 500 }
        );
    }
}
