import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function testDashboardQuery() {
    try {
        // This simulates the query at line 75 of src/app/api/driver/dashboard/route.ts
        const activeOrders = await prisma.order.findMany({
            where: {
                driverId: { not: null }, // Just any driver for testing
                status: {
                    in: ["DRIVER_ASSIGNED", "DRIVER_ARRIVED", "PICKED_UP", "ON_THE_WAY"]
                }
            },
            include: {
                merchant: { select: { name: true, address: true, latitude: true, longitude: true } },
                address: { select: { street: true, number: true, city: true, latitude: true, longitude: true } }
            },
            orderBy: { updatedAt: "desc" },
            take: 1
        });
        console.log('Query successful! Found active orders:', activeOrders.length);
    } catch (error) {
        console.error('Query failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDashboardQuery();
