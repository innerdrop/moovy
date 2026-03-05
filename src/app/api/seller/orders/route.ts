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

        // Parse optional status filter
        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status");

        const where: any = { sellerId: seller.id };
        if (status) {
            where.status = status;
        }

        const subOrders = await prisma.subOrder.findMany({
            where,
            include: {
                items: true,
                order: {
                    select: {
                        orderNumber: true,
                        createdAt: true,
                        user: {
                            select: { name: true },
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
