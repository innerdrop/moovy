// API Route: Driver Claim Order
// Allows an APPROVED driver to claim an available READY order
// Uses transaction to prevent race condition (two drivers claiming same order)
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

        if (!hasAnyRole(session, ["DRIVER"])) {
            return NextResponse.json({ error: "Solo repartidores pueden tomar pedidos" }, { status: 403 });
        }

        const { id: orderId } = await params;

        // Verify driver exists, is approved, and is active
        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: { id: true, approvalStatus: true, isActive: true, isOnline: true },
        });

        if (!driver) {
            return NextResponse.json({ error: "Perfil de repartidor no encontrado. Registrate primero." }, { status: 404 });
        }

        if (driver.approvalStatus !== "APPROVED") {
            return NextResponse.json(
                { error: "Tu solicitud está pendiente de aprobación" },
                { status: 403 }
            );
        }

        if (!driver.isActive) {
            return NextResponse.json({ error: "Tu cuenta está desactivada" }, { status: 403 });
        }

        // Atomic claim using updateMany with condition to prevent race condition
        // Only updates if order is READY and has no driver assigned
        const result = await prisma.order.updateMany({
            where: {
                id: orderId,
                status: "READY",
                driverId: null,
                deletedAt: null,
            },
            data: {
                driverId: driver.id,
                status: "DRIVER_ASSIGNED",
                deliveryStatus: "DRIVER_ASSIGNED",
            },
        });

        if (result.count === 0) {
            // Check why it failed — order doesn't exist, wrong status, or already claimed
            const order = await prisma.order.findUnique({
                where: { id: orderId },
                select: { status: true, driverId: true, deletedAt: true },
            });

            if (!order || order.deletedAt) {
                return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
            }
            if (order.driverId) {
                return NextResponse.json({ error: "Este pedido ya fue tomado por otro repartidor" }, { status: 409 });
            }
            return NextResponse.json(
                { error: `Este pedido no está disponible (estado: ${order.status})` },
                { status: 400 }
            );
        }

        // Fetch order data for notification
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { userId: true, orderNumber: true, id: true, total: true },
        });

        if (order) {
            notifyBuyer(order.userId, "DRIVER_ASSIGNED", order.orderNumber, {
                total: order.total,
                orderId: order.id,
            }).catch(err => console.error("[Push] Buyer notification error:", err));
        }

        return NextResponse.json({ success: true, message: "Pedido asignado correctamente" });
    } catch (error) {
        console.error("Error claiming order:", error);
        return NextResponse.json(
            { error: "Error al tomar el pedido" },
            { status: 500 }
        );
    }
}
