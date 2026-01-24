const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugOrders() {
    try {
        console.log("--- MERCHANTS ---");
        const merchants = await prisma.merchant.findMany({
            select: { id: true, name: true, ownerId: true }
        });
        console.log(JSON.stringify(merchants, null, 2));

        console.log("\n--- RECENT ORDERS ---");
        const orders = await prisma.order.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { id: true, status: true, merchantId: true, total: true, createdAt: true }
        });
        console.log(JSON.stringify(orders, null, 2));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

debugOrders();
