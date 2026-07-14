/**
 * Verificación — feat/moover-canje-recompensas
 *
 * 1. Catálogo bien formado: todas con pointsCost > 0; FIXED_AMOUNT con value > 0;
 *    type válido (FREE_DELIVERY | FIXED_AMOUNT).
 * 2. Invariante de dinero: ningún pedido quedó con total negativo (el descuento de
 *    la recompensa nunca deja el total < 0 — Math.max(0, ...) en la creación).
 *
 * Read-only. Uso: npx tsx scripts/verify-recompensas.ts
 */
import { prisma } from "../src/lib/prisma";

let ok = 0;
let fail = 0;
function check(cond: boolean, msg: string) {
    if (cond) { ok++; console.log(`  ✅ ${msg}`); }
    else { fail++; console.log(`  ❌ ${msg}`); }
}

async function main() {
    console.log("── Verificación recompensas ──\n");

    const rewards = await prisma.reward.findMany();
    check(rewards.every((r) => r.pointsCost > 0), `Todas con costo en puntos > 0 (mal: ${rewards.filter((r) => r.pointsCost <= 0).length})`);
    check(
        rewards.filter((r) => r.type === "FIXED_AMOUNT").every((r) => r.value > 0),
        `FIXED_AMOUNT con valor > 0 (mal: ${rewards.filter((r) => r.type === "FIXED_AMOUNT" && r.value <= 0).length})`
    );
    const validTypes = ["FREE_DELIVERY", "FIXED_AMOUNT"];
    check(rewards.every((r) => validTypes.includes(r.type)), `Tipos válidos (mal: ${rewards.filter((r) => !validTypes.includes(r.type)).length})`);

    const negTotals = await prisma.order.count({ where: { total: { lt: 0 } } });
    check(negTotals === 0, `Sin pedidos con total negativo (encontrados: ${negTotals})`);

    console.log(`\nRecompensas: ${rewards.length} (${rewards.filter((r) => r.isActive).length} activas)`);
    console.log(`${ok} OK, ${fail} fallos`);

    await prisma.$disconnect();
    process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
