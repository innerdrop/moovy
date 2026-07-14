/**
 * Verificación — feat/moover-referido-residual
 *
 * 1. El config expone referralResidualBonus y referralResidualEvery (> 0).
 * 2. Invariante anti-sobrepago (idempotencia/autofinanciamiento): para CADA referral,
 *    residualsPaid <= floor(pedidos_entregados_del_referido / every). Nunca se paga
 *    más residual del que corresponde por pedidos reales entregados.
 *
 * Read-only (no crea ni borra data). Uso: npx tsx scripts/verify-referido-residual.ts
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
    console.log("── Verificación referido residual ──\n");

    const config = await getPointsConfig();
    check(
        typeof config.referralResidualBonus === "number" && config.referralResidualBonus > 0,
        `referralResidualBonus = ${config.referralResidualBonus}`
    );
    check(
        typeof config.referralResidualEvery === "number" && config.referralResidualEvery > 0,
        `referralResidualEvery = ${config.referralResidualEvery}`
    );

    const every = config.referralResidualEvery || 10;
    const referrals = await prisma.referral.findMany({
        select: { refereeId: true, residualsPaid: true },
    });

    let overpaid = 0;
    for (const r of referrals) {
        const delivered = await prisma.order.count({
            where: { userId: r.refereeId, status: "DELIVERED", deletedAt: null },
        });
        const due = Math.floor(delivered / every);
        if (r.residualsPaid > due) overpaid++;
    }
    check(overpaid === 0, `Sin sobrepago de residual (referrals con residualsPaid > hitos reales: ${overpaid})`);

    const totalTx = await prisma.pointsTransaction.count({ where: { type: "REFERRAL_RESIDUAL" } });
    console.log(`\nReferrals: ${referrals.length} · Transacciones de residual: ${totalTx}`);
    console.log(`${ok} OK, ${fail} fallos`);

    await prisma.$disconnect();
    process.exit(fail > 0 ? 1 : 0);
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
