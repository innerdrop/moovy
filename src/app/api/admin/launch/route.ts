// feat/centro-lanzamiento: API única del Centro de Lanzamiento en OPS.
//
// GET  → estado consolidado de las 4 cosas del lanzamiento:
//        - comisión mes 1 (informativo: es automático per-merchant desde createdAt)
//        - boost de puntos (activo/vencido + días restantes)
//        - publicidad Fase 2 (flag merchant.publicidad + comercios activos)
//        - precio nafta (fuelPricePerLiter)
// POST → activar/desactivar el boost de puntos con UN click (setea earnBoostUntil).
//        El boost se apaga SOLO cuando pasa la fecha (getActiveEarnBoost), así que
//        no hay nada que "recordar" el día 31.
//
// La nafta se edita reusando /api/admin/ops-config (section delivery) y la publicidad
// reusando /api/admin/features/[key]; acá solo consolidamos la LECTURA de estado + el
// boost, que no tenían un botón directo.

import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import {
    getPointsConfig,
    updatePointsConfig,
    getActiveEarnBoost,
} from "@/lib/points";
import { isInFirstMonthFree, getFirstMonthFreeDaysRemaining } from "@/lib/merchant-loyalty";
import { logConfigChange } from "@/lib/ops-config";
import { z } from "zod";

export const dynamic = "force-dynamic";

// Umbral de comercios activos para habilitar la publicidad (Fase 2, Biblia).
const PUBLICIDAD_MERCHANT_THRESHOLD = 5;

function daysUntil(date: Date | null): number {
    if (!date) return 0;
    const ms = date.getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
}

export async function GET() {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const config = await getPointsConfig();
        const now = new Date();
        const activeBoost = getActiveEarnBoost(config, now);

        // Comercios activos (aprobados + operativos) + su ventana de mes gratis.
        const merchants = await prisma.merchant.findMany({
            where: { isActive: true, approvalStatus: "APPROVED" },
            select: { id: true, name: true, createdAt: true },
            orderBy: { createdAt: "asc" },
        });
        const activeCount = merchants.length;
        const firstMonthList = merchants
            .filter((m) => isInFirstMonthFree(m.createdAt, now))
            .map((m) => ({
                id: m.id,
                name: m.name,
                daysRemaining: getFirstMonthFreeDaysRemaining(m.createdAt, now),
            }));

        // Flag de publicidad (puede no existir todavía).
        const publicidadFlag = await prisma.featureFlag.findUnique({
            where: { key: "merchant.publicidad" },
            select: { isActive: true },
        });

        // Precio nafta (fallback igual que ops-config).
        const settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
            select: { fuelPricePerLiter: true },
        });

        return NextResponse.json({
            commission: {
                // Puramente informativo: el mes gratis es automático per-merchant.
                automatic: true,
                firstMonthList,
            },
            boost: {
                active: activeBoost > 1,
                multiplier: config.earnBoostMultiplier,
                until: config.earnBoostUntil,
                daysRemaining: config.earnBoostUntil ? daysUntil(config.earnBoostUntil) : 0,
            },
            publicidad: {
                enabled: publicidadFlag?.isActive ?? false,
                exists: publicidadFlag !== null,
                activeMerchants: activeCount,
                threshold: PUBLICIDAD_MERCHANT_THRESHOLD,
                thresholdReached: activeCount >= PUBLICIDAD_MERCHANT_THRESHOLD,
            },
            fuel: {
                pricePerLiter: settings?.fuelPricePerLiter ?? 1200,
            },
        });
    } catch (error: any) {
        console.error("[admin/launch GET] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

const PostSchema = z.object({
    action: z.enum(["activate-boost", "deactivate-boost"]),
    // Solo aplica a activate-boost.
    multiplier: z.number().min(1).max(10).optional(),
    days: z.number().int().min(1).max(365).optional(),
});

export async function POST(request: Request) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const parsed = PostSchema.safeParse(await request.json());
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Datos inválidos" },
                { status: 400 }
            );
        }
        const { action } = parsed.data;

        const before = await getPointsConfig();
        const adminId = (admin as any).userId || "unknown";
        const adminEmail = (admin as any).email || "unknown";

        let update: { earnBoostMultiplier: number; earnBoostUntil: Date | null };
        if (action === "activate-boost") {
            const multiplier = parsed.data.multiplier ?? 2;
            const days = parsed.data.days ?? 30;
            const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
            update = { earnBoostMultiplier: multiplier, earnBoostUntil: until };
        } else {
            // Apagar: multiplicador 1 y sin fecha (getActiveEarnBoost devuelve 1).
            update = { earnBoostMultiplier: 1, earnBoostUntil: null };
        }

        await updatePointsConfig(update);

        // Audit (mismo helper que usa el panel de config-biblia).
        await logConfigChange(
            adminId,
            adminEmail,
            "POINTS_CONFIG",
            "launch-boost",
            { earnBoostMultiplier: before.earnBoostMultiplier, earnBoostUntil: before.earnBoostUntil },
            update
        );

        return NextResponse.json({
            message:
                action === "activate-boost"
                    ? `Boost ×${update.earnBoostMultiplier} activado hasta ${update.earnBoostUntil?.toLocaleDateString("es-AR")}`
                    : "Boost desactivado",
            boost: {
                active: update.earnBoostMultiplier > 1 && !!update.earnBoostUntil,
                multiplier: update.earnBoostMultiplier,
                until: update.earnBoostUntil,
                daysRemaining: update.earnBoostUntil ? daysUntil(update.earnBoostUntil) : 0,
            },
        });
    } catch (error: any) {
        console.error("[admin/launch POST] Error:", error);
        return NextResponse.json(
            { error: "Error al actualizar: " + (error?.message || "desconocido") },
            { status: 500 }
        );
    }
}
