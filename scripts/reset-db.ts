/**
 * 🔄 MOOVY — Reset local database to clean state
 *
 * Leaves: 1 admin, 3 merchants (3 products each), categories, configs
 * Deletes: Everything else (users, orders, drivers, sellers, etc.)
 *
 * Run: npx tsx scripts/reset-db.ts
 *
 * Safe to run repeatedly for local testing.
 * NEVER run this on production.
 */

import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Config ──────────────────────────────────────────────────────────────────

const ADMIN_EMAIL = "admin@somosmoovy.com";
const ADMIN_PASSWORD = "demo2026";
const ADMIN_NAME = "Admin Moovy";

const MERCHANTS = [
    {
        name: "El Falafel Ushuaia",
        slug: "el-falafel-ushuaia",
        category: "Restaurante",
        description: "Cocina árabe y mediterránea en el fin del mundo",
        email: "falafel@test.com",
        phone: "+5492901555001",
        address: "San Martín 456, Ushuaia",
        latitude: -54.8069,
        longitude: -68.3044,
        scheduleJson: JSON.stringify({ "1": { open: "11:00", close: "23:00" }, "2": { open: "11:00", close: "23:00" }, "3": { open: "11:00", close: "23:00" }, "4": { open: "11:00", close: "23:00" }, "5": { open: "11:00", close: "00:00" }, "6": { open: "11:00", close: "00:00" }, "7": { open: "12:00", close: "22:00" } }),
        products: [
            { name: "Falafel Wrap", price: 4500, costPrice: 2000, stock: 50, description: "Wrap de falafel con hummus, tahini y ensalada fresca" },
            { name: "Shawarma de Pollo", price: 5200, costPrice: 2500, stock: 40, description: "Shawarma de pollo con salsa de ajo y vegetales" },
            { name: "Plato Mixto Árabe", price: 7800, costPrice: 3500, stock: 30, description: "Falafel, shawarma, hummus, tabouleh y pan pita" },
        ],
    },
    {
        name: "La Estancia del Sur",
        slug: "la-estancia-del-sur",
        category: "Parrilla",
        description: "La mejor carne patagónica a tu puerta",
        email: "estancia@test.com",
        phone: "+5492901555002",
        address: "Maipú 780, Ushuaia",
        latitude: -54.8025,
        longitude: -68.3065,
        scheduleJson: JSON.stringify({ "1": { open: "12:00", close: "23:30" }, "2": { open: "12:00", close: "23:30" }, "3": { open: "12:00", close: "23:30" }, "4": { open: "12:00", close: "23:30" }, "5": { open: "12:00", close: "00:30" }, "6": { open: "12:00", close: "00:30" }, "7": { open: "12:00", close: "23:00" } }),
        products: [
            { name: "Bife de Chorizo 400g", price: 8900, costPrice: 4500, stock: 25, description: "Corte premium a la parrilla con guarnición a elección" },
            { name: "Cordero Patagónico", price: 9500, costPrice: 5000, stock: 15, description: "Costillar de cordero patagónico con papas rústicas" },
            { name: "Tabla de Asado (2 personas)", price: 14500, costPrice: 7000, stock: 20, description: "Vacío, chorizo, morcilla, ensalada y pan casero" },
        ],
    },
    {
        name: "Patagonia Dreams Café",
        slug: "patagonia-dreams-cafe",
        category: "Cafetería",
        description: "Café de especialidad y pastelería artesanal",
        email: "dreams@test.com",
        phone: "+5492901555003",
        address: "25 de Mayo 120, Ushuaia",
        latitude: -54.8042,
        longitude: -68.3028,
        scheduleJson: JSON.stringify({ "1": { open: "08:00", close: "20:00" }, "2": { open: "08:00", close: "20:00" }, "3": { open: "08:00", close: "20:00" }, "4": { open: "08:00", close: "20:00" }, "5": { open: "08:00", close: "21:00" }, "6": { open: "09:00", close: "21:00" }, "7": { open: "09:00", close: "19:00" } }),
        products: [
            { name: "Café Latte de Especialidad", price: 2800, costPrice: 800, stock: 100, description: "Café de origen colombiano con leche vaporizada y arte latte" },
            { name: "Torta de Chocolate Belga", price: 4200, costPrice: 1500, stock: 20, description: "Porción generosa de torta con chocolate belga 70% cacao" },
            { name: "Combo Desayuno Patagónico", price: 5500, costPrice: 2200, stock: 30, description: "Café o té + tostadas + mermelada casera de calafate + jugo" },
        ],
    },
];

const CATEGORIES = [
    { name: "Restaurante", slug: "restaurante", order: 1, scope: "STORE" },
    { name: "Parrilla", slug: "parrilla", order: 2, scope: "STORE" },
    { name: "Cafetería", slug: "cafeteria", order: 3, scope: "STORE" },
    { name: "Pizzería", slug: "pizzeria", order: 4, scope: "STORE" },
    { name: "Comida Rápida", slug: "comida-rapida", order: 5, scope: "STORE" },
    { name: "Heladería", slug: "heladeria", order: 6, scope: "STORE" },
    { name: "Supermercado", slug: "supermercado", order: 7, scope: "STORE" },
    { name: "Ropa y Accesorios", slug: "ropa-y-accesorios", order: 1, scope: "MARKETPLACE" },
    { name: "Electrónica", slug: "electronica", order: 2, scope: "MARKETPLACE" },
    { name: "Hogar", slug: "hogar", order: 3, scope: "MARKETPLACE" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log("\n🔄 MOOVY — Reset de base de datos local\n");
    console.log("=".repeat(55));

    // ─── PHASE 1: Nuclear cleanup ──────────────────────────────────────────

    console.log("\n🗑️  Fase 1: Limpiando todas las tablas transaccionales...\n");

    // Tables to TRUNCATE (order matters for foreign keys, CASCADE handles most)
    // We preserve: StoreSettings, PointsConfig, MoovyConfig, MerchantLoyaltyConfig,
    //              DeliveryRate, PackagePricingTier, PackageCategory, CannedResponse,
    //              ConfigAuditLog, spatial_ref_sys
    const tablesToTruncate = [
        // Chat & support
        '"OrderChatMessage"', '"OrderChat"',
        '"SupportMessage"', '"SupportChat"', '"SupportOperator"',
        // Orders & payments
        '"DriverLocationHistory"', '"AssignmentLog"', '"PendingAssignment"',
        '"Payment"', '"MpWebhookLog"', '"OrderBackup"',
        '"OrderItem"', '"SubOrder"', '"Order"',
        // User data
        '"CartItem"', '"SavedCart"', '"PointsTransaction"',
        '"Favorite"', '"CouponUsage"', '"Coupon"',
        '"Referral"', '"Bid"', '"AuditLog"',
        '"PushSubscription"', '"Address"',
        // Listings & seller
        '"ListingImage"', '"Listing"',
        '"SellerAvailability"', '"SellerProfile"',
        // Driver
        '"Driver"',
        // Products & merchants
        '"ProductImage"', '"ProductVariant"', '"ProductCategory"',
        '"MerchantAcquiredProduct"', '"MerchantCategory"',
        '"PackagePurchase"', '"AdPlacement"',
        '"Product"', '"Merchant"',
        // Categories & home
        '"HomeCategorySlot"', '"HeroSlide"', '"Category"',
        // Users
        '"UserRole"', '"User"',
    ];

    for (const table of tablesToTruncate) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${table} CASCADE`);
            console.log(`   ✓ ${table}`);
        } catch (e: any) {
            // Table might not exist yet (pending migration)
            console.log(`   ⚠ ${table}: ${e.message?.split("\n")[0]}`);
        }
    }

    // ─── PHASE 2: Recreate base data ──────────────────────────────────────

    console.log("\n🔨 Fase 2: Creando datos base...\n");

    // 2a. Admin user
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);
    const admin = await prisma.user.create({
        data: {
            email: ADMIN_EMAIL,
            password: hashedPassword,
            name: ADMIN_NAME,
            role: "ADMIN",
            emailVerified: new Date(),
            roles: {
                create: [
                    { role: "USER", isActive: true },
                    { role: "ADMIN", isActive: true },
                ],
            },
        },
    });
    console.log(`   ✅ Admin: ${admin.email}`);

    // 2b. Categories
    for (const cat of CATEGORIES) {
        await prisma.category.create({
            data: {
                name: cat.name,
                slug: cat.slug,
                order: cat.order,
                scope: cat.scope,
                isActive: true,
            },
        });
    }
    console.log(`   ✅ Categorías: ${CATEGORIES.length}`);

    // 2c. Merchants (all owned by admin for simplicity) + Products
    for (const m of MERCHANTS) {
        // Find matching category
        const category = await prisma.category.findFirst({
            where: { name: m.category },
        });

        const merchant = await prisma.merchant.create({
            data: {
                name: m.name,
                slug: m.slug,
                description: m.description,
                category: m.category,
                email: m.email,
                phone: m.phone,
                address: m.address,
                latitude: m.latitude,
                longitude: m.longitude,
                isActive: true,
                isOpen: true,
                isVerified: true,
                scheduleEnabled: true,
                scheduleJson: m.scheduleJson,
                approvalStatus: "APPROVED",
                approvedAt: new Date(),
                deliveryRadiusKm: 5,
                deliveryTimeMin: 30,
                deliveryTimeMax: 45,
                minOrderAmount: 2000,
                ownerId: admin.id,
                commissionRate: 8,
                ...(category && {
                    categories: {
                        create: { categoryId: category.id },
                    },
                }),
            },
        });

        // Create products
        for (const p of m.products) {
            const productSlug = slugify(`${p.name}-${m.slug}`);
            await prisma.product.create({
                data: {
                    name: p.name,
                    slug: productSlug,
                    description: p.description,
                    price: p.price,
                    costPrice: p.costPrice,
                    stock: p.stock,
                    isActive: true,
                    merchantId: merchant.id,
                    ...(category && {
                        categories: {
                            create: { categoryId: category.id },
                        },
                    }),
                },
            });
        }

        console.log(`   ✅ ${m.name}: ${m.products.length} productos`);
    }

    // 2d. Add COMERCIO role to admin (so admin can access merchant panels)
    await prisma.userRole.create({
        data: { userId: admin.id, role: "COMERCIO", isActive: true },
    });

    // ─── PHASE 3: Ensure configs exist ────────────────────────────────────

    console.log("\n⚙️  Fase 3: Verificando configuraciones...\n");

    // StoreSettings singleton
    const settings = await prisma.storeSettings.findFirst();
    if (!settings) {
        await prisma.storeSettings.create({ data: { id: "settings" } });
        console.log("   ✅ StoreSettings creado");
    } else {
        console.log("   ✓ StoreSettings existe");
    }

    // PointsConfig singleton
    const pointsConfig = await prisma.pointsConfig.findFirst();
    if (!pointsConfig) {
        await prisma.pointsConfig.create({ data: { id: "points_config" } });
        console.log("   ✅ PointsConfig creado");
    } else {
        console.log("   ✓ PointsConfig existe");
    }

    // MoovyConfig keys
    const moovyConfigKeys = [
        { key: "merchant_confirm_timeout", value: "300", description: "Timeout en segundos para que el comercio confirme un pedido" },
        { key: "driver_response_timeout", value: "60", description: "Timeout en segundos para que el repartidor acepte un pedido" },
        { key: "max_assignment_attempts", value: "5", description: "Máximo de intentos de asignación de repartidor" },
        { key: "assignment_radius_km", value: "10", description: "Radio en km para buscar repartidores disponibles" },
    ];
    for (const { key, value, description } of moovyConfigKeys) {
        const existing = await prisma.moovyConfig.findUnique({ where: { key } });
        if (!existing) {
            await prisma.moovyConfig.create({ data: { key, value, description } });
        }
    }
    console.log("   ✅ MoovyConfig verificado");

    // MerchantLoyaltyConfig tiers
    const tiers = [
        { tier: "BRONCE", minOrdersPerMonth: 0, commissionRate: 8, badgeText: "Nuevo", badgeColor: "gray", displayOrder: 0 },
        { tier: "PLATA", minOrdersPerMonth: 30, commissionRate: 7, badgeText: "Destacado", badgeColor: "blue", displayOrder: 1 },
        { tier: "ORO", minOrdersPerMonth: 80, commissionRate: 6, badgeText: "Popular", badgeColor: "yellow", displayOrder: 2 },
        { tier: "DIAMANTE", minOrdersPerMonth: 200, commissionRate: 5, badgeText: "Elite", badgeColor: "purple", displayOrder: 3 },
    ];
    for (const t of tiers) {
        const existing = await prisma.merchantLoyaltyConfig.findFirst({ where: { tier: t.tier } });
        if (!existing) {
            await prisma.merchantLoyaltyConfig.create({ data: t });
        }
    }
    console.log("   ✅ MerchantLoyaltyConfig verificado");

    // DeliveryRates se preservan (no se truncan) — dependen de PackageCategory
    const drCount = await prisma.deliveryRate.count();
    console.log(`   ✓ DeliveryRates existentes: ${drCount}`);

    // ─── Summary ──────────────────────────────────────────────────────────

    const counts = {
        users: await prisma.user.count(),
        merchants: await prisma.merchant.count(),
        products: await prisma.product.count(),
        categories: await prisma.category.count(),
        orders: await prisma.order.count(),
    };

    console.log("\n" + "=".repeat(55));
    console.log("📊 Estado final:");
    console.log(`   👤 Usuarios: ${counts.users}`);
    console.log(`   🏪 Comercios: ${counts.merchants}`);
    console.log(`   📦 Productos: ${counts.products}`);
    console.log(`   🏷️  Categorías: ${counts.categories}`);
    console.log(`   📋 Pedidos: ${counts.orders}`);
    console.log("=".repeat(55));
    console.log("\n✨ Base de datos reseteada exitosamente.\n");
    console.log("   Credenciales admin:");
    console.log(`   📧 Email: ${ADMIN_EMAIL}`);
    console.log(`   🔑 Password: ${ADMIN_PASSWORD}`);
    console.log("");
}

main()
    .catch(e => {
        console.error("\n❌ Error durante el reset:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());