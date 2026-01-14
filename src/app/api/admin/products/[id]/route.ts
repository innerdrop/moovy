// API Route: Single Product Operations (Admin)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single product by ID
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                images: { orderBy: { order: "asc" } },
                categories: { include: { category: true } },
                variants: true,
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json({ error: "Error al obtener el producto" }, { status: 500 });
    }
}

// PATCH - Update product
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

        // Build update data dynamically
        const updateData: any = {};

        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.price !== undefined) updateData.price = parseFloat(data.price);
        if (data.costPrice !== undefined) updateData.costPrice = parseFloat(data.costPrice);
        if (data.stock !== undefined) updateData.stock = parseInt(data.stock);
        if (data.minStock !== undefined) updateData.minStock = parseInt(data.minStock);
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;

        // Handle category change
        if (data.categoryId !== undefined) {
            // Remove existing category associations
            await prisma.productCategory.deleteMany({
                where: { productId: id },
            });

            // Add new category if provided
            if (data.categoryId) {
                await prisma.productCategory.create({
                    data: {
                        productId: id,
                        categoryId: data.categoryId,
                    },
                });
            }
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                categories: { include: { category: true } },
            },
        });

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 });
    }
}

// DELETE - Delete product
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

        // Delete related records first
        await prisma.productCategory.deleteMany({ where: { productId: id } });
        await prisma.productImage.deleteMany({ where: { productId: id } });
        await prisma.productVariant.deleteMany({ where: { productId: id } });
        await prisma.cartItem.deleteMany({ where: { productId: id } });

        // Delete product
        await prisma.product.delete({ where: { id } });

        return NextResponse.json({ success: true, message: "Producto eliminado" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 });
    }
}
