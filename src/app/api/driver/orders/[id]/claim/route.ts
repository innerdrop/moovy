// API Route: Driver Claim Order
// Allows a driver to claim an available order
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { notifyBuyer } from "@/lib/notifications";

export async function POST(
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

        // Get or create driver record
        let driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
        });

        if (!driver) {
            // Auto-create driver record if user has DRIVER role
            driver = await prisma.driver.create({
                data: {
                    userId: session.user.id,
                    isActive: true,
                    isOnline: true,
                },
            });
        }

        // Check if order is available
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.status !== "READY") {
            return NextResponse.json({ error: "Este pedido no está listo para retiro" }, { status: 400 });
        }

        if (order.driverId) {
            return NextResponse.json({ error: "Este pedido ya fue tomado por otro conductor" }, { status: 400 });
        }

        // Claim the order
        await prisma.order.update({
            where: { id: orderId },
            data: {
                driverId: driver.id,
                status: "IN_DELIVERY",
                deliveryStatus: "ASSIGNED",
            },
        });

        // Notify buyer that order is in delivery
        notifyBuyer(order.userId, "IN_DELIVERY", order.orderNumber, {
            total: order.total,
            orderId: order.id,
        }).catch(err => console.error("[Push] Buyer notification error:", err));

        return NextResponse.json({ success: true, message: "Pedido asignado correctamente" });
    } catch (error) {
        console.error("Error claiming order:", error);
        return NextResponse.json(
            { error: "Error al tomar el pedido" },
            { status: 500 }
        );
    }
}
