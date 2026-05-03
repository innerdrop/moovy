// API: GET /api/admin/delivery-zones/[id] — fetch single zone
// API: PUT /api/admin/delivery-zones/[id] — update zone
// API: DELETE /api/admin/delivery-zones/[id] — soft delete (isActive: false)
// Rama: feat/zonas-delivery-multiplicador

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { invalidateZonesCache } from "@/lib/delivery-zones";
import logger from "@/lib/logger";

const zonesLogger = logger.child({ module: "delivery-zones" });

const PointSchema = z.tuple([z.number(), z.number()]);
const PolygonRingSchema = z
    .array(PointSchema)
    .min(4, "El polígono necesita al menos 3 vértices más el cierre");

// Update permite tocar campos parcialmente. Polygon es opcional para que el
// admin pueda cambiar solo nombre/color/multiplicador sin re-dibujar.
const UpdateZoneSchema = z.object({
    name: z.string().trim().min(2).max(80).optional(),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
    multiplier: z.coerce.number().min(0.5).max(3.0).optional(),
    driverBonus: z.coerce.number().int().min(0).max(10000).optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    polygon: PolygonRingSchema.optional(),
});

// ─── GET: fetch single ──────────────────────────────────────────────────────

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;

    type Row = {
        id: string;
        name: string;
        color: string;
        multiplier: number;
        driverBonus: number;
        displayOrder: number;
        isActive: boolean;
        polygonGeoJson: string | null;
    };

    const rows = await prisma.$queryRaw<Row[]>`
        SELECT
            id, name, color, multiplier, "driverBonus", "displayOrder", "isActive",
            ST_AsGeoJSON(polygon) AS "polygonGeoJson"
        FROM "DeliveryZone"
        WHERE id = ${id}
        LIMIT 1
    `;

    if (rows.length === 0) {
        return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    }

    const r = rows[0];
    let polygon: [number, number][] | null = null;
    if (r.polygonGeoJson) {
        try {
            const geom = JSON.parse(r.polygonGeoJson);
            polygon = geom?.coordinates?.[0] ?? null;
        } catch {}
    }

    return NextResponse.json({ ...r, polygonGeoJson: undefined, polygon });
}

// ─── PUT: update ────────────────────────────────────────────────────────────

export async function PUT(request: Request, ctx: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = UpdateZoneSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Parámetros inválidos", details: parsed.error.issues },
            { status: 400 }
        );
    }

    const data = parsed.data;

    // Verificar existencia
    const existing = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    }

    // Si renombró, verificar unique
    if (data.name && data.name !== existing.name) {
        const dup = await prisma.deliveryZone.findUnique({ where: { name: data.name } });
        if (dup) {
            return NextResponse.json(
                { error: `Ya existe otra zona llamada "${data.name}"` },
                { status: 409 }
            );
        }
    }

    try {
        // Actualizamos todo lo que NO sea polygon con Prisma normal
        const scalarUpdates: Record<string, unknown> = {};
        if (data.name !== undefined) scalarUpdates.name = data.name;
        if (data.color !== undefined) scalarUpdates.color = data.color;
        if (data.multiplier !== undefined) scalarUpdates.multiplier = data.multiplier;
        if (data.driverBonus !== undefined) scalarUpdates.driverBonus = data.driverBonus;
        if (data.displayOrder !== undefined) scalarUpdates.displayOrder = data.displayOrder;
        if (data.isActive !== undefined) scalarUpdates.isActive = data.isActive;

        if (Object.keys(scalarUpdates).length > 0) {
            await prisma.deliveryZone.update({
                where: { id },
                data: scalarUpdates,
            });
        }

        // Si trajeron polygon nuevo, lo actualizamos con SQL crudo
        if (data.polygon) {
            const geoJson = JSON.stringify({ type: "Polygon", coordinates: [data.polygon] });
            await prisma.$executeRaw`
                UPDATE "DeliveryZone"
                SET polygon = ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326),
                    "updatedAt" = NOW()
                WHERE id = ${id}
            `;
        }
    } catch (err) {
        zonesLogger.error({ err, id }, "Error actualizando DeliveryZone");
        return NextResponse.json({ error: "Error al actualizar la zona" }, { status: 500 });
    }

    invalidateZonesCache();

    // Detectar overlaps si actualizó el polígono
    type OverlapRow = { id: string; name: string };
    let overlaps: OverlapRow[] = [];
    if (data.polygon) {
        overlaps = await prisma.$queryRaw<OverlapRow[]>`
            SELECT id, name
            FROM "DeliveryZone"
            WHERE id != ${id}
              AND "isActive" = true
              AND polygon IS NOT NULL
              AND ST_Intersects(
                  polygon,
                  (SELECT polygon FROM "DeliveryZone" WHERE id = ${id})
              )
        `;
    }

    const changedKeys = Object.keys(data).join(", ");
    zonesLogger.info(
        { zoneId: id, name: existing.name, changedKeys, adminId: session.user.id, action: "update", overlapsCount: overlaps.length },
        "Delivery zone updated"
    );
    return NextResponse.json({ ok: true, overlaps });
}

// ─── DELETE: HARD delete (borra la fila de DB) ─────────────────────────────
//
// El admin requiere confirmación textual desde el cliente — body con
// `{ confirm: "BORRAR" }` (regla canónica #26 del CLAUDE.md: operaciones
// irreversibles requieren confirmación textual literal).
//
// Es seguro hard-deletear: SubOrder.zoneCode guarda un snapshot string del
// nombre de la zona (no es FK). Los pedidos históricos conservan el snapshot
// aunque la fila DeliveryZone se borre.
//
// Para "apagar" temporalmente sin borrar (toggle visibilidad), usar PUT con
// { isActive: false }.

export async function DELETE(request: Request, ctx: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await ctx.params;

    // Confirmación textual obligatoria
    let body: { confirm?: string } = {};
    try {
        body = await request.json();
    } catch {
        // Sin body — exigir confirmación
    }
    if (body.confirm !== "BORRAR") {
        return NextResponse.json(
            { error: "Confirmación textual requerida. Body debe contener { confirm: \"BORRAR\" }." },
            { status: 400 }
        );
    }

    const existing = await prisma.deliveryZone.findUnique({ where: { id } });
    if (!existing) {
        return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
    }

    // HARD DELETE — la fila desaparece de DB. Los SubOrders con zoneCode
    // referenciando esta zona conservan su snapshot inmutable (audit AAIP).
    await prisma.deliveryZone.delete({ where: { id } });

    invalidateZonesCache();

    zonesLogger.info(
        { zoneId: id, name: existing.name, adminId: session.user.id, action: "hard-delete" },
        "Delivery zone hard-deleted"
    );
    return NextResponse.json({ ok: true });
}
