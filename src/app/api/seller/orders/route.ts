import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all SubOrders for the authenticated seller
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const seller = await prisma.sellerProfile.findUnique({
            where: { userId },
            select: { id: true },
        });

        if (!seller) {
            return NextResponse.json(
                { error: "No tenés perfil de vendedor." },
                { status: 404 }
            );
        }

        // Parse optional filters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");
        const deliveryType = searchParams.get("deliveryType");

        const where: any = { sellerId: seller.id };
        if (status) {
            where.status = status;
        }

        // Filter by delivery type on the parent order
        if (deliveryType) {
            where.order = { deliveryType };
        }

        const subOrders = await prisma.subOrder.findMany({
            where,
            include: {
                items: true,
                // Driver asignado a ESTA SubOrder (multi-vendor tiene driver por SubOrder).
                // Usado para el chat DRIVER_SELLER cuando el rider ya está en camino al pickup.
                driver: {
                    select: {
                        id: true,
                        user: { select: { name: true } },
                    },
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        createdAt: true,
                        deliveryType: true,
                        scheduledSlotStart: true,
                        scheduledSlotEnd: true,
                        scheduledConfirmedAt: true,
                        status: true,
                        user: {
                            select: { name: true },
                        },
                        // Fallback single-vendor: si la SubOrder no tiene driver propio
                        // (pedido single-vendor con driver a nivel Order), usamos este.
                        driver: {
                            select: {
                                id: true,
                                user: { select: { name: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(subOrders);
    } catch (error) {
        console.error("Error fetching seller orders:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
