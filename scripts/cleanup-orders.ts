/**
 * Cleanup ALL order-related data from the database.
 * For development/testing only — wipes everything related to orders.
 * Also frees all drivers and clears cart items.
 *
 * Usage: npx tsx scripts/cleanup-orders.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🧹 Limpiando todos los datos de pedidos...\n");

    // Delete in order of dependencies (children first)
    const tables = [
        { name: "DriverLocationHistory", fn: () => prisma.driverLocationHistory.deleteMany() },
        { name: "OrderChatMessage", fn: () => prisma.orderChatMessage.deleteMany() },
        { name: "OrderChat", fn: () => prisma.orderChat.deleteMany() },
        { name: "AssignmentLog", fn: () => prisma.assignmentLog.deleteMany() },
        { name: "PendingAssignment", fn: () => prisma.pendingAssignment.deleteMany() },
        { name: "Payment", fn: () => prisma.payment.deleteMany() },
        { name: "MpWebhookLog", fn: () => prisma.mpWebhookLog.deleteMany() },
        { name: "OrderItem", fn: () => prisma.orderItem.deleteMany() },
        { name: "SubOrder", fn: () => prisma.subOrder.deleteMany() },
        { name: "Order", fn: () => prisma.order.deleteMany() },
        { name: "CartItem", fn: () => prisma.cartItem.deleteMany() },
        { name: "CouponUsage", fn: () => prisma.couponUsage.deleteMany() },
        // Reset points transactions related to orders
        { name: "PointsTransaction", fn: () => prisma.pointsTransaction.deleteMany() },
    ];

    for (const table of tables) {
        try {
            const result = await table.fn();
            console.log(`  ✅ ${table.name}: ${result.count} registros eliminados`);
        } catch (err: any) {
            console.log(`  ⚠️  ${table.name}: ${err.message}`);
        }
    }

    // Free all drivers
    const driversUpdated = await prisma.driver.updateMany({
        data: { availabilityStatus: "DISPONIBLE" },
    });
    console.log(`\n  🏍️  ${driversUpdated.count} driver(s) liberados (DISPONIBLE)`);

    // Reset user points balance to 0 (since we deleted all PointsTransactions)
    // Only reset if you want clean slate — comment out if you want to keep balances
    const usersReset = await prisma.user.updateMany({
        data: { pointsBalance: 100 }, // Reset to signup bonus
    });
    console.log(`  👤 ${usersReset.count} usuario(s) reseteados a 100 puntos (bonus inicial)`);

    console.log("\n✨ Base de datos limpia. Podés hacer pedidos de prueba desde cero.\n");
}

main()
    .catch((e) => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
