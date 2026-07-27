// API Route: Home Category Slots — la vitrina LIBRE del home.
//
// feat/home-categorias-independientes (2026-07-26, decisión founder): un slot ya
// NO es "una Category del sistema que además se muestra en el home". Es una
// vitrina autónoma con nombre e imagen propios y un DESTINO elegido:
//   · CATEGORY → categoryId (filtra comercios de esa categoría real)
//   · SEARCH   → linkValue (ejecuta una búsqueda con ese término)
// Así, lo que el founder puede mostrar en el home dejó de estar condicionado por
// los paquetes B2B ni por la clasificación de productos.
//
// NOTA: se usa `(prisma as any)` en los puntos que tocan los campos nuevos
// (linkType/linkValue/categoryId opcional) — mismo patrón que supportOperator:
// el cliente generado se pone al día recién con `npx prisma db push`.
import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  image: true,
  icon: true,
  scope: true,
  isActive: true,
} as const;

type SlotInput = {
  linkType?: unknown;
  linkValue?: unknown;
  categoryId?: unknown;
  label?: unknown;
  image?: unknown;
  icon?: unknown;
  isActive?: unknown;
};

/** Valida y normaliza el DESTINO de una vitrina. */
async function resolveLink(data: SlotInput): Promise<
  | { ok: true; linkType: "CATEGORY" | "SEARCH"; categoryId: string | null; linkValue: string | null }
  | { ok: false; error: string }
> {
  const linkType = data.linkType === "SEARCH" ? "SEARCH" : "CATEGORY";

  if (linkType === "SEARCH") {
    const term = typeof data.linkValue === "string" ? data.linkValue.trim().slice(0, 60) : "";
    if (term.length < 2) {
      return { ok: false, error: "Escribí qué se busca al tocar la vitrina (mínimo 2 letras)." };
    }
    return { ok: true, linkType, categoryId: null, linkValue: term };
  }

  const categoryId = typeof data.categoryId === "string" ? data.categoryId : "";
  if (!categoryId) {
    return { ok: false, error: "Elegí a qué categoría lleva la vitrina." };
  }
  const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) {
    return { ok: false, error: "Esa categoría ya no existe." };
  }
  return { ok: true, linkType, categoryId, linkValue: null };
}

// GET — todas las vitrinas con su categoría (si tienen).
export async function GET() {
  try {
    const slots = await prisma.homeCategorySlot.findMany({
      orderBy: { order: "asc" },
      include: { category: { select: CATEGORY_SELECT } },
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

// POST — crear una vitrina.
export async function POST(request: Request) {
  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const data: SlotInput = await request.json();

    const label = typeof data.label === "string" ? data.label.trim().slice(0, 40) : "";
    if (label.length < 2) {
      return NextResponse.json(
        { error: "Ponele un nombre a la vitrina (mínimo 2 letras)." },
        { status: 400 }
      );
    }

    const link = await resolveLink(data);
    if (!link.ok) {
      return NextResponse.json({ error: link.error }, { status: 400 });
    }

    // Orden: al final de la fila.
    const lastSlot = await prisma.homeCategorySlot.findFirst({ orderBy: { order: "desc" } });
    const newOrder = (lastSlot?.order ?? 0) + 1;

    const slot = await (prisma as any).homeCategorySlot.create({
      data: {
        linkType: link.linkType,
        categoryId: link.categoryId,
        linkValue: link.linkValue,
        order: newOrder,
        label,
        image: typeof data.image === "string" && data.image ? data.image : null,
        icon: typeof data.icon === "string" && data.icon ? data.icon : null,
        isActive: data.isActive !== false,
      },
      include: { category: { select: CATEGORY_SELECT } },
    });

    await logAudit({
      action: "HOME_CATEGORY_SLOT_CREATED",
      entityType: "HomeCategorySlot",
      entityId: slot.id,
      userId: admin.userId,
      details: { label, linkType: link.linkType, categoryId: link.categoryId, linkValue: link.linkValue },
    });

    return NextResponse.json(slot, { status: 201 });
  } catch (error) {
    console.error("Error creating home category slot:", error);
    return NextResponse.json(
      { error: "Error al crear la vitrina del home" },
      { status: 500 }
    );
  }
}

// PATCH — reordenar en lote { slotIds } o editar una vitrina { id, ... }.
export async function PATCH(request: Request) {
  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const data: SlotInput & { id?: unknown; slotIds?: unknown } = await request.json();

    if (Array.isArray(data.slotIds)) {
      await prisma.$transaction(
        (data.slotIds as string[]).map((id, index) =>
          prisma.homeCategorySlot.update({ where: { id }, data: { order: index } })
        )
      );
      return NextResponse.json({ success: true });
    }

    const id = typeof data.id === "string" ? data.id : "";
    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {};

    if (data.label !== undefined) {
      const label = typeof data.label === "string" ? data.label.trim().slice(0, 40) : "";
      if (label.length < 2) {
        return NextResponse.json(
          { error: "Ponele un nombre a la vitrina (mínimo 2 letras)." },
          { status: 400 }
        );
      }
      patch.label = label;
    }
    if (data.image !== undefined) patch.image = data.image || null;
    if (data.icon !== undefined) patch.icon = data.icon || null;
    if (data.isActive !== undefined) patch.isActive = data.isActive;

    // El destino se cambia entero (tipo + valor) para no dejar estados híbridos.
    if (data.linkType !== undefined || data.categoryId !== undefined || data.linkValue !== undefined) {
      const link = await resolveLink(data);
      if (!link.ok) {
        return NextResponse.json({ error: link.error }, { status: 400 });
      }
      patch.linkType = link.linkType;
      patch.categoryId = link.categoryId;
      patch.linkValue = link.linkValue;
    }

    const slot = await (prisma as any).homeCategorySlot.update({
      where: { id },
      data: patch,
      include: { category: { select: CATEGORY_SELECT } },
    });

    await logAudit({
      action: "HOME_CATEGORY_SLOT_UPDATED",
      entityType: "HomeCategorySlot",
      entityId: id,
      userId: admin.userId,
      details: { changes: patch },
    });

    return NextResponse.json(slot);
  } catch (error) {
    console.error("Error updating home category slot:", error);
    return NextResponse.json(
      { error: "Error al actualizar la vitrina del home" },
      { status: 500 }
    );
  }
}

// DELETE — sacar la vitrina del home (la Category del sistema NO se toca).
export async function DELETE(request: Request) {
  try {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id es requerido" }, { status: 400 });
    }

    await prisma.homeCategorySlot.delete({ where: { id } });

    await logAudit({
      action: "HOME_CATEGORY_SLOT_DELETED",
      entityType: "HomeCategorySlot",
      entityId: id,
      userId: admin.userId,
      details: {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting home category slot:", error);
    return NextResponse.json(
      { error: "Error al eliminar la vitrina del home" },
      { status: 500 }
    );
  }
}
