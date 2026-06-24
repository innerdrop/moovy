// API admin: togglear / leer un feature flag.
//
// feat/feature-flags-ops (2026-05-13): endpoint que sirve la pagina
// /ops/feature-flags. Solo admin. Patch atomico + invalidacion de cache.
//
//   GET    /api/admin/features/[key]  → devuelve el flag completo (con
//                                       label, description, lastToggled).
//   PATCH  /api/admin/features/[key]  → { isActive: bool }. Cambia el
//                                       toggle, registra audit + invalida
//                                       la cache server-side para que el
//                                       cambio se propague al instante.
//
// PATH PARAM key viene URL-encoded (ej: "merchant.publicidad" se pasa como
// "merchant.publicidad" — el "." y "-" son safe characters en URLs).

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { clearFeatureFlagCache } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
    isActive: z.boolean(),
});

// ─── GET ────────────────────────────────────────────────────────────────────

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { key } = await params;
        const flag = await prisma.featureFlag.findUnique({ where: { key } });
        if (!flag) {
            return NextResponse.json({ error: "Flag no encontrado" }, { status: 404 });
        }
        return NextResponse.json({ flag });
    } catch (error: any) {
        console.error("[admin/features GET] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// ─── PATCH ──────────────────────────────────────────────────────────────────

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const adminId = admin.userId;
        const adminEmail = admin.email as string;

        const { key } = await params;
        const body = await request.json().catch(() => ({}));
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Body inválido" },
                { status: 400 }
            );
        }

        const { isActive } = parsed.data;

        const flag = await prisma.featureFlag.findUnique({ where: { key } });
        if (!flag) {
            return NextResponse.json({ error: "Flag no encontrado" }, { status: 404 });
        }

        if (flag.isActive === isActive) {
            // No-op: ya esta en el estado pedido. Devolvemos OK sin tocar nada
            // para no ensuciar el audit log con cambios fantasma.
            return NextResponse.json({ flag, changed: false });
        }

        const updated = await prisma.featureFlag.update({
            where: { key },
            data: {
                isActive,
                lastToggledByUserId: adminId,
                lastToggledAt: new Date(),
            },
        });

        // Invalidacion inmediata de la cache server-side. Sin esto el cambio
        // tardaria hasta 30s en propagarse (ver feature-flags.ts CACHE_TTL_MS).
        clearFeatureFlagCache();

        await logAudit({
            action: "FEATURE_FLAG_TOGGLED",
            entityType: "FeatureFlag",
            entityId: flag.id,
            userId: adminId,
            details: {
                key,
                previousState: flag.isActive,
                newState: isActive,
                toggledBy: adminEmail,
            },
        }).catch(() => {});

        return NextResponse.json({ flag: updated, changed: true });
    } catch (error: any) {
        console.error("[admin/features PATCH] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
