/**
 * LOCAL DB Reset: Borra TODO y seedea con datos de demo.
 *
 * Resultado final:
 *   - 1 admin (admin@somosmoovy.com)
 *   - 3 comercios APPROVED con 3 productos cada uno (con fotos)
 *   - 0 clientes, 0 repartidores, 0 pedidos
 *   - Toda la config operativa (StoreSettings, PointsConfig, MoovyConfig, categorías, etc.)
 *
 * Uso:
 *   npx tsx prisma/seed-local-reset.ts
 *
 * ⚠️  DESTRUCTIVO: borra toda la base de datos local. Solo para desarrollo.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─── Imágenes de productos que ya existen en public/uploads/products/ ────────
const productImages: Record<string, string[]> = {
    // Comercio 1: Patagonia Drinks (Kiosco/Bebidas)
    "heineken-1l": ["/uploads/products/1770304665330-HEINEKEN_1L.webp"],
    "patagonia-247": ["/uploads/products/1770304942603-PATAGONIA_24.7.webp"],
    "schneider-710": ["/uploads/products/1770305081726-SCHNEIDER_710.webp"],

    // Comercio 2: El Falafel (Restaurante)
    "falafel-clasico": ["/uploads/products/1770009341029-Falafel-S2.jpg"],
    "vino-santa-julia": ["/uploads/products/1770304130508-santa-julia-varietal-tardio1-37606a1f9b87ecfe9916845380691395-640-0.webp"],
    "aquarius-manzana": ["/uploads/products/1770304706896-AQUARIUS_MANZANA_2.25lts.webp"],

    // Comercio 3: La Estancia (Parrilla)
    "tabla-estancia": ["/uploads/products/1774652896943-laestancia.webp"],
    "beagle-red-ale": ["/uploads/products/1770305051620-BEAGLE_RED_ALE.webp"],
    "cepita-naranja": ["/uploads/products/1770304792812-CEPITA_NARANJA_1.5.webp"],
};

async function main() {
    console.log("\n🔴 RESET LOCAL DATABASE — Borrando todo...\n");

    // ─── 1. Nuclear delete (orden para respetar FKs) ────────────────
    // Prisma no soporta CASCADE fácil, así que borramos en orden inverso de dependencias
    await prisma.$executeRawUnsafe(`DROP SCHEMA public CASCADE`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA public`);
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis`);
    console.log("✅ Schema dropped and recreated (PostGIS restored)");

    // Push schema
    console.log("⏳ Running db push...");
    const { execSync } = require("child_process");
    execSync("npx prisma db push", { stdio: "inherit" });

    // Need to reconnect after schema recreation
    await prisma.$disconnect();
    // Re-import fresh client
    const { PrismaClient: FreshPrisma } = require("@prisma/client");
    const db = new FreshPrisma() as PrismaClient;

    console.log("\n🌱 Seeding fresh data...\n");

    // ─── 2. Admin user ──────────────────────────────────────────────
    const adminPw = await bcrypt.hash("demo2026", 12);
    const admin = await db.user.create({
        data: {
            email: "admin@somosmoovy.com",
            password: adminPw,
            name: "Admin MOOVY",
            firstName: "Admin",
            lastName: "MOOVY",
            role: "ADMIN",
        },
    });
    await db.userRole.create({ data: { userId: admin.id, role: "ADMIN" } });
    await db.userRole.create({ data: { userId: admin.id, role: "USER" } });
    console.log("✅ Admin: admin@somosmoovy.com / demo2026");

    // ─── 3. Store Settings ──────────────────────────────────────────
    await db.storeSettings.create({
        data: {
            id: "settings",
            isOpen: true,
            closedMessage: "Volvemos pronto",
            isMaintenanceMode: false,
            maintenanceMessage: "Estamos preparando todo para vos. MOOVY llega pronto a Ushuaia.",
            tiendaMaintenance: false,
            storeName: "Moovy Ushuaia",
            storeAddress: "Ushuaia, Tierra del Fuego",
            originLat: -54.8019,
            originLng: -68.303,
            fuelPricePerLiter: 1591,
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
            merchantConfirmTimeoutSec: 300,
            driverResponseTimeoutSec: 60,
            maxOrdersPerSlot: 15,
            slotDurationMinutes: 120,
            minAnticipationHours: 1.5,
            maxAnticipationHours: 48,
            operatingHoursStart: "09:00",
            operatingHoursEnd: "22:00",
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
    console.log("✅ StoreSettings (modo mantenimiento DESACTIVADO para local)");

    // ─── 4. Points Config ───────────────────────────────────────────
    await db.pointsConfig.create({
        data: {
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
    console.log("✅ PointsConfig");

    // ─── 5. MoovyConfig ─────────────────────────────────────────────
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
        await db.moovyConfig.create({ data: cfg });
    }
    console.log("✅ MoovyConfig (10 keys)");

    // ─── 6. Categories ──────────────────────────────────────────────
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
        await db.category.create({ data: cat });
    }
    console.log("✅ Categorías (12 store + 9 marketplace)");

    // Get category IDs for linking
    const catKiosco = await db.category.findUnique({ where: { slug: "kiosco" } });
    const catRestaurante = await db.category.findUnique({ where: { slug: "restaurante" } });
    const catParrilla = await db.category.findUnique({ where: { slug: "parrilla" } });

    // ─── 7. Loyalty Tiers ───────────────────────────────────────────
    const loyaltyTiers = [
        { tier: "BRONCE", minOrdersPerMonth: 0, commissionRate: 8, badgeText: "Nuevo", badgeColor: "gray", displayOrder: 1, benefitsJson: "[]" },
        { tier: "PLATA", minOrdersPerMonth: 30, commissionRate: 7, badgeText: "Destacado", badgeColor: "blue", displayOrder: 2, benefitsJson: '["Comisión reducida 7%","Prioridad en soporte"]' },
        { tier: "ORO", minOrdersPerMonth: 80, commissionRate: 6, badgeText: "Popular", badgeColor: "yellow", displayOrder: 3, benefitsJson: '["Comisión reducida 6%","Prioridad en soporte","Destacado en búsquedas"]' },
        { tier: "DIAMANTE", minOrdersPerMonth: 200, commissionRate: 5, badgeText: "Elite", badgeColor: "purple", displayOrder: 4, benefitsJson: '["Comisión reducida 5%","Soporte prioritario 24/7","Destacado en home","Account manager dedicado"]' },
    ];
    for (const lt of loyaltyTiers) {
        await db.merchantLoyaltyConfig.create({ data: lt });
    }
    console.log("✅ MerchantLoyaltyConfig (4 tiers)");

    // ─── 8. Package Categories + Delivery Rates ─────────────────────
    const packageCats = [
        { name: "MICRO", maxWeightGrams: 500, maxLengthCm: 20, maxWidthCm: 15, maxHeightCm: 10, volumeScore: 1, allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"], displayOrder: 1 },
        { name: "SMALL", maxWeightGrams: 2000, maxLengthCm: 35, maxWidthCm: 25, maxHeightCm: 20, volumeScore: 3, allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"], displayOrder: 2 },
        { name: "MEDIUM", maxWeightGrams: 5000, maxLengthCm: 50, maxWidthCm: 40, maxHeightCm: 30, volumeScore: 6, allowedVehicles: ["MOTO", "CAR", "TRUCK"], displayOrder: 3 },
        { name: "LARGE", maxWeightGrams: 15000, maxLengthCm: 80, maxWidthCm: 60, maxHeightCm: 50, volumeScore: 10, allowedVehicles: ["CAR", "TRUCK"], displayOrder: 4 },
        { name: "XL", maxWeightGrams: 50000, maxLengthCm: 120, maxWidthCm: 80, maxHeightCm: 80, volumeScore: 20, allowedVehicles: ["TRUCK"], displayOrder: 5 },
    ];
    const rateDefaults: Record<string, { base: number; perKm: number }> = {
        MICRO: { base: 300, perKm: 80 },
        SMALL: { base: 400, perKm: 100 },
        MEDIUM: { base: 600, perKm: 130 },
        LARGE: { base: 900, perKm: 180 },
        XL: { base: 1500, perKm: 250 },
    };
    for (const cat of packageCats) {
        const created = await db.packageCategory.create({ data: cat });
        const rd = rateDefaults[cat.name];
        if (rd) {
            await db.deliveryRate.create({ data: { categoryId: created.id, basePriceArs: rd.base, pricePerKmArs: rd.perKm } });
        }
    }
    console.log("✅ PackageCategories + DeliveryRates");

    // ─── 9. Package Pricing Tiers ───────────────────────────────────
    const tiers = [
        { name: "Pack x10", minItems: 1, maxItems: 10, pricePerItem: 150, totalPrice: 1500, order: 1 },
        { name: "Pack x25", minItems: 11, maxItems: 25, pricePerItem: 120, totalPrice: 3000, order: 2 },
        { name: "Pack x50", minItems: 26, maxItems: 50, pricePerItem: 90, totalPrice: 4500, order: 3 },
    ];
    for (const tier of tiers) {
        await db.packagePricingTier.create({ data: tier });
    }
    console.log("✅ PackagePricingTiers");

    // ─── 10. Canned Responses ───────────────────────────────────────
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
        await db.cannedResponse.create({ data: cr });
    }
    console.log("✅ CannedResponses (10)");

    // ═══════════════════════════════════════════════════════════════════
    // ─── 11. COMERCIOS + PRODUCTOS ──────────────────────────────────
    // ═══════════════════════════════════════════════════════════════════

    // Helper: create merchant owner user + merchant + products
    async function createMerchantWithProducts(data: {
        ownerEmail: string;
        ownerName: string;
        ownerPassword: string;
        merchant: {
            name: string;
            slug: string;
            description: string;
            phone: string;
            address: string;
            lat: number;
            lng: number;
            category: string;
            categorySlug: string;
        };
        products: Array<{
            name: string;
            slug: string;
            description: string;
            price: number;
            costPrice: number;
            stock: number;
            imageKey: string;
        }>;
    }) {
        // Owner user
        const pw = await bcrypt.hash(data.ownerPassword, 12);
        const owner = await db.user.create({
            data: {
                email: data.ownerEmail,
                password: pw,
                name: data.ownerName,
                role: "COMERCIO",
            },
        });
        await db.userRole.create({ data: { userId: owner.id, role: "COMERCIO" } });
        await db.userRole.create({ data: { userId: owner.id, role: "USER" } });

        // Merchant (APPROVED)
        const merchant = await db.merchant.create({
            data: {
                name: data.merchant.name,
                slug: data.merchant.slug,
                description: data.merchant.description,
                phone: data.merchant.phone,
                address: data.merchant.address,
                latitude: data.merchant.lat,
                longitude: data.merchant.lng,
                category: data.merchant.category,
                ownerId: owner.id,
                email: data.ownerEmail,
                isActive: true,
                isOpen: true,
                approvalStatus: "APPROVED",
                approvedAt: new Date(),
                commissionRate: 8,
                deliveryRadiusKm: 5,
                deliveryTimeMin: 30,
                deliveryTimeMax: 45,
                scheduleEnabled: true,
                scheduleJson: JSON.stringify({
                    "1": { open: "09:00", close: "22:00" },
                    "2": { open: "09:00", close: "22:00" },
                    "3": { open: "09:00", close: "22:00" },
                    "4": { open: "09:00", close: "22:00" },
                    "5": { open: "09:00", close: "23:00" },
                    "6": { open: "10:00", close: "23:00" },
                    "0": { open: "10:00", close: "21:00" },
                }),
                acceptedTermsAt: new Date(),
                acceptedPrivacyAt: new Date(),
            },
        });

        // Link merchant to category
        const cat = await db.category.findUnique({ where: { slug: data.merchant.categorySlug } });
        if (cat) {
            await db.merchantCategory.create({
                data: { merchantId: merchant.id, categoryId: cat.id },
            });
        }

        // Products with images
        for (const prod of data.products) {
            const product = await db.product.create({
                data: {
                    name: prod.name,
                    slug: prod.slug,
                    description: prod.description,
                    price: prod.price,
                    costPrice: prod.costPrice,
                    stock: prod.stock,
                    merchantId: merchant.id,
                    isActive: true,
                },
            });

            // Link product to category
            if (cat) {
                await db.productCategory.create({
                    data: { productId: product.id, categoryId: cat.id },
                });
            }

            // Product images
            const imgs = productImages[prod.imageKey] || [];
            for (let i = 0; i < imgs.length; i++) {
                await db.productImage.create({
                    data: {
                        productId: product.id,
                        url: imgs[i],
                        alt: prod.name,
                        order: i,
                    },
                });
            }
        }

        console.log(`✅ Comercio: ${data.merchant.name} (${data.ownerEmail}) — 3 productos con fotos`);
    }

    // ─── Comercio 1: Patagonia Drinks (Kiosco) ─────────────────────
    await createMerchantWithProducts({
        ownerEmail: "comercio1@somosmoovy.com",
        ownerName: "Carlos Patagonia",
        ownerPassword: "demo2026",
        merchant: {
            name: "Patagonia Drinks",
            slug: "patagonia-drinks",
            description: "Las mejores bebidas del fin del mundo. Cervezas artesanales, gaseosas y más.",
            phone: "+5492901555001",
            address: "San Martín 456, Ushuaia",
            lat: -54.8069,
            lng: -68.3042,
            category: "Kiosco",
            categorySlug: "kiosco",
        },
        products: [
            {
                name: "Heineken Lata 1L",
                slug: "heineken-1l",
                description: "Cerveza Heineken lata grande 1 litro. Ideal para compartir.",
                price: 3500,
                costPrice: 2800,
                stock: 50,
                imageKey: "heineken-1l",
            },
            {
                name: "Patagonia 24.7",
                slug: "patagonia-247",
                description: "Cerveza Patagonia 24.7 Session IPA. Suave y refrescante.",
                price: 4200,
                costPrice: 3400,
                stock: 30,
                imageKey: "patagonia-247",
            },
            {
                name: "Schneider 710ml",
                slug: "schneider-710",
                description: "Cerveza Schneider rubia 710ml. Un clásico argentino.",
                price: 2800,
                costPrice: 2100,
                stock: 40,
                imageKey: "schneider-710",
            },
        ],
    });

    // ─── Comercio 2: El Falafel (Restaurante) ──────────────────────
    await createMerchantWithProducts({
        ownerEmail: "comercio2@somosmoovy.com",
        ownerName: "Ana Falafel",
        ownerPassword: "demo2026",
        merchant: {
            name: "El Falafel Ushuaia",
            slug: "el-falafel-ushuaia",
            description: "Comida mediterránea en el fin del mundo. Falafel, hummus y sabores únicos.",
            phone: "+5492901555002",
            address: "Gobernador Paz 789, Ushuaia",
            lat: -54.8085,
            lng: -68.3120,
            category: "Restaurante",
            categorySlug: "restaurante",
        },
        products: [
            {
                name: "Falafel Clásico",
                slug: "falafel-clasico",
                description: "6 unidades de falafel casero con salsa tahini. Receta original.",
                price: 5500,
                costPrice: 3200,
                stock: 20,
                imageKey: "falafel-clasico",
            },
            {
                name: "Vino Santa Julia Tardío",
                slug: "vino-santa-julia-tardio",
                description: "Vino dulce Santa Julia cosecha tardía. Perfecto para postres.",
                price: 7800,
                costPrice: 5500,
                stock: 15,
                imageKey: "vino-santa-julia",
            },
            {
                name: "Aquarius Manzana 2.25L",
                slug: "aquarius-manzana-225",
                description: "Agua saborizada Aquarius manzana 2.25 litros.",
                price: 2200,
                costPrice: 1600,
                stock: 25,
                imageKey: "aquarius-manzana",
            },
        ],
    });

    // ─── Comercio 3: La Estancia del Sur (Parrilla) ────────────────
    await createMerchantWithProducts({
        ownerEmail: "comercio3@somosmoovy.com",
        ownerName: "Pedro Estancia",
        ownerPassword: "demo2026",
        merchant: {
            name: "La Estancia del Sur",
            slug: "la-estancia-del-sur",
            description: "La mejor parrilla de Ushuaia. Carnes premium y cordero fueguino.",
            phone: "+5492901555003",
            address: "Maipú 1234, Ushuaia",
            lat: -54.8010,
            lng: -68.2985,
            category: "Parrilla",
            categorySlug: "parrilla",
        },
        products: [
            {
                name: "Tabla La Estancia",
                slug: "tabla-la-estancia",
                description: "Tabla de fiambres y quesos patagónicos para 2 personas.",
                price: 12500,
                costPrice: 8000,
                stock: 10,
                imageKey: "tabla-estancia",
            },
            {
                name: "Beagle Red Ale",
                slug: "beagle-red-ale",
                description: "Cerveza artesanal Beagle Red Ale. Elaborada en Ushuaia.",
                price: 4500,
                costPrice: 3200,
                stock: 20,
                imageKey: "beagle-red-ale",
            },
            {
                name: "Cepita Naranja 1.5L",
                slug: "cepita-naranja-15",
                description: "Jugo Cepita de naranja 1.5 litros. Natural y refrescante.",
                price: 2000,
                costPrice: 1400,
                stock: 30,
                imageKey: "cepita-naranja",
            },
        ],
    });

    // ─── Resumen ────────────────────────────────────────────────────
    console.log("\n🎉 LOCAL DATABASE RESET COMPLETE!\n");
    console.log("   👤 Admin:     admin@somosmoovy.com / demo2026");
    console.log("   🏪 Comercio 1: Patagonia Drinks — comercio1@somosmoovy.com / demo2026");
    console.log("   🏪 Comercio 2: El Falafel Ushuaia — comercio2@somosmoovy.com / demo2026");
    console.log("   🏪 Comercio 3: La Estancia del Sur — comercio3@somosmoovy.com / demo2026");
    console.log("   📦 9 productos con fotos (3 por comercio)");
    console.log("   🛒 0 clientes, 0 repartidores, 0 pedidos");
    console.log("   ⚙️  Config completa (StoreSettings, Points, MoovyConfig, categorías, loyalty)\n");

    await db.$disconnect();
}

main()
    .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
    .finally(() => prisma.$disconnect());
