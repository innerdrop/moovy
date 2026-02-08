// API Route: Hero Slides CRUD
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all slides
export async function GET() {
    try {
        const slides = await prisma.heroSlide.findMany({
            orderBy: { order: "asc" },
        });
        return NextResponse.json(slides);
    } catch (error) {
        console.error("Error fetching slides:", error);
        return NextResponse.json({ error: "Error al obtener slides" }, { status: 500 });
    }
}

// POST - Create new slide
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();

        // Get max order number
        const lastSlide = await prisma.heroSlide.findFirst({
            orderBy: { order: "desc" },
        });
        const newOrder = (lastSlide?.order ?? 0) + 1;

        const slide = await prisma.heroSlide.create({
            data: {
                title: data.title,
                subtitle: data.subtitle || "",
                buttonText: data.buttonText || "Ver más",
                buttonLink: data.buttonLink || "/productos",
                gradient: data.gradient || "from-[#e60012] via-[#ff2a3a] to-[#ff6b6b]",
                image: data.image || null,
                isActive: data.isActive !== false,
                order: newOrder,
            },
        });

        return NextResponse.json(slide, { status: 201 });
    } catch (error) {
        console.error("Error creating slide:", error);
        return NextResponse.json({ error: "Error al crear slide" }, { status: 500 });
    }
}

// PATCH - Update slide
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const { id, ...updateData } = data;

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        const slide = await prisma.heroSlide.update({
            where: { id },
            data: updateData,
        });

        return NextResponse.json(slide);
    } catch (error) {
        console.error("Error updating slide:", error);
        return NextResponse.json({ error: "Error al actualizar slide" }, { status: 500 });
    }
}

// DELETE - Delete slide
export async function DELETE(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== "ADMIN") {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json({ error: "ID requerido" }, { status: 400 });
        }

        await prisma.heroSlide.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Slide eliminado" });
    } catch (error) {
        console.error("Error deleting slide:", error);
        return NextResponse.json({ error: "Error al eliminar slide" }, { status: 500 });
    }
}
