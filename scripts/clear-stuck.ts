import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
    // Clear the stuck pending assignment so timeout processor can re-assign
    const stuckOrders = await p.order.findMany({
        where: {
            pendingDriverId: { not: null },
            driverId: null,
            status: { in: ["PREPARING", "READY"] }
        },
        select: { id: true, orderNumber: true, pendingDriverId: true, assignmentExpiresAt: true }
    });

    console.log("=== STUCK ORDERS ===");
    for (const order of stuckOrders) {
        const expired = order.assignmentExpiresAt && new Date() > order.assignmentExpiresAt;
        console.log(`${order.orderNumber}: pendingDriver=${order.pendingDriverId}, expires=${order.assignmentExpiresAt?.toISOString()}, expired=${expired}`);

        if (expired) {
            // Clear the expired pending assignment
            await p.order.update({
                where: { id: order.id },
                data: {
                    pendingDriverId: null,
                    assignmentExpiresAt: null,
                }
            });
            console.log(`  → Cleared expired pending assignment for ${order.orderNumber}`);
        }
    }

    await p.$disconnect();
}

main().catch(console.error);
