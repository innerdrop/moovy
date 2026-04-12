/**
 * MOOVY — Limpieza total de base de datos para producción
 *
 * Borra TODOS los datos excepto el usuario admin OPS.
 * Deja la DB como si la app estuviera por habilitarse al público:
 * sin comercios, pedidos, repartidores, compradores, estadísticas, nada.
 *
 * Después de ejecutar este script, correr:
 *   npx tsx prisma/seed-production.ts
 *
 * Eso re-crea: StoreSettings, PointsConfig, MoovyConfig, Categories,
 * PackageCategories, DeliveryRates, PackagePricingTiers, MerchantLoyaltyConfig.
 *
 * Uso:
 *   npx tsx scripts/clean-db.ts
 *
 * Requisito: ADMIN_RESET_EMAIL (o ADMIN_EMAIL) en el .env
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_RESET_EMAIL || process.env.ADMIN_EMAIL;

async function main() {
    console.log("\n🧹 MOOVY — Limpieza total de base de datos");
    console.log("=============================================\n");

    if (!ADMIN_EMAIL) {
        console.error("❌ Falta ADMIN_RESET_EMAIL o ADMIN_EMAIL en el .env");
        process.exit(1);
    }

    // Verificar que el admin existe
    const admin = await prisma.user.findUnique({
        where: { email: ADMIN_EMAIL },
        select: { id: true, email: true, name: true, role: true }
    });

    if (!admin) {
        console.error(`❌ No se encontró usuario con email: ${ADMIN_EMAIL}`);
        console.error("   Verificá ADMIN_RESET_EMAIL o ADMIN_EMAIL en el .env");
        process.exit(1);
    }

    console.log(`✅ Admin encontrado: ${admin.email} (${admin.name || "sin nombre"})`);
    console.log(`   ID: ${admin.id}`);
    console.log(`   Rol: ${admin.role}\n`);

    // Confirmación de seguridad
    console.log("⚠️  ATENCIÓN: Esto va a borrar TODOS los datos excepto el admin.");
    console.log("   Comercios, repartidores, pedidos, productos, compradores... TODO.\n");

    // Dar 3 segundos para cancelar
    console.log("   Esperando 3 segundos... (Ctrl+C para cancelar)\n");
    await new Promise(resolve => setTimeout(resolve, 3000));

    console.log("🗑️  Iniciando limpieza...\n");

    const adminId = admin.id;

    // ─── Orden de borrado: hojas → raíces (respeta FK constraints) ──────

    // 1. Chat de pedidos
    const chatMsgs = await prisma.orderChatMessage.deleteMany({});
    console.log(`   OrderChatMessage: ${chatMsgs.count} borrados`);

    const chats = await prisma.orderChat.deleteMany({});
    console.log(`   OrderChat: ${chats.count} borrados`);

    // 2. Soporte
    const supportMsgs = await prisma.supportMessage.deleteMany({});
    console.log(`   SupportMessage: ${supportMsgs.count} borrados`);

    const supportChats = await prisma.supportChat.deleteMany({});
    console.log(`   SupportChat: ${supportChats.count} borrados`);

    const operators = await prisma.supportOperator.deleteMany({});
    console.log(`   SupportOperator: ${operators.count} borrados`);

    // 3. Pedidos y pagos
    const orderItems = await prisma.orderItem.deleteMany({});
    console.log(`   OrderItem: ${orderItems.count} borrados`);

    const payments = await prisma.payment.deleteMany({});
    console.log(`   Payment: ${payments.count} borrados`);

    const webhookLogs = await prisma.mpWebhookLog.deleteMany({});
    console.log(`   MpWebhookLog: ${webhookLogs.count} borrados`);

    const assignLogs = await prisma.assignmentLog.deleteMany({});
    console.log(`   AssignmentLog: ${assignLogs.count} borrados`);

    const pendingAssign = await prisma.pendingAssignment.deleteMany({});
    console.log(`   PendingAssignment: ${pendingAssign.count} borrados`);

    const locHistory = await prisma.driverLocationHistory.deleteMany({});
    console.log(`   DriverLocationHistory: ${locHistory.count} borrados`);

    const subOrders = await prisma.subOrder.deleteMany({});
    console.log(`   SubOrder: ${subOrders.count} borrados`);

    const orders = await prisma.order.deleteMany({});
    console.log(`   Order: ${orders.count} borrados`);

    const orderBackups = await prisma.orderBackup.deleteMany({});
    console.log(`   OrderBackup: ${orderBackups.count} borrados`);

    // 4. Comercios y marketplace
    const pkgPurchases = await prisma.packagePurchase.deleteMany({});
    console.log(`   PackagePurchase: ${pkgPurchases.count} borrados`);

    const adPlacements = await prisma.adPlacement.deleteMany({});
    console.log(`   AdPlacement: ${adPlacements.count} borrados`);

    const acqProducts = await prisma.merchantAcquiredProduct.deleteMany({});
    console.log(`   MerchantAcquiredProduct: ${acqProducts.count} borrados`);

    const merchCats = await prisma.merchantCategory.deleteMany({});
    console.log(`   MerchantCategory: ${merchCats.count} borrados`);

    // 5. Productos
    const prodImages = await prisma.productImage.deleteMany({});
    console.log(`   ProductImage: ${prodImages.count} borrados`);

    const prodVariants = await prisma.productVariant.deleteMany({});
    console.log(`   ProductVariant: ${prodVariants.count} borrados`);

    const prodCats = await prisma.productCategory.deleteMany({});
    console.log(`   ProductCategory: ${prodCats.count} borrados`);

    const cartItems = await prisma.cartItem.deleteMany({});
    console.log(`   CartItem: ${cartItems.count} borrados`);

    const products = await prisma.product.deleteMany({});
    console.log(`   Product: ${products.count} borrados`);

    // 6. Listings y subastas
    const bids = await prisma.bid.deleteMany({});
    console.log(`   Bid: ${bids.count} borrados`);

    const listImages = await prisma.listingImage.deleteMany({});
    console.log(`   ListingImage: ${listImages.count} borrados`);

    const listings = await prisma.listing.deleteMany({});
    console.log(`   Listing: ${listings.count} borrados`);

    // 7. Merchants, drivers, sellers
    const merchants = await prisma.merchant.deleteMany({});
    console.log(`   Merchant: ${merchants.count} borrados`);

    const drivers = await prisma.driver.deleteMany({});
    console.log(`   Driver: ${drivers.count} borrados`);

    const sellerAvail = await prisma.sellerAvailability.deleteMany({});
    console.log(`   SellerAvailability: ${sellerAvail.count} borrados`);

    const sellers = await prisma.sellerProfile.deleteMany({});
    console.log(`   SellerProfile: ${sellers.count} borrados`);

    // 8. Favoritos, cupones, puntos, referidos
    const favs = await prisma.favorite.deleteMany({});
    console.log(`   Favorite: ${favs.count} borrados`);

    const couponUsages = await prisma.couponUsage.deleteMany({});
    console.log(`   CouponUsage: ${couponUsages.count} borrados`);

    const coupons = await prisma.coupon.deleteMany({});
    console.log(`   Coupon: ${coupons.count} borrados`);

    const ptsTx = await prisma.pointsTransaction.deleteMany({});
    console.log(`   PointsTransaction: ${ptsTx.count} borrados`);

    const referrals = await prisma.referral.deleteMany({});
    console.log(`   Referral: ${referrals.count} borrados`);

    const savedCarts = await prisma.savedCart.deleteMany({});
    console.log(`   SavedCart: ${savedCarts.count} borrados`);

    // 9. Actividad y auditoría
    const actLogs = await prisma.userActivityLog.deleteMany({});
    console.log(`   UserActivityLog: ${actLogs.count} borrados`);

    const auditLogs = await prisma.auditLog.deleteMany({});
    console.log(`   AuditLog: ${auditLogs.count} borrados`);

    const configAudit = await prisma.configAuditLog.deleteMany({});
    console.log(`   ConfigAuditLog: ${configAudit.count} borrados`);

    // 10. Push, direcciones, roles
    const pushSubs = await prisma.pushSubscription.deleteMany({});
    console.log(`   PushSubscription: ${pushSubs.count} borrados`);

    const addresses = await prisma.address.deleteMany({});
    console.log(`   Address: ${addresses.count} borrados`);

    const userRoles = await prisma.userRole.deleteMany({});
    console.log(`   UserRole: ${userRoles.count} borrados`);

    // 11. UI content
    const heroSlides = await prisma.heroSlide.deleteMany({});
    console.log(`   HeroSlide: ${heroSlides.count} borrados`);

    const homeSlots = await prisma.homeCategorySlot.deleteMany({});
    console.log(`   HomeCategorySlot: ${homeSlots.count} borrados`);

    const cannedResp = await prisma.cannedResponse.deleteMany({});
    console.log(`   CannedResponse: ${cannedResp.count} borrados`);

    // 12. Seed data (se re-crea con seed-production.ts)
    const delRates = await prisma.deliveryRate.deleteMany({});
    console.log(`   DeliveryRate: ${delRates.count} borrados`);

    const pkgCats = await prisma.packageCategory.deleteMany({});
    console.log(`   PackageCategory: ${pkgCats.count} borrados`);

    const priceTiers = await prisma.packagePricingTier.deleteMany({});
    console.log(`   PackagePricingTier: ${priceTiers.count} borrados`);

    const categories = await prisma.category.deleteMany({});
    console.log(`   Category: ${categories.count} borrados`);

    const loyaltyConfig = await prisma.merchantLoyaltyConfig.deleteMany({});
    console.log(`   MerchantLoyaltyConfig: ${loyaltyConfig.count} borrados`);

    // 13. Config singletons (se re-crean con seed-production.ts)
    const moovyConfig = await prisma.moovyConfig.deleteMany({});
    console.log(`   MoovyConfig: ${moovyConfig.count} borrados`);

    const pointsConfig = await prisma.pointsConfig.deleteMany({});
    console.log(`   PointsConfig: ${pointsConfig.count} borrados`);

    // StoreSettings — delete para que seed-production.ts lo re-cree limpio
    await prisma.$executeRaw`DELETE FROM "StoreSettings"`;
    console.log(`   StoreSettings: borrado`);

    // 14. Usuarios — borrar TODOS excepto el admin
    const deletedUsers = await prisma.user.deleteMany({
        where: { id: { not: adminId } }
    });
    console.log(`   User: ${deletedUsers.count} borrados (admin conservado)`);

    // 15. Resetear el admin a estado limpio
    await prisma.user.update({
        where: { id: adminId },
        data: {
            pointsBalance: 0,
            pendingBonusPoints: 0,
            bonusActivated: false,
            referredById: null,
            isSuspended: false,
            suspendedAt: null,
            suspendedUntil: null,
            suspensionReason: null,
            archivedAt: null,
            deletedAt: null,
            role: "ADMIN"
        }
    });
    console.log(`\n✅ Admin reseteado a estado limpio (puntos=0, sin suspensión)`);

    // Resumen
    console.log("\n=============================================");
    console.log("🎉 Base de datos limpia.");
    console.log(`   Único usuario: ${admin.email}`);
    console.log("\n📋 Próximo paso:");
    console.log("   npx tsx prisma/seed-production.ts");
    console.log("   (Re-crea StoreSettings, PointsConfig, MoovyConfig, categorías, etc.)\n");
}

main()
    .catch((error) => {
        console.error("❌ Error:", error.message || error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
