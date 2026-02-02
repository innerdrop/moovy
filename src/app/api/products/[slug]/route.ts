// API Route: Get Single Product by Slug
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: Request,
    context: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await context.params;

        const product = await prisma.product.findFirst({
            where: {
                slug,
                merchantId: { not: null } // Solo productos con comercio asignado
            },
            include: {
                images: { orderBy: { order: "asc" } },
                categories: { include: { category: true } },
                variants: { where: { isActive: true } },
            },
        });

        if (!product) {
            return NextResponse.json(
                { error: "Producto no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json(
            { error: "Error al obtener el producto" },
            { status: 500 }
        );
    }
}
