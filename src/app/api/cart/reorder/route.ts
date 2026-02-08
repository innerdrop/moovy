import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autenticado" }, { status: 401 });
        }

        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: "orderId requerido" }, { status: 400 });
        }

        // Fetch the original order with items
        const originalOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                merchant: true
            }
        });

        if (!originalOrder) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Check if user owns this order
        if (originalOrder.userId !== session.user.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        // Get or create user's cart
        let cart = await prisma.cart.findFirst({
            where: { userId: session.user.id },
            include: { items: true }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: {
                    userId: session.user.id,
                    merchantId: originalOrder.merchantId
                },
                include: { items: true }
            });
        } else if (cart.merchantId !== originalOrder.merchantId) {
            // Clear cart if switching merchants
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id }
            });
            await prisma.cart.update({
                where: { id: cart.id },
                data: { merchantId: originalOrder.merchantId }
            });
        }

        // Add items from original order to cart
        for (const item of originalOrder.items) {
            const existingCartItem = await prisma.cartItem.findFirst({
                where: {
                    cartId: cart.id,
                    productId: item.productId
                }
            });

            if (existingCartItem) {
                // Update quantity
                await prisma.cartItem.update({
                    where: { id: existingCartItem.id },
                    data: { quantity: existingCartItem.quantity + item.quantity }
                });
            } else {
                // Add new item
                await prisma.cartItem.create({
                    data: {
                        cartId: cart.id,
                        productId: item.productId!,
                        quantity: item.quantity,
                        price: item.price,
                        notes: item.notes
                    }
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Productos agregados al carrito",
            merchantId: originalOrder.merchantId,
            merchantName: originalOrder.merchant?.name
        });

    } catch (error) {
        console.error("[Reorder] Error:", error);
        return NextResponse.json({ error: "Error al procesar reorden" }, { status: 500 });
    }
}
