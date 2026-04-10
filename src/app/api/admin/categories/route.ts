// API Route: Categories CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - Get all categories
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { order: "asc" },
            include: {
                _count: { select: { products: true, listings: { where: { isActive: true } } } },
                children: {
                    orderBy: { order: "asc" },
                    include: { _count: { select: { products: true, listings: { where: { isActive: true } } } } }
                },
                parent: true
            },
        });

        return NextResponse.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return NextResponse.json({ error: "Error al obtener categorías" }, { status: 500 });
    }
}

// POST - Create new category
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();

        // Generate slug
        const slug = data.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        // Get max order number
        const lastCategory = await prisma.category.findFirst({
            orderBy: { order: "desc" },
        });
        const newOrder = (lastCategory?.order ?? 0) + 1;

        const category = await prisma.category.create({
            data: {
                name: data.name,
                slug,
                description: data.description || null,
                image: data.image || null,
                isActive: data.isActive !== false,
                scope: ["STORE", "MARKETPLACE", "BOTH"].includes(data.scope) ? data.scope : "BOTH",
                price: parseFloat(data.price || 0),
                allowIndividualPurchase: data.allowIndividualPurchase !== false,
                isPackageAvailable: data.isPackageAvailable !== false,
                order: newOrder,
                parentId: data.parentId || null,
                icon: data.icon || null,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
    }
}

// PATCH - Update category
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        // Generate slug if name changes
        if (updateData.name) {
            updateData.slug = updateData.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");
        }

        if (updateData.price !== undefined) {
            updateData.price = parseFloat(updateData.price);
        }

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

// DELETE - Delete category (PROTEGIDO: no permite borrar si tiene productos asignados)
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        // Verificar si tiene productos asignados (protección contra pérdida de clasificación)
        const productCount = await prisma.productCategory.count({
            where: { categoryId: id },
        });

        if (productCount > 0) {
            return NextResponse.json(
                {
                    error: `No se puede eliminar: esta categoría tiene ${productCount} producto(s) asignado(s). Desvinculá los productos primero o desactivá la categoría en su lugar.`,
                },
                { status: 409 }
            );
        }

        // Verificar si tiene listings asignados
        const listingCount = await prisma.listing.count({
            where: { categoryId: id },
        });

        if (listingCount > 0) {
            return NextResponse.json(
                {
                    error: `No se puede eliminar: esta categoría tiene ${listingCount} listing(s) del marketplace asignado(s).`,
                },
                { status: 409 }
            );
        }

        // Safe to delete — also removes HomeCategorySlot (cascade) and MerchantCategory (cascade)
        await prisma.category.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Categoría eliminada" });
    } catch (error) {
        console.error("Error deleting category:", error);
        return NextResponse.json({ error: "Error al eliminar categoría" }, { status: 500 });
    }
}