import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkActiveOrders() {
    try {
        const driverId = 'cmkvbvo7n0022r0gkuu9g9uab';
        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { driverId: driverId },
                    { pendingDriverId: driverId }
                ],
                NOT: {
                    status: { in: ['COMPLETED', 'CANCELLED', 'DELIVERED'] }
                }
            }
        });

        console.log(`Found ${orders.length} active/pending orders for driver:`);
        orders.forEach(o => {
            console.log(`- Order ${o.orderNumber}, Status: ${o.status}, DriverID: ${o.driverId}, PendingDriverID: ${o.pendingDriverId}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkActiveOrders();
