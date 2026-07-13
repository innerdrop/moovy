import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import {
    HOME_SECTIONS,
    HOME_SECTION_BY_KEY,
    isValidHomeSectionKey,
} from "@/lib/home/sections";

// ─── Home Builder — API del organizador de secciones (OPS) ──────────────────
//
// GET: devuelve las secciones movibles del home con su orden/enabled persistido
//      (sembrando las que falten desde el registry). Cada item trae label +
//      description del registry para pintar la UI.
// PUT: guarda el nuevo orden + enabled. Valida contra el registry (keys
//      desconocidas se rechazan), upsert en tx Serializable (idempotente).
//
// Admin-only (requireApiAdmin). El render real del home usa estas filas vía
// resolveHomeLayout(); el enabled es un candado ADICIONAL sobre el guard de
// "hay datos" de cada sección.

type HomeSectionRow = { key: string; order: number; enabled: boolean };

/** Siembra filas faltantes desde el registry y devuelve el estado mergeado,
 *  ordenado, con metadata (label/description) del registry. */
async function syncAndGetSections() {
    const existing: HomeSectionRow[] = await prisma.homeSection.findMany({
        select: { key: true, order: true, enabled: true },
    });
    const existingKeys = new Set(existing.map((s) => s.key));

    const missing = HOME_SECTIONS.filter((d) => !existingKeys.has(d.key));
    if (missing.length > 0) {
        await prisma.homeSection.createMany({
            data: missing.map((d) => ({
                key: d.key,
                label: d.label,
                order: d.defaultOrder,
                enabled: true,
            })),
            skipDuplicates: true,
        });
    }

    const rows: HomeSectionRow[] = await prisma.homeSection.findMany({
        select: { key: true, order: true, enabled: true },
    });
    const byKey = new Map(rows.map((r) => [r.key, r]));

    // Solo devolvemos las keys del registry (ignoramos huérfanas de la DB), con
    // su metadata visual. Ordenadas por order.
    return HOME_SECTIONS.map((d) => {
        const row = byKey.get(d.key);
        return {
            key: d.key,
            label: d.label,
            description: d.description,
            order: row?.order ?? d.defaultOrder,
            enabled: row?.enabled ?? true,
        };
    }).sort((a, b) => a.order - b.order);
}

export async function GET(request: Request) {
    const limited = await applyRateLimit(request, "ops:home-sections", 30, 60_000);
    if (limited) return limited;

    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const sections = await syncAndGetSections();
        return NextResponse.json({ sections });
    } catch (error) {
        console.error("Error fetching home sections:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

const putSchema = z.object({
    sections: z
        .array(
            z.object({
                key: z.string().min(1),
                order: z.number().int(),
                enabled: z.boolean(),
            })
        )
        .min(1),
});

export async function PUT(request: Request) {
    const limited = await applyRateLimit(request, "ops:home-sections:update", 30, 60_000);
    if (limited) return limited;

    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const body = await request.json().catch(() => null);
        const parsed = putSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        // Rechazamos keys que no existan en el registry (defensa contra basura).
        const unknown = parsed.data.sections.filter((s) => !isValidHomeSectionKey(s.key));
        if (unknown.length > 0) {
            return NextResponse.json(
                { error: `Secciones desconocidas: ${unknown.map((s) => s.key).join(", ")}` },
                { status: 400 }
            );
        }

        // Upsert en tx Serializable: idempotente, siembra si falta, actualiza si existe.
        await prisma.$transaction(
            parsed.data.sections.map((s) =>
                prisma.homeSection.upsert({
                    where: { key: s.key },
                    update: { order: s.order, enabled: s.enabled },
                    create: {
                        key: s.key,
                        label: HOME_SECTION_BY_KEY[s.key].label,
                        order: s.order,
                        enabled: s.enabled,
                    },
                })
            ),
            { isolationLevel: "Serializable" }
        );

        const sections = await syncAndGetSections();
        return NextResponse.json({ sections });
    } catch (error) {
        console.error("Error updating home sections:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
