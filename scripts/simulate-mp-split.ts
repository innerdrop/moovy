// ─────────────────────────────────────────────────────────────────────────────
// Simulación del reparto financiero del pago con Mercado Pago.
// Rama: fix/split-mp-reserva-y-operativo
// Rama: fix/split-mp-cada-parte-paga-lo-suyo (2026-07-03): la fórmula ahora es
//   marketplace_fee = (comisión + envío − desc) × (1 − r)  →  cada parte paga
//   SU porción del costo de MP (Plan Maestro v1). Ver src/lib/finance/mp-split.ts
//   y el barrido de verificación en scripts/verify-split-cada-parte.ts.
//
// Corré:  npx tsx scripts/simulate-mp-split.ts
//         npx tsx scripts/simulate-mp-split.ts 9      (probar con 9% de reserva)
//
// Muestra, para varios escenarios, cuánto paga el comprador y cuánto recibe cada
// parte (comercio / Moovy / MP), y CONFIRMA que MP nunca rechaza y que el comercio
// nunca queda en negativo. No toca la base de datos: es matemática pura.
// ─────────────────────────────────────────────────────────────────────────────

import { computeMpSplit, simulateActualSettlement } from "../src/lib/finance/mp-split";

// % de reserva de MP a probar (configurable; en prod vendrá de la Biblia).
const reservePercent = Number(process.argv[2]) || 8;

// Comisiones REALES de MP que querés contrastar (de tus capturas):
//   6.29% = "al instante" sin IVA | ~7.6% = al instante CON IVA | 10-13% = subas futuras
const realMpFees = [6.29, 7.6, 10, 13];

const scenarios = [
    { name: "Producto barato + envío caro (el caso del CPT01)", subtotal: 10, deliveryFee: 300, commission: 0 },
    { name: "Producto caro + envío normal (comercio mes 2+, 8%)", subtotal: 5000, deliveryFee: 800, commission: 400 },
    { name: "Producto y envío parecidos", subtotal: 1500, deliveryFee: 1200, commission: 120 },
    { name: "Producto muy barato + envío chico", subtotal: 50, deliveryFee: 90, commission: 0 },
];

console.log(`\n=== SIMULACIÓN REPARTO MP — reserva configurada: ${reservePercent}% ===\n`);

let algunRechazo = false;
let algunNegativo = false;

for (const s of scenarios) {
    // PASO 1 (lo que está cableado hoy): grossUp=false → no se toca el total, Moovy absorbe.
    const split = computeMpSplit({
        subtotal: s.subtotal,
        deliveryFee: s.deliveryFee,
        commission: s.commission,
        mpReservePercent: reservePercent,
        grossUp: false,
    });
    // PASO 2 (para comparar): grossUp=true → el comprador paga un buffer, Moovy cobra completo.
    const step2 = computeMpSplit({
        subtotal: s.subtotal,
        deliveryFee: s.deliveryFee,
        commission: s.commission,
        mpReservePercent: reservePercent,
        grossUp: true,
    });

    console.log(`■ ${s.name}`);
    console.log(`   Producto $${s.subtotal} | Envío $${s.deliveryFee} | Comisión Moovy $${s.commission}`);
    console.log(`   PASO 1 (cableado): comprador paga $${split.chargedTotal} (sin buffer) | marketplace_fee Moovy $${split.marketplaceFee}`);
    console.log(`   PASO 2 (futuro):   comprador paga $${step2.chargedTotal} (buffer $${step2.buyerBuffer}) | marketplace_fee Moovy $${step2.marketplaceFee}`);
    split.notes.forEach((n) => console.log(`   ⚠️  PASO 1: ${n}`));

    console.log(`   Contraste con la comisión REAL de MP (PASO 1, lo cableado):`);
    for (const f of realMpFees) {
        const r = simulateActualSettlement(split.chargedTotal, split.marketplaceFee, f);
        if (r.rejected) algunRechazo = true;
        if (r.merchantNet < 0) algunNegativo = true;
        const flag = r.rejected ? "❌ RECHAZA" : "✅ OK";
        console.log(
            `     MP ${String(f).padStart(5)}% → comercio $${String(r.merchantNet).padStart(8)} | ` +
            `Moovy $${String(r.moovyNet).padStart(8)} | MP cobra $${String(r.mpFee).padStart(7)}  ${flag}`
        );
    }
    console.log("");
}

console.log("─".repeat(70));
console.log(`Resultado global:`);
console.log(`  ${algunRechazo ? "❌ HAY rechazos" : "✅ NINGÚN rechazo"} en los escenarios probados (hasta MP ${Math.max(...realMpFees)}%).`);
console.log(`  ${algunNegativo ? "❌ HAY casos negativos" : "✅ El comercio NUNCA queda en negativo"}.`);
console.log(`\nNota: cuando la comisión real de MP supera la reserva del ${reservePercent}%, Moovy`);
console.log(`absorbe la diferencia (cobra un poco menos) PERO el pago entra igual. Si eso pasa`);
console.log(`seguido, subí el % de reserva en la Biblia. Probá distintos %: npx tsx scripts/simulate-mp-split.ts 10\n`);
