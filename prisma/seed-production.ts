/**
 * Production seed: ensures all critical config records exist.
 * Safe to run multiple times (uses upsert).
 * Run: npx tsx prisma/seed-production.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🚀 Seeding production essentials...\n");

    // ─── 1. Admin user ──────────────────────────────────────────────
    const adminEmail = process.env.ADMIN_EMAIL || "admin@somosmoovy.com";
    const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existing) {
        const pw = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Moovy2026!", 12);
        const admin = await prisma.user.create({
            data: { email: adminEmail, password: pw, name: "Admin MOOVY", role: "ADMIN" },
        });
        await prisma.userRole.create({ data: { userId: admin.id, role: "ADMIN" } });
        await prisma.userRole.create({ data: { userId: admin.id, role: "USER" } });
        console.log("✅ Admin user created");
    } else {
        // Ensure admin has ADMIN role in UserRole table
        const hasRole = await prisma.userRole.findFirst({ where: { userId: existing.id, role: "ADMIN" } });
        if (!hasRole) {
            await prisma.userRole.create({ data: { userId: existing.id, role: "ADMIN" } });
            console.log("✅ Admin role added to existing user");
        } else {
            console.log("⏭️ Admin user already exists");
        }
    }

    // ─── 2. Store Settings (singleton) ──────────────────────────────
    await prisma.storeSettings.upsert({
        where: { id: "settings" },
        update: {},
        create: {
            id: "settings",
            isOpen: true,
            closedMessage: "Volvemos pronto 🔜",
            isMaintenanceMode: false,
            maintenanceMessage: "Estamos mejorando MOOVY. Volvemos en minutos.",
            storeName: "Moovy Ushuaia",
            storeAddress: "Ushuaia, Tierra del Fuego",
            originLat: -54.8019,
            originLng: -68.303,
            fuelPricePerLiter: 1200,
            fuelConsumptionPerKm: 0.06,
            baseDeliveryFee: 500,
            maintenanceFactor: 1.35,
            maxDeliveryDistance: 15,
            riderCommissionPercent: 80,
        },
    });
    console.log("✅ StoreSettings ensured");

    // ─── 3. Points Config (singleton) ───────────────────────────────
    await prisma.pointsConfig.upsert({
        where: { id: "points_config" },
        update: {},
        create: {
            id: "points_config",
            pointsPerDollar: 1,
            minPurchaseForPoints: 0,
            pointsValue: 0.01,
            minPointsToRedeem: 100,
            maxDiscountPercent: 50,
            signupBonus: 100,
            referralBonus: 200,
            reviewBonus: 10,
        },
    });
    console.log("✅ PointsConfig ensured");

    // ─── 4. MoovyConfig (key-value dynamic config) ─────────────────
    const configs = [
        { key: "default_merchant_commission_pct", value: "8", description: "Comisión MOOVY a comercios (%)" },
        { key: "default_seller_commission_pct", value: "12", description: "Comisión MOOVY a vendedores marketplace (%)" },
        { key: "merchant_confirm_timeout_seconds", value: "300", description: "Timeout para que el comercio confirme (seg)" },
        { key: "driver_response_timeout_seconds", value: "60", description: "Timeout para que el driver acepte oferta (seg)" },
        { key: "max_assignment_attempts", value: "5", description: "Máximo intentos de asignación de driver" },
        { key: "points_per_dollar", value: "1", description: "Puntos por peso gastado" },
        { key: "signup_bonus", value: "100", description: "Puntos bonus por registro" },
        { key: "referral_bonus", value: "200", description: "Puntos bonus por referir" },
        { key: "min_points_to_redeem", value: "100", description: "Mínimo de puntos para canjear" },
        { key: "max_discount_percent", value: "50", description: "Máximo % de descuento con puntos" },
    ];

    for (const cfg of configs) {
        await prisma.moovyConfig.upsert({
            where: { key: cfg.key },
            update: {},
            create: cfg,
        });
    }
    console.log(`✅ MoovyConfig ensured (${configs.length} keys)`);

    // ─── 5. Package Categories (for delivery sizing) ────────────────
    const packageCats = [
        { name: "MICRO", maxWeightGrams: 500, maxLengthCm: 20, maxWidthCm: 15, maxHeightCm: 10, volumeScore: 1, allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"], displayOrder: 1 },
        { name: "SMALL", maxWeightGrams: 2000, maxLengthCm: 35, maxWidthCm: 25, maxHeightCm: 20, volumeScore: 3, allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"], displayOrder: 2 },
        { name: "MEDIUM", maxWeightGrams: 5000, maxLengthCm: 50, maxWidthCm: 40, maxHeightCm: 30, volumeScore: 6, allowedVehicles: ["MOTO", "CAR", "TRUCK"], displayOrder: 3 },
        { name: "LARGE", maxWeightGrams: 15000, maxLengthCm: 80, maxWidthCm: 60, maxHeightCm: 50, volumeScore: 10, allowedVehicles: ["CAR", "TRUCK"], displayOrder: 4 },
        { name: "XL", maxWeightGrams: 50000, maxLengthCm: 120, maxWidthCm: 80, maxHeightCm: 80, volumeScore: 20, allowedVehicles: ["TRUCK"], displayOrder: 5 },
    ];

    for (const cat of packageCats) {
        const existing = await prisma.packageCategory.findUnique({ where: { name: cat.name } });
        if (!existing) {
            await prisma.packageCategory.create({ data: cat });
        }
    }
    console.log("✅ PackageCategories ensured");

    // ─── 6. Delivery Rates (one per package category) ───────────────
    const categories = await prisma.packageCategory.findMany();
    const rateDefaults: Record<string, { base: number; perKm: number }> = {
        MICRO: { base: 300, perKm: 80 },
        SMALL: { base: 400, perKm: 100 },
        MEDIUM: { base: 600, perKm: 130 },
        LARGE: { base: 900, perKm: 180 },
        XL: { base: 1500, perKm: 250 },
    };

    for (const cat of categories) {
        const defaults = rateDefaults[cat.name];
        if (defaults) {
            await prisma.deliveryRate.upsert({
                where: { categoryId: cat.id },
                update: {},
                create: { categoryId: cat.id, basePriceArs: defaults.base, pricePerKmArs: defaults.perKm },
            });
        }
    }
    console.log("✅ DeliveryRates ensured");

    // ─── 7. Package Pricing Tiers (for B2B custom builder) ──────────
    const tiers = [
        { name: "Pack x10", minItems: 1, maxItems: 10, pricePerItem: 150, totalPrice: 1500, order: 1 },
        { name: "Pack x25", minItems: 11, maxItems: 25, pricePerItem: 120, totalPrice: 3000, order: 2 },
        { name: "Pack x50", minItems: 26, maxItems: 50, pricePerItem: 90, totalPrice: 4500, order: 3 },
    ];

    for (const tier of tiers) {
        const exists = await prisma.packagePricingTier.findFirst({ where: { name: tier.name } });
        if (!exists) {
            await prisma.packagePricingTier.create({ data: tier });
        }
    }
    console.log("✅ PackagePricingTiers ensured");

    console.log("\n🎉 Production seed complete!");
}

main()
    .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
