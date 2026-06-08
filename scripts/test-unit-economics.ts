// Test: unit economics — simulación financiera del margen de contribución.
// Rama: feat/dashboard-unit-economics
//
// Valida la lógica PURA (lib/finance/unit-economics) con números calculados a
// mano, casos borde y la regla FINANZAS "los totales coinciden con la suma de
// las partes". No mockea: usa las funciones reales que consume el endpoint.
//
// Uso: npx tsx scripts/test-unit-economics.ts

import {
    computeOrderEconomics,
    aggregateEconomics,
    resolveDriverPayout,
    round2,
    type OrderEcoInput,
} from "../src/lib/finance/unit-economics";

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
    if (cond) { passed++; console.log(`  ✅ ${msg}`); }
    else { failed++; console.log(`  ❌ ${msg}`); }
}
const near = (a: number, b: number, tol = 0.02) => Math.abs(a - b) <= tol;

const MP = 3.81;
const FIXED = 440000;
const NOW = new Date("2026-06-15T12:00:00Z");

function order(partial: Partial<OrderEcoInput> & { subOrders: OrderEcoInput["subOrders"] }): OrderEcoInput {
    return {
        id: partial.id ?? "o1",
        orderNumber: partial.orderNumber ?? "0001",
        createdAt: partial.createdAt ?? NOW,
        subtotal: partial.subtotal ?? 0,
        total: partial.total ?? 0,
        discount: partial.discount ?? 0,
        distanceKm: partial.distanceKm ?? null,
        isMultiVendor: partial.isMultiVendor ?? false,
        subOrders: partial.subOrders,
    };
}

console.log("\n=== TEST: unit economics (margen de contribución + break-even) ===\n");

// ── (a) Pedido comercio simple, números a mano ──────────────────────────────
console.log("(a) Pedido comercio simple");
// subtotal 10000, envío 1500, comisión 800 (8%), driver 1200, total 11500, sin descuento
// deliveryMargin = 1500-1200 = 300 ; moovyGross = 800+300 = 1100
// mpCost = 3.81% × 11500 = 438.15 ; margen = 1100 - 438.15 = 661.85
const oA = order({
    subtotal: 10000, total: 11500, discount: 0, distanceKm: 3,
    subOrders: [{ deliveryFee: 1500, moovyCommission: 800, driverPayoutAmount: 1200 }],
});
const rA = computeOrderEconomics(oA, MP);
assert(near(rA.mpCost, 438.15), `mpCost = 3.81% del total (${rA.mpCost} ≈ 438.15)`);
assert(near(rA.margin, 661.85), `margen a mano = 661.85 (got ${rA.margin})`);
assert(rA.deliveryPct === 15, `envío % subtotal = 15% (got ${rA.deliveryPct})`);

// ── (b) Multivendor: 2 SubOrders, payout por viaje ──────────────────────────
console.log("(b) Multivendor (2 SubOrders)");
// SO1 envío 1500/com 800/driver 1200 ; SO2 envío 800/com 600/driver 640
// subtotal 15000, total 17300, sin descuento
// commission 1400 ; deliveryFee 2300 ; driver 1840 ; deliveryMargin 460 ; gross 1860
// mpCost = 3.81% × 17300 = 659.13 ; margen = 1860 - 659.13 = 1200.87
const oB = order({
    id: "o2", subtotal: 15000, total: 17300, isMultiVendor: true,
    subOrders: [
        { deliveryFee: 1500, moovyCommission: 800, driverPayoutAmount: 1200 },
        { deliveryFee: 800, moovyCommission: 600, driverPayoutAmount: 640 },
    ],
});
const rB = computeOrderEconomics(oB, MP);
assert(rB.driverPayout === 1840, `driver payout suma 2 SubOrders = 1840 (got ${rB.driverPayout})`);
assert(near(rB.margin, 1200.87), `margen multivendor = 1200.87 (got ${rB.margin})`);
assert(rB.tripPayouts.length === 2 && rB.tripPayouts[0] === 1200 && rB.tripPayouts[1] === 640,
    `tripPayouts = un payout por viaje [1200, 640]`);

// ── (c) Pedido con margen NEGATIVO (descuento grande + envío caro) ───────────
console.log("(c) Margen negativo");
// subtotal 2000, envío 1500, comisión 160, driver 1200, descuento 500, total 3000
// deliveryMargin 300 ; gross 460 ; mpCost = 3.81%×3000 = 114.3 ; margen = 460-114.3-500 = -154.3
const oC = order({
    id: "o3", subtotal: 2000, total: 3000, discount: 500,
    subOrders: [{ deliveryFee: 1500, moovyCommission: 160, driverPayoutAmount: 1200 }],
});
const rC = computeOrderEconomics(oC, MP);
assert(near(rC.margin, -154.3), `margen negativo = -154.3 (got ${rC.margin})`);
assert(rC.margin < 0, `se detecta como pérdida`);
assert(rC.deliveryPct === 75, `envío = 75% del subtotal (pedido chico, riesgo conversión)`);

// ── (d) Fallback driver payout cuando el snapshot es null ───────────────────
console.log("(d) Fallback de payout sin snapshot");
assert(resolveDriverPayout({ deliveryFee: 1000, moovyCommission: 0, driverPayoutAmount: null }) === 800,
    `driverPayoutAmount null → 80% del fee = 800`);
assert(resolveDriverPayout({ deliveryFee: 1000, moovyCommission: 0, driverPayoutAmount: 950 }) === 950,
    `driverPayoutAmount presente → usa el snapshot (950)`);

// ── (e) Agregado vacío (sin pedidos) ────────────────────────────────────────
console.log("(e) Sin pedidos entregados");
const empty = aggregateEconomics([], { mpFeePercent: MP, fixedMonthlyCost: FIXED, now: NOW });
assert(empty.summary.orderCount === 0, `orderCount = 0`);
assert(empty.summary.contributionMargin === 0, `margen total = 0`);
assert(empty.breakEven.ordersToBreakEven === null, `break-even = null (no se puede calcular sin margen)`);

// ── (f) Regla FINANZAS: el total coincide con la suma de las partes ─────────
console.log("(f) Totales = suma de las partes");
const agg = aggregateEconomics([oA, oB, oC], { mpFeePercent: MP, fixedMonthlyCost: FIXED, now: NOW });
const sumOfRows = round2(agg.rows.reduce((a, r) => a + r.margin, 0));
assert(near(agg.summary.contributionMargin, sumOfRows, 0.05),
    `margen total (${agg.summary.contributionMargin}) = Σ márgenes por pedido (${sumOfRows})`);
assert(agg.summary.negativeMarginCount === 1, `1 pedido con margen negativo (got ${agg.summary.negativeMarginCount})`);
assert(agg.summary.highDeliveryShareCount === 1, `1 pedido con envío > 40% (got ${agg.summary.highDeliveryShareCount})`);
// avg payout por viaje: viajes [1200, 1200, 640, 1200] → 1060
assert(agg.summary.avgDriverPayout === 1060, `payout promedio por viaje = 1060 (got ${agg.summary.avgDriverPayout})`);

// ── (g) Break-even: pedidos/mes para cubrir gastos fijos ────────────────────
console.log("(g) Break-even");
// pedido único con margen 661.85 → ceil(440000/661.85) = 665
const beAgg = aggregateEconomics([oA], { mpFeePercent: MP, fixedMonthlyCost: FIXED, now: NOW });
assert(beAgg.breakEven.ordersToBreakEven === Math.ceil(FIXED / beAgg.summary.avgMarginPerOrder),
    `ordersToBreakEven = ceil(gastos / margenPorPedido) = ${beAgg.breakEven.ordersToBreakEven}`);
assert(beAgg.breakEven.ordersThisMonth === 1, `1 pedido este mes (got ${beAgg.breakEven.ordersThisMonth})`);

// ── (h) Sin margen positivo → no hay break-even posible ─────────────────────
console.log("(h) Margen no positivo → break-even null");
const lossAgg = aggregateEconomics([oC], { mpFeePercent: MP, fixedMonthlyCost: FIXED, now: NOW });
assert(lossAgg.breakEven.ordersToBreakEven === null, `con margen negativo, break-even = null`);
assert(lossAgg.breakEven.breakEvenProgressPct === 0, `progreso = 0%`);

console.log(`\n=== RESULTADO: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
