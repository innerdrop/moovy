/**
 * MOOVY -- Limpieza quirurgica de pedidos viejos (data legacy pre-rama actual)
 *
 * Rama: fix/state-machine-paralela-merchant-driver
 *
 * PROPOSITO:
 * Borra TODOS los Orders existentes (de prueba) + sus dependencias para que
 * la nueva state machine paralela (merchantStatus + driverStatus + PIN 4 digitos)
 * arranque desde cero sin data inconsistente.
 *
 * BORRA:
 *   - Order (pedidos)
 *   - SubOrder (sub-pedidos multi-vendor)
 *   - OrderItem (items de pedidos)
 *   - Payment (pagos)
 *   - OrderBackup (snapshots)
 *   - OrderChat + chats de soporte de pedidos
 *   - AssignmentLog (logs de asignacion)
 *   - PendingAssignment (asignaciones pendientes)
 *   - DriverLocationHistory (GPS tracks de pedidos)
 *   - DeliveryAttempt (intentos de delivery)
 *   - MpWebhookLog (webhooks MP de pedidos)
 *   - PointsTransaction (puntos earned/redeemed por pedidos)
 *   - DriverAvailabilitySubscription (avisos para no-disponibles)
 *
 * PRESERVA (NO TOCA):
 *   - User, Merchant, Driver, SellerProfile (cuentas)
 *   - DeliveryZone (zonas dibujadas a mano!)
 *   - Product, Listing, ProductImage, ListingImage
 *   - Address (las direcciones del buyer)
 *   - Category, MerchantCategory
 *   - StoreSettings, PointsConfig, MoovyConfig, MerchantLoyaltyConfig
 *   - DeliveryRate, PackageCategory, PackagePricingTier
 *   - Coupons, Favorites, Ratings (no son por order)
 *   - PushSub (suscripciones push)
 *   - AuditLog (audit historico se preserva)
 *
 * USO:
 *   npx tsx scripts/clean-old-orders.ts                    (dry-run, solo cuenta)
 *   npx tsx scripts/clean-old-orders.ts --execute          (borra real, requiere confirmacion)
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const EXECUTE = process.argv.includes("--execute");
const prisma = new PrismaClient();

async function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function countOrDelete(table: string, op: () => Promise<{ count: number }>) {
    const result = await op();
    console.log(`   ${table.padEnd(35)} ${String(result.count).padStart(6)} ${EXECUTE ? "borrados" : "(dry-run)"}`);
    return result.count;
}

async function main() {
    console.log("");
    console.log("===================================================================");
    console.log("  MOOVY -- Limpieza de pedidos viejos (preserva todo lo demas)");
    console.log("===================================================================");
    console.log("");
    console.log(`  Modo: ${EXECUTE ? "EJECUTAR (borrado real)" : "DRY RUN (solo conteo)"}`);
    console.log(`  DB:   ${process.env.DATABASE_URL?.replace(/:\/\/[^@]+@/, "://***@") || "(no DATABASE_URL)"}`);
    console.log("");

    if (!process.env.DATABASE_URL) {
        console.error("ERROR: DATABASE_URL no esta seteado. Abortando por seguridad.");
        process.exit(1);
    }

    // === Snapshot pre-cleanup (para reportar) ===
    const orderCount = await prisma.order.count();
    const subOrderCount = await prisma.subOrder.count();
    const userCount = await prisma.user.count();
    const merchantCount = await prisma.merchant.count();
    const driverCount = await prisma.driver.count();
    const zoneCount = await prisma.deliveryZone.count();
    const productCount = await prisma.product.count();

    console.log("  Estado actual de la DB:");
    console.log(`    Orders:        ${orderCount}`);
    console.log(`    SubOrders:     ${subOrderCount}`);
    console.log(`    Users:         ${userCount}      (NO se tocan)`);
    console.log(`    Merchants:     ${merchantCount}      (NO se tocan)`);
    console.log(`    Drivers:       ${driverCount}      (NO se tocan)`);
    console.log(`    DeliveryZones: ${zoneCount}      (NO se tocan)`);
    console.log(`    Products:      ${productCount}      (NO se tocan)`);
    console.log("");

    if (orderCount === 0) {
        console.log("  No hay pedidos para borrar. Saliendo.");
        await prisma.$disconnect();
        return;
    }

    if (EXECUTE) {
        console.log(`  AVISO: vas a borrar ${orderCount} pedido(s) y todas sus dependencias.`);
        console.log(`         Las zonas de delivery, comercios, drivers y productos NO se tocan.`);
        console.log("");
        const ans = await prompt("  Escribi 'SI BORRAR' para confirmar: ");
        if (ans.trim() !== "SI BORRAR") {
            console.log("  Cancelado por el usuario.");
            await prisma.$disconnect();
            return;
        }
        console.log("");
    }

    console.log("  --- Borrando dependencias en orden ---");
    console.log("");

    // === Orden de borrado (de hijos a padres por foreign keys) ===

    // OrderChatMessage (mensajes de chats de pedido). Cascade on delete OrderChat
    // los borraria solos, pero los borramos explicitamente para reportar el conteo.
    await countOrDelete("OrderChatMessage", async () => {
        if (!EXECUTE) return { count: await prisma.orderChatMessage.count() };
        return await prisma.orderChatMessage.deleteMany({});
    });

    // OrderChat (chats de pedido)
    await countOrDelete("OrderChat", async () => {
        if (!EXECUTE) return { count: await prisma.orderChat.count() };
        return await prisma.orderChat.deleteMany({});
    });

    // DriverLocationHistory (GPS de pedidos)
    await countOrDelete("DriverLocationHistory", async () => {
        if (!EXECUTE) return { count: await prisma.driverLocationHistory.count() };
        return await prisma.driverLocationHistory.deleteMany({});
    });

    // DeliveryAttempt
    await countOrDelete("DeliveryAttempt", async () => {
        if (!EXECUTE) return { count: await prisma.deliveryAttempt.count() };
        return await prisma.deliveryAttempt.deleteMany({});
    });

    // AssignmentLog
    await countOrDelete("AssignmentLog", async () => {
        if (!EXECUTE) return { count: await prisma.assignmentLog.count() };
        return await prisma.assignmentLog.deleteMany({});
    });

    // PendingAssignment
    await countOrDelete("PendingAssignment", async () => {
        if (!EXECUTE) return { count: await prisma.pendingAssignment.count() };
        return await prisma.pendingAssignment.deleteMany({});
    });

    // Payment
    await countOrDelete("Payment", async () => {
        if (!EXECUTE) return { count: await prisma.payment.count() };
        return await prisma.payment.deleteMany({});
    });

    // OrderBackup
    await countOrDelete("OrderBackup", async () => {
        if (!EXECUTE) return { count: await prisma.orderBackup.count() };
        return await prisma.orderBackup.deleteMany({});
    });

    // PointsTransaction (relacionadas a pedidos)
    await countOrDelete("PointsTransaction (orderId)", async () => {
        if (!EXECUTE) {
            const c = await prisma.pointsTransaction.count({ where: { orderId: { not: null } } });
            return { count: c };
        }
        return await prisma.pointsTransaction.deleteMany({ where: { orderId: { not: null } } });
    });

    // OrderItem
    await countOrDelete("OrderItem", async () => {
        if (!EXECUTE) return { count: await prisma.orderItem.count() };
        return await prisma.orderItem.deleteMany({});
    });

    // SubOrder
    await countOrDelete("SubOrder", async () => {
        if (!EXECUTE) return { count: await prisma.subOrder.count() };
        return await prisma.subOrder.deleteMany({});
    });

    // MpWebhookLog (relacionados a Order)
    await countOrDelete("MpWebhookLog", async () => {
        if (!EXECUTE) return { count: await prisma.mpWebhookLog.count() };
        return await prisma.mpWebhookLog.deleteMany({});
    });

    // DriverAvailabilitySubscription
    await countOrDelete("DriverAvailabilitySubscription", async () => {
        if (!EXECUTE) return { count: await prisma.driverAvailabilitySubscription.count() };
        return await prisma.driverAvailabilitySubscription.deleteMany({});
    });

    // Order (al final, ya sin dependencias)
    await countOrDelete("Order", async () => {
        if (!EXECUTE) return { count: await prisma.order.count() };
        return await prisma.order.deleteMany({});
    });

    console.log("");
    console.log("  --- Validacion post-cleanup ---");
    const finalOrderCount = await prisma.order.count();
    const finalSubOrderCount = await prisma.subOrder.count();
    const finalUserCount = await prisma.user.count();
    const finalMerchantCount = await prisma.merchant.count();
    const finalDriverCount = await prisma.driver.count();
    const finalZoneCount = await prisma.deliveryZone.count();
    const finalProductCount = await prisma.product.count();

    console.log(`    Orders:        ${finalOrderCount}      (esperado: ${EXECUTE ? 0 : orderCount})`);
    console.log(`    SubOrders:     ${finalSubOrderCount}      (esperado: ${EXECUTE ? 0 : subOrderCount})`);
    console.log(`    Users:         ${finalUserCount}      (intacto: ${userCount === finalUserCount ? "OK" : "WARN"})`);
    console.log(`    Merchants:     ${finalMerchantCount}      (intacto: ${merchantCount === finalMerchantCount ? "OK" : "WARN"})`);
    console.log(`    Drivers:       ${finalDriverCount}      (intacto: ${driverCount === finalDriverCount ? "OK" : "WARN"})`);
    console.log(`    DeliveryZones: ${finalZoneCount}      (intacto: ${zoneCount === finalZoneCount ? "OK" : "WARN"})`);
    console.log(`    Products:      ${finalProductCount}      (intacto: ${productCount === finalProductCount ? "OK" : "WARN"})`);
    console.log("");

    if (EXECUTE) {
        console.log("  [OK] Limpieza completada. Las zonas dibujadas, comercios y drivers siguen intactos.");
    } else {
        console.log("  [DRY RUN] No se borro nada. Para borrar real, corre con --execute");
    }
    console.log("");

    await prisma.$disconnect();
}

main().catch((err) => {
    console.error("ERROR:", err);
    prisma.$disconnect();
    process.exit(1);
});
