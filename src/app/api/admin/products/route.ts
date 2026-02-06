import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all products with filters
export async function GET(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        if (!session || !["ADMIN", "MERCHANT"].includes(userRole)) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const merchantId = searchParams.get("merchantId");
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        const where: any = {};

        if (merchantId) {
            where.merchantId = merchantId;
        }

        if (status === "active") {
            where.isActive = true;
        } else if (status === "inactive") {
            where.isActive = false;
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        const products = await prisma.product.findMany({
            where,
            include: {
                merchant: {
                    select: { id: true, name: true, slug: true }
                },
                categories: {
                    include: { category: true }
                },
                images: {
                    orderBy: { order: "asc" },
                    take: 1
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(products);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Error al obtener productos" }, { status: 500 });
    }
}

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

        // Normalize categoryId to categoryIds array
        const categoryIds = data.categoryIds?.length
            ? data.categoryIds
            : (data.categoryId ? [data.categoryId] : []);

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
                categories: categoryIds.length ? {
                    create: categoryIds.map((catId: string) => ({
                        category: { connect: { id: catId } }
                    }))
                } : undefined,
                // Create ProductImage if imageUrl is provided
                images: data.imageUrl ? {
                    create: {
                        url: data.imageUrl,
                        alt: data.name,
                        order: 0
                    }
                } : undefined
            },
            include: {
                categories: { include: { category: true } },
                images: true
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

// PATCH - Update product (toggle active, update fields)
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        if (!session || userRole !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const { id, action, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        let update: any = {};

        switch (action) {
            case "toggle_active":
                const product = await prisma.product.findUnique({ where: { id } });
                update.isActive = !product?.isActive;
                break;
            case "update":
                if (updateData.price) updateData.price = parseFloat(updateData.price);
                if (updateData.costPrice) updateData.costPrice = parseFloat(updateData.costPrice);
                if (updateData.stock) updateData.stock = parseInt(updateData.stock);

                // Handle Category updates
                if (updateData.categoryIds) {
                    const categoryIds = updateData.categoryIds;
                    delete updateData.categoryIds;

                    // Delete existing categories for this product and create new ones
                    await prisma.productCategory.deleteMany({
                        where: { productId: id }
                    });

                    update.categories = {
                        create: categoryIds.map((catId: string) => ({
                            categoryId: catId
                        }))
                    };
                }
                update = { ...update, ...updateData };
                break;
            default:
                update = updateData;
        }

        const updated = await prisma.product.update({
            where: { id },
            data: update
        });

        return NextResponse.json({ message: "Producto actualizado", product: updated });
    } catch (error) {
        console.error("Error updating product:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

// DELETE - Soft delete product
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        const userRole = (session?.user as any)?.role;

        if (!session || userRole !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        // Soft delete - just deactivate
        await prisma.product.update({
            where: { id },
            data: { isActive: false }
        });

        return NextResponse.json({ message: "Producto eliminado" });
    } catch (error) {
        console.error("Error deleting product:", error);
        return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
    }
}
