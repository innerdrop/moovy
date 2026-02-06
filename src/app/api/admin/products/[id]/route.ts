import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get single product
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const session = await auth();
        const isAdmin = (session?.user as any)?.role === "ADMIN";

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                categories: { include: { category: true } },
                variants: true,
                images: true,
            },
        });

        if (!product) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        // Hide inactive products from non-admins
        if (!product.isActive && !isAdmin) {
            return NextResponse.json({ error: "Producto no disponible" }, { status: 404 });
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error("Error fetching product:", error);
        return NextResponse.json({ error: "Error al obtener producto" }, { status: 500 });
    }
}

// Helper function for update logic
async function updateProduct(id: string, data: any) {
    // Update basic fields
    const updateData: any = {
        name: data.name,
        description: data.description,
        price: parseFloat(data.price),
        costPrice: data.costPrice !== undefined ? parseFloat(data.costPrice) : undefined,
        stock: parseInt(data.stock),
        minStock: data.minStock !== undefined ? parseInt(data.minStock) : undefined,
        isFeatured: data.isFeatured,
        isActive: data.isActive,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

    if (data.slug) updateData.slug = data.slug;
    if (data.image) updateData.image = data.image;

    // Handle category updates if provided
    if (data.categoryId) {
        updateData.categories = {
            deleteMany: {}, // Clear existing
            create: [{ category: { connect: { id: data.categoryId } } }]
        };
    } else if (data.categoryIds) {
        updateData.categories = {
            deleteMany: {}, // Clear existing
            create: data.categoryIds.map((catId: string) => ({
                category: { connect: { id: catId } }
            }))
        };
    }

    // Handle image URL update
    if (data.imageUrl !== undefined) {
        // Delete existing images
        await prisma.productImage.deleteMany({ where: { productId: id } });

        // Add new image if provided
        if (data.imageUrl) {
            await prisma.productImage.create({
                data: {
                    url: data.imageUrl,
                    productId: id,
                    order: 0
                }
            });
        }
    }

    const product = await prisma.product.update({
        where: { id },
        data: updateData,
        include: { categories: true, images: true }
    });

    return product;
}

// PUT - Update product (Admin only)
export async function PUT(
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

        const product = await updateProduct(id, data);
        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
    }
}

// PATCH - Update product (Admin only) - Alias for PUT
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

        const product = await updateProduct(id, data);
        return NextResponse.json(product);
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
    }
}

// DELETE - Delete product (Admin only)
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

        // Verify it exists
        const exists = await prisma.product.findUnique({ where: { id } });
        if (!exists) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

        try {
            await prisma.product.delete({ where: { id } });
            return NextResponse.json({ success: true, message: "Producto eliminado" });
        } catch (e) {
            // Likely foreign key constraint
            await prisma.product.update({ where: { id }, data: { isActive: false } });
            return NextResponse.json({ success: true, message: "Producto desactivado (tiene historial de ventas)" });
        }

    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
    }
}
