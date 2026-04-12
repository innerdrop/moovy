/**
 * Production seed: inicializa TODA la configuración operativa de MOOVY.
 * Safe to run multiple times (uses upsert / findFirst checks).
 *
 * IMPORTANTE: La contraseña del admin se lee de la variable de entorno ADMIN_PASSWORD.
 * Antes de ejecutar, configurala:
 *   $env:ADMIN_PASSWORD = "TuClaveSegura123"    (PowerShell)
 *   export ADMIN_PASSWORD="TuClaveSegura123"      (Bash/SSH)
 *
 * Run: npx tsx prisma/seed-production.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("\n🚀 Seeding production essentials...\n");

    // ─── 1. Admin user ──────────────────────────────────────────────
    const adminEmail = "maurod@me.com";
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        console.error("❌ ERROR: Debes configurar la variable ADMIN_PASSWORD antes de ejecutar.");
        console.error("   PowerShell:  $env:ADMIN_PASSWORD = \"TuClaveSegura123\"");
        console.error("   Bash/SSH:    export ADMIN_PASSWORD=\"TuClaveSegura123\"");
        process.exit(1);
    }

    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!existingAdmin) {
        const pw = await bcrypt.hash(adminPassword, 12);
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                password: pw,
                name: "Mauro",
                firstName: "Mauro",
                role: "ADMIN",
            },
        });
        await prisma.userRole.create({ data: { userId: admin.id, role: "ADMIN" } });
        await prisma.userRole.create({ data: { userId: admin.id, role: "USER" } });
        console.log("✅ Admin user created (maurod@me.com)");
    } else {
        const hasRole = await prisma.userRole.findFirst({ where: { userId: existingAdmin.id, role: "ADMIN" } });
        if (!hasRole) {
            await prisma.userRole.create({ data: { userId: existingAdmin.id, role: "ADMIN" } });
            console.log("✅ Admin role added to existing user");
        } else {
            console.log("⏭️  Admin user already exists");
        }
    }

    // ─── 2. Store Settings (singleton) ──────────────────────────────
    await prisma.storeSettings.upsert({
        where: { id: "settings" },
        update: {},
        create: {
            id: "settings",
            isOpen: true,
            closedMessage: "Volvemos pronto",
            isMaintenanceMode: true,
            maintenanceMessage: "Estamos preparando todo para vos. MOOVY llega pronto a Ushuaia.",
            tiendaMaintenance: true,
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
            defaultMerchantCommission: 8,
            defaultSellerCommission: 12,
            heroSliderEnabled: true,
            heroSliderInterval: 5000,
            heroSliderShowArrows: true,
            promoBannerEnabled: false,
            maxCategoriesHome: 6,
            showComerciosCard: true,
            showRepartidoresCard: true,
            // Timeouts
            merchantConfirmTimeoutSec: 300,
            driverResponseTimeoutSec: 60,
            // Scheduled delivery
            maxOrdersPerSlot: 15,
            slotDurationMinutes: 120,
            minAnticipationHours: 1.5,
            maxAnticipationHours: 48,
            operatingHoursStart: "09:00",
            operatingHoursEnd: "22:00",
            // Advertising pricing (Biblia Financiera)
            adPricePlatino: 150000,
            adPriceDestacado: 95000,
            adPricePremium: 55000,
            adPriceHeroBanner: 250000,
            adPriceBannerPromo: 180000,
            adPriceProducto: 25000,
            adLaunchDiscountPercent: 50,
            adMaxHeroBannerSlots: 3,
            adMaxDestacadosSlots: 8,
            adMaxProductosSlots: 12,
        },
    });
    console.log("✅ StoreSettings ensured (modo mantenimiento ACTIVADO)");

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
            refereeBonus: 100,
            reviewBonus: 10,
            minPurchaseForBonus: 5000,
            minReferralPurchase: 8000,
            tierWindowDays: 90,
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
        // Cart recovery
        { key: "cart_recovery_enabled", value: "true", description: "Habilitar recuperación de carritos abandonados" },
        { key: "cart_recovery_first_reminder_hours", value: "2", description: "Horas hasta 1er recordatorio de carrito" },
        { key: "cart_recovery_second_reminder_hours", value: "24", description: "Horas hasta 2do recordatorio de carrito" },
        { key: "cart_recovery_max_reminders", value: "2", description: "Máximo de recordatorios por carrito" },
        { key: "cart_recovery_min_cart_value", value: "5000", description: "Valor mínimo del carrito para enviar recordatorio (ARS)" },
    ];

    for (const cfg of configs) {
        await prisma.moovyConfig.upsert({
            where: { key: cfg.key },
            update: {},
            create: cfg,
        });
    }
    console.log(`✅ MoovyConfig ensured (${configs.length} keys)`);

    // ─── 5. Categories (store + marketplace) ───────────────────────
    const storeCategories = [
        { name: "Restaurante", slug: "restaurante", scope: "STORE", order: 1 },
        { name: "Pizzería", slug: "pizzeria", scope: "STORE", order: 2 },
        { name: "Hamburguesería", slug: "hamburgueseria", scope: "STORE", order: 3 },
        { name: "Parrilla", slug: "parrilla", scope: "STORE", order: 4 },
        { name: "Cafetería", slug: "cafeteria", scope: "STORE", order: 5 },
        { name: "Panadería", slug: "panaderia", scope: "STORE", order: 6 },
        { name: "Farmacia", slug: "farmacia", scope: "STORE", order: 7 },
        { name: "Supermercado", slug: "supermercado", scope: "STORE", order: 8 },
        { name: "Kiosco", slug: "kiosco", scope: "STORE", order: 9 },
        { name: "Verdulería", slug: "verduleria", scope: "STORE", order: 10 },
        { name: "Carnicería", slug: "carniceria", scope: "STORE", order: 11 },
        { name: "Otro", slug: "otro", scope: "BOTH", order: 99 },
    ];

    const marketplaceCategories = [
        { name: "Electrónica", slug: "electronica", scope: "MARKETPLACE", order: 1 },
        { name: "Ropa y Calzado", slug: "ropa-calzado", scope: "MARKETPLACE", order: 2 },
        { name: "Hogar y Jardín", slug: "hogar-jardin", scope: "MARKETPLACE", order: 3 },
        { name: "Deportes", slug: "deportes", scope: "MARKETPLACE", order: 4 },
        { name: "Juguetes", slug: "juguetes", scope: "MARKETPLACE", order: 5 },
        { name: "Libros y Música", slug: "libros-musica", scope: "MARKETPLACE", order: 6 },
        { name: "Mascotas", slug: "mascotas", scope: "MARKETPLACE", order: 7 },
        { name: "Automotor", slug: "automotor", scope: "MARKETPLACE", order: 8 },
        { name: "Artesanías", slug: "artesanias", scope: "MARKETPLACE", order: 9 },
    ];

    for (const cat of [...storeCategories, ...marketplaceCategories]) {
        const exists = await prisma.category.findUnique({ where: { slug: cat.slug } });
        if (!exists) {
            await prisma.category.create({ data: cat });
        }
    }
    console.log(`✅ Categories ensured (${storeCategories.length} store + ${marketplaceCategories.length} marketplace)`);

    // ─── 6. Merchant Loyalty Tiers ─────────────────────────────────
    const loyaltyTiers = [
        { tier: "BRONCE", minOrdersPerMonth: 0, commissionRate: 8, badgeText: "Nuevo", badgeColor: "gray", displayOrder: 1, benefitsJson: "[]" },
        { tier: "PLATA", minOrdersPerMonth: 30, commissionRate: 7, badgeText: "Destacado", badgeColor: "blue", displayOrder: 2, benefitsJson: '["Comisión reducida 7%","Prioridad en soporte"]' },
        { tier: "ORO", minOrdersPerMonth: 80, commissionRate: 6, badgeText: "Popular", badgeColor: "yellow", displayOrder: 3, benefitsJson: '["Comisión reducida 6%","Prioridad en soporte","Destacado en búsquedas"]' },
        { tier: "DIAMANTE", minOrdersPerMonth: 200, commissionRate: 5, badgeText: "Elite", badgeColor: "purple", displayOrder: 4, benefitsJson: '["Comisión reducida 5%","Soporte prioritario 24/7","Destacado en home","Account manager dedicado"]' },
    ];

    for (const lt of loyaltyTiers) {
        await prisma.merchantLoyaltyConfig.upsert({
            where: { tier: lt.tier },
            update: {},
            create: lt,
        });
    }
    console.log("✅ MerchantLoyaltyConfig ensured (4 tiers)");

    // ─── 7. Package Categories (for delivery sizing) ────────────────
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

    // ─── 8. Delivery Rates (one per package category) ───────────────
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

    // ─── 9. Package Pricing Tiers (for B2B custom builder) ──────────
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

    // ─── 10. Canned Responses (soporte) ─────────────────────────────
    const cannedResponses = [
        { shortcut: "/saludo", title: "Saludo inicial", content: "¡Hola! Soy del equipo de MOOVY. ¿En qué puedo ayudarte?", category: "general", sortOrder: 1 },
        { shortcut: "/espera", title: "Pedir paciencia", content: "Dame unos minutos para revisar tu caso. Ya te respondo.", category: "general", sortOrder: 2 },
        { shortcut: "/pedido-estado", title: "Estado del pedido", content: "Estoy revisando el estado de tu pedido. Un momento por favor.", category: "pedido", sortOrder: 3 },
        { shortcut: "/pedido-demora", title: "Demora en pedido", content: "Lamento la demora. Estoy contactando al comercio para acelerar tu pedido.", category: "pedido", sortOrder: 4 },
        { shortcut: "/pago-pendiente", title: "Pago pendiente", content: "Veo que el pago todavía está pendiente. ¿Pudiste completarlo desde MercadoPago?", category: "pago", sortOrder: 5 },
        { shortcut: "/pago-reembolso", title: "Reembolso", content: "Voy a gestionar el reembolso ahora. Puede demorar hasta 48hs en reflejarse en tu cuenta de MercadoPago.", category: "pago", sortOrder: 6 },
        { shortcut: "/cuenta-datos", title: "Datos de cuenta", content: "Para proteger tu seguridad, no puedo modificar datos sensibles por chat. Podés actualizarlos desde tu perfil en la app.", category: "cuenta", sortOrder: 7 },
        { shortcut: "/cierre", title: "Cierre de chat", content: "¡Listo! ¿Hay algo más en lo que pueda ayudarte? Si no, cierro el chat. ¡Que tengas un excelente día!", category: "cierre", sortOrder: 8 },
        { shortcut: "/horario", title: "Horario de atención", content: "Nuestro horario de atención es de lunes a sábado de 9:00 a 21:00. Fuera de ese horario, dejanos tu mensaje y te respondemos apenas abramos.", category: "general", sortOrder: 9 },
        { shortcut: "/repartidor", title: "Problema con repartidor", content: "Lamento el inconveniente. Voy a reportar la situación al equipo de operaciones para que tomen acción.", category: "pedido", sortOrder: 10 },
    ];

    for (const cr of cannedResponses) {
        const exists = await prisma.cannedResponse.findUnique({ where: { shortcut: cr.shortcut } });
        if (!exists) {
            await prisma.cannedResponse.create({ data: cr });
        }
    }
    console.log(`✅ CannedResponses ensured (${cannedResponses.length} responses)`);

    // ─── Resumen final ──────────────────────────────────────────────
    console.log("\n🎉 Production seed complete!");
    console.log("   → Admin: maurod@me.com");
    console.log("   → Modo mantenimiento: ACTIVADO");
    console.log("   → Categorías, loyalty, delivery rates, soporte: TODO listo");
    console.log("   → La app está lista para recibir registros de comercios, repartidores y vendedores.\n");
}

main()
    .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
