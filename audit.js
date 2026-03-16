const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  const users = await prisma.user.findMany({
    include: {
      roles: true,
      ownedMerchants: { select: { id: true, name: true } },
      driver: { select: { id: true } },
      sellerProfile: { select: { id: true, displayName: true } }
    },
    orderBy: { email: 'asc' }
  });

  console.log('=== USUARIOS ===');
  for (const u of users) {
    const roles = u.roles.map(r => r.role).join(', ');
    const merchants = u.ownedMerchants.map(m => m.name).join(', ');
    const hasDriver = u.driver ? 'YES' : 'NO';
    const sellerName = u.sellerProfile ? u.sellerProfile.displayName : '-';
    console.log(`${u.email} | ${u.name || '-'} | roles: [${roles}] | merchants: [${merchants}] | driver: ${hasDriver} | seller: ${sellerName} | pts: ${u.pointsBalance}`);
  }

  const counts = {
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    orderItems: await prisma.orderItem.count(),
    subOrders: await prisma.subOrder.count(),
    payments: await prisma.payment.count(),
    pointsTx: await prisma.pointsTransaction.count(),
    cartItems: await prisma.cartItem.count(),
    savedCarts: await prisma.savedCart.count(),
    supportChats: await prisma.supportChat.count(),
    auditLogs: await prisma.auditLog.count(),
    referrals: await prisma.referral.count(),
    favorites: await prisma.favorite.count(),
    assignmentLogs: await prisma.assignmentLog.count(),
    pendingAssignments: await prisma.pendingAssignment.count(),
    mpWebhookLogs: await prisma.mpWebhookLog.count(),
    orderBackups: await prisma.orderBackup.count(),
    merchants: await prisma.merchant.count(),
    products: await prisma.product.count(),
    listings: await prisma.listing.count(),
    drivers: await prisma.driver.count(),
  };

  console.log('\n=== CONTEOS ===');
  for (const [k, v] of Object.entries(counts)) {
    console.log(`${k}: ${v}`);
  }

  await prisma.$disconnect();
}
audit().catch(e => { console.error(e); process.exit(1); });
