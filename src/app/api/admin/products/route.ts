import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - Fetch all products with filters
export async function GET(request: Request) {
    try {
        const session = await auth();

        if (!session || !hasAnyRole(session, ["ADMIN", "MERCHANT"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const merchantId = searchParams.get("merchantId");
        const status = searchParams.get("status");
        const search = searchParams.get("search");

        // Siempre filtrar soft-deleted
        const where: any = { deletedAt: null };

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

        if (!session || !hasAnyRole(session, ["ADMIN"])) {
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

// PATCH - Toggle active SOLAMENTE.
// Para updates más complejos usar /api/admin/products/[id] (PUT/PATCH), que
// respeta las reglas de moderación estricta sobre productos de comercio.
export async function PATCH(request: Request) {
    try {
        const session = await auth();

        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const { id, action } = data;

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        // Solo toggle_active está permitido acá.
        // Cualquier otra modificación va por /api/admin/products/[id] que tiene
        // las reglas de moderación estricta.
        if (action !== "toggle_active") {
            return NextResponse.json(
                { error: "Acción no soportada. Para editar productos usar PUT /api/admin/products/[id]" },
                { status: 400 }
            );
        }

        const existing = await prisma.product.findUnique({
            where: { id },
            select: { isActive: true, deletedAt: true },
        });

        if (!existing || (existing as any).deletedAt) {
            return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
        }

        const updated = await prisma.product.update({
            where: { id },
            data: { isActive: !existing.isActive },
        });

        return NextResponse.json({ message: "Producto actualizado", product: updated });
    } catch (error) {
        console.error("Error toggling product:", error);
        return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
    }
}

// DELETE plural endpoint está deprecado.
// La eliminación real se hace vía DELETE /api/admin/products/[id] que aplica
// soft-delete con razón opcional + audit log.
export async function DELETE() {
    return NextResponse.json(
        { error: "Usar DELETE /api/admin/products/[id] con body { reason?: string }" },
        { status: 410 }
    );
}
