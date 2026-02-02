import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id }
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const [categories, products] = await Promise.all([
            prisma.merchantCategory.findMany({
                where: { merchantId: merchant.id },
                select: { categoryId: true }
            }),
            prisma.merchantAcquiredProduct.findMany({
                where: { merchantId: merchant.id },
                select: { productId: true }
            })
        ]);

        return NextResponse.json({
            categories: categories.map(c => c.categoryId),
            products: products.map(p => p.productId)
        });

    } catch (error) {
        console.error("Error fetching merchant acquisitions:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
