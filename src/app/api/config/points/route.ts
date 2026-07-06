// Public Points Config Endpoint
// Returns points system configuration for public access (no auth required)
//
// feat/moover-boost-lanzamiento-y-defaults (2026-07-06): antes este endpoint tenía
// defaults propios DESACTUALIZADOS (1 pt/$ = 100× el valor real, bono 250, tope 15%).
// Si la config faltaba o la DB fallaba, la página /moover mostraba números falsos.
// Ahora usa getPointsConfig() de src/lib/points.ts — única fuente de verdad, cuyos
// defaults son los canónicos de la Biblia (regla #15: defaults conservadores).
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { getPointsConfig, getActiveEarnBoost } from "@/lib/points";

export async function GET(request: Request) {
    const limited = await applyRateLimit(request, "config:points", 30, 60_000);
    if (limited) return limited;

    // getPointsConfig() nunca throwea: si la DB falla, devuelve los defaults
    // canónicos (0.01 pts/$, bono 1000, tope 20%, punto = $1).
    const config = await getPointsConfig();

    return NextResponse.json({
        pointsPerDollar: config.pointsPerDollar,
        signupBonus: config.signupBonus,
        referralBonus: config.referralBonus,
        refereeBonus: config.refereeBonus,
        minPointsToRedeem: config.minPointsToRedeem,
        maxDiscountPercent: config.maxDiscountPercent,
        pointsValue: config.pointsValue,
        // Expiración: 180 días fijos en el sistema actual (6 meses, canon Biblia).
        pointsExpire: true,
        // Boost de lanzamiento vigente (1 = apagado). La UI puede mostrar
        // "¡Puntos ×2 por lanzamiento!" cuando sea > 1.
        earnBoostActive: getActiveEarnBoost(config) > 1,
        earnBoostMultiplier: getActiveEarnBoost(config),
        earnBoostUntil: config.earnBoostUntil,
    });
}
