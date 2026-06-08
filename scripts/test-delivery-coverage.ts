// Test: cobertura por zonas + coherencia de fees por distancia
//
// Rama: fix/delivery-geocoding-cobertura
//
// Valida las 4 garantías del fix sin mockear la lógica de pricing (usa el motor
// REAL calculateDeliveryCost) y la lógica REAL de point-in-polygon (copiada del
// algoritmo de delivery-zones.ts para poder testear cobertura sin depender de
// que haya zonas pintadas en la DB ni de la Google API).
//
// Casos:
//   (a) San Martín 222 vs Paseo de la Plaza → fees coherentes (min domina en
//       corto, el fee crece con la distancia).
//   (b) Río Grande (~-53.78,-67.70) → fuera del polígono de cobertura → RECHAZADO.
//   (c) Un punto lejano fuera de toda zona → rechazado.
//   (d) Sin zonas configuradas → NO_ZONES → fallback (no rompe).
//
// Además, si la DB es accesible, corre getCoverageStatus REAL contra las zonas
// configuradas (informativo).
//
// Uso: npx tsx scripts/test-delivery-coverage.ts

import { calculateDeliveryCost, type DeliverySettings } from "../src/lib/delivery";

// ─── Coordenadas conocidas (Ushuaia / Río Grande) ───────────────────────────
const SAN_MARTIN_222 = { lat: -54.8072, lng: -68.3074, label: "San Martín 222 (centro Ushuaia)" };
const PASEO_DE_LA_PLAZA = { lat: -54.8019, lng: -68.3030, label: "Paseo de la Plaza (Ushuaia)" };
const RIO_GRANDE = { lat: -53.7877, lng: -67.7095, label: "Río Grande (otra ciudad, ~200km)" };
const FAR_AWAY = { lat: -34.6037, lng: -58.3816, label: "Buenos Aires (lejísimos)" };

// Polígono de cobertura de prueba: rectángulo que cubre Ushuaia capital.
// Convención GeoJSON: [lng, lat]. Ring cerrado.
const USHUAIA_COVERAGE_POLYGON: [number, number][] = [
    [-68.45, -54.85],
    [-68.15, -54.85],
    [-68.15, -54.70],
    [-68.45, -54.70],
    [-68.45, -54.85],
];

// Copia EXACTA del ray-casting de src/lib/delivery-zones.ts (pointInPolygon).
function pointInPolygon(lng: number, lat: number, polygon: [number, number][]): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

// Réplica del gate getCoverageStatus para testear la decisión sin DB.
type CoverageStatus = "COVERED" | "OUT_OF_COVERAGE" | "NO_ZONES";
function coverageStatus(lat: number, lng: number, zones: [number, number][][]): CoverageStatus {
    if (zones.length === 0) return "NO_ZONES";
    for (const poly of zones) {
        if (pointInPolygon(lng, lat, poly)) return "COVERED";
    }
    return "OUT_OF_COVERAGE";
}

// Settings de prueba (Moto: min 1500, costo_km 73 vía pricePerKmArs).
const BIBLIA: DeliverySettings = {
    baseDeliveryFee: 1500,
    freeDeliveryMinimum: null,
    maxDeliveryDistance: 15,
    operationalCostPercent: 5,
    riderSharePercent: 80,
    zoneMultiplier: 1.0,
    climateMultiplier: 1.0,
    demandMultiplier: 1.0,
    rate: { pricePerKmArs: 73, minVehicleFee: 1500, consumptionPerKm: null },
};

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) {
        passed++;
        console.log(`  ✅ ${msg}`);
    } else {
        failed++;
        console.error(`  ❌ ${msg}`);
    }
}

console.log("\n=== TEST: cobertura por zonas + fees por distancia (fix/delivery-geocoding-cobertura) ===\n");

// ── (a) Fees coherentes: el fee crece con la distancia; el mínimo domina en corto ──
console.log("(a) Coherencia de fees por distancia");
const subtotal = 12000;
const feeShort = calculateDeliveryCost(0.4, BIBLIA, subtotal);   // ~San Martín 222 (muy cerca)
const feeMid = calculateDeliveryCost(2.5, BIBLIA, subtotal);     // ~Paseo de la Plaza
const feeLong = calculateDeliveryCost(15.0, BIBLIA, subtotal);   // periferia (arriba del quiebre del minimo ~9.3km en moto)
console.log(`     dist 0.4km → tripCost ${feeShort.tripCost} (minApplied=${feeShort.minApplied})`);
console.log(`     dist 2.5km → tripCost ${feeMid.tripCost} (minApplied=${feeMid.minApplied})`);
console.log(`     dist 15.0km → tripCost ${feeLong.tripCost} (minApplied=${feeLong.minApplied})`);
assert(feeShort.minApplied, "en 0.4km el MÍNIMO del vehículo domina (esperado)");
assert(feeLong.tripCost > feeShort.tripCost, "el fee a 15km es MAYOR que a 0.4km (varía con la distancia)");
assert(feeLong.tripCost >= feeMid.tripCost, "el fee es monotónico no-decreciente con la distancia");
assert(feeShort.operationalCost === Math.round(subtotal * 0.05), "operativo = 5% del subtotal");

// ── (b) Río Grande → fuera de cobertura → rechazado ──
console.log("\n(b) Río Grande fuera de cobertura");
const rgStatus = coverageStatus(RIO_GRANDE.lat, RIO_GRANDE.lng, [USHUAIA_COVERAGE_POLYGON]);
console.log(`     ${RIO_GRANDE.label} → ${rgStatus}`);
assert(rgStatus === "OUT_OF_COVERAGE", "Río Grande cae FUERA del polígono → OUT_OF_COVERAGE (rechazado)");

// Sanity: los dos puntos de Ushuaia SÍ están cubiertos.
const smStatus = coverageStatus(SAN_MARTIN_222.lat, SAN_MARTIN_222.lng, [USHUAIA_COVERAGE_POLYGON]);
const ppStatus = coverageStatus(PASEO_DE_LA_PLAZA.lat, PASEO_DE_LA_PLAZA.lng, [USHUAIA_COVERAGE_POLYGON]);
assert(smStatus === "COVERED", `${SAN_MARTIN_222.label} → COVERED`);
assert(ppStatus === "COVERED", `${PASEO_DE_LA_PLAZA.label} → COVERED`);

// ── (c) Punto lejano fuera de toda zona → rechazado ──
console.log("\n(c) Punto lejano fuera de toda zona");
const farStatus = coverageStatus(FAR_AWAY.lat, FAR_AWAY.lng, [USHUAIA_COVERAGE_POLYGON]);
console.log(`     ${FAR_AWAY.label} → ${farStatus}`);
assert(farStatus === "OUT_OF_COVERAGE", "Buenos Aires → OUT_OF_COVERAGE (rechazado)");

// ── (d) Sin zonas configuradas → NO_ZONES → fallback seguro (no rompe) ──
console.log("\n(d) Fallback sin zonas configuradas");
const noZonesStatus = coverageStatus(RIO_GRANDE.lat, RIO_GRANDE.lng, []);
console.log(`     sin zonas → ${noZonesStatus} (el caller cae al radio del merchant, NO bloquea)`);
assert(noZonesStatus === "NO_ZONES", "sin zonas → NO_ZONES (fallback seguro, no rompe producción)");

// ── (e) OPCIONAL: gate REAL contra DB si está accesible ──
async function runRealGate() {
    console.log("\n(e) Gate REAL contra DB (informativo, requiere DATABASE_URL + zonas)");
    try {
        const { getCoverageStatus, getAllActiveZones } = await import("../src/lib/delivery-zones");
        const zones = await getAllActiveZones();
        console.log(`     zonas activas en DB: ${zones.length}`);
        const real = await getCoverageStatus(RIO_GRANDE.lat, RIO_GRANDE.lng);
        console.log(`     getCoverageStatus(Río Grande) → ${real.status}`);
        if (zones.length === 0) {
            assert(real.status === "NO_ZONES", "DB sin zonas → NO_ZONES (fallback)");
        } else {
            console.log("     (con zonas configuradas, Río Grande debería dar OUT_OF_COVERAGE)");
        }
    } catch (e) {
        console.log(`     ⚠️  DB no accesible / sin Prisma — se omite el gate real: ${e instanceof Error ? e.message : String(e)}`);
    }
}

runRealGate().finally(() => {
    console.log(`\n=== RESULTADO: ${passed} passed, ${failed} failed ===\n`);
    process.exit(failed > 0 ? 1 : 0);
});
