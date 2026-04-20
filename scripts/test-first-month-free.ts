/**
 * Test: Mes 1 gratis (Biblia Financiera v3)
 *
 * Valida que la ventana de comisión 0% durante los primeros 30 días
 * corridos desde Merchant.createdAt funcione en todos los casos borde.
 *
 * Casos cubiertos:
 *   - Día 1 (recién creado) → isInFirstMonthFree = true
 *   - Día 29 (último día dentro) → true
 *   - Día 30 exacto (al segundo del vencimiento) → false (ventana estricta < 30d)
 *   - Día 31 (vencido) → false
 *   - Fecha de fin calculada = createdAt + 30 días
 *   - daysRemaining correcto en día 1, 15, 29, 30, 31
 *   - getEffectiveCommission devuelve 0 en mes gratis para tier BRONCE
 *   - getEffectiveCommission devuelve 0 en mes gratis para tier DIAMANTE (no confunde con 5%)
 *   - commissionOverride gana contra mes gratis
 *   - Fuera de la ventana vuelve al tier correspondiente
 *
 * Uso: npx tsx scripts/test-first-month-free.ts
 */

import {
    isInFirstMonthFree,
    getFirstMonthFreeEndDate,
    getFirstMonthFreeDaysRemaining,
    getEffectiveCommission,
    FIRST_MONTH_FREE_DAYS,
} from "../src/lib/merchant-loyalty";
import { prisma } from "../src/lib/prisma";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(cond: boolean, description: string) {
    if (cond) {
        console.log(`  ✅ ${description}`);
        passed++;
    } else {
        console.error(`  ❌ ${description}`);
        failures.push(description);
        failed++;
    }
}

function section(title: string) {
    console.log(`\n== ${title} ==`);
}

async function main() {
    console.log("\n🧪 Test: Mes 1 gratis (Biblia Financiera v3)\n");
    console.log(`FIRST_MONTH_FREE_DAYS = ${FIRST_MONTH_FREE_DAYS}\n`);

    // ================================================================
    // Parte 1: funciones puras con inyección de "now"
    // ================================================================
    section("Funciones puras — ventana de 30 días");

    const now = new Date("2026-04-20T12:00:00Z");

    // Día 1 — creado hoy
    const day1 = new Date(now);
    assert(
        isInFirstMonthFree(day1, now) === true,
        "Día 1 (recién creado) → isInFirstMonthFree = true"
    );

    // Día 15 — mitad de la ventana
    const day15 = new Date(now.getTime() - 15 * ONE_DAY_MS);
    assert(
        isInFirstMonthFree(day15, now) === true,
        "Día 15 (mitad de ventana) → true"
    );

    // Día 29 — último día completo dentro
    const day29 = new Date(now.getTime() - 29 * ONE_DAY_MS);
    assert(
        isInFirstMonthFree(day29, now) === true,
        "Día 29 (último día dentro) → true"
    );

    // Día 30 exacto — límite estricto, fuera por 1ms
    const day30exact = new Date(now.getTime() - 30 * ONE_DAY_MS);
    assert(
        isInFirstMonthFree(day30exact, now) === false,
        "Día 30 exacto (30 × 24h = vencido) → false"
    );

    // Día 31 — claramente fuera
    const day31 = new Date(now.getTime() - 31 * ONE_DAY_MS);
    assert(
        isInFirstMonthFree(day31, now) === false,
        "Día 31 (vencido) → false"
    );

    // Defensa contra clock skew: fecha futura también está dentro
    const futureDate = new Date(now.getTime() + ONE_DAY_MS);
    assert(
        isInFirstMonthFree(futureDate, now) === true,
        "Fecha futura (clock skew) → true (tolerancia)"
    );

    // ================================================================
    // Parte 2: getFirstMonthFreeEndDate
    // ================================================================
    section("Fecha de vencimiento");

    const createdAtFixed = new Date("2026-04-01T00:00:00Z");
    const expectedEnd = new Date("2026-05-01T00:00:00Z"); // exacto +30 días
    const actualEnd = getFirstMonthFreeEndDate(createdAtFixed);
    assert(
        actualEnd.getTime() === expectedEnd.getTime(),
        `createdAt=2026-04-01 → vence 2026-05-01 (got ${actualEnd.toISOString()})`
    );

    // ================================================================
    // Parte 3: getFirstMonthFreeDaysRemaining
    // ================================================================
    section("Días restantes");

    assert(
        getFirstMonthFreeDaysRemaining(day1, now) === 30,
        "Día 1 → quedan 30 días"
    );
    assert(
        getFirstMonthFreeDaysRemaining(day15, now) === 15,
        "Día 15 → quedan 15 días"
    );
    const daysLeft29 = getFirstMonthFreeDaysRemaining(day29, now);
    assert(
        daysLeft29 === 1,
        `Día 29 → queda 1 día (got ${daysLeft29})`
    );
    assert(
        getFirstMonthFreeDaysRemaining(day30exact, now) === 0,
        "Día 30 exacto → 0 días"
    );
    assert(
        getFirstMonthFreeDaysRemaining(day31, now) === 0,
        "Día 31 (vencido) → 0 días (no negativo)"
    );

    // ================================================================
    // Parte 4: getEffectiveCommission — integración con DB real
    // ================================================================
    section("getEffectiveCommission contra DB");

    // Buscar un merchant existente para usar como base y hacer pruebas destructivas
    // en una copia. Si no hay merchants, creamos uno temporal.
    const anyUser = await prisma.user.findFirst({
        where: { deletedAt: null },
        select: { id: true },
    });

    if (!anyUser) {
        console.warn("  ⚠️  No hay users en la DB. Saltando integración con Prisma.");
    } else {
        // Crear merchant de test con createdAt manipulable.
        // Usamos un slug único para no colisionar con otros.
        const testSlug = `test-first-month-free-${Date.now()}`;
        const testMerchant = await prisma.merchant.create({
            data: {
                name: "Test First Month Free",
                slug: testSlug,
                ownerId: anyUser.id,
                approvalStatus: "APPROVED",
                loyaltyTier: "BRONCE",
                commissionRate: 8,
                // createdAt lo sobrescribimos con raw SQL después (Prisma default es now())
            },
        });

        try {
            // Escenario A: mes 1 gratis activo (createdAt hace 5 días) + tier BRONCE → debe devolver 0
            await prisma.$executeRaw`
                UPDATE "Merchant"
                SET "createdAt" = NOW() - INTERVAL '5 days',
                    "commissionOverride" = NULL,
                    "loyaltyTier" = 'BRONCE'
                WHERE id = ${testMerchant.id}
            `;
            const rateBronceNuevo = await getEffectiveCommission(testMerchant.id);
            assert(
                rateBronceNuevo === 0,
                `BRONCE + 5 días de creado → 0% (got ${rateBronceNuevo}%)`
            );

            // Escenario B: mes 1 gratis activo + tier DIAMANTE → debe devolver 0 (no 5%)
            await prisma.$executeRaw`
                UPDATE "Merchant"
                SET "loyaltyTier" = 'DIAMANTE'
                WHERE id = ${testMerchant.id}
            `;
            const rateDiamanteNuevo = await getEffectiveCommission(testMerchant.id);
            assert(
                rateDiamanteNuevo === 0,
                `DIAMANTE + 5 días de creado → 0% (el mes gratis gana al tier, got ${rateDiamanteNuevo}%)`
            );

            // Escenario C: commissionOverride gana al mes gratis
            await prisma.$executeRaw`
                UPDATE "Merchant"
                SET "commissionOverride" = 3.5
                WHERE id = ${testMerchant.id}
            `;
            const rateOverride = await getEffectiveCommission(testMerchant.id);
            assert(
                rateOverride === 3.5,
                `commissionOverride=3.5 + 5 días de creado → 3.5% (override gana, got ${rateOverride}%)`
            );

            // Escenario D: mes gratis vencido → vuelve al tier del programa
            await prisma.$executeRaw`
                UPDATE "Merchant"
                SET "createdAt" = NOW() - INTERVAL '60 days',
                    "commissionOverride" = NULL,
                    "loyaltyTier" = 'BRONCE'
                WHERE id = ${testMerchant.id}
            `;
            const rateBronceVencido = await getEffectiveCommission(testMerchant.id);
            // BRONCE config en DB: commissionRate = 8 (seed). Si no hay config, fallback 8.
            assert(
                rateBronceVencido === 8,
                `BRONCE + 60 días de creado → 8% (tier, got ${rateBronceVencido}%)`
            );

            // Escenario E: día 30 exacto (vencido) → vuelve al tier
            await prisma.$executeRaw`
                UPDATE "Merchant"
                SET "createdAt" = NOW() - INTERVAL '31 days',
                    "loyaltyTier" = 'DIAMANTE'
                WHERE id = ${testMerchant.id}
            `;
            const rateDiamanteVencido = await getEffectiveCommission(testMerchant.id);
            // DIAMANTE seed = 5%. Si no hay config, fallback 8.
            assert(
                rateDiamanteVencido === 5 || rateDiamanteVencido === 8,
                `DIAMANTE + 31 días → 5% (o 8% si no hay config, got ${rateDiamanteVencido}%)`
            );
        } finally {
            // Limpieza: borrar el merchant de test
            await prisma.merchant.delete({ where: { id: testMerchant.id } });
            console.log("  🧹 Merchant de test eliminado");
        }
    }

    // ================================================================
    // Resumen
    // ================================================================
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Total: ${passed + failed} | ✅ Passed: ${passed} | ❌ Failed: ${failed}`);
    if (failed > 0) {
        console.error("\nFallas:");
        failures.forEach((f) => console.error(`  - ${f}`));
        process.exit(1);
    } else {
        console.log("\n🎉 Todos los tests pasaron. Mes 1 gratis funciona según Biblia v3.");
    }
}

main()
    .catch((err) => {
        console.error("Error fatal:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
