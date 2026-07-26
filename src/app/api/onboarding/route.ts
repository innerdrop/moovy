// API Route: Onboarding status + completion (ISSUE-021 tour buyer)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { getPointsConfig } from "@/lib/points";

/**
 * GET /api/onboarding — devuelve si el tour debe mostrarse al buyer.
 * shouldShow = true cuando onboardingCompletedAt es null (nunca completó/saltó).
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { onboardingCompletedAt: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // fix/safe-area-pausa-rapida-y-card: el slide de puntos del tour muestra
        // los valores REALES del programa (viven en PointsConfig, editables desde
        // OPS) — nunca hardcodear montos en el texto del tour: si el founder
        // cambia el bono, el slide mentiria.
        const config = await getPointsConfig();

        return NextResponse.json({
            shouldShow: user.onboardingCompletedAt === null,
            onboardingCompletedAt: user.onboardingCompletedAt,
            points: {
                signupBonus: config.signupBonus,
                minPurchaseForBonus: config.minPurchaseForBonus,
            },
        });
    } catch (error) {
        logger.error({ error }, "onboarding GET error");
        return NextResponse.json({ error: "Error al obtener estado" }, { status: 500 });
    }
}

/**
 * POST /api/onboarding/complete — marca el tour como completado/saltado.
 * Idempotente: si ya estaba completo, no rompe, simplemente devuelve el estado actual.
 */
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const existing = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { onboardingCompletedAt: true },
        });

        // Idempotencia: si ya tiene timestamp, no lo sobrescribimos
        if (existing?.onboardingCompletedAt) {
            return NextResponse.json({
                ok: true,
                onboardingCompletedAt: existing.onboardingCompletedAt,
                alreadyCompleted: true,
            });
        }

        const updated = await prisma.user.update({
            where: { id: session.user.id },
            data: { onboardingCompletedAt: new Date() },
            select: { onboardingCompletedAt: true },
        });

        return NextResponse.json({
            ok: true,
            onboardingCompletedAt: updated.onboardingCompletedAt,
            alreadyCompleted: false,
        });
    } catch (error) {
        logger.error({ error }, "onboarding POST error");
        return NextResponse.json({ error: "Error al guardar" }, { status: 500 });
    }
}
