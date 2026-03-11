// API: Rate Seller on an Order (marketplace)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: "La calificación debe ser entre 1 y 5" }, { status: 400 });
        }

        // Find the order and its sub-orders with sellers
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                subOrders: {
                    where: { sellerId: { not: null } },
                    include: { seller: true }
                }
            }
        });

        if (!order) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (order.userId !== userId) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        if (order.status !== "DELIVERED" && order.status !== "COMPLETED") {
            return NextResponse.json({ error: "El pedido debe estar entregado para calificar" }, { status: 400 });
        }

        if (order.sellerRating) {
            return NextResponse.json({ error: "Ya calificaste al vendedor" }, { status: 400 });
        }

        // Find the seller from sub-orders
        const sellerSubOrder = order.subOrders.find(so => so.sellerId);
        if (!sellerSubOrder || !sellerSubOrder.sellerId) {
            return NextResponse.json({ error: "Este pedido no tiene vendedor del marketplace" }, { status: 400 });
        }

        const sellerId = sellerSubOrder.sellerId;

        // Update order with seller rating
        await prisma.order.update({
            where: { id: orderId },
            data: {
                sellerRating: rating,
                sellerRatingComment: comment || null,
            }
        });

        // Update seller's average rating
        const sellerOrders = await prisma.order.findMany({
            where: {
                sellerRating: { not: null },
                subOrders: {
                    some: { sellerId }
                }
            },
            select: { sellerRating: true }
        });

        const avgRating = sellerOrders.reduce((sum, o) => sum + (o.sellerRating || 0), 0) / sellerOrders.length;

        await prisma.sellerProfile.update({
            where: { id: sellerId },
            data: { rating: avgRating }
        });

        return NextResponse.json({
            success: true,
            message: "¡Gracias por tu calificación!",
            newSellerRating: avgRating.toFixed(1)
        });
    } catch (error) {
        console.error("Error rating seller:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
