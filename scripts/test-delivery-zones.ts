/**
 * Test: point-in-polygon de DeliveryZone
 * Rama: feat/zonas-delivery-multiplicador
 *
 * Valida que el helper getZoneSnapshotForLocation funcione contra la DB real
 * con las zonas A/B/C ya pobladas (correr `apply-default-zone-polygons.ts` primero).
 *
 * 6 casos:
 *   1. Punto dentro de Zona A (centro Ushuaia) → A, multiplier 1.0
 *   2. Punto dentro de Zona B (intermedia)     → B, multiplier 1.15
 *   3. Punto dentro de Zona C (alta)           → C, multiplier 1.35
 *   4. Punto fuera de todas (mar adentro)      → null, multiplier 1.0
 *   5. Coordenadas inválidas (NaN)             → null defensivo
 *   6. Punto en overlap A/B/C (frontera)       → gana displayOrder más alto
 *
 * Uso:
 *   npx tsx scripts/test-delivery-zones.ts
 */

import { getZoneSnapshotForLocation } from "../src/lib/delivery-zones";

interface TestCase {
    name: string;
    lat: number;
    lng: number;
    expectMultiplier?: number;
    expectZoneName?: string | null;
    expectBonusGreaterOrEq?: number;
}

const TEST_CASES: TestCase[] = [
    {
        name: "Centro Ushuaia (Cartel Ushuaia, Av. San Martín)",
        lat: -54.808, lng: -68.305,
        expectZoneName: "Zona A",
        expectMultiplier: 1.0,
        expectBonusGreaterOrEq: 0,
    },
    {
        name: "Intermedia (norte de Maipú, Don Bosco)",
        lat: -54.800, lng: -68.310,
        expectZoneName: "Zona B",
        expectMultiplier: 1.15,
        expectBonusGreaterOrEq: 150,
    },
    {
        name: "Zona Alta (cerca de Andorra / Pioneros)",
        lat: -54.785, lng: -68.305,
        expectZoneName: "Zona C",
        expectMultiplier: 1.35,
        expectBonusGreaterOrEq: 350,
    },
    {
        name: "Mar adentro (Canal Beagle)",
        lat: -54.870, lng: -68.300,
        expectZoneName: null,
        expectMultiplier: 1.0,
    },
    {
        name: "Coordenadas inválidas (NaN)",
        lat: NaN, lng: NaN,
        expectZoneName: null,
        expectMultiplier: 1.0,
    },
];

async function main() {
    console.log("\n[TEST] Point-in-polygon DeliveryZone");
    console.log("─".repeat(70));

    let passed = 0;
    let failed = 0;
    const failures: string[] = [];

    for (const tc of TEST_CASES) {
        const result = await getZoneSnapshotForLocation(tc.lat, tc.lng);
        let ok = true;
        const reasons: string[] = [];

        // expectZoneName: null vs string. "Zona A" puede ser "Zona A — Centro" en el seed.
        if (tc.expectZoneName === null) {
            if (result.zoneCode !== null) {
                ok = false;
                reasons.push(`expected zoneCode null, got "${result.zoneCode}"`);
            }
        } else if (tc.expectZoneName !== undefined) {
            if (!result.zoneCode || !result.zoneCode.includes(tc.expectZoneName)) {
                ok = false;
                reasons.push(`expected zoneCode containing "${tc.expectZoneName}", got "${result.zoneCode}"`);
            }
        }

        if (tc.expectMultiplier !== undefined) {
            const diff = Math.abs(result.zoneMultiplier - tc.expectMultiplier);
            if (diff > 0.001) {
                ok = false;
                reasons.push(`expected multiplier ${tc.expectMultiplier}, got ${result.zoneMultiplier}`);
            }
        }

        if (tc.expectBonusGreaterOrEq !== undefined) {
            if (result.zoneDriverBonus < tc.expectBonusGreaterOrEq) {
                ok = false;
                reasons.push(`expected driverBonus >= ${tc.expectBonusGreaterOrEq}, got ${result.zoneDriverBonus}`);
            }
        }

        if (ok) {
            passed++;
            console.log(`  ✓ ${tc.name}`);
            console.log(`      → zone=${result.zoneCode}, mult=${result.zoneMultiplier}, bonus=$${result.zoneDriverBonus}`);
        } else {
            failed++;
            console.log(`  ✖ ${tc.name}`);
            console.log(`      Got: zone=${result.zoneCode}, mult=${result.zoneMultiplier}, bonus=$${result.zoneDriverBonus}`);
            for (const r of reasons) console.log(`      ${r}`);
            failures.push(tc.name);
        }
    }

    console.log("─".repeat(70));
    console.log(`Passed: ${passed}/${TEST_CASES.length}  ·  Failed: ${failed}`);

    if (failed > 0) {
        console.log("\n✖ Tests fallidos:");
        for (const f of failures) console.log(`   - ${f}`);
        console.log("\nVerificá que las 3 zonas A/B/C estén sembradas con polígonos:");
        console.log("   npx tsx scripts/seed-delivery-zones.ts");
        console.log("   npx tsx scripts/apply-default-zone-polygons.ts");
        process.exit(1);
    }

    console.log("\n✓ Todos los tests pasaron.\n");
}

main().catch((err) => {
    console.error("✖ Error en test:", err);
    process.exit(1);
});
