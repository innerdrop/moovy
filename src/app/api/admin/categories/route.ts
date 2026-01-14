// API Route: Categories CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all categories
export async function GET() {
    try {
        const categories = await prisma.category.findMany({
            orderBy: { order: "asc" },
            include: {
                _count: { select: { products: true } },
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
        if (!session || (session.user as any)?.role !== "ADMIN") {
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
                order: newOrder,
            },
        });

        return NextResponse.json(category, { status: 201 });
    } catch (error) {
        console.error("Error creating category:", error);
        return NextResponse.json({ error: "Error al crear categoría" }, { status: 500 });
    }
}

