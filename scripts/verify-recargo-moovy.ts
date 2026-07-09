/**
 * Verificación — feat/recargo-moovy-y-tamano-toggle
 *
 * 1. Math del recargo: price = round(base × (1 + markup/100)) para alta/edición y para
 *    el importador (precio del local + recargo del lote).
 * 2. Anti-gaming: en modo "markup" el `price` que manda el cliente se IGNORA — el server
 *    re-deriva desde base+markup. Bajar base + subir recargo no baja la comisión porque
 *    la comisión cae sobre el precio FINAL.
 * 3. Escotilla del import: treatAsFinal / recargo 0 → el precio va tal cual, sin metadata.
 * 4. Integridad DB: ningún producto con basePrice cargado tiene price ≠ round(base×(1+m)).
 * 5. Simulación financiera: desglose final / comisión / payout (0% primer mes y 10%).
 *
 * Uso: npx tsx scripts/verify-recargo-moovy.ts
 */

import { derivePricing, deriveImportPricing } from "../src/lib/finance/product-pricing";
import { prisma } from "../src/lib/prisma";

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail: string) {
    if (ok) { passed++; console.log(`✅ ${name} — ${detail}`); }
    else { failed++; console.log(`❌ ${name} — ${detail}`); }
}

const round = (n: number) => Math.round(n);

async function main() {
    console.log("\n=== 1. Math del recargo (alta/edición) ===");
    {
        const r = derivePricing({ priceMode: "markup", price: 0, basePrice: 5000, markupPercent: 5 });
        check("5000 + 5%", r.price === 5250 && r.basePrice === 5000 && r.markupPercent === 5, `price=${r.price} base=${r.basePrice} markup=${r.markupPercent}`);
    }
    {
        const r = derivePricing({ priceMode: "markup", price: 0, basePrice: 1234, markupPercent: 12.5 });
        check("1234 + 12.5%", r.price === round(1234 * 1.125), `price=${r.price} (esperado ${round(1234 * 1.125)})`);
    }
    {
        const r = derivePricing({ priceMode: "markup", price: 0, basePrice: 5000, markupPercent: 0 });
        check("markup 0% = base", r.price === 5000 && r.basePrice === 5000, `price=${r.price}`);
    }
    {
        const r = derivePricing({ priceMode: "direct", price: 7777, basePrice: null, markupPercent: null });
        check("modo directo", r.price === 7777 && r.basePrice === null && r.markupPercent === null, `price=${r.price} base=${r.basePrice}`);
    }

    console.log("\n=== 2. Anti-gaming (el price del cliente se ignora en markup) ===");
    {
        // Cliente intenta falsificar price=1 pero declara base=5000 + 5%.
        const r = derivePricing({ priceMode: "markup", price: 1, basePrice: 5000, markupPercent: 5 });
        check("price falsificado ignorado", r.price === 5250, `server re-derivó ${r.price}, no el 1 del cliente`);
    }
    {
        // El truco clásico: base baja + recargo gigante. La comisión (sobre el FINAL) no baja.
        const honesto = derivePricing({ priceMode: "markup", price: 0, basePrice: 5000, markupPercent: 5 });
        const truco = derivePricing({ priceMode: "markup", price: 0, basePrice: 1, markupPercent: 524900 });
        const comHonesto = round(honesto.price * 0.10);
        const comTruco = round(truco.price * 0.10);
        // Ambos publican ~$5250 → la comisión es la misma. El truco no sirve.
        check("gaming no baja comisión", Math.abs(honesto.price - truco.price) <= 1 && Math.abs(comHonesto - comTruco) <= 1,
            `final honesto=${honesto.price} (com ${comHonesto}) vs truco=${truco.price} (com ${comTruco})`);
    }

    console.log("\n=== 3. Importador (precio del local + recargo del lote) ===");
    {
        const r = deriveImportPricing(2000, 5, false);
        check("import 2000 local + 5%", r.price === 2100 && r.basePrice === 2000 && r.markupPercent === 5, `price=${r.price} base=${r.basePrice}`);
    }
    {
        const r = deriveImportPricing(2100, 5, true); // escotilla: ya es final
        check("import escotilla (final)", r.price === 2100 && r.basePrice === null && r.markupPercent === null, `price=${r.price} base=${r.basePrice}`);
    }
    {
        const r = deriveImportPricing(2000, 0, false); // sin recargo
        check("import sin recargo", r.price === 2000 && r.basePrice === null, `price=${r.price} base=${r.basePrice}`);
    }

    console.log("\n=== 4. Integridad DB (productos con basePrice) ===");
    try {
        const rows: { id: string; price: number; basePrice: number | null; markupPercent: number | null }[] =
            await (prisma as any).product.findMany({
                where: { basePrice: { not: null } },
                select: { id: true, price: true, basePrice: true, markupPercent: true },
            });
        if (rows.length === 0) {
            console.log("   (sin productos con recargo todavía — nada que auditar)");
        }
        let drift = 0;
        for (const p of rows) {
            const expected = round((p.basePrice ?? 0) * (1 + (p.markupPercent ?? 0) / 100));
            if (Math.abs(expected - p.price) > 1) { drift++; console.log(`   ⚠️  ${p.id}: price=${p.price} esperado=${expected}`); }
        }
        check("sin drift base↔final en DB", drift === 0, `${rows.length} productos con recargo, ${drift} con desvío`);
    } catch (e) {
        console.log("   ⏭️  Sin acceso a DB (corré con la DB local levantada para auditar):", (e as Error).message);
    }

    console.log("\n=== 5. Simulación financiera (base $5000 + 5%) ===");
    {
        const final = derivePricing({ priceMode: "markup", price: 0, basePrice: 5000, markupPercent: 5 }).price;
        for (const rate of [0, 10]) {
            const com = round(final * rate / 100);
            console.log(`   Comisión ${rate}%${rate === 0 ? " (primer mes)" : ""}: final $${final} · comisión $${com} · recibís $${final - com}`);
        }
    }

    console.log(`\n=== RESULTADO: ${passed} ok, ${failed} fallidos ===`);
    await prisma.$disconnect().catch(() => {});
    process.exit(failed === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
