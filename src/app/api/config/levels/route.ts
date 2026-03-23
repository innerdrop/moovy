// Public Levels Config Endpoint
// Returns MOOVER levels with dynamic benefits text (no auth required)
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MOOVER_LEVELS } from "@/lib/moover-level";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
    const limited = await applyRateLimit(request, "config:levels", 30, 60_000);
    if (limited) return limited;

    try {
        // Read points config to make benefits dynamic
        const pointsConfig = await prisma.pointsConfig.findUnique({
            where: { id: "points_config" }
        });

        const ppd = pointsConfig?.pointsPerDollar ?? 1;
        const pointWord = ppd !== 1 ? 'puntos' : 'punto';

        // Build benefits mapping with dynamic pointsPerDollar value
        const levelBenefits: Record<string, string[]> = {
            Moover: [
                `${ppd} ${pointWord} por cada $1 gastado`,
                "Acceso a descuentos base"
            ],
            Pro: [
                "Todo lo de Moover",
                "5% OFF en envíos",
                "Sorteos exclusivos"
            ],
            Leyenda: [
                "Todo lo de Pro",
                "Envíos gratis > $20k",
                "Atención prioritaria 24/7"
            ]
        };

        // Combine levels with benefits
        const levels = MOOVER_LEVELS.map(level => ({
            name: level.name,
            min: level.min,
            max: level.max,
            color: level.color,
            benefits: levelBenefits[level.name] || []
        }));

        return NextResponse.json({ levels });
    } catch (error) {
        console.error("[Levels Config API] Error:", error);
        // Return default levels on error
        const ppd = 1;
        const pointWord = 'punto';
        const levelBenefits: Record<string, string[]> = {
            Moover: [
                `${ppd} ${pointWord} por cada $1 gastado`,
                "Acceso a descuentos base"
            ],
            Pro: [
                "Todo lo de Moover",
                "5% OFF en envíos",
                "Sorteos exclusivos"
            ],
            Leyenda: [
                "Todo lo de Pro",
                "Envíos gratis > $20k",
                "Atención prioritaria 24/7"
            ]
        };

        const levels = MOOVER_LEVELS.map(level => ({
            name: level.name,
            min: level.min,
            max: level.max,
            color: level.color,
            benefits: levelBenefits[level.name] || []
        }));

        return NextResponse.json({ levels });
    }
}
