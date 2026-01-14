// API Route: Products CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all products (public)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const categoria = searchParams.get("categoria");
        const buscar = searchParams.get("buscar");
        const featured = searchParams.get("featured");

        const session = await auth();
        const isAdmin = (session?.user as any)?.role === "ADMIN";

        const where: any = {};

        // Show only active products to non-admins
        if (!isAdmin) {
            where.isActive = true;
        }

        if (categoria) {
            where.categories = {
                some: { category: { slug: categoria } }
            };
        }

        if (buscar) {
            where.OR = [
                { name: { contains: buscar } },
                { description: { contains: buscar } },
            ];
        }

        if (featured === "true") {
            where.isFeatured = true;
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                images: true,
                categories: { include: { category: true } },
                variants: true,
            },
            orderBy: { name: "asc" },
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { error: "Error al obtener productos" },
            { status: 500 }
        );
    }
}



