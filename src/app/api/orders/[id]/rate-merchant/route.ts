// API: Rate Merchant on an Order
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

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { merchant: true }
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

        if (order.merchantRating) {
            return NextResponse.json({ error: "Ya calificaste este comercio" }, { status: 400 });
        }

        if (!order.merchantId) {
            return NextResponse.json({ error: "Este pedido no tiene comercio" }, { status: 400 });
        }

        // V-019 FIX: Atomic transaction to prevent race condition
        const result = await prisma.$transaction(async (tx) => {
            // Re-check inside transaction to prevent TOCTOU race condition
            const freshOrder = await tx.order.findUnique({
                where: { id: orderId },
                select: { merchantRating: true }
            });

            if (freshOrder?.merchantRating) {
                throw new Error("ALREADY_RATED");
            }

            // Update order with merchant rating
            await tx.order.update({
                where: { id: orderId },
                data: {
                    merchantRating: rating,
                    ...(comment ? { merchantRatingComment: comment } : {}),
                }
            });

            // Update merchant's average rating
            const merchantOrders = await tx.order.findMany({
                where: {
                    merchantId: order.merchantId!,
                    merchantRating: { not: null }
                },
                select: { merchantRating: true }
            });

            const avgRating = merchantOrders.reduce((sum, o) => sum + (o.merchantRating || 0), 0) / merchantOrders.length;

            await tx.merchant.update({
                where: { id: order.merchantId! },
                data: { rating: avgRating }
            });

            return avgRating;
        }, { isolationLevel: "Serializable" });

        return NextResponse.json({
            success: true,
            message: "¡Gracias por tu calificación!",
            newMerchantRating: result.toFixed(1)
        });
    } catch (error) {
        if (error instanceof Error && error.message === "ALREADY_RATED") {
            return NextResponse.json({ error: "Ya calificaste este comercio" }, { status: 400 });
        }
        console.error("Error rating merchant:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
