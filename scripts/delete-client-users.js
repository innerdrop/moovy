// Script to delete all CLIENT users (role = 'USER')
// Does NOT delete ADMIN, DRIVER, or MERCHANT users

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteClientUsers() {
    console.log('🔍 Buscando usuarios con rol CLIENT (USER)...\n');

    // First, find all client users
    const clientUsers = await prisma.user.findMany({
        where: {
            role: 'USER'
        },
        select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true,
            createdAt: true
        }
    });

    console.log(`📊 Encontrados ${clientUsers.length} usuarios cliente:\n`);

    clientUsers.forEach((user, index) => {
        const displayName = user.firstName
            ? `${user.firstName} ${user.lastName || ''}`.trim()
            : user.name || 'Sin nombre';
        console.log(`  ${index + 1}. ${displayName} (${user.email})`);
    });

    if (clientUsers.length === 0) {
        console.log('\n✅ No hay usuarios cliente para eliminar.');
        return;
    }

    console.log('\n🗑️  Eliminando usuarios cliente y sus datos relacionados...\n');

    // Delete related data in order (respecting foreign key constraints)
    const userIds = clientUsers.map(u => u.id);

    // Delete cart items
    const deletedCarts = await prisma.cartItem.deleteMany({
        where: { userId: { in: userIds } }
    });
    console.log(`  - CartItems eliminados: ${deletedCarts.count}`);

    // Delete points transactions
    const deletedPoints = await prisma.pointsTransaction.deleteMany({
        where: { userId: { in: userIds } }
    });
    console.log(`  - PointsTransactions eliminados: ${deletedPoints.count}`);

    // Delete referrals (both as referrer and referee)
    const deletedReferrals1 = await prisma.referral.deleteMany({
        where: { referrerId: { in: userIds } }
    });
    const deletedReferrals2 = await prisma.referral.deleteMany({
        where: { refereeId: { in: userIds } }
    });
    console.log(`  - Referrals eliminados: ${deletedReferrals1.count + deletedReferrals2.count}`);

    // Delete orders (orders of client users)
    const deletedOrders = await prisma.order.deleteMany({
        where: { userId: { in: userIds } }
    });
    console.log(`  - Orders eliminados: ${deletedOrders.count}`);

    // Delete addresses
    const deletedAddresses = await prisma.address.deleteMany({
        where: { userId: { in: userIds } }
    });
    console.log(`  - Addresses eliminados: ${deletedAddresses.count}`);

    // Clear referredBy references to avoid foreign key issues
    await prisma.user.updateMany({
        where: { referredById: { in: userIds } },
        data: { referredById: null }
    });

    // Finally, delete the users
    const deletedUsers = await prisma.user.deleteMany({
        where: { id: { in: userIds } }
    });
    console.log(`  - Users eliminados: ${deletedUsers.count}`);

    console.log('\n✅ Todos los usuarios cliente han sido eliminados exitosamente.');
    console.log('   Los comercios, conductores y admins se mantienen intactos.');
}

deleteClientUsers()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
