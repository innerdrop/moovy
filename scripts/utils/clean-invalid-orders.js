const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanInvalidOrders() {
    try {
        const deleted = await prisma.order.deleteMany({
            where: { merchantId: null }
        });
        console.log(`Deleted ${deleted.count} invalid orders.`);
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

cleanInvalidOrders();
