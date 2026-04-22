// API Route: Excluded Zones CRUD (per-id)
// PATCH  → edita una zona (cualquier campo validado; active incluido)
// DELETE → elimina la zona por id
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { parseExcludedZones, ExcludedZone } from "@/lib/excluded-zones";
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

/**
 * Valida parches parciales. Cada campo es opcional — permite editar solo `active`
 * o solo el radio sin tener que reenviar todo.
 */
function validatePatch(input: unknown):
    | { ok: true; data: Partial<Pick<ExcludedZone, "name" | "lat" | "lng" | "radiusKm" | "reason" | "active">> }
    | { ok: false; error: string } {
    if (!input || typeof input !== "object") {
        return { ok: false, error: "Payload inválido" };
    }
    const i = input as Record<string, unknown>;
    const out: Record<string, any> = {};

    if (i.name !== undefined) {
        if (typeof i.name !== "string" || i.name.trim().length < 1 || i.name.length > 50) {
            return { ok: false, error: "El nombre debe tener entre 1 y 50 caracteres" };
        }
        out.name = i.name.trim();
    }
    if (i.lat !== undefined) {
        if (typeof i.lat !== "number" || i.lat < -90 || i.lat > 90) {
            return { ok: false, error: "Latitud fuera de rango" };
        }
        out.lat = i.lat;
    }
    if (i.lng !== undefined) {
        if (typeof i.lng !== "number" || i.lng < -180 || i.lng > 180) {
            return { ok: false, error: "Longitud fuera de rango" };
        }
        out.lng = i.lng;
    }
    if (i.radiusKm !== undefined) {
        if (typeof i.radiusKm !== "number" || i.radiusKm < 0.1 || i.radiusKm > 3) {
            return { ok: false, error: "El radio debe estar entre 0.1 y 3 km" };
        }
        out.radiusKm = i.radiusKm;
    }
    if (i.reason !== undefined) {
        if (typeof i.reason !== "string" || i.reason.trim().length < 1 || i.reason.length > 200) {
            return { ok: false, error: "La razón debe tener entre 1 y 200 caracteres" };
        }
        out.reason = i.reason.trim();
    }
    if (i.active !== undefined) {
        if (typeof i.active !== "boolean") {
            return { ok: false, error: "active debe ser boolean" };
        }
        out.active = i.active;
    }

    if (Object.keys(out).length === 0) {
        return { ok: false, error: "No hay campos válidos para actualizar" };
    }
    return { ok: true, data: out };
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const validation = validatePatch(body);
        if (!validation.ok) {
            return NextResponse.json({ error: validation.error }, { status: 400 });
        }

        const zones = await loadZones();
        const idx = zones.findIndex((z) => z.id === id);
        if (idx === -1) {
            return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
        }

        // Validar nombre único si cambió
        if (validation.data.name !== undefined) {
            const nameLower = validation.data.name.toLowerCase();
            const duplicated = zones.some(
                (z, i) => i !== idx && z.name.toLowerCase() === nameLower
            );
            if (duplicated) {
                return NextResponse.json(
                    { error: "Ya existe otra zona con ese nombre" },
                    { status: 409 }
                );
            }
        }

        const before = zones[idx];
        const updated: ExcludedZone = {
            ...before,
            ...validation.data,
            updatedAt: new Date().toISOString(),
        };
        zones[idx] = updated;
        await persistZones(zones);

        await logAudit({
            action: "EXCLUDED_ZONE_UPDATED",
            entityType: "StoreSettings",
            entityId: "settings",
            userId: session.user.id,
            details: { before, after: updated, changes: validation.data },
        });

        return NextResponse.json({ zone: updated });
    } catch (error) {
        console.error("Error updating excluded zone:", error);
        return NextResponse.json(
            { error: "Error al actualizar zona" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await params;
        const zones = await loadZones();
        const removed = zones.find((z) => z.id === id);
        if (!removed) {
            return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 });
        }

        const next = zones.filter((z) => z.id !== id);
        await persistZones(next);

        await logAudit({
            action: "EXCLUDED_ZONE_DELETED",
            entityType: "StoreSettings",
            entityId: "settings",
            userId: session.user.id,
            details: { zone: removed },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting excluded zone:", error);
        return NextResponse.json(
            { error: "Error al eliminar zona" },
            { status: 500 }
        );
    }
}
