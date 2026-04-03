// API Route: Home Category Slots — curated homepage categories (independent of B2B packages)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

// GET - Get all home category slots with their linked category
export async function GET() {
  try {
    const slots = await prisma.homeCategorySlot.findMany({
      orderBy: { order: "asc" },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            icon: true,
            scope: true,
            isActive: true,
          },
        },
      },
    });

    return NextResponse.json(slots);
  } catch (error) {
    console.error("Error fetching home category slots:", error);
    return NextResponse.json(
      { error: "Error al obtener categorías del home" },
      { status: 500 }
    );
  }
}

// POST - Add a category to the home (create slot)
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    if (!data.categoryId) {
      return NextResponse.json(
        { error: "categoryId es requerido" },
        { status: 400 }
      );
    }

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Categoría no encontrada" },
        { status: 404 }
      );
    }

    // Check if already has a slot
    const existing = await prisma.homeCategorySlot.findUnique({
      where: { categoryId: data.categoryId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Esta categoría ya tiene un slot en el home" },
        { status: 409 }
      );
    }

    // Get next order
    const lastSlot = await prisma.homeCategorySlot.findFirst({
      orderBy: { order: "desc" },
    });
    const newOrder = (lastSlot?.order ?? 0) + 1;

    const slot = await prisma.homeCategorySlot.create({
      data: {
        categoryId: data.categoryId,
        order: newOrder,
        image: data.image || null,
        icon: data.icon || null,
        label: data.label || null,
        isActive: data.isActive !== false,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("Error creating home category slot:", error);
    return NextResponse.json(
      { error: "Error al crear slot del home" },
      { status: 500 }
    );
  }
}

// PATCH - Update a slot (image, icon, label, isActive) or bulk reorder
export async function PATCH(request: Request) {
  try {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const data = await request.json();

    // Bulk reorder: { slotIds: string[] }
    if (data.slotIds && Array.isArray(data.slotIds)) {
      await prisma.$transaction(
        data.slotIds.map((id: string, index: number) =>
          prisma.homeCategorySlot.update({
            where: { id },
            data: { order: index },
          })
        )
      );

      return NextResponse.json({ success: true });
    }

    // Single slot update: { id, image?, icon?, label?, isActive? }
    if (!data.id) {
      return NextResponse.json(
        { error: "id es requerido" },
        { status: 400 }
      );
    }

    const slot = await prisma.homeCategorySlot.update({
      where: { id: data.id },
      data: {
        ...(data.image !== undefined && { image: data.image || null }),
        ...(data.icon !== undefined && { icon: data.icon || null }),
        ...(data.label !== undefined && { label: data.label || null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            image: true,
            icon: true,
          },
        },
      },
    });

    return NextResponse.json(slot);
  } catch (error) {
    console.error("Error updating home category slot:", error);
    return NextResponse.json(
      { error: "Error al actualizar slot del home" },
      { status: 500 }
    );
  }
}

// DELETE - Remove a slot (category is NOT affected)
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id es requerido" },
        { status: 400 }
      );
    }

    await prisma.homeCategorySlot.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting home category slot:", error);
    return NextResponse.json(
      { error: "Error al eliminar slot del home" },
      { status: 500 }
    );
  }
}
