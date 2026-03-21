import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/** Safe deleteMany — skips if table doesn't exist yet */
async function safeDelete(model: any) {
    try {
        await model.deleteMany({});
    } catch {
        // Table may not exist yet, skip
    }
}

async function main() {
    console.log("🗑️ Limpiando base de datos...");

    // Clear all data in order (respect foreign keys)
    await safeDelete(prisma.couponUsage);
    await safeDelete(prisma.coupon);
    await safeDelete(prisma.auditLog);
    await safeDelete(prisma.assignmentLog);
    await safeDelete(prisma.pendingAssignment);
    await safeDelete(prisma.payment);
    await safeDelete(prisma.mpWebhookLog);
    await safeDelete(prisma.orderItem);
    await safeDelete(prisma.subOrder);
    await safeDelete(prisma.order);
    await safeDelete(prisma.cartItem);
    await safeDelete(prisma.productImage);
    await safeDelete(prisma.productVariant);
    await safeDelete(prisma.productCategory);
    await safeDelete(prisma.merchantAcquiredProduct);
    await safeDelete(prisma.merchantCategory);
    await safeDelete(prisma.product);
    await safeDelete(prisma.category);
    await safeDelete(prisma.favorite);
    await safeDelete(prisma.pointsTransaction);
    await safeDelete(prisma.referral);
    await safeDelete(prisma.pushSubscription);
    await safeDelete(prisma.supportMessage);
    await safeDelete(prisma.supportChat);
    await safeDelete(prisma.sellerAvailability);
    await safeDelete(prisma.listingImage);
    await safeDelete(prisma.listing);
    await safeDelete(prisma.sellerProfile);
    await safeDelete(prisma.driver);
    await safeDelete(prisma.merchant);
    await safeDelete(prisma.address);
    await safeDelete(prisma.packagePurchase);
    await safeDelete(prisma.userRole);
    await safeDelete(prisma.user);
    await safeDelete(prisma.storeSettings);
    await safeDelete(prisma.moovyConfig);
    await safeDelete(prisma.pointsConfig);

    console.log("✅ Base de datos limpia");

    // Hash password for all accounts
    const password = await bcrypt.hash("demo2026", 10);

    // ==================== ADMIN ====================
    console.log("\n👤 Creando Admin...");
    await prisma.user.create({
        data: {
            email: "admin@somosmoovy.com",
            password,
            name: "Admin MOOVY",
            role: "ADMIN",
        },
    });

    // ==================== STORE SETTINGS ====================
    console.log("\n⚙️ Creando Configuración...");
    await prisma.storeSettings.upsert({
        where: { id: "settings" },
        update: {},
        create: {
            id: "settings",
            storeName: "Moovy Ushuaia",
            storeAddress: "Ushuaia, Tierra del Fuego",
            isOpen: true,
            originLat: -54.8019,
            originLng: -68.303,
            fuelPricePerLiter: 1200,
            baseDeliveryFee: 500,
            maintenanceFactor: 1.35,
            maxDeliveryDistance: 15,
            maxCategoriesHome: 10,
        },
    });

    // ==================== CATEGORIES ====================
    console.log("\n📂 Creando Categorías...");
    const categorias = await Promise.all([
        prisma.category.upsert({ where: { slug: "hamburguesas" }, update: {}, create: { name: "Hamburguesas", slug: "hamburguesas", order: 1 } }),
        prisma.category.upsert({ where: { slug: "pizzas" }, update: {}, create: { name: "Pizzas", slug: "pizzas", order: 2 } }),
        prisma.category.upsert({ where: { slug: "sushi" }, update: {}, create: { name: "Sushi", slug: "sushi", order: 3 } }),
        prisma.category.upsert({ where: { slug: "lacteos" }, update: {}, create: { name: "Lácteos", slug: "lacteos", order: 4 } }),
        prisma.category.upsert({ where: { slug: "bebidas" }, update: {}, create: { name: "Bebidas", slug: "bebidas", order: 5 } }),
        prisma.category.upsert({ where: { slug: "sandwicheria" }, update: {}, create: { name: "Sandwichería", slug: "sandwicheria", order: 6 } }),
        prisma.category.upsert({ where: { slug: "golosinas" }, update: {}, create: { name: "Golosinas", slug: "golosinas", order: 7 } }),
        prisma.category.upsert({ where: { slug: "almacen" }, update: {}, create: { name: "Almacén", slug: "almacen", order: 8 } }),
        prisma.category.upsert({ where: { slug: "limpieza" }, update: {}, create: { name: "Limpieza", slug: "limpieza", order: 9 } }),
    ]);

    // ==================== COMERCIO ====================
    console.log("\n🏪 Creando Comercio...");

    const comercioOwner = await prisma.user.create({
        data: {
            email: "comercio@somosmoovy.com",
            password,
            name: "Burger Ushuaia",
            role: "MERCHANT",
        },
    });

    const merchant = await prisma.merchant.create({
        data: {
            name: "Burger Ushuaia",
            slug: "burger-ushuaia",
            description: "Las mejores hamburguesas del fin del mundo",
            category: "Hamburguesas",
            email: "comercio@somosmoovy.com",
            phone: "+54 9 2901 553173",
            address: "San Martín 500, Ushuaia",
            isActive: true,
            isOpen: true,
            isVerified: true,
            approvalStatus: "APPROVED",
            ownerId: comercioOwner.id,
        },
    });

    // Products
    const productos = [
        { name: "Hamburguesa Clásica", price: 5500, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
        { name: "Hamburguesa Doble", price: 7500, img: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400" },
        { name: "Hamburguesa Veggie", price: 5000, img: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400" },
        { name: "Papas Fritas", price: 2500, img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400" },
        { name: "Coca Cola 500ml", price: 1500, img: "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?w=400" },
    ];

    for (const prod of productos) {
        const product = await prisma.product.create({
            data: {
                name: prod.name,
                slug: `burger-ushuaia-${prod.name.toLowerCase().replace(/\s+/g, "-")}`,
                price: prod.price,
                costPrice: prod.price * 0.6,
                stock: 100,
                isActive: true,
                merchantId: merchant.id,
            },
        });

        await prisma.productImage.create({
            data: { productId: product.id, url: prod.img, alt: prod.name, order: 0 },
        });

        // Assign category (hamburguesas for burgers, bebidas for coca)
        const catId = prod.name.includes("Coca") ? categorias[4].id : categorias[0].id;
        await prisma.productCategory.create({
            data: { productId: product.id, categoryId: catId },
        });
    }
    console.log("   ✅ Burger Ushuaia con 5 productos");

    // ==================== REPARTIDOR ====================
    console.log("\n🏍️ Creando Repartidor...");

    const riderUser = await prisma.user.create({
        data: {
            email: "rider@somosmoovy.com",
            password,
            name: "Repartidor Demo",
            role: "DRIVER",
        },
    });

    await prisma.driver.create({
        data: {
            userId: riderUser.id,
            vehicleType: "MOTO",
            licensePlate: "ABC 123",
            isActive: true,
            isOnline: false,
            approvalStatus: "APPROVED",
        },
    });
    console.log("   ✅ Repartidor Demo (moto)");

    // ==================== CLIENTE ====================
    console.log("\n👥 Creando Cliente...");

    const clienteUser = await prisma.user.create({
        data: {
            email: "cliente@somosmoovy.com",
            password,
            name: "Cliente Demo",
            role: "CLIENT",
        },
    });

    // Create a default address for the client
    await prisma.address.create({
        data: {
            userId: clienteUser.id,
            label: "Casa",
            street: "San Martín 800",
            number: "800",
            city: "Ushuaia",
            province: "Tierra del Fuego",
            zipCode: "9410",
            latitude: -54.8069,
            longitude: -68.3040,
            isDefault: true,
        },
    });
    console.log("   ✅ Cliente Demo con dirección");

    // ==================== SUMMARY ====================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 BASE DE DATOS DEMO CREADA");
    console.log("=".repeat(50));
    console.log("\n📋 RESUMEN:");
    console.log("   • 1 Admin");
    console.log("   • 1 Comercio (Burger Ushuaia, 5 productos)");
    console.log("   • 1 Repartidor (moto, aprobado)");
    console.log("   • 1 Cliente (con dirección en Ushuaia)");
    console.log("   • 9 Categorías");
    console.log("\n🔐 CREDENCIALES (contraseña: demo2026):");
    console.log("\n   ADMIN:");
    console.log("   └─ admin@somosmoovy.com");
    console.log("\n   COMERCIO:");
    console.log("   └─ comercio@somosmoovy.com");
    console.log("\n   REPARTIDOR:");
    console.log("   └─ rider@somosmoovy.com");
    console.log("\n   CLIENTE:");
    console.log("   └─ cliente@somosmoovy.com");
    console.log("\n");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
