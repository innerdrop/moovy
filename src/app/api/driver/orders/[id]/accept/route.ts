// API Route: Driver accepts pending order
// POST /api/driver/orders/[id]/accept
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { driverAcceptOrder } from "@/lib/logistics";
import { socketEmitToRooms } from "@/lib/socket-emit";
import { requireDriverApi } from "@/lib/driver-auth";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authResult = await requireDriverApi();
        if (authResult instanceof NextResponse) return authResult;
        const { driver } = authResult;

        const { id } = await context.params;

        if (!driver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado" }, { status: 404 });
        }

        const result = await driverAcceptOrder(driver.id, id);

        if (result.success) {
            // Fetch order details for socket notifications
            const order = await prisma.order.findUnique({
                where: { id },
                select: {
                    id: true,
                    orderNumber: true,
                    merchantId: true,
                    userId: true,
                    status: true,
                    deliveryStatus: true,
                },
            });

            if (order) {
                // Notify merchant, customer, and admin rooms
                const eventData = {
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    deliveryStatus: order.deliveryStatus,
                    driverId: driver.id,
                };

                const rooms = [
                    `order:${order.id}`,
                    ...(order.merchantId ? [`merchant:${order.merchantId}`] : []),
                    `customer:${order.userId}`,
                    "admin:orders",
                ];

                socketEmitToRooms(rooms, "order_status_changed", eventData).catch(console.error);
            }

            return NextResponse.json({
                success: true,
                message: "Pedido aceptado",
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error,
            }, { status: 400 });
        }
    } catch (error) {
        console.error("Error accepting order:", error);
        return NextResponse.json(
            { error: "Error al aceptar pedido" },
            { status: 500 }
        );
    }
}
