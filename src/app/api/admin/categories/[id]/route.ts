// API Route: Single Category Operations
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single category
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        const category = await prisma.category.findUnique({
            where: { id },
            include: {
                _count: { select: { products: true } },
            },
        });

        if (!category) {
            return NextResponse.json({ error: "Categoría no encontrada" }, { status: 404 });
        }

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error fetching category:", error);
        return NextResponse.json({ error: "Error al obtener categoría" }, { status: 500 });
    }
}

// PATCH - Update category
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const data = await request.json();

        const updateData: any = {};
        if (data.name !== undefined) {
            updateData.name = data.name;
            // Update slug if name changes
            updateData.slug = data.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
        }
        if (data.description !== undefined) updateData.description = data.description;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.order !== undefined) updateData.order = data.order;

        const category = await prisma.category.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(category);
    } catch (error) {
        console.error("Error updating category:", error);
        return NextResponse.json({ error: "Error al actualizar categoría" }, { status: 500 });
    }
}

// DELETE - Delete category
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        // Check if category has products
        const productCount = await prisma.productCategory.count({
            where: { categoryId: id },
        });

        if (productCount > 0) {
            return NextResponse.json(
                { error: `No se puede eliminar: hay ${productCount} productos en esta categoría` },
                { status: 400 }
            );
        }

        await prisma.category.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Categoría eliminada" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
    }
}
