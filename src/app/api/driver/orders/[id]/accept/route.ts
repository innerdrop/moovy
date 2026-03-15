// API Route: Driver accepts pending order
// POST /api/driver/orders/[id]/accept
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { driverAcceptOrder } from "@/lib/logistics";
import { socketEmitToRooms } from "@/lib/socket-emit";

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER"])) {
            return NextResponse.json({ error: "Solo repartidores" }, { status: 403 });
        }

        const { id } = await context.params;

        // Get driver ID for current user
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

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
