// API: Order Rating
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Rate a delivered order
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id: orderId } = await params;
        const userId = (session.user as any).id;
        const body = await request.json();
        const { rating, comment } = body;

        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "La calificación debe ser entre 1 y 5" }, { status: 400 });
        }

        // Get order
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { driver: true }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Check if user owns this order
        if (order.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Check if order is delivered
        if (order.status !== "DELIVERED") {
            return NextResponse.json({ error: "El pedido debe estar entregado para calificar" }, { status: 400 });
        }

        // Check if already rated
        if (order.driverRating) {
            return NextResponse.json({ error: "Ya calificaste este pedido" }, { status: 400 });
        }

        // Check if there's a driver
        if (!order.driverId) {
            return NextResponse.json({ error: "Este pedido no tiene repartidor asignado" }, { status: 400 });
        }

        // Update order with rating and mark as COMPLETED
        await prisma.order.update({
            where: { id: orderId },
            data: {
                driverRating: rating,
                ratingComment: comment || null,
                ratedAt: new Date(),
                status: "COMPLETED"
            }
        });

        // Update driver's average rating
        const driverOrders = await prisma.order.findMany({
            where: {
                driverId: order.driverId,
                driverRating: { not: null }
            },
            select: { driverRating: true }
        });

        const avgRating = driverOrders.reduce((sum, o) => sum + (o.driverRating || 0), 0) / driverOrders.length;

        await prisma.driver.update({
            where: { id: order.driverId },
            data: { rating: avgRating }
        });

        return NextResponse.json({
            success: true,
            message: "¡Gracias por tu calificación!",
            newDriverRating: avgRating.toFixed(1)
        });
    } catch (error) {
        console.error("Error rating order:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// GET - Get order with driver info for rating
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id: orderId } = await params;
        const userId = (session.user as any).id;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                driver: {
                    include: {
                        user: { select: { name: true } }
                    }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        return NextResponse.json({
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            driverRating: order.driverRating,
            driverName: order.driver?.user?.name?.split(' ')[0] || null, // First name only
            driverTotalDeliveries: order.driver?.totalDeliveries || 0,
            driverRatingAvg: order.driver?.rating || null
        });
    } catch (error) {
        console.error("Error fetching order:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
