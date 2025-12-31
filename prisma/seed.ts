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
    console.log("🌱 Seeding database for Polirrubro San Juan...\n");

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
            storeName: "Polirrubro San Juan",
            storeAddress: "San Juan, Argentina",
            originLat: -31.5375,
            originLng: -68.5364,
        },
    });

    // ==================== CATEGORIES ====================
    console.log("📁 Creating categories...");
    const categories = [
        { name: "Lácteos", slug: "lacteos", description: "Leche, yogurt, quesos y más", order: 1 },
        { name: "Bebidas", slug: "bebidas", description: "Gaseosas, jugos, agua y bebidas", order: 2 },
        { name: "Cigarrillos", slug: "cigarrillos", description: "Cigarrillos y tabaco", order: 3 },
        { name: "Sandwichería", slug: "sandwicheria", description: "Sándwiches, tostados y más", order: 4 },
        { name: "Almacén", slug: "almacen", description: "Productos de almacén", order: 5 },
        { name: "Limpieza", slug: "limpieza", description: "Productos de limpieza", order: 6 },
        { name: "Golosinas", slug: "golosinas", description: "Dulces, chocolates y snacks", order: 7 },
        { name: "Panadería", slug: "panaderia", description: "Pan, facturas y productos de panadería", order: 8 },
        { name: "Fiambrería", slug: "fiambreria", description: "Jamón, queso, salame y fiambres", order: 9 },
        { name: "Congelados", slug: "congelados", description: "Helados y productos congelados", order: 10 },
    ];

    for (const cat of categories) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: cat,
            create: cat,
        });
    }

    // ==================== USERS ====================
    console.log("👤 Creating users...");

    // Admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = await prisma.user.upsert({
        where: { email: "admin@polirrubrosanjuan.com" },
        update: {},
        create: {
            email: "admin@polirrubrosanjuan.com",
            password: adminPassword,
            name: "Administrador",
            phone: "+5492645555555",
            role: "ADMIN",
        },
    });

    // Demo customer
    const userPassword = await bcrypt.hash("demo123", 10);
    const demoUser = await prisma.user.upsert({
        where: { email: "cliente@demo.com" },
        update: {},
        create: {
            email: "cliente@demo.com",
            password: userPassword,
            name: "Cliente Demo",
            phone: "+5492641234567",
            role: "USER",
        },
    });

    // Demo driver
    const driverPassword = await bcrypt.hash("driver123", 10);
    const driverUser = await prisma.user.upsert({
        where: { email: "repartidor@polirrubrosanjuan.com" },
        update: {},
        create: {
            email: "repartidor@polirrubrosanjuan.com",
            password: driverPassword,
            name: "Juan Repartidor",
            phone: "+5492649999999",
            role: "DRIVER",
        },
    });

    // Create driver profile
    await prisma.driver.upsert({
        where: { userId: driverUser.id },
        update: {},
        create: {
            userId: driverUser.id,
            vehicleType: "MOTO",
            isActive: true,
            isOnline: false,
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
            street: "Av. Libertador General San Martín",
            number: "100",
            city: "San Juan",
            province: "San Juan",
            latitude: -31.5357,
            longitude: -68.5295,
            isDefault: true,
        },
    });

    // ==================== PRODUCTS ====================
    console.log("📦 Creating products...");

    const lacteosCategory = await prisma.category.findUnique({ where: { slug: "lacteos" } });
    const bebidasCategory = await prisma.category.findUnique({ where: { slug: "bebidas" } });
    const sandwicheriaCategory = await prisma.category.findUnique({ where: { slug: "sandwicheria" } });
    const golosinasCategory = await prisma.category.findUnique({ where: { slug: "golosinas" } });
    const almacenCategory = await prisma.category.findUnique({ where: { slug: "almacen" } });

    const products = [
        // Lácteos
        {
            name: "Leche La Serenísima 1L",
            slug: "leche-la-serenisima-1l",
            description: "Leche entera La Serenísima sachet 1 litro",
            price: 1200,
            costPrice: 950,
            stock: 50,
            isFeatured: true,
            categoryId: lacteosCategory!.id,
        },
        {
            name: "Yogur Ser Frutilla 190g",
            slug: "yogur-ser-frutilla",
            description: "Yogur bebible sabor frutilla",
            price: 800,
            costPrice: 600,
            stock: 30,
            isFeatured: false,
            categoryId: lacteosCategory!.id,
        },
        {
            name: "Queso Cremoso Tregar 1kg",
            slug: "queso-cremoso-tregar",
            description: "Queso cremoso para sándwich",
            price: 4500,
            costPrice: 3500,
            stock: 15,
            isFeatured: true,
            categoryId: lacteosCategory!.id,
        },
        // Bebidas
        {
            name: "Coca-Cola 2.25L",
            slug: "coca-cola-2l",
            description: "Gaseosa Coca-Cola 2.25 litros",
            price: 2800,
            costPrice: 2200,
            stock: 40,
            isFeatured: true,
            categoryId: bebidasCategory!.id,
        },
        {
            name: "Agua Mineral Villavicencio 1.5L",
            slug: "agua-villavicencio",
            description: "Agua mineral sin gas",
            price: 900,
            costPrice: 600,
            stock: 60,
            isFeatured: false,
            categoryId: bebidasCategory!.id,
        },
        {
            name: "Cerveza Quilmes 1L",
            slug: "cerveza-quilmes-1l",
            description: "Cerveza Quilmes retornable 1 litro",
            price: 1800,
            costPrice: 1400,
            stock: 25,
            isFeatured: true,
            categoryId: bebidasCategory!.id,
        },
        // Sandwichería
        {
            name: "Sándwich de Milanesa",
            slug: "sandwich-milanesa",
            description: "Sándwich de milanesa con lechuga y tomate",
            price: 3500,
            costPrice: 2200,
            stock: 20,
            isFeatured: true,
            categoryId: sandwicheriaCategory!.id,
        },
        {
            name: "Tostado de Jamón y Queso",
            slug: "tostado-jamon-queso",
            description: "Tostado clásico de jamón y queso",
            price: 1800,
            costPrice: 1000,
            stock: 30,
            isFeatured: true,
            categoryId: sandwicheriaCategory!.id,
        },
        {
            name: "Sándwich Triple",
            slug: "sandwich-triple",
            description: "Sándwich triple de miga: jamón, queso y tomate",
            price: 2200,
            costPrice: 1400,
            stock: 25,
            isFeatured: false,
            categoryId: sandwicheriaCategory!.id,
        },
        // Golosinas
        {
            name: "Alfajor Havanna",
            slug: "alfajor-havanna",
            description: "Alfajor de chocolate con dulce de leche",
            price: 1500,
            costPrice: 1100,
            stock: 40,
            isFeatured: true,
            categoryId: golosinasCategory!.id,
        },
        {
            name: "Barra de Chocolate Milka 100g",
            slug: "chocolate-milka",
            description: "Chocolate con leche Milka",
            price: 2000,
            costPrice: 1500,
            stock: 35,
            isFeatured: false,
            categoryId: golosinasCategory!.id,
        },
        // Almacén
        {
            name: "Yerba Mate Taragüí 1kg",
            slug: "yerba-taragui",
            description: "Yerba mate con palo",
            price: 3200,
            costPrice: 2600,
            stock: 45,
            isFeatured: true,
            categoryId: almacenCategory!.id,
        },
        {
            name: "Aceite de Girasol Natura 1.5L",
            slug: "aceite-natura",
            description: "Aceite de girasol premium",
            price: 2500,
            costPrice: 1900,
            stock: 30,
            isFeatured: false,
            categoryId: almacenCategory!.id,
        },
        {
            name: "Fideos Matarazzo 500g",
            slug: "fideos-matarazzo",
            description: "Fideos tirabuzón",
            price: 900,
            costPrice: 650,
            stock: 50,
            isFeatured: false,
            categoryId: almacenCategory!.id,
        },
    ];

    for (const prod of products) {
        const { categoryId, ...productData } = prod;
        const product = await prisma.product.upsert({
            where: { slug: prod.slug },
            update: productData,
            create: productData,
        });

        // Link to category
        await prisma.productCategory.upsert({
            where: {
                productId_categoryId: {
                    productId: product.id,
                    categoryId: categoryId,
                },
            },
            update: {},
            create: {
                productId: product.id,
                categoryId: categoryId,
            },
        });
    }

    console.log("\n✅ Seed completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`   - Categories: ${categories.length}`);
    console.log(`   - Products: ${products.length}`);
    console.log(`   - Users: 3 (admin, customer, driver)`);
    console.log("\n🔐 Test credentials:");
    console.log("   Admin: admin@polirrubrosanjuan.com / admin123");
    console.log("   Cliente: cliente@demo.com / demo123");
    console.log("   Repartidor: repartidor@polirrubrosanjuan.com / driver123");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
