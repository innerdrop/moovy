import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { email: 'cliente1@somosmoovy.com' }
    });

    if (user) {
        // Delete orders first as they reference addresses
        const deletedOrders = await prisma.order.deleteMany({
            where: { userId: user.id }
        });
        console.log(`Deleted ${deletedOrders.count} orders for cliente1@somosmoovy.com`);

        const deleted = await prisma.address.deleteMany({
            where: { userId: user.id }
        });
        console.log(`Deleted ${deleted.count} addresses for cliente1@somosmoovy.com`);
    } else {
        console.log('User cliente1@somosmoovy.com not found');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
