/**
 * Cleanup Script: Delete buyer users and all their data
 *
 * KEEPS: Admin users, Merchant owners, their products
 * DELETES: All other users (buyers, sellers, drivers) and their associated data
 *
 * Run: npx tsx scripts/cleanup-buyers.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("\n🧹 MOOVY — Limpieza de usuarios compradores\n");
    console.log("=".repeat(50));

    // Step 1: Identify users to KEEP
    // - Admin users (role = "ADMIN" or UserRole with role ADMIN)
    // - Merchant owners (ownerId in Merchant table)
    const adminRoles = await prisma.userRole.findMany({
        where: { role: "ADMIN" },
        select: { userId: true },
    });
    const adminUserIds = adminRoles.map(r => r.userId);

    const adminByLegacy = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
    });
    adminUserIds.push(...adminByLegacy.map(u => u.id));

    const merchants = await prisma.merchant.findMany({
        select: { ownerId: true, name: true },
    });
    const merchantOwnerIds = merchants.map(m => m.ownerId);

    const keepUserIds = [...new Set([...adminUserIds, ...merchantOwnerIds])];

    console.log(`\n✅ Usuarios a MANTENER: ${keepUserIds.length}`);

    // Show who we're keeping
    const keepUsers = await prisma.user.findMany({
        where: { id: { in: keepUserIds } },
        select: { id: true, email: true, name: true, role: true },
    });
    keepUsers.forEach(u => {
        console.log(`   - ${u.email} (${u.name || "sin nombre"}) [${u.role}]`);
    });

    // Step 2: Identify users to DELETE
    const usersToDelete = await prisma.user.findMany({
        where: { id: { notIn: keepUserIds } },
        select: { id: true, email: true, name: true, role: true },
    });

    console.log(`\n🗑️  Usuarios a ELIMINAR: ${usersToDelete.length}`);
    usersToDelete.forEach(u => {
        console.log(`   - ${u.email} (${u.name || "sin nombre"}) [${u.role}]`);
    });

    if (usersToDelete.length === 0) {
        console.log("\n✨ No hay usuarios para eliminar. Base de datos limpia.\n");
        return;
    }

    const deleteUserIds = usersToDelete.map(u => u.id);

    console.log("\n⏳ Eliminando datos asociados...\n");

    // Step 3: Delete in order (respect foreign keys)

    // 3a. OrderChat messages and chats (references Order + User)
    const orderChats = await prisma.orderChat.findMany({
        where: { OR: [{ participantAId: { in: deleteUserIds } }, { participantBId: { in: deleteUserIds } }] },
        select: { id: true },
    });
    if (orderChats.length > 0) {
        const chatIds = orderChats.map(c => c.id);
        const delMsgs = await prisma.orderChatMessage.deleteMany({ where: { chatId: { in: chatIds } } });
        console.log(`   OrderChatMessages: ${delMsgs.count}`);
        const delChats = await prisma.orderChat.deleteMany({ where: { id: { in: chatIds } } });
        console.log(`   OrderChats: ${delChats.count}`);
    }

    // 3b. Orders and related data
    const userOrders = await prisma.order.findMany({
        where: { userId: { in: deleteUserIds } },
        select: { id: true },
    });
    if (userOrders.length > 0) {
        const orderIds = userOrders.map(o => o.id);

        // Delete DriverLocationHistory
        const delLocHist = await prisma.driverLocationHistory.deleteMany({ where: { orderId: { in: orderIds } } });
        console.log(`   DriverLocationHistory: ${delLocHist.count}`);

        // Delete AssignmentLogs
        const delAssignLogs = await prisma.assignmentLog.deleteMany({ where: { orderId: { in: orderIds } } });
        console.log(`   AssignmentLogs: ${delAssignLogs.count}`);

        // Delete PendingAssignments
        const delPending = await prisma.pendingAssignment.deleteMany({ where: { orderId: { in: orderIds } } });
        console.log(`   PendingAssignments: ${delPending.count}`);

        // Delete Payments
        const delPayments = await prisma.payment.deleteMany({ where: { orderId: { in: orderIds } } });
        console.log(`   Payments: ${delPayments.count}`);

        // Delete SubOrders (first delete their OrderItems)
        const subOrders = await prisma.subOrder.findMany({
            where: { orderId: { in: orderIds } },
            select: { id: true },
        });
        if (subOrders.length > 0) {
            const subOrderIds = subOrders.map(s => s.id);
            await prisma.orderItem.deleteMany({ where: { subOrderId: { in: subOrderIds } } });
        }
        const delSubOrders = await prisma.subOrder.deleteMany({ where: { orderId: { in: orderIds } } });
        console.log(`   SubOrders: ${delSubOrders.count}`);

        // Delete OrderItems (those directly on order, not sub-order)
        const delItems = await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } });
        console.log(`   OrderItems: ${delItems.count}`);

        // Delete Orders
        const delOrders = await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
        console.log(`   Orders: ${delOrders.count}`);
    }

    // 3c. Support chats and messages
    const supportChats = await prisma.supportChat.findMany({
        where: { userId: { in: deleteUserIds } },
        select: { id: true },
    });
    if (supportChats.length > 0) {
        const chatIds = supportChats.map(c => c.id);
        const delSupportMsgs = await prisma.supportMessage.deleteMany({ where: { chatId: { in: chatIds } } });
        console.log(`   SupportMessages: ${delSupportMsgs.count}`);
        const delSupportChats = await prisma.supportChat.deleteMany({ where: { id: { in: chatIds } } });
        console.log(`   SupportChats: ${delSupportChats.count}`);
    }

    // 3d. Driver records (has its own relations)
    const drivers = await prisma.driver.findMany({
        where: { userId: { in: deleteUserIds } },
        select: { id: true },
    });
    if (drivers.length > 0) {
        const driverIds = drivers.map(d => d.id);
        // DriverLocationHistory not linked to these orders might exist
        await prisma.driverLocationHistory.deleteMany({ where: { driverId: { in: driverIds } } });
        const delDrivers = await prisma.driver.deleteMany({ where: { id: { in: driverIds } } });
        console.log(`   Drivers: ${delDrivers.count}`);
    }

    // 3e. SellerProfile and SellerAvailability
    const delSellerAvail = await prisma.sellerAvailability.deleteMany({ where: { sellerId: { in: deleteUserIds } } });
    console.log(`   SellerAvailability: ${delSellerAvail.count}`);

    const sellerProfiles = await prisma.sellerProfile.findMany({
        where: { userId: { in: deleteUserIds } },
        select: { id: true },
    });
    if (sellerProfiles.length > 0) {
        const sellerIds = sellerProfiles.map(s => s.id);
        // Delete listings owned by these sellers
        const sellerListings = await prisma.listing.findMany({
            where: { sellerId: { in: sellerIds } },
            select: { id: true },
        });
        if (sellerListings.length > 0) {
            const listingIds = sellerListings.map(l => l.id);
            await prisma.listingImage.deleteMany({ where: { listingId: { in: listingIds } } });
            await prisma.bid.deleteMany({ where: { listingId: { in: listingIds } } });
            await prisma.favorite.deleteMany({ where: { listingId: { in: listingIds } } });
            await prisma.listing.deleteMany({ where: { id: { in: listingIds } } });
        }
        const delSellers = await prisma.sellerProfile.deleteMany({ where: { id: { in: sellerIds } } });
        console.log(`   SellerProfiles: ${delSellers.count}`);
    }

    // 3f. Referrals
    const delReferrals = await prisma.referral.deleteMany({
        where: { OR: [{ referrerId: { in: deleteUserIds } }, { refereeId: { in: deleteUserIds } }] },
    });
    console.log(`   Referrals: ${delReferrals.count}`);

    // 3g. CouponUsages
    const delCoupons = await prisma.couponUsage.deleteMany({ where: { userId: { in: deleteUserIds } } });
    console.log(`   CouponUsages: ${delCoupons.count}`);

    // 3h. Bids
    const delBids = await prisma.bid.deleteMany({ where: { userId: { in: deleteUserIds } } });
    console.log(`   Bids: ${delBids.count}`);

    // 3i. AuditLogs by these users
    const delAudit = await prisma.auditLog.deleteMany({ where: { userId: { in: deleteUserIds } } });
    console.log(`   AuditLogs: ${delAudit.count}`);

    // 3j. SupportMessages sent by these users (in other chats)
    const delSentMsgs = await prisma.supportMessage.deleteMany({ where: { senderId: { in: deleteUserIds } } });
    console.log(`   SupportMessages (sent): ${delSentMsgs.count}`);

    // 3k. Delete Users (cascades: UserRole, PushSubscription, Address, CartItem, PointsTransaction, Favorite)
    console.log("\n⏳ Eliminando usuarios...");
    const delUsers = await prisma.user.deleteMany({ where: { id: { in: deleteUserIds } } });
    console.log(`\n✅ Usuarios eliminados: ${delUsers.count}`);

    // Step 4: Summary
    const remainingUsers = await prisma.user.count();
    const remainingMerchants = await prisma.merchant.count();
    const remainingProducts = await prisma.product.count();

    console.log("\n" + "=".repeat(50));
    console.log("📊 Estado final de la base de datos:");
    console.log(`   Usuarios: ${remainingUsers}`);
    console.log(`   Comercios: ${remainingMerchants}`);
    console.log(`   Productos: ${remainingProducts}`);
    console.log("=".repeat(50));
    console.log("\n✨ Limpieza completada.\n");
}

main()
    .catch(e => {
        console.error("Error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());