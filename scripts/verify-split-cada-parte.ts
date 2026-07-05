/**
 * Verificación — fix/split-mp-cada-parte-paga-lo-suyo (Plan Maestro v1)
 *
 * Demuestra que "cada parte paga lo suyo" se cumple para CUALQUIER monto:
 *   comercio recibe (subtotal − comisión) × (1 − r)
 *   Moovy recibe    (comisión + envío − desc) × (1 − r)
 * con r = % de MP (7,6% al instante). Barrido de casos normales y extremos,
 * incluida la reproducción exacta del pago real de prueba MOV-W3G2.
 *
 * Uso: npx tsx scripts/verify-split-cada-parte.ts
 */

import { computeMpSplit, simulateActualSettlement } from "../src/lib/finance/mp-split";

const R = 7.6; // % MP acreditación al instante (config Biblia)
const round2 = (n: number) => Math.round(n * 100) / 100;

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail: string) {
    if (ok) {
        passed++;
        console.log(`✅ ${name} — ${detail}`);
    } else {
        failed++;
        console.log(`❌ ${name} — ${detail}`);
    }
}

interface Caso {
    nombre: string;
    subtotal: number;
    envio: number;
    comisionPct: number; // 0 = mes 1
    descuento?: number;
    esperaWarningCupon?: boolean;
}

const casos: Caso[] = [
    { nombre: "Pedido típico ($10.000 + envío $2.190, 10%)", subtotal: 10000, envio: 2190, comisionPct: 10 },
    { nombre: "Mes 1 (comisión 0%)", subtotal: 10000, envio: 2190, comisionPct: 0 },
    { nombre: "Prueba real MOV-W3G2 ($2 + envío $12)", subtotal: 2, envio: 12, comisionPct: 10 },
    { nombre: "Ticket chico ($500 + envío $1.888)", subtotal: 500, envio: 1888, comisionPct: 10 },
    { nombre: "Ticket grande ($500.000 + flete $20.250)", subtotal: 500000, envio: 20250, comisionPct: 7 },
    { nombre: "Envío gratis promo (envío $0, lo absorbe Moovy)", subtotal: 8000, envio: 0, comisionPct: 10 },
    { nombre: "Cupón normal ($1.000, dentro de la parte Moovy)", subtotal: 10000, envio: 2190, comisionPct: 10, descuento: 1000 },
    {
        nombre: "Cupón extremo (supera comisión + envío) → warning",
        subtotal: 10000, envio: 500, comisionPct: 10, descuento: 3000, esperaWarningCupon: true,
    },
];

console.log("── Verificación split MP: cada parte paga lo suyo ──\n");

for (const c of casos) {
    const comision = round2((c.subtotal * c.comisionPct) / 100);
    const desc = c.descuento ?? 0;
    const split = computeMpSplit({
        subtotal: c.subtotal,
        deliveryFee: c.envio,
        commission: comision,
        mpReservePercent: R,
        discount: desc,
    });
    const st = simulateActualSettlement(split.chargedTotal, split.marketplaceFee, R);

    const moovyEsperado = round2(Math.max(0, comision + c.envio - desc) * (1 - R / 100));
    const comercioEsperado = round2((c.subtotal - comision) * (1 - R / 100));

    console.log(`\n▸ ${c.nombre}`);
    console.log(
        `   total $${split.chargedTotal} · MP $${st.mpFee} · comercio $${st.merchantNet} · Moovy $${st.moovyNet}`
    );

    check("Moovy recibe su parte × (1−r)", Math.abs(st.moovyNet - moovyEsperado) <= 0.02,
        `recibió $${st.moovyNet}, esperado $${moovyEsperado}`);

    if (!c.esperaWarningCupon) {
        check("Comercio recibe su parte × (1−r)", Math.abs(st.merchantNet - comercioEsperado) <= 0.02,
            `recibió $${st.merchantNet}, esperado $${comercioEsperado}`);
    } else {
        check("Warning de cupón excedido presente", split.notes.some((n) => n.includes("cupones")),
            split.notes[0] ?? "sin notes");
    }

    check("MP nunca rechaza (comercio ≥ 0)", !st.rejected && st.merchantNet >= 0,
        `neto comercio $${st.merchantNet}`);
    check("Fee sin decimales ilegales para MP", split.marketplaceFee === round2(split.marketplaceFee),
        `fee $${split.marketplaceFee}`);

    // La suma cierra exacta: comercio + Moovy + MP = total (±2 centavos de redondeo).
    const suma = round2(st.merchantNet + st.moovyNet + st.mpFee);
    check("La suma de las partes = total", Math.abs(suma - split.chargedTotal) <= 0.02,
        `$${suma} vs $${split.chargedTotal}`);
}

// ── Liberación diferida: si MP le cobra MENOS al comercio (3,81%), Moovy no cambia ──
console.log("\n▸ Liberación diferida (MP cobra 3,81% en vez de 7,6%)");
const base = computeMpSplit({ subtotal: 10000, deliveryFee: 2190, commission: 1000, mpReservePercent: R });
const instante = simulateActualSettlement(base.chargedTotal, base.marketplaceFee, 7.6);
const diferida = simulateActualSettlement(base.chargedTotal, base.marketplaceFee, 3.81);
check("Moovy cobra IGUAL con cualquier plazo", instante.moovyNet === diferida.moovyNet,
    `$${instante.moovyNet} = $${diferida.moovyNet}`);
check("El ahorro es todo del comercio", diferida.merchantNet > instante.merchantNet,
    `comercio: $${instante.merchantNet} → $${diferida.merchantNet}`);

console.log(`\n── Resumen: ${passed} ✅ · ${failed} ❌ ──`);
process.exit(failed > 0 ? 1 : 0);
