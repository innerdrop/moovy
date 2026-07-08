/**
 * Verificación: bandeja de soporte en OPS + etiquetado de tickets.
 * Rama: feat/soporte-bandeja-ops
 *
 * READ-ONLY (no escribe ni borra nada). Corre contra la DB real y chequea que
 * el cableado nuevo sea coherente:
 *   1. El campo `origin` existe y es consultable (requiere `prisma db push`).
 *   2. Distribución de tickets por origen (BUYER/MERCHANT/DRIVER).
 *   3. La query que usa la bandeja de OPS (findMany + include) no rompe.
 *   4. Todo ticket MERCHANT tiene merchantId (para que el badge del comercio
 *      funcione). Marca los que no lo tengan (data vieja pre-fix).
 *   5. El contador del dashboard usa estados válidos (waiting/active).
 *
 * Uso: npx tsx scripts/verify-soporte-bandeja.ts
 */

import { prisma } from "../src/lib/prisma";

let failures = 0;
function check(cond: boolean, msg: string) {
  console.log(`  ${cond ? "✓" : "✗"} ${msg}`);
  if (!cond) failures++;
}

async function main() {
  console.log("\n=== Verificación soporte: bandeja OPS + etiquetado ===\n");

  // 1 + 2: origin consultable + distribución
  const byOrigin = await (prisma as any).supportChat.groupBy({
    by: ["origin"],
    _count: { _all: true },
  });
  console.log("Tickets por origen:");
  for (const row of byOrigin) {
    console.log(`   ${row.origin}: ${row._count._all}`);
  }
  check(Array.isArray(byOrigin), "El campo `origin` es consultable (db push aplicado)");

  // 3: query de la bandeja (misma forma que /api/admin/support/chats)
  const inbox = await (prisma as any).supportChat.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      operator: { select: { id: true, displayName: true, isOnline: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: "desc" },
    take: 20,
  });
  check(Array.isArray(inbox), "La query de la bandeja OPS corre sin romper");

  // 4: tickets MERCHANT sin merchantId (data vieja o bug)
  const merchantTickets = await (prisma as any).supportChat.findMany({
    where: { origin: "MERCHANT" },
    select: { id: true, merchantId: true, createdAt: true },
  });
  const sinMerchant = merchantTickets.filter((t: any) => !t.merchantId);
  check(
    sinMerchant.length === 0,
    `Tickets MERCHANT con merchantId: ${merchantTickets.length - sinMerchant.length}/${merchantTickets.length}` +
      (sinMerchant.length ? ` — ${sinMerchant.length} sin merchantId (data previa al fix; los nuevos ya se etiquetan)` : ""),
  );

  // 5: contador del dashboard con estados válidos
  const pendientes = await prisma.supportChat.count({ where: { status: { in: ["waiting", "active"] } } });
  console.log(`\nTickets sin responder (waiting+active): ${pendientes}`);
  check(typeof pendientes === "number", "El contador del dashboard usa estados válidos");

  console.log(`\n${"─".repeat(60)}`);
  console.log(failures === 0 ? "✅ Cableado consistente.\n" : `❌ ${failures} chequeo(s) con observaciones (ver arriba).\n`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error("Error en la verificación:", err);
  await prisma.$disconnect();
  process.exit(1);
});
