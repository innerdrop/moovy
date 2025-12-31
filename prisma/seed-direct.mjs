// Direct SQLite seed using better-sqlite3
// Run with: node prisma/seed-direct.mjs

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to database
const dbPath = path.join(__dirname, "dev.db");
console.log("📁 Database path:", dbPath);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma("foreign_keys = ON");

async function seed() {
    console.log("\n🌱 Seeding database for Polirrubro San Juan...\n");

    // ==================== STORE SETTINGS ====================
    console.log("⚙️  Creating store settings...");

    const existingSettings = db.prepare("SELECT id FROM StoreSettings WHERE id = ?").get("settings");

    if (!existingSettings) {
        db.prepare(`
            INSERT INTO StoreSettings (
                id, isOpen, closedMessage, fuelPricePerLiter, fuelConsumptionPerKm,
                baseDeliveryFee, maintenanceFactor, maxDeliveryDistance,
                storeName, storeAddress, originLat, originLng, updatedAt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
            "settings",
            1,
            "Estamos cerrados. ¡Volvemos pronto!",
            1200,
            0.06,
            500,
            1.35,
            15,
            "Polirrubro San Juan",
            "San Juan, Argentina",
            -31.5375,
            -68.5364
        );
    }

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

    const insertCategory = db.prepare(`
        INSERT OR REPLACE INTO Category (id, name, slug, description, isActive, "order", createdAt, updatedAt)
        VALUES (?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    `);

    const categoryIds = {};
    for (const cat of categories) {
        const id = randomUUID();
        const existing = db.prepare("SELECT id FROM Category WHERE slug = ?").get(cat.slug);
        if (existing) {
            categoryIds[cat.slug] = existing.id;
        } else {
            insertCategory.run(id, cat.name, cat.slug, cat.description, cat.order);
            categoryIds[cat.slug] = id;
        }
    }

    // ==================== USERS ====================
    console.log("👤 Creating users...");

    const insertUser = db.prepare(`
        INSERT OR REPLACE INTO User (id, email, password, name, phone, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    // Admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const existingAdmin = db.prepare("SELECT id FROM User WHERE email = ?").get("admin@polirrubrosanjuan.com");
    let adminId;
    if (existingAdmin) {
        adminId = existingAdmin.id;
        db.prepare("UPDATE User SET password = ? WHERE id = ?").run(adminPassword, adminId);
    } else {
        adminId = randomUUID();
        insertUser.run(adminId, "admin@polirrubrosanjuan.com", adminPassword, "Administrador", "+5492645555555", "ADMIN");
    }

    // Demo customer
    const userPassword = await bcrypt.hash("demo123", 10);
    const existingUser = db.prepare("SELECT id FROM User WHERE email = ?").get("cliente@demo.com");
    let userId;
    if (existingUser) {
        userId = existingUser.id;
        db.prepare("UPDATE User SET password = ? WHERE id = ?").run(userPassword, userId);
    } else {
        userId = randomUUID();
        insertUser.run(userId, "cliente@demo.com", userPassword, "Cliente Demo", "+5492641234567", "USER");
    }

    // Demo driver
    const driverPassword = await bcrypt.hash("driver123", 10);
    const existingDriver = db.prepare("SELECT id FROM User WHERE email = ?").get("repartidor@polirrubrosanjuan.com");
    let driverId;
    if (existingDriver) {
        driverId = existingDriver.id;
        db.prepare("UPDATE User SET password = ? WHERE id = ?").run(driverPassword, driverId);
    } else {
        driverId = randomUUID();
        insertUser.run(driverId, "repartidor@polirrubrosanjuan.com", driverPassword, "Juan Repartidor", "+5492649999999", "DRIVER");
    }

    // Create driver profile
    const existingDriverProfile = db.prepare("SELECT id FROM Driver WHERE userId = ?").get(driverId);
    if (!existingDriverProfile) {
        db.prepare(`
            INSERT INTO Driver (id, userId, vehicleType, isActive, isOnline, totalDeliveries, createdAt, updatedAt)
            VALUES (?, ?, ?, 1, 0, 0, datetime('now'), datetime('now'))
        `).run(randomUUID(), driverId, "MOTO");
    }

    // ==================== PRODUCTS ====================
    console.log("📦 Creating products...");

    const insertProduct = db.prepare(`
        INSERT OR REPLACE INTO Product (id, name, slug, description, price, costPrice, stock, minStock, isActive, isFeatured, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'), datetime('now'))
    `);

    const insertProductCategory = db.prepare(`
        INSERT OR IGNORE INTO ProductCategory (id, productId, categoryId)
        VALUES (?, ?, ?)
    `);

    const products = [
        { name: "Leche La Serenísima 1L", slug: "leche-la-serenisima-1l", description: "Leche entera La Serenísima sachet 1 litro", price: 1200, costPrice: 950, stock: 50, isFeatured: 1, categorySlug: "lacteos" },
        { name: "Yogur Ser Frutilla 190g", slug: "yogur-ser-frutilla", description: "Yogur bebible sabor frutilla", price: 800, costPrice: 600, stock: 30, isFeatured: 0, categorySlug: "lacteos" },
        { name: "Queso Cremoso Tregar 1kg", slug: "queso-cremoso-tregar", description: "Queso cremoso para sándwich", price: 4500, costPrice: 3500, stock: 15, isFeatured: 1, categorySlug: "lacteos" },
        { name: "Coca-Cola 2.25L", slug: "coca-cola-2l", description: "Gaseosa Coca-Cola 2.25 litros", price: 2800, costPrice: 2200, stock: 40, isFeatured: 1, categorySlug: "bebidas" },
        { name: "Agua Mineral Villavicencio 1.5L", slug: "agua-villavicencio", description: "Agua mineral sin gas", price: 900, costPrice: 600, stock: 60, isFeatured: 0, categorySlug: "bebidas" },
        { name: "Cerveza Quilmes 1L", slug: "cerveza-quilmes-1l", description: "Cerveza Quilmes retornable 1 litro", price: 1800, costPrice: 1400, stock: 25, isFeatured: 1, categorySlug: "bebidas" },
        { name: "Fernet Branca 750ml", slug: "fernet-branca-750", description: "Fernet Branca botella 750ml", price: 8500, costPrice: 7000, stock: 20, isFeatured: 1, categorySlug: "bebidas" },
        { name: "Sándwich de Milanesa", slug: "sandwich-milanesa", description: "Sándwich de milanesa con lechuga y tomate", price: 3500, costPrice: 2200, stock: 20, isFeatured: 1, categorySlug: "sandwicheria" },
        { name: "Tostado de Jamón y Queso", slug: "tostado-jamon-queso", description: "Tostado clásico de jamón y queso", price: 1800, costPrice: 1000, stock: 30, isFeatured: 1, categorySlug: "sandwicheria" },
        { name: "Sándwich Triple", slug: "sandwich-triple", description: "Sándwich triple de miga: jamón, queso y tomate", price: 2200, costPrice: 1400, stock: 25, isFeatured: 0, categorySlug: "sandwicheria" },
        { name: "Alfajor Havanna", slug: "alfajor-havanna", description: "Alfajor de chocolate con dulce de leche", price: 1500, costPrice: 1100, stock: 40, isFeatured: 1, categorySlug: "golosinas" },
        { name: "Barra de Chocolate Milka 100g", slug: "chocolate-milka", description: "Chocolate con leche Milka", price: 2000, costPrice: 1500, stock: 35, isFeatured: 0, categorySlug: "golosinas" },
        { name: "Caramelos Sugus x10", slug: "caramelos-sugus", description: "Caramelos masticables Sugus surtidos", price: 500, costPrice: 350, stock: 100, isFeatured: 0, categorySlug: "golosinas" },
        { name: "Yerba Mate Taragüí 1kg", slug: "yerba-taragui", description: "Yerba mate con palo", price: 3200, costPrice: 2600, stock: 45, isFeatured: 1, categorySlug: "almacen" },
        { name: "Aceite de Girasol Natura 1.5L", slug: "aceite-natura", description: "Aceite de girasol premium", price: 2500, costPrice: 1900, stock: 30, isFeatured: 0, categorySlug: "almacen" },
        { name: "Fideos Matarazzo 500g", slug: "fideos-matarazzo", description: "Fideos tirabuzón", price: 900, costPrice: 650, stock: 50, isFeatured: 0, categorySlug: "almacen" },
        { name: "Arroz Gallo Oro 1kg", slug: "arroz-gallo-oro", description: "Arroz largo fino", price: 1400, costPrice: 1000, stock: 40, isFeatured: 0, categorySlug: "almacen" },
        { name: "Lavandina Ayudín 1L", slug: "lavandina-ayudin", description: "Lavandina concentrada", price: 600, costPrice: 400, stock: 35, isFeatured: 0, categorySlug: "limpieza" },
        { name: "Detergente Magistral 500ml", slug: "detergente-magistral", description: "Detergente lavavajillas", price: 1100, costPrice: 800, stock: 30, isFeatured: 0, categorySlug: "limpieza" },
    ];

    for (const prod of products) {
        const existingProduct = db.prepare("SELECT id FROM Product WHERE slug = ?").get(prod.slug);
        let productId;

        if (existingProduct) {
            productId = existingProduct.id;
            db.prepare(`
                UPDATE Product SET name = ?, description = ?, price = ?, costPrice = ?, stock = ?, isFeatured = ?, updatedAt = datetime('now')
                WHERE id = ?
            `).run(prod.name, prod.description, prod.price, prod.costPrice, prod.stock, prod.isFeatured, productId);
        } else {
            productId = randomUUID();
            insertProduct.run(productId, prod.name, prod.slug, prod.description, prod.price, prod.costPrice, prod.stock, 5, prod.isFeatured);
        }

        // Link to category
        const categoryId = categoryIds[prod.categorySlug];
        if (categoryId) {
            insertProductCategory.run(randomUUID(), productId, categoryId);
        }
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

seed()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(() => {
        db.close();
    });
