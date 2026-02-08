import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
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

        // Prepare items for the cart based on the store's CartItem interface
        const newCartItems = originalOrder.items.map(item => ({
            id: `${item.productId}-default-${Date.now()}`,
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            variantName: item.variantName || undefined,
            merchantId: originalOrder.merchantId || undefined
        }));

        // Upsert the saved cart
        await prisma.savedCart.upsert({
            where: { userId: session.user.id },
            update: {
                items: newCartItems,
                merchantId: originalOrder.merchantId || null
            },
            create: {
                userId: session.user.id,
                items: newCartItems,
                merchantId: originalOrder.merchantId || null
            }
        });

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
