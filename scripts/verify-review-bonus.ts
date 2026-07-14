/**
 * Verificación — feat/moover-bono-resena
 *
 * 1. El config expone `reviewBonus` (> 0; si es 0, hay que setearlo en /ops/config-biblia).
 * 2. Idempotencia en data REAL: no existe ningún pedido con 2 o más bonos REVIEW
 *    (el bono se otorga una sola vez por pedido, aunque el user califique
 *    comercio + repartidor + vendedor).
 *
 * Read-only (no crea ni borra data). Uso: npx tsx scripts/verify-review-bonus.ts
 */
import { prisma } from "../src/lib/prisma";
import { getPointsConfig } from "../src/lib/points";

let ok = 0;
let fail = 0;
function check(cond: boolean, msg: string) {
    if (cond) { ok++; console.log(`  ✅ ${msg}`); }
    else { fail++; console.log(`  ❌ ${msg}`); }
}

async function main() {
    console.log("── Verificación bono por reseña ──\n");

    const config = await getPointsConfig();
    check(typeof config.reviewBonus === "number", `reviewBonus expuesto en el config: ${config.reviewBonus}`);
    check((config.reviewBonus ?? 0) > 0, "reviewBonus > 0 (si da 0, setealo en /ops/config-biblia → Bono reseña)");

    // Idempotencia: ningún pedido debe tener 2+ transacciones REVIEW.
    const dupes = await prisma.pointsTransaction.groupBy({
        by: ["orderId"],
        where: { type: "REVIEW", orderId: { not: null } },
        _count: { id: true },
        having: { id: { _count: { gt: 1 } } },
    });
    check(dupes.length === 0, `Sin bonos de reseña duplicados por pedido (encontrados: ${dupes.length})`);

    const total = await prisma.pointsTransaction.count({ where: { type: "REVIEW" } });
    console.log(`\nBonos de reseña otorgados hasta hoy: ${total}`);
    console.log(`${ok} OK, ${fail} fallos`);

    await prisma.$disconnect();
    process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
