/**
 * audit-before-clean.js
 * Auditoría de integridad ANTES de limpiar la DB.
 * Ejecutar: node scripts/audit-before-clean.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KEEP_EMAILS = [
  'comercio1@somosmoovy.com',
  'comercio2@somosmoovy.com',
  'comercio3@somosmoovy.com',
  'test.moover@somosmoovy.com',
];

async function main() {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   MOOVY — Auditoría pre-limpieza de DB      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // 1. Listar todos los usuarios
  const users = await prisma.user.findMany({
    include: {
      roles: true,
      ownedMerchants: { select: { id: true, name: true, slug: true } },
      driver: { select: { id: true, totalDeliveries: true, rating: true } },
      sellerProfile: { select: { id: true, displayName: true, totalSales: true } },
    },
    orderBy: { email: 'asc' },
  });

  console.log(`=== USUARIOS (${users.length} total) ===`);
  for (const u of users) {
    const roles = u.roles.map(r => r.role).join(', ') || '-';
    const merchants = u.ownedMerchants.map(m => m.name).join(', ') || '-';
    const driver = u.driver ? `YES (${u.driver.totalDeliveries} entregas, rating: ${u.driver.rating || '-'})` : 'NO';
    const seller = u.sellerProfile ? `${u.sellerProfile.displayName || 'sin nombre'} (${u.sellerProfile.totalSales} ventas)` : '-';
    const keep = KEEP_EMAILS.includes(u.email) ? ' ✅ CONSERVAR' : ' ❌ ELIMINAR';
    console.log(`  ${u.email} | ${u.name || '-'} | roles: [${roles}] | merchants: [${merchants}] | driver: ${driver} | seller: ${seller} | pts: ${u.pointsBalance}${keep}`);
  }

  // 2. Usuarios a conservar: verificar que existen
  console.log('\n=== VERIFICACIÓN DE USUARIOS A CONSERVAR ===');
  for (const email of KEEP_EMAILS) {
    const found = users.find(u => u.email === email);
    if (found) {
      console.log(`  ✅ ${email} — encontrado (id: ${found.id})`);
    } else {
      console.log(`  ⚠️  ${email} — NO EXISTE en la DB`);
    }
  }

  // 3. Conteos de tablas transaccionales
  const counts = [
    ['Order', prisma.order.count()],
    ['OrderItem', prisma.orderItem.count()],
    ['SubOrder', prisma.subOrder.count()],
    ['Payment', prisma.payment.count()],
    ['MpWebhookLog', prisma.mpWebhookLog.count()],
    ['AssignmentLog', prisma.assignmentLog.count()],
    ['PendingAssignment', prisma.pendingAssignment.count()],
    ['PointsTransaction', prisma.pointsTransaction.count()],
    ['CartItem', prisma.cartItem.count()],
    ['SavedCart', prisma.savedCart.count()],
    ['SupportChat', prisma.supportChat.count()],
    ['SupportMessage', prisma.supportMessage.count()],
    ['AuditLog', prisma.auditLog.count()],
    ['Referral', prisma.referral.count()],
    ['Favorite', prisma.favorite.count()],
    ['OrderBackup', prisma.orderBackup.count()],
  ];

  const results = await Promise.all(counts.map(async ([name, promise]) => [name, await promise]));

  console.log('\n=== TABLAS TRANSACCIONALES (se borrarán) ===');
  let totalTx = 0;
  for (const [name, count] of results) {
    console.log(`  ${name}: ${count}`);
    totalTx += count;
  }
  console.log(`  TOTAL registros a eliminar: ${totalTx}`);

  // 4. Conteos de catálogo (se conserva)
  const catalogCounts = [
    ['Merchant', prisma.merchant.count()],
    ['Product', prisma.product.count()],
    ['ProductImage', prisma.productImage.count()],
    ['ProductVariant', prisma.productVariant.count()],
    ['Listing', prisma.listing.count()],
    ['ListingImage', prisma.listingImage.count()],
    ['Category', prisma.category.count()],
    ['SellerProfile', prisma.sellerProfile.count()],
    ['Driver', prisma.driver.count()],
  ];

  const catResults = await Promise.all(catalogCounts.map(async ([name, promise]) => [name, await promise]));

  console.log('\n=== CATÁLOGO (de usuarios conservados se mantiene, resto se borra) ===');
  for (const [name, count] of catResults) {
    console.log(`  ${name}: ${count}`);
  }

  // 5. Integridad: OrderItems huérfanos
  const orphanItems = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "OrderItem" oi
    LEFT JOIN "Order" o ON oi."orderId" = o.id
    WHERE o.id IS NULL
  `;
  console.log(`\n=== INTEGRIDAD ===`);
  console.log(`  OrderItems huérfanos (sin Order): ${orphanItems[0].count}`);

  const orphanPayments = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "Payment" p
    LEFT JOIN "Order" o ON p."orderId" = o.id
    WHERE o.id IS NULL
  `;
  console.log(`  Payments huérfanos (sin Order): ${orphanPayments[0].count}`);

  const orphanSubOrders = await prisma.$queryRaw`
    SELECT COUNT(*) as count FROM "SubOrder" so
    LEFT JOIN "Order" o ON so."orderId" = o.id
    WHERE o.id IS NULL
  `;
  console.log(`  SubOrders huérfanos (sin Order): ${orphanSubOrders[0].count}`);

  // 6. Merchants de usuarios que se eliminarán
  const keepIds = users.filter(u => KEEP_EMAILS.includes(u.email)).map(u => u.id);
  const deleteUsers = users.filter(u => !KEEP_EMAILS.includes(u.email));
  const merchantsToDelete = deleteUsers.flatMap(u => u.ownedMerchants);

  if (merchantsToDelete.length > 0) {
    console.log(`\n=== MERCHANTS QUE SE ELIMINARÁN (de usuarios no conservados) ===`);
    for (const m of merchantsToDelete) {
      const productCount = await prisma.product.count({ where: { merchantId: m.id } });
      console.log(`  ${m.name} (${m.slug}) — ${productCount} productos`);
    }
  } else {
    console.log('\n  No hay merchants a eliminar de usuarios no conservados.');
  }

  // 7. Resumen
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log(`║  Usuarios a conservar: ${KEEP_EMAILS.length}`);
  console.log(`║  Usuarios a eliminar:  ${deleteUsers.length}`);
  console.log(`║  Registros tx a borrar: ${totalTx}`);
  console.log(`║  Merchants a eliminar: ${merchantsToDelete.length}`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\nSi todo se ve correcto, ejecutá: node scripts/clean-db.js');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
