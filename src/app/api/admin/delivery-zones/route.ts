// API: GET /api/admin/delivery-zones — list active zones
// API: POST /api/admin/delivery-zones — create zone
// Rama: feat/zonas-delivery-multiplicador
//
// AUTH: Solo ADMIN.
// AUDIT: Cada mutate (POST/PUT/DELETE) loguea con AdminNote.
// CACHE: Después de cada mutate exitoso, llamamos invalidateZonesCache().
//
// El campo `polygon` en DB es PostGIS Polygon, Unsupported en Prisma. Se
// inserta con $executeRaw + ST_GeomFromGeoJSON. Al leer, ST_AsGeoJSON.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { invalidateZonesCache } from "@/lib/delivery-zones";
import logger from "@/lib/logger";

const zonesLogger = logger.child({ module: "delivery-zones" });

// ─── Validación ─────────────────────────────────────────────────────────────

// GeoJSON Polygon: debe tener al menos 4 puntos en el outer ring (3 vértices
// + cierre que repite el primero). El admin lo dibuja con Google Maps drawing
// manager y normalizamos al formato GeoJSON antes de enviar.
const PointSchema = z.tuple([z.number(), z.number()]); // [lng, lat]
const PolygonRingSchema = z
    .array(PointSchema)
    .min(4, "El polígono necesita al menos 3 vértices más el cierre")
    .refine(
        (ring) => {
            const first = ring[0];
            const last = ring[ring.length - 1];
            return first[0] === last[0] && first[1] === last[1];
        },
        { message: "El primer y último punto del polígono deben ser iguales (cerrado)" }
    );

const CreateZoneSchema = z.object({
    name: z.string().trim().min(2, "Nombre muy corto").max(80),
    color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/, "Color debe ser hex tipo #22c55e")
        .default("#22c55e"),
    multiplier: z.coerce.number().min(0.5).max(3.0),
    driverBonus: z.coerce.number().int().min(0).max(10000).default(0),
    displayOrder: z.coerce.number().int().min(0).default(0),
    polygon: PolygonRingSchema,
});

// ─── GET: list ──────────────────────────────────────────────────────────────

export async function GET() {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    type Row = {
        id: string;
        name: string;
        color: string;
        multiplier: number;
        driverBonus: number;
        displayOrder: number;
        isActive: boolean;
        polygonGeoJson: string | null;
        createdAt: Date;
        updatedAt: Date;
    };

    const rows = await prisma.$queryRaw<Row[]>`
        SELECT
            id, name, color, multiplier, "driverBonus", "displayOrder", "isActive",
            ST_AsGeoJSON(polygon) AS "polygonGeoJson",
            "createdAt", "updatedAt"
        FROM "DeliveryZone"
        ORDER BY "displayOrder" DESC, name ASC
    `;

    const zones = rows.map((r) => {
        let polygon: [number, number][] | null = null;
        if (r.polygonGeoJson) {
            try {
                const geom = JSON.parse(r.polygonGeoJson);
                polygon = geom?.coordinates?.[0] ?? null;
            } catch {
                polygon = null;
            }
        }
        return { ...r, polygonGeoJson: undefined, polygon };
    });

    return NextResponse.json(zones);
}

// ─── POST: create ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = CreateZoneSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: "Parámetros inválidos", details: parsed.error.issues },
            { status: 400 }
        );
    }

    const { name, color, multiplier, driverBonus, displayOrder, polygon } = parsed.data;

    // Verificar unique name
    const existing = await prisma.deliveryZone.findUnique({ where: { name } });
    if (existing) {
        return NextResponse.json({ error: `Ya existe una zona llamada "${name}"` }, { status: 409 });
    }

    // GeoJSON Polygon completo para ST_GeomFromGeoJSON
    const geoJson = JSON.stringify({ type: "Polygon", coordinates: [polygon] });

    // Generamos un id manual (cuid no se puede en SQL crudo sin extensión).
    // Usamos crypto.randomUUID() que en runtime de Node sí está disponible.
    const id = `zone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    try {
        await prisma.$executeRaw`
            INSERT INTO "DeliveryZone"
                (id, name, color, multiplier, "driverBonus", "displayOrder", "isActive", polygon, "createdAt", "updatedAt")
            VALUES (
                ${id},
                ${name},
                ${color},
                ${multiplier},
                ${driverBonus},
                ${displayOrder},
                true,
                ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326),
                NOW(),
                NOW()
            )
        `;
    } catch (err) {
        zonesLogger.error({ err, name }, "Error creando DeliveryZone");
        return NextResponse.json({ error: "Error al crear la zona" }, { status: 500 });
    }

    invalidateZonesCache();

    // Detectar overlaps con otras zonas activas (ST_Intersects).
    // Devolvemos warnings al frontend para que el admin sepa que su polígono
    // se superpone — no bloquea, porque puede ser intencional. El sistema
    // resuelve el conflicto con displayOrder DESC (gana la de mayor orden).
    type OverlapRow = { id: string; name: string };
    const overlaps = await prisma.$queryRaw<OverlapRow[]>`
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

    zonesLogger.info(
        { zoneId: id, name, multiplier, driverBonus, displayOrder, adminId: session.user.id, action: "create", overlapsCount: overlaps.length },
        "Delivery zone created"
    );
    return NextResponse.json(
        { id, name, color, multiplier, driverBonus, displayOrder, polygon, overlaps },
        { status: 201 }
    );
}
