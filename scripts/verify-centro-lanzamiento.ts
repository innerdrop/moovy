// Verificación del Centro de Lanzamiento (feat/centro-lanzamiento).
// Ejercita contra la DB real las mismas lecturas/lógica que usa /api/admin/launch,
// para cazar errores de campo/schema ANTES de deployar. NO muta nada.
//
//   npx tsx scripts/verify-centro-lanzamiento.ts

import { prisma } from "../src/lib/prisma";
import { getPointsConfig, getActiveEarnBoost } from "../src/lib/points";
import { isInFirstMonthFree, getFirstMonthFreeDaysRemaining } from "../src/lib/merchant-loyalty";

let failures = 0;
function check(name: string, ok: boolean, detail = "") {
    console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? ` — ${detail}` : ""}`);
    if (!ok) failures++;
}

async function main() {
    console.log("\n🚀 Verificación — Centro de Lanzamiento\n");

    // 1. Boost: la lógica de vencimiento es la que apaga el boost solo.
    const config = await getPointsConfig();
    const future = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const past = new Date(Date.now() - 1000);
    const boostFuture = getActiveEarnBoost({ ...config, earnBoostMultiplier: 2, earnBoostUntil: future });
    const boostPast = getActiveEarnBoost({ ...config, earnBoostMultiplier: 2, earnBoostUntil: past });
    const boostNull = getActiveEarnBoost({ ...config, earnBoostMultiplier: 2, earnBoostUntil: null });
    check("Boost con fecha futura → ×2 activo", boostFuture === 2, `got ${boostFuture}`);
    check("Boost con fecha pasada → ×1 (apagado solo)", boostPast === 1, `got ${boostPast}`);
    check("Boost sin fecha → ×1 (apagado)", boostNull === 1, `got ${boostNull}`);
    console.log(`     Estado real actual: boost ${getActiveEarnBoost(config) > 1 ? `×${config.earnBoostMultiplier} activo` : "apagado"}`);

    // 2. Comercios activos + mes gratis (misma query que la API).
    const merchants = await prisma.merchant.findMany({
        where: { isActive: true, approvalStatus: "APPROVED" },
        select: { id: true, name: true, createdAt: true },
    });
    check("Query comercios activos ejecuta sin error", true, `${merchants.length} activos`);
    const inFreeMonth = merchants.filter((m) => isInFirstMonthFree(m.createdAt));
    check("Cálculo mes gratis per-merchant ejecuta", true, `${inFreeMonth.length} en mes gratis`);
    for (const m of inFreeMonth) {
        const days = getFirstMonthFreeDaysRemaining(m.createdAt);
        check(`  · ${m.name}: días restantes válido`, days >= 0 && days <= 30, `${days} días`);
    }

    // 3. Flag publicidad (puede no existir aún — tolerado).
    const flag = await prisma.featureFlag.findUnique({
        where: { key: "merchant.publicidad" },
        select: { isActive: true },
    });
    check("Lectura flag merchant.publicidad ejecuta", true, flag ? `enabled=${flag.isActive}` : "no existe todavía");

    // 4. Precio nafta.
    const settings = await prisma.storeSettings.findUnique({
        where: { id: "settings" },
        select: { fuelPricePerLiter: true },
    });
    const fuel = settings?.fuelPricePerLiter ?? 1200;
    check("Precio nafta legible y en rango", fuel >= 100 && fuel <= 5000, `$${fuel}/L`);

    console.log(`\n${failures === 0 ? "✅ TODO OK" : `❌ ${failures} fallas`}\n`);
    await prisma.$disconnect();
    process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (e) => {
    console.error("Error:", e);
    await prisma.$disconnect();
    process.exit(1);
});
