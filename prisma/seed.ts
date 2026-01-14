// Seed script for Polirrubro San Juan
// Run with: npx tsx prisma/seed.ts

import "dotenv/config";
import path from "path";

// Set database URL if not set
if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = `file:${path.join(process.cwd(), "prisma", "dev.db")}`;
}

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database for Moovy...\n");

    // ==================== STORE SETTINGS ====================
    console.log("⚙️  Creating store settings...");
    await prisma.storeSettings.upsert({
        where: { id: "settings" },
        update: {},
        create: {
            id: "settings",
            isOpen: true,
            closedMessage: "Estamos cerrados. ¡Volvemos pronto!",
            fuelPricePerLiter: 1200,
            fuelConsumptionPerKm: 0.06,
            baseDeliveryFee: 500,
            maintenanceFactor: 1.35,
            maxDeliveryDistance: 15,
            storeName: "Moovy Ushuaia",
            storeAddress: "Ushuaia, Tierra del Fuego",
            originLat: -54.8019, // Ushuaia coordinates
            originLng: -68.3030,
        },
    });

    // ==================== CATEGORIES ====================
    console.log("📦 Creating categories...");
    const categoriesData = [
        { name: "Lácteos", slug: "lacteos", icon: "Milk" },
        { name: "Bebidas", slug: "bebidas", icon: "Wine" },
        { name: "Sandwichería", slug: "sandwicheria", icon: "Sandwich" },
        { name: "Golosinas", slug: "golosinas", icon: "Candy" },
        { name: "Almacén", slug: "almacen", icon: "Store" },
        { name: "Limpieza", slug: "limpieza", icon: "SprayCan" },
    ];

    const categories = {};
    for (const cat of categoriesData) {
        const category = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: {
                name: cat.name,
                slug: cat.slug,
                description: `Todo en ${cat.name}`,
                isActive: true,
                order: 1
            },
        });
        categories[cat.slug] = category;
    }


    // Actually, I can allow the script to continue to Users/Merchant, 
    // and then fill the '... products loop ...' placeholder at the end.

    /* 
       Note: The user asked me to replace the placeholders.
       I will split this into two Replace operations or one big one if contiguous?
       They are NOT contiguous (Line 41 vs 142).
       I must use multi_replace or two tool calls.
       I'll use multi_replace_file_content.
    */

    // ==================== USERS ====================
    console.log("👤 Creating users...");

    // Admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
        where: { email: "admin@somosmoovy.com" },
        update: {},
        create: {
            email: "admin@somosmoovy.com",
            password: adminPassword,
            name: "Super Admin Moovy",
            phone: "+5492901555555",
            role: "ADMIN",
        },
    });

    // Demo customer
    const userPassword = await bcrypt.hash("demo123", 10);
    const demoUser = await prisma.user.upsert({
        where: { email: "cliente@somosmoovy.com" },
        update: {},
        create: {
            email: "cliente@somosmoovy.com",
            password: userPassword,
            name: "Cliente Demo",
            phone: "+5492901123456",
            role: "USER",
        },
    });

    // Demo driver
    const driverPassword = await bcrypt.hash("driver123", 10);
    const driverUser = await prisma.user.upsert({
        where: { email: "repartidor@somosmoovy.com" },
        update: {},
        create: {
            email: "repartidor@somosmoovy.com",
            password: driverPassword,
            name: "Juan Repartidor",
            phone: "+5492901999999",
            role: "DRIVER",
        },
    });

    // ... (driver profile) ...

    // ==================== MERCHANTS ====================
    console.log("🏪 Creating merchant...");

    // Create Merchant Owner
    const merchantPassword = await bcrypt.hash("merchant123", 10);
    const merchantUser = await prisma.user.upsert({
        where: { email: "burger@somosmoovy.com" },
        update: {},
        create: {
            email: "burger@somosmoovy.com",
            password: merchantPassword,
            name: "Joe Burger Owner",
            phone: "+5492901112222",
            role: "MERCHANT",
        },
    });

    const merchant = await prisma.merchant.upsert({
        where: { slug: "burgers-joe" },
        update: {},
        create: {
            name: "Burgers Joe",
            slug: "burgers-joe",
            description: "Las mejores hamburguesas del Fin del Mundo",
            ownerId: merchantUser.id,
            address: "San Martín 1234, Ushuaia",
            email: "contacto@burgersjoe.com",
            phone: "+5492901112222",
            isActive: true,
            isOpen: true,
        },
    });

    // ==================== ADDRESS ====================
    console.log("🏠 Creating addresses...");
    await prisma.address.upsert({
        where: { id: "demo-address-1" },
        update: {},
        create: {
            id: "demo-address-1",
            userId: demoUser.id,
            label: "Casa",
            street: "Maipú",
            number: "100",
            city: "Ushuaia",
            province: "Tierra del Fuego",
            latitude: -54.8050,
            longitude: -68.3050,
            isDefault: true,
        },
    });

    // ==================== PRODUCTS ====================
    console.log("🍔 Creating products...");

    const productsData = [
        { name: "Leche La Serenísima 1L", price: 1200, category: "lacteos" },
        { name: "Yogur Bebible Frutilla", price: 1500, category: "lacteos" },
        { name: "Coca Cola 2.25L", price: 2800, category: "bebidas", isFeatured: true },
        { name: "Cerveza Andes Origen Roja", price: 3200, category: "bebidas" },
        { name: "Sándwich de Miga J&Q", price: 3500, category: "sandwicheria", isFeatured: true },
        { name: "Peyogur", price: 3500, category: "golosinas" }, // Typo intent: Peyogur? Maybe Pico Dulce?
        { name: "Alfajor Jorgito", price: 800, category: "golosinas" },
        { name: "Yerba Playadito 500g", price: 2400, category: "almacen" },
        { name: "Arroz Gallo Oro", price: 1800, category: "almacen" },
        { name: "Lavandina Ayudín 1L", price: 1500, category: "limpieza" },
    ];

    for (const p of productsData) {
        const product = await prisma.product.upsert({
            where: { slug: p.name.toLowerCase().replace(/ /g, "-").replace(/[áéíóú]/g, "a") },
            update: {},
            create: {
                name: p.name,
                slug: p.name.toLowerCase().replace(/ /g, "-").replace(/[áéíóú]/g, "a"),
                description: "Descripción de ejemplo para " + p.name,
                price: p.price,
                costPrice: p.price * 0.7, // Estimated cost
                isActive: true,
                isFeatured: p.isFeatured || false,
                merchantId: merchant.id,
                stock: 100,
            },
        });

        // Link to category
        if (categories[p.category]) {
            // Assuming Many-to-Many or One-to-Many via ProductCategory table
            // Checking schema from previous steps: 'categories: { include: { category: true } }' implies ProductCategory relation

            // We need to create the relation. 
            // Let's assume explicit table 'ProductCategory' or implicit?
            // Usually explicit in these schemas.
            // upserting ProductCategory
            await prisma.productCategory.upsert({
                where: {
                    productId_categoryId: {
                        productId: product.id,
                        categoryId: categories[p.category].id
                    }
                },
                update: {},
                create: {
                    productId: product.id,
                    categoryId: categories[p.category].id
                }
            });
        }
    }

    console.log("\n✅ Seed completed successfully!");
    console.log("\n🔐 Credenciales Actualizadas (Ushuaia):");
    console.log("   Super Admin: admin@somosmoovy.com / admin123");
    console.log("   Comercio (Joe): burger@somosmoovy.com / merchant123");
    console.log("   Cliente: cliente@somosmoovy.com / demo123");
    console.log("   Repartidor: repartidor@somosmoovy.com / driver123");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
