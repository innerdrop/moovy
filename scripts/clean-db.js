/**
 * clean-db.js
 * Limpieza total de operaciones + usuarios no conservados.
 * Conserva: catálogo de merchants/productos de los 4 usuarios, categorías, config.
 *
 * Ejecutar PRIMERO: node scripts/audit-before-clean.js
 * Luego:            node scripts/clean-db.js
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
  console.log('║   MOOVY — Limpieza de DB para producción     ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // Verificar usuarios a conservar
  const keepUsers = await prisma.user.findMany({
    where: { email: { in: KEEP_EMAILS } },
    select: { id: true, email: true },
  });

  console.log(`Usuarios a conservar encontrados: ${keepUsers.length}/${KEEP_EMAILS.length}`);
  for (const u of keepUsers) {
    console.log(`  ✅ ${u.email} (${u.id})`);
  }

  const missingEmails = KEEP_EMAILS.filter(e => !keepUsers.find(u => u.email === e));
  if (missingEmails.length > 0) {
    console.log('\n⚠️  Emails no encontrados en la DB:');
    for (const e of missingEmails) console.log(`  ❌ ${e}`);
    console.log('\nAbortando. Verificá los emails y volvé a ejecutar.');
    return;
  }

  const keepUserIds = keepUsers.map(u => u.id);

  // IDs de merchants a conservar (los que pertenecen a usuarios conservados)
  const keepMerchants = await prisma.merchant.findMany({
    where: { ownerId: { in: keepUserIds } },
    select: { id: true, name: true },
  });
  const keepMerchantIds = keepMerchants.map(m => m.id);
  console.log(`\nMerchants a conservar: ${keepMerchants.length}`);
  for (const m of keepMerchants) console.log(`  📦 ${m.name}`);

  // IDs de sellers a conservar
  const keepSellers = await prisma.sellerProfile.findMany({
    where: { userId: { in: keepUserIds } },
    select: { id: true, displayName: true },
  });
  const keepSellerIds = keepSellers.map(s => s.id);
  console.log(`\nSellers a conservar: ${keepSellers.length}`);

  // === FASE 1: Borrar TODAS las tablas transaccionales ===
  console.log('\n--- FASE 1: Borrando datos transaccionales ---');

  // 1. PendingAssignment
  let r = await prisma.pendingAssignment.deleteMany({});
  console.log(`  PendingAssignment: ${r.count} eliminados`);

  // 2. AssignmentLog
  r = await prisma.assignmentLog.deleteMany({});
  console.log(`  AssignmentLog: ${r.count} eliminados`);

  // 3. Payment
  r = await prisma.payment.deleteMany({});
  console.log(`  Payment: ${r.count} eliminados`);

  // 4. MpWebhookLog
  r = await prisma.mpWebhookLog.deleteMany({});
  console.log(`  MpWebhookLog: ${r.count} eliminados`);

  // 5. OrderItem (todos, incluyendo los vinculados a SubOrders)
  r = await prisma.orderItem.deleteMany({});
  console.log(`  OrderItem: ${r.count} eliminados`);

  // 6. SubOrder
  r = await prisma.subOrder.deleteMany({});
  console.log(`  SubOrder: ${r.count} eliminados`);

  // 7. Order
  r = await prisma.order.deleteMany({});
  console.log(`  Order: ${r.count} eliminados`);

  // 8. OrderBackup
  r = await prisma.orderBackup.deleteMany({});
  console.log(`  OrderBackup: ${r.count} eliminados`);

  // 9. PointsTransaction
  r = await prisma.pointsTransaction.deleteMany({});
  console.log(`  PointsTransaction: ${r.count} eliminados`);

  // 10. CartItem (todos)
  r = await prisma.cartItem.deleteMany({});
  console.log(`  CartItem: ${r.count} eliminados`);

  // 11. SavedCart
  r = await prisma.savedCart.deleteMany({});
  console.log(`  SavedCart: ${r.count} eliminados`);

  // 12. SupportMessage (antes de SupportChat por FK)
  r = await prisma.supportMessage.deleteMany({});
  console.log(`  SupportMessage: ${r.count} eliminados`);

  // 13. SupportChat
  r = await prisma.supportChat.deleteMany({});
  console.log(`  SupportChat: ${r.count} eliminados`);

  // 14. AuditLog
  r = await prisma.auditLog.deleteMany({});
  console.log(`  AuditLog: ${r.count} eliminados`);

  // 15. Referral
  r = await prisma.referral.deleteMany({});
  console.log(`  Referral: ${r.count} eliminados`);

  // 16. Favorite (todos)
  r = await prisma.favorite.deleteMany({});
  console.log(`  Favorite: ${r.count} eliminados`);

  // === FASE 2: Borrar entidades de usuarios NO conservados ===
  console.log('\n--- FASE 2: Borrando usuarios no conservados y sus entidades ---');

  // 2.1 PushSubscription de usuarios a eliminar
  r = await prisma.pushSubscription.deleteMany({ where: { userId: { notIn: keepUserIds } } });
  console.log(`  PushSubscription (no-keep): ${r.count} eliminados`);

  // 2.2 Address de usuarios a eliminar
  r = await prisma.address.deleteMany({ where: { userId: { notIn: keepUserIds } } });
  console.log(`  Address (no-keep): ${r.count} eliminados`);

  // 2.3 SellerAvailability de usuarios a eliminar
  r = await prisma.sellerAvailability.deleteMany({ where: { sellerId: { notIn: keepUserIds } } });
  console.log(`  SellerAvailability (no-keep): ${r.count} eliminados`);

  // 2.4 Listings e imágenes de sellers a eliminar
  const sellersToDelete = await prisma.sellerProfile.findMany({
    where: { userId: { notIn: keepUserIds } },
    select: { id: true },
  });
  const sellerIdsToDelete = sellersToDelete.map(s => s.id);

  if (sellerIdsToDelete.length > 0) {
    // ListingImage de esos listings
    const listingsToDelete = await prisma.listing.findMany({
      where: { sellerId: { in: sellerIdsToDelete } },
      select: { id: true },
    });
    const listingIdsToDelete = listingsToDelete.map(l => l.id);

    if (listingIdsToDelete.length > 0) {
      r = await prisma.listingImage.deleteMany({ where: { listingId: { in: listingIdsToDelete } } });
      console.log(`  ListingImage (no-keep sellers): ${r.count} eliminados`);

      r = await prisma.listing.deleteMany({ where: { id: { in: listingIdsToDelete } } });
      console.log(`  Listing (no-keep sellers): ${r.count} eliminados`);
    }

    // SellerProfile
    r = await prisma.sellerProfile.deleteMany({ where: { id: { in: sellerIdsToDelete } } });
    console.log(`  SellerProfile (no-keep): ${r.count} eliminados`);
  }

  // 2.5 Driver de usuarios a eliminar
  r = await prisma.driver.deleteMany({ where: { userId: { notIn: keepUserIds } } });
  console.log(`  Driver (no-keep): ${r.count} eliminados`);

  // 2.6 Merchants a eliminar (y sus productos, imágenes, variantes, categorías)
  const merchantsToDelete = await prisma.merchant.findMany({
    where: { ownerId: { notIn: keepUserIds } },
    select: { id: true, name: true },
  });
  const merchantIdsToDelete = merchantsToDelete.map(m => m.id);

  if (merchantIdsToDelete.length > 0) {
    // Productos de esos merchants
    const productsToDelete = await prisma.product.findMany({
      where: { merchantId: { in: merchantIdsToDelete } },
      select: { id: true },
    });
    const productIdsToDelete = productsToDelete.map(p => p.id);

    if (productIdsToDelete.length > 0) {
      r = await prisma.productImage.deleteMany({ where: { productId: { in: productIdsToDelete } } });
      console.log(`  ProductImage (no-keep merchants): ${r.count} eliminados`);

      r = await prisma.productVariant.deleteMany({ where: { productId: { in: productIdsToDelete } } });
      console.log(`  ProductVariant (no-keep merchants): ${r.count} eliminados`);

      r = await prisma.productCategory.deleteMany({ where: { productId: { in: productIdsToDelete } } });
      console.log(`  ProductCategory (no-keep merchants): ${r.count} eliminados`);

      r = await prisma.merchantAcquiredProduct.deleteMany({ where: { merchantId: { in: merchantIdsToDelete } } });
      console.log(`  MerchantAcquiredProduct (no-keep): ${r.count} eliminados`);

      r = await prisma.product.deleteMany({ where: { id: { in: productIdsToDelete } } });
      console.log(`  Product (no-keep merchants): ${r.count} eliminados`);
    }

    r = await prisma.merchantCategory.deleteMany({ where: { merchantId: { in: merchantIdsToDelete } } });
    console.log(`  MerchantCategory (no-keep): ${r.count} eliminados`);

    r = await prisma.merchant.deleteMany({ where: { id: { in: merchantIdsToDelete } } });
    console.log(`  Merchant (no-keep): ${r.count} eliminados`);
  }

  // 2.7 UserRole de usuarios a eliminar
  r = await prisma.userRole.deleteMany({ where: { userId: { notIn: keepUserIds } } });
  console.log(`  UserRole (no-keep): ${r.count} eliminados`);

  // 2.8 Eliminar los usuarios
  r = await prisma.user.deleteMany({ where: { id: { notIn: keepUserIds } } });
  console.log(`  User (no-keep): ${r.count} eliminados`);

  // === FASE 3: Resetear contadores de usuarios conservados ===
  console.log('\n--- FASE 3: Reseteando contadores ---');

  // Users
  r = await prisma.user.updateMany({
    where: { id: { in: keepUserIds } },
    data: {
      pointsBalance: 0,
      pendingBonusPoints: 0,
      bonusActivated: false,
      referredById: null,
    },
  });
  console.log(`  User contadores reseteados: ${r.count}`);

  // Drivers de usuarios conservados
  r = await prisma.driver.updateMany({
    where: { userId: { in: keepUserIds } },
    data: {
      totalDeliveries: 0,
      rating: null,
      isOnline: false,
      availabilityStatus: 'FUERA_DE_SERVICIO',
      latitude: null,
      longitude: null,
      lastLocationAt: null,
    },
  });
  console.log(`  Driver contadores reseteados: ${r.count}`);

  // SellerProfiles de usuarios conservados
  r = await prisma.sellerProfile.updateMany({
    where: { userId: { in: keepUserIds } },
    data: {
      totalSales: 0,
      rating: null,
    },
  });
  console.log(`  SellerProfile contadores reseteados: ${r.count}`);

  // Merchants de usuarios conservados
  r = await prisma.merchant.updateMany({
    where: { ownerId: { in: keepUserIds } },
    data: {
      rating: null,
    },
  });
  console.log(`  Merchant rating reseteado: ${r.count}`);

  // === FASE 4: Verificación ===
  console.log('\n--- FASE 4: Verificación post-limpieza ---');

  const verification = {
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    subOrders: await prisma.subOrder.count(),
    payments: await prisma.payment.count(),
    pointsTx: await prisma.pointsTransaction.count(),
    cartItems: await prisma.cartItem.count(),
    supportChats: await prisma.supportChat.count(),
    auditLogs: await prisma.auditLog.count(),
    referrals: await prisma.referral.count(),
    favorites: await prisma.favorite.count(),
    merchants: await prisma.merchant.count(),
    products: await prisma.product.count(),
    listings: await prisma.listing.count(),
    drivers: await prisma.driver.count(),
    sellers: await prisma.sellerProfile.count(),
    categories: await prisma.category.count(),
  };

  console.log('  Conteos finales:');
  for (const [k, v] of Object.entries(verification)) {
    const expected = ['orders', 'orderItems', 'subOrders', 'payments', 'pointsTx', 'cartItems', 'supportChats', 'auditLogs', 'referrals', 'favorites'].includes(k);
    const icon = expected ? (v === 0 ? '✅' : '⚠️') : '📊';
    console.log(`    ${icon} ${k}: ${v}`);
  }

  // Listar usuarios restantes
  const remainingUsers = await prisma.user.findMany({
    include: { roles: true, ownedMerchants: { select: { name: true } } },
    orderBy: { email: 'asc' },
  });

  console.log('\n  Usuarios restantes:');
  for (const u of remainingUsers) {
    const roles = u.roles.map(r => r.role).join(', ');
    const merchants = u.ownedMerchants.map(m => m.name).join(', ') || '-';
    console.log(`    ${u.email} | roles: [${roles}] | merchants: [${merchants}]`);
  }

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║  ✅ Limpieza completada exitosamente         ║');
  console.log('║  La DB está lista para pruebas reales.       ║');
  console.log('╚══════════════════════════════════════════════╝');
}

main()
  .catch(e => { console.error('❌ Error durante la limpieza:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
