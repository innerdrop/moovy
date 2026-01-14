import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Create product (Admin only)
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json(
                { error: "No autorizado" },
                { status: 401 }
            );
        }

        const data = await request.json();

        // Generate slug from name
        const slug = data.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const product = await prisma.product.create({
            data: {
                name: data.name,
                slug,
                description: data.description,
                price: parseFloat(data.price),
                costPrice: parseFloat(data.costPrice || 0),
                stock: parseInt(data.stock || 0),
                minStock: parseInt(data.minStock || 5),
                isFeatured: data.isFeatured || false,
                isActive: data.isActive !== false,
                categories: data.categoryIds?.length ? {
                    create: data.categoryIds.map((catId: string) => ({
                        category: { connect: { id: catId } }
                    }))
                } : undefined,
            },
            include: {
                categories: { include: { category: true } },
            },
        });

        return NextResponse.json(product, { status: 201 });
    } catch (error) {
        console.error("Error creating product:", error);
        return NextResponse.json(
            { error: "Error al crear producto" },
            { status: 500 }
        );
    }
}
