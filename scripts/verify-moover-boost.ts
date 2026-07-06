/**
 * Verificación — feat/moover-boost-lanzamiento-y-defaults
 *
 * 1. Lógica pura del boost (activo / vencido / apagado / inválido).
 * 2. El earn aplica el boost (×2 duplica puntos, y respeta nivel + mínimos).
 * 3. Roundtrip contra DB REAL: guardar boost desde la config de OPS → leerlo
 *    con getPointsConfig (el mismo camino que usa el earn) → restaurar.
 * 4. Defaults canónicos (los que ve /moover si la DB falla).
 *
 * Uso: npx tsx scripts/verify-moover-boost.ts
 */

import { prisma } from "../src/lib/prisma";
import {
    calculatePointsEarned,
    getActiveEarnBoost,
    getPointsConfig,
    defaultConfig,
    type PointsConfig,
} from "../src/lib/points";
import { updatePointsConfig } from "../src/lib/ops-config";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string) {
    if (ok) { passed++; console.log(`✅ ${name}${detail ? ` — ${detail}` : ""}`); }
    else { failed++; console.log(`❌ ${name}${detail ? ` — ${detail}` : ""}`); }
}

const mañana = new Date(Date.now() + 24 * 60 * 60 * 1000);
const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);

function cfg(overrides: Partial<PointsConfig>): PointsConfig {
    return { ...defaultConfig, ...overrides };
}

async function main() {
    console.log("── Verificación boost MOOVER + defaults canónicos ──\n");

    // 1. Lógica pura del boost
    check("Boost apagado (sin fecha)", getActiveEarnBoost(cfg({ earnBoostMultiplier: 2, earnBoostUntil: null })) === 1);
    check("Boost activo (fecha futura, ×2)", getActiveEarnBoost(cfg({ earnBoostMultiplier: 2, earnBoostUntil: mañana })) === 2);
    check("Boost vencido (fecha pasada)", getActiveEarnBoost(cfg({ earnBoostMultiplier: 2, earnBoostUntil: ayer })) === 1);
    check("Multiplicador inválido (0) → 1", getActiveEarnBoost(cfg({ earnBoostMultiplier: 0, earnBoostUntil: mañana })) === 1);

    // 2. El earn aplica el boost
    const sinBoost = calculatePointsEarned(8000, cfg({}));
    const conBoost = calculatePointsEarned(8000, cfg({ earnBoostMultiplier: 2, earnBoostUntil: mañana }));
    check("Earn $8.000 sin boost = 80", sinBoost === 80, `dio ${sinBoost}`);
    check("Earn $8.000 con boost ×2 = 160", conBoost === 160, `dio ${conBoost}`);
    const conNivelYBoost = calculatePointsEarned(8000, cfg({ earnBoostMultiplier: 2, earnBoostUntil: mañana }), 1.5);
    check("Boost compone con nivel (GOLD ×1.5 y boost ×2 = 240)", conNivelYBoost === 240, `dio ${conNivelYBoost}`);
    const bajoMinimo = calculatePointsEarned(50, cfg({ minPurchaseForPoints: 100, earnBoostMultiplier: 2, earnBoostUntil: mañana }));
    check("Boost NO puentea el mínimo de compra", bajoMinimo === 0, `dio ${bajoMinimo}`);

    // 3. Roundtrip contra DB real (guardamos, leemos por el camino del earn, restauramos)
    const original = await prisma.pointsConfig.findUnique({ where: { id: "points_config" } });
    if (!original) {
        console.log("⏭️  Roundtrip SALTEADO: no hay PointsConfig en esta DB (correr seed)");
    } else {
        const origMult = (original as any).earnBoostMultiplier ?? 1;
        const origUntil = (original as any).earnBoostUntil ?? null;
        try {
            const fecha = mañana.toISOString().slice(0, 10);
            await updatePointsConfig({ earnBoostMultiplier: 2, earnBoostUntil: fecha });
            const leida = await getPointsConfig();
            check("Roundtrip DB: multiplicador guardado y leído", leida.earnBoostMultiplier === 2, `leído ${leida.earnBoostMultiplier}`);
            check("Roundtrip DB: boost queda ACTIVO", getActiveEarnBoost(leida) === 2);
            await updatePointsConfig({ earnBoostMultiplier: 1, earnBoostUntil: null });
            const apagada = await getPointsConfig();
            check("Roundtrip DB: apagar con fecha vacía funciona", getActiveEarnBoost(apagada) === 1);
        } finally {
            // Restaurar SIEMPRE los valores originales, pase lo que pase.
            await prisma.pointsConfig.update({
                where: { id: "points_config" },
                data: { earnBoostMultiplier: origMult, earnBoostUntil: origUntil } as any,
            });
        }
    }

    // 4. Defaults canónicos (lo que vería /moover si la DB fallara)
    check("Default pointsPerDollar = 0.01 (10 pts/$1.000)", defaultConfig.pointsPerDollar === 0.01);
    check("Default signupBonus = 1000", defaultConfig.signupBonus === 1000);
    check("Default maxDiscountPercent = 20", defaultConfig.maxDiscountPercent === 20);
    check("Default pointsValue = 1 (1 pt = $1)", defaultConfig.pointsValue === 1);
    check("Default boost apagado", defaultConfig.earnBoostMultiplier === 1 && defaultConfig.earnBoostUntil === null);

    console.log(`\n── Resumen: ${passed} ✅ · ${failed} ❌ ──`);
    process.exit(failed > 0 ? 1 : 0);
}

main()
    .catch((e) => {
        console.error("Error corriendo la verificación:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
