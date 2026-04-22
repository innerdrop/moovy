/**
 * MOOVY — Limpieza pre-lanzamiento (datos usuario) PRESERVANDO config OPS
 *
 * Objetivo: dejar la base como si nadie hubiera usado la app todavía,
 * pero con toda la configuración de OPS intacta (Biblia Financiera v3).
 *
 * ✅ PRESERVA:
 *   - Usuario admin (User.role = 'ADMIN') + su UserRole
 *   - StoreSettings, PointsConfig, MoovyConfig
 *   - MerchantLoyaltyConfig (BRONCE/PLATA/ORO/DIAMANTE)
 *   - DeliveryRate, PackageCategory, PackagePricingTier
 *   - Category (árbol de categorías)
 *   - HeroSlide, HomeCategorySlot, CannedResponse
 *
 * 🗑️  BORRA (46 modelos, todo lo generado por uso):
 *   - Users no-admin, Merchants, Drivers, SellerProfiles
 *   - Orders, SubOrders, OrderItems, Payments, OrderBackup
 *   - Products, Listings, Variants, ProductImages, ListingImages
 *   - Favorites, Ratings, Chats (Order + Support), Bids
 *   - Coupons (Usages + Coupons)
 *   - PointsTransactions, Referrals, SavedCarts, Addresses, PushSubs
 *   - AdPlacements, PackagePurchases, MerchantCategories, AcquiredProducts
 *   - AssignmentLogs, PendingAssignments, DriverLocationHistory, DeliveryAttempts
 *   - AuditLog, ConfigAuditLog, UserActivityLog, ConsentLog, MpWebhookLog, CronRunLog
 *   - DriverAvailabilitySubscriptions, CartItems, SellerAvailability, SupportOperator (no-admin)
 *
 * Uso:
 *   DRY RUN (default, solo cuenta):
 *     npx tsx scripts/clean-db-pre-launch.ts
 *
 *   EJECUTAR (requiere confirmación interactiva "SI BORRAR"):
 *     npx tsx scripts/clean-db-pre-launch.ts --execute
 *
 * Requisitos:
 *   - DATABASE_URL seteado (apunta a la DB objetivo: local o VPS)
 *   - Al menos un User con role = 'ADMIN' en la DB
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const EXECUTE = process.argv.includes("--execute");
const prisma = new PrismaClient();

type PhaseResult = { phase: string; table: string; count: number };
const results: PhaseResult[] = [];

function log(msg: string) {
    console.log(msg);
}

async function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function countOrDelete(phase: string, table: string, op: () => Promise<{ count: number }>) {
    const result = await op();
    results.push({ phase, table, count: result.count });
    log(`   ${table.padEnd(35)} ${String(result.count).padStart(6)} ${EXECUTE ? "borrados" : "(dry-run)"}`);
}

async function main() {
    log("");
    log("═══════════════════════════════════════════════════════════════════");
    log("  MOOVY — Limpieza pre-lanzamiento (preserva config OPS)");
    log("═══════════════════════════════════════════════════════════════════");
    log("");
    log(`  Modo: ${EXECUTE ? "🔥 EJECUTAR (borrado real)" : "🔍 DRY RUN (solo conteo)"}`);
    log(`  DB:   ${process.env.DATABASE_URL?.replace(/:\/\/[^@]+@/, "://***@") || "(no DATABASE_URL)"}`);
    log("");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL no está seteado. Abortando por seguridad.");
        process.exit(1);
    }

    // ─── Identificar admins ─────────────────────────────────────────────
    const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, email: true, name: true, createdAt: true, deletedAt: true },
    });

    if (admins.length === 0) {
        console.error("❌ No hay usuarios con role = 'ADMIN'. Abortando.");
        console.error("   Corré primero: npx tsx scripts/create-admin.ts [email]");
        process.exit(1);
    }

    log(`  Admins preservados (${admins.length}):`);
    for (const a of admins) {
        const marker = a.deletedAt ? " [⚠️ SOFT-DELETED]" : "";
        log(`    • ${a.email} (${a.name || "sin nombre"}) id=${a.id}${marker}`);
    }
    log("");

    const adminIds = admins.map((a) => a.id);

    // ─── Confirmación interactiva (solo en EXECUTE) ─────────────────────
    if (EXECUTE) {
        log("⚠️  VAS A BORRAR TODOS LOS DATOS DE USUARIO EN ESTA BASE DE DATOS.");
        log("    Pedidos, comercios, productos, repartidores, vendedores, chats...");
        log("    TODO menos el(los) admin(s) listado(s) arriba y la config de OPS.");
        log("");
        const answer = await prompt("    Escribí 'SI BORRAR' (sin comillas) para confirmar: ");
        if (answer.trim() !== "SI BORRAR") {
            log("");
            log("❌ Confirmación incorrecta. Abortando sin tocar nada.");
            process.exit(1);
        }
        log("");
        log("🔥 Confirmado. Empezando limpieza...");
        log("");
    } else {
        log("🔍 DRY RUN — no se va a borrar nada. Los números son el total que se borraría.");
        log("   Para ejecutar de verdad: npx tsx scripts/clean-db-pre-launch.ts --execute");
        log("");
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 1 — Chat y soporte (hojas primero)
    // ─────────────────────────────────────────────────────────────────────
    log("─── Fase 1: Chat y soporte ──────────────────────────────────────────");
    if (EXECUTE) {
        await countOrDelete("1", "OrderChatMessage", () => prisma.orderChatMessage.deleteMany({}));
        await countOrDelete("1", "OrderChat", () => prisma.orderChat.deleteMany({}));
        await countOrDelete("1", "SupportMessage", () => prisma.supportMessage.deleteMany({}));
        await countOrDelete("1", "SupportChat", () => prisma.supportChat.deleteMany({}));
        // SupportOperator: borrar solo los que NO son admin
        await countOrDelete("1", "SupportOperator", () =>
            prisma.supportOperator.deleteMany({ where: { userId: { notIn: adminIds } } })
        );
    } else {
        results.push({ phase: "1", table: "OrderChatMessage", count: await prisma.orderChatMessage.count() });
        results.push({ phase: "1", table: "OrderChat", count: await prisma.orderChat.count() });
        results.push({ phase: "1", table: "SupportMessage", count: await prisma.supportMessage.count() });
        results.push({ phase: "1", table: "SupportChat", count: await prisma.supportChat.count() });
        results.push({ phase: "1", table: "SupportOperator", count: await prisma.supportOperator.count({ where: { userId: { notIn: adminIds } } }) });
        for (const r of results.filter(r => r.phase === "1")) log(`   ${r.table.padEnd(35)} ${String(r.count).padStart(6)} (dry-run)`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 2 — Pedidos, pagos y asignación
    // ─────────────────────────────────────────────────────────────────────
    log("");
    log("─── Fase 2: Pedidos, pagos y asignación ─────────────────────────────");
    if (EXECUTE) {
        await countOrDelete("2", "Payment", () => prisma.payment.deleteMany({}));
        await countOrDelete("2", "MpWebhookLog", () => prisma.mpWebhookLog.deleteMany({}));
        await countOrDelete("2", "DeliveryAttempt", () => prisma.deliveryAttempt.deleteMany({}));
        await countOrDelete("2", "DriverLocationHistory", () => prisma.driverLocationHistory.deleteMany({}));
        await countOrDelete("2", "AssignmentLog", () => prisma.assignmentLog.deleteMany({}));
        await countOrDelete("2", "PendingAssignment", () => prisma.pendingAssignment.deleteMany({}));
        await countOrDelete("2", "OrderItem", () => prisma.orderItem.deleteMany({}));
        await countOrDelete("2", "SubOrder", () => prisma.subOrder.deleteMany({}));
        await countOrDelete("2", "Order", () => prisma.order.deleteMany({}));
        await countOrDelete("2", "OrderBackup", () => prisma.orderBackup.deleteMany({}));
    } else {
        for (const t of ["payment", "mpWebhookLog", "deliveryAttempt", "driverLocationHistory", "assignmentLog", "pendingAssignment", "orderItem", "subOrder", "order", "orderBackup"] as const) {
            // @ts-expect-error dynamic access for dry-run count
            const count = await prisma[t].count();
            const pascalName = t.charAt(0).toUpperCase() + t.slice(1);
            results.push({ phase: "2", table: pascalName, count });
            log(`   ${pascalName.padEnd(35)} ${String(count).padStart(6)} (dry-run)`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 3 — Productos, listings, carritos, favoritos
    // ─────────────────────────────────────────────────────────────────────
    log("");
    log("─── Fase 3: Productos, listings, carritos, favoritos ────────────────");
    if (EXECUTE) {
        await countOrDelete("3", "Bid", () => prisma.bid.deleteMany({}));
        await countOrDelete("3", "ListingImage", () => prisma.listingImage.deleteMany({}));
        await countOrDelete("3", "Listing", () => prisma.listing.deleteMany({}));
        await countOrDelete("3", "ProductImage", () => prisma.productImage.deleteMany({}));
        await countOrDelete("3", "ProductVariant", () => prisma.productVariant.deleteMany({}));
        await countOrDelete("3", "ProductCategory", () => prisma.productCategory.deleteMany({}));
        await countOrDelete("3", "MerchantAcquiredProduct", () => prisma.merchantAcquiredProduct.deleteMany({}));
        await countOrDelete("3", "CartItem", () => prisma.cartItem.deleteMany({}));
        await countOrDelete("3", "Favorite", () => prisma.favorite.deleteMany({}));
        await countOrDelete("3", "Product", () => prisma.product.deleteMany({}));
    } else {
        for (const t of ["bid", "listingImage", "listing", "productImage", "productVariant", "productCategory", "merchantAcquiredProduct", "cartItem", "favorite", "product"] as const) {
            // @ts-expect-error dynamic access for dry-run count
            const count = await prisma[t].count();
            const pascalName = t.charAt(0).toUpperCase() + t.slice(1);
            results.push({ phase: "3", table: pascalName, count });
            log(`   ${pascalName.padEnd(35)} ${String(count).padStart(6)} (dry-run)`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 4 — Publicidad, paquetes B2B, relaciones merchant↔category
    // ─────────────────────────────────────────────────────────────────────
    log("");
    log("─── Fase 4: Publicidad, paquetes B2B, merchant↔category ─────────────");
    if (EXECUTE) {
        await countOrDelete("4", "AdPlacement", () => prisma.adPlacement.deleteMany({}));
        await countOrDelete("4", "PackagePurchase", () => prisma.packagePurchase.deleteMany({}));
        await countOrDelete("4", "MerchantCategory", () => prisma.merchantCategory.deleteMany({}));
    } else {
        for (const t of ["adPlacement", "packagePurchase", "merchantCategory"] as const) {
            // @ts-expect-error dynamic access for dry-run count
            const count = await prisma[t].count();
            const pascalName = t.charAt(0).toUpperCase() + t.slice(1);
            results.push({ phase: "4", table: pascalName, count });
            log(`   ${pascalName.padEnd(35)} ${String(count).padStart(6)} (dry-run)`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 5 — Merchants, sellers, drivers, availability
    // ─────────────────────────────────────────────────────────────────────
    log("");
    log("─── Fase 5: Merchants, sellers, drivers ─────────────────────────────");
    if (EXECUTE) {
        await countOrDelete("5", "Merchant", () => prisma.merchant.deleteMany({}));
        await countOrDelete("5", "SellerAvailability", () => prisma.sellerAvailability.deleteMany({}));
        await countOrDelete("5", "SellerProfile", () => prisma.sellerProfile.deleteMany({}));
        await countOrDelete("5", "DriverAvailabilitySubscription", () => prisma.driverAvailabilitySubscription.deleteMany({}));
        await countOrDelete("5", "Driver", () => prisma.driver.deleteMany({}));
    } else {
        for (const t of ["merchant", "sellerAvailability", "sellerProfile", "driverAvailabilitySubscription", "driver"] as const) {
            // @ts-expect-error dynamic access for dry-run count
            const count = await prisma[t].count();
            const pascalName = t.charAt(0).toUpperCase() + t.slice(1);
            results.push({ phase: "5", table: pascalName, count });
            log(`   ${pascalName.padEnd(35)} ${String(count).padStart(6)} (dry-run)`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 6 — Puntos, referidos, carritos guardados, direcciones, push
    // ─────────────────────────────────────────────────────────────────────
    log("");
    log("─── Fase 6: Puntos, referidos, direcciones, push ────────────────────");
    if (EXECUTE) {
        await countOrDelete("6", "CouponUsage", () => prisma.couponUsage.deleteMany({}));
        await countOrDelete("6", "Coupon", () => prisma.coupon.deleteMany({}));
        await countOrDelete("6", "PointsTransaction", () => prisma.pointsTransaction.deleteMany({}));
        await countOrDelete("6", "Referral", () => prisma.referral.deleteMany({}));
        await countOrDelete("6", "SavedCart", () => prisma.savedCart.deleteMany({}));
        await countOrDelete("6", "Address", () => prisma.address.deleteMany({}));
        await countOrDelete("6", "PushSubscription", () => prisma.pushSubscription.deleteMany({}));
        await countOrDelete("6", "ConsentLog", () => prisma.consentLog.deleteMany({}));
    } else {
        for (const t of ["couponUsage", "coupon", "pointsTransaction", "referral", "savedCart", "address", "pushSubscription", "consentLog"] as const) {
            // @ts-expect-error dynamic access for dry-run count
            const count = await prisma[t].count();
            const pascalName = t.charAt(0).toUpperCase() + t.slice(1);
            results.push({ phase: "6", table: pascalName, count });
            log(`   ${pascalName.padEnd(35)} ${String(count).padStart(6)} (dry-run)`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 7 — Logs y auditoría
    // ─────────────────────────────────────────────────────────────────────
    log("");
    log("─── Fase 7: Logs y auditoría ────────────────────────────────────────");
    if (EXECUTE) {
        await countOrDelete("7", "UserActivityLog", () => prisma.userActivityLog.deleteMany({}));
        await countOrDelete("7", "AuditLog", () => prisma.auditLog.deleteMany({}));
        await countOrDelete("7", "ConfigAuditLog", () => prisma.configAuditLog.deleteMany({}));
        await countOrDelete("7", "CronRunLog", () => prisma.cronRunLog.deleteMany({}));
    } else {
        for (const t of ["userActivityLog", "auditLog", "configAuditLog", "cronRunLog"] as const) {
            // @ts-expect-error dynamic access for dry-run count
            const count = await prisma[t].count();
            const pascalName = t.charAt(0).toUpperCase() + t.slice(1);
            results.push({ phase: "7", table: pascalName, count });
            log(`   ${pascalName.padEnd(35)} ${String(count).padStart(6)} (dry-run)`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 8 — UserRole no-admin, User no-admin
    // ─────────────────────────────────────────────────────────────────────
    log("");
    log("─── Fase 8: UserRole y User (no-admin) ──────────────────────────────");
    if (EXECUTE) {
        await countOrDelete("8", "UserRole", () =>
            prisma.userRole.deleteMany({ where: { userId: { notIn: adminIds } } })
        );
        await countOrDelete("8", "User", () =>
            prisma.user.deleteMany({ where: { id: { notIn: adminIds } } })
        );
    } else {
        const userRoleCount = await prisma.userRole.count({ where: { userId: { notIn: adminIds } } });
        const userCount = await prisma.user.count({ where: { id: { notIn: adminIds } } });
        results.push({ phase: "8", table: "UserRole", count: userRoleCount });
        results.push({ phase: "8", table: "User", count: userCount });
        log(`   ${"UserRole".padEnd(35)} ${String(userRoleCount).padStart(6)} (dry-run)`);
        log(`   ${"User".padEnd(35)} ${String(userCount).padStart(6)} (dry-run)`);
    }

    // ─────────────────────────────────────────────────────────────────────
    // FASE 9 — Resetear admin a estado limpio (solo si EXECUTE)
    // ─────────────────────────────────────────────────────────────────────
    if (EXECUTE) {
        log("");
        log("─── Fase 9: Reseteando admin(s) a estado limpio ─────────────────────");
        for (const a of admins) {
            await prisma.user.update({
                where: { id: a.id },
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
                    termsConsentAt: null,
                    privacyConsentAt: null,
                    marketingConsent: false,
                    marketingConsentAt: null,
                    marketingConsentRevokedAt: null,
                    cookiesConsent: null,
                    cookiesConsentAt: null,
                    onboardingCompletedAt: null,
                },
            });
            log(`   ✓ ${a.email} reseteado (balance=0, flags limpias)`);
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // RESUMEN
    // ─────────────────────────────────────────────────────────────────────
    const totalDeleted = results.reduce((sum, r) => sum + r.count, 0);
    log("");
    log("═══════════════════════════════════════════════════════════════════");
    log(`  RESUMEN: ${totalDeleted} registros ${EXECUTE ? "BORRADOS" : "se borrarían"}`);
    log("═══════════════════════════════════════════════════════════════════");
    log("");
    log("  ✅ PRESERVADO (config OPS + admin):");
    const storeSettingsCount = await prisma.storeSettings.count();
    const pointsConfigCount = await prisma.pointsConfig.count();
    const moovyConfigCount = await prisma.moovyConfig.count();
    const loyaltyCount = await prisma.merchantLoyaltyConfig.count();
    const delRateCount = await prisma.deliveryRate.count();
    const pkgCatCount = await prisma.packageCategory.count();
    const pkgTierCount = await prisma.packagePricingTier.count();
    const catCount = await prisma.category.count();
    const heroCount = await prisma.heroSlide.count();
    const homeSlotCount = await prisma.homeCategorySlot.count();
    const cannedCount = await prisma.cannedResponse.count();

    log(`     • StoreSettings:          ${storeSettingsCount}`);
    log(`     • PointsConfig:           ${pointsConfigCount}`);
    log(`     • MoovyConfig:            ${moovyConfigCount} entradas`);
    log(`     • MerchantLoyaltyConfig:  ${loyaltyCount} tiers`);
    log(`     • DeliveryRate:           ${delRateCount} vehículos`);
    log(`     • PackageCategory:        ${pkgCatCount} categorías`);
    log(`     • PackagePricingTier:     ${pkgTierCount} tiers`);
    log(`     • Category:               ${catCount} categorías`);
    log(`     • HeroSlide:              ${heroCount}`);
    log(`     • HomeCategorySlot:       ${homeSlotCount}`);
    log(`     • CannedResponse:         ${cannedCount}`);
    log(`     • User (admin):           ${admins.length}`);
    log("");

    if (!EXECUTE) {
        log("  🔍 Esto fue un DRY RUN. Nada se borró.");
        log("  Para ejecutar: npx tsx scripts/clean-db-pre-launch.ts --execute");
    } else {
        log("  🎉 Limpieza completa. La DB está lista para el pre-launch.");
        log("");
        log("  ⚠️  Si algún singleton de config (StoreSettings, PointsConfig) salió");
        log("      en 0, correr: npx tsx scripts/fix-ops-config.ts");
        log("      Eso re-crea los defaults sin tocar valores existentes.");
    }
    log("");
}

main()
    .catch((error) => {
        console.error("");
        console.error("❌ ERROR:", error.message || error);
        if (error.stack) console.error(error.stack);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
