// API Route: Excluded Zones CRUD (collection)
// GET  → lista todas las zonas excluidas configuradas
// POST → crea una nueva zona excluida
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { parseExcludedZones, validateZoneInput, ExcludedZone } from "@/lib/excluded-zones";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function loadZones(): Promise<ExcludedZone[]> {
    const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } });
    return parseExcludedZones((settings as any)?.excludedZonesJson);
}

async function persistZones(zones: ExcludedZone[]): Promise<void> {
    await prisma.storeSettings.update({
        where: { id: "settings" },
        data: { excludedZonesJson: JSON.stringify(zones) } as any,
    });
}

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const zones = await loadZones();
        return NextResponse.json({ zones });
    } catch (error) {
        console.error("Error fetching excluded zones:", error);
        return NextResponse.json(
            { error: "Error al obtener zonas excluidas" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();
        const validation = validateZoneInput(body);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const zones = await loadZones();

        // Nombre único (case-insensitive) para evitar duplicados accidentales
        const nameLower = validation.data.name.toLowerCase();
        if (zones.some((z) => z.name.toLowerCase() === nameLower)) {
            return NextResponse.json(
                { error: "Ya existe una zona con ese nombre" },
                { status: 409 }
            );
        }

        const now = new Date().toISOString();
        const newZone: ExcludedZone = {
            id: randomUUID(),
            name: validation.data.name,
            lat: validation.data.lat,
            lng: validation.data.lng,
            radiusKm: validation.data.radiusKm,
            reason: validation.data.reason,
            active: validation.data.active ?? true,
            createdAt: now,
            updatedAt: now,
        };

        await persistZones([...zones, newZone]);

        await logAudit({
            action: "EXCLUDED_ZONE_CREATED",
            entityType: "StoreSettings",
            entityId: "settings",
            userId: session.user.id,
            details: { zone: newZone },
        });

        return NextResponse.json({ zone: newZone }, { status: 201 });
    } catch (error) {
        console.error("Error creating excluded zone:", error);
        return NextResponse.json(
            { error: "Error al crear zona excluida" },
            { status: 500 }
        );
    }
}
