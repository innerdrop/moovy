import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🗑️ Limpiando base de datos...");

    // Clear all data in order (respect foreign keys)
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.productImage.deleteMany({});
    await prisma.productVariant.deleteMany({});
    await prisma.productCategory.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.merchant.deleteMany({});
    await prisma.driver.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.pointsTransaction.deleteMany({});
    await prisma.referral.deleteMany({});
    await prisma.user.deleteMany({});

    console.log("✅ Base de datos limpia");

    // Hash password for all accounts
    const password = await bcrypt.hash("demo123", 10);

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

    // ==================== CATEGORIES ====================
    console.log("\n📂 Creando Categorías...");
    const categorias = await Promise.all([
        prisma.category.create({
            data: { name: "Hamburguesas", slug: "hamburguesas", order: 1 },
        }),
        prisma.category.create({
            data: { name: "Pizzas", slug: "pizzas", order: 2 },
        }),
        prisma.category.create({
            data: { name: "Sushi", slug: "sushi", order: 3 },
        }),
    ]);

    // ==================== COMERCIOS ====================
    console.log("\n🏪 Creando Comercios...");

    const comerciosData = [
        {
            name: "COMERCIO 1",
            slug: "comercio-1",
            email: "comercio1@somosmoovy.com",
            category: "Hamburguesas",
            categoryId: categorias[0].id,
            description: "Las mejores hamburguesas de Ushuaia",
            products: [
                { name: "Hamburguesa Clásica", price: 5500, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400" },
                { name: "Hamburguesa Doble", price: 7500, image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400" },
                { name: "Hamburguesa Veggie", price: 5000, image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400" },
            ],
        },
        {
            name: "COMERCIO 2",
            slug: "comercio-2",
            email: "comercio2@somosmoovy.com",
            category: "Pizzas",
            categoryId: categorias[1].id,
            description: "Pizzas artesanales con ingredientes premium",
            products: [
                { name: "Pizza Margherita", price: 6000, image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400" },
                { name: "Pizza Pepperoni", price: 7000, image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400" },
                { name: "Pizza 4 Quesos", price: 7500, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400" },
            ],
        },
        {
            name: "COMERCIO 3",
            slug: "comercio-3",
            email: "comercio3@somosmoovy.com",
            category: "Sushi",
            categoryId: categorias[2].id,
            description: "Sushi fresco preparado por chefs expertos",
            products: [
                { name: "Roll California", price: 4500, image: "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400" },
                { name: "Roll Salmón", price: 5500, image: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400" },
                { name: "Combo 30 piezas", price: 12000, image: "https://images.unsplash.com/photo-1553621042-f6e147245754?w=400" },
            ],
        },
    ];

    for (const comercio of comerciosData) {
        // Create merchant owner user
        const owner = await prisma.user.create({
            data: {
                email: comercio.email,
                password,
                name: comercio.name,
                role: "MERCHANT",
            },
        });

        // Create merchant
        const merchant = await prisma.merchant.create({
            data: {
                name: comercio.name,
                slug: comercio.slug,
                description: comercio.description,
                category: comercio.category,
                email: comercio.email,
                phone: "+54 9 2901 000000",
                address: "Ushuaia, Tierra del Fuego",
                isActive: true,
                isOpen: true,
                isVerified: true,
                ownerId: owner.id,
            },
        });

        // Create products for this merchant
        for (const prod of comercio.products) {
            const product = await prisma.product.create({
                data: {
                    name: prod.name,
                    slug: `${comercio.slug}-${prod.name.toLowerCase().replace(/\s+/g, '-')}`,
                    price: prod.price,
                    costPrice: prod.price * 0.6,
                    stock: 100,
                    isActive: true,
                    merchantId: merchant.id,
                },
            });

            // Add image
            await prisma.productImage.create({
                data: {
                    productId: product.id,
                    url: prod.image,
                    alt: prod.name,
                    order: 0,
                },
            });

            // Link to category
            await prisma.productCategory.create({
                data: {
                    productId: product.id,
                    categoryId: comercio.categoryId,
                },
            });
        }

        console.log(`   ✅ ${comercio.name} con 3 productos`);
    }

    // ==================== REPARTIDORES ====================
    console.log("\n🏍️ Creando Repartidores...");

    const repartidoresData = [
        { name: "RIDER 1", email: "rider1@somosmoovy.com", vehicle: "MOTO", plate: "ABC 001" },
        { name: "RIDER 2", email: "rider2@somosmoovy.com", vehicle: "BICICLETA", plate: null },
        { name: "RIDER 3", email: "rider3@somosmoovy.com", vehicle: "AUTO", plate: "XYZ 999" },
    ];

    for (const rider of repartidoresData) {
        const user = await prisma.user.create({
            data: {
                email: rider.email,
                password,
                name: rider.name,
                role: "DRIVER",
            },
        });

        await prisma.driver.create({
            data: {
                userId: user.id,
                vehicleType: rider.vehicle,
                licensePlate: rider.plate,
                isActive: true,
                isOnline: false,
            },
        });

        console.log(`   ✅ ${rider.name}`);
    }

    // ==================== CLIENTES ====================
    console.log("\n👥 Creando Clientes...");

    const clientesData = [
        { name: "CLIENTE 1", email: "cliente1@somosmoovy.com" },
        { name: "CLIENTE 2", email: "cliente2@somosmoovy.com" },
        { name: "CLIENTE 3", email: "cliente3@somosmoovy.com" },
    ];

    for (const cliente of clientesData) {
        await prisma.user.create({
            data: {
                email: cliente.email,
                password,
                name: cliente.name,
                role: "CLIENT",
            },
        });
        console.log(`   ✅ ${cliente.name}`);
    }

    // ==================== SUMMARY ====================
    console.log("\n" + "=".repeat(50));
    console.log("🎉 BASE DE DATOS DEMO CREADA");
    console.log("=".repeat(50));
    console.log("\n📋 RESUMEN:");
    console.log("   • 1 Admin");
    console.log("   • 3 Comercios (con 3 productos c/u)");
    console.log("   • 3 Repartidores");
    console.log("   • 3 Clientes");
    console.log("\n🔐 CREDENCIALES (todas con contraseña: demo123):");
    console.log("\n   ADMIN:");
    console.log("   └─ admin@somosmoovy.com");
    console.log("\n   COMERCIOS:");
    console.log("   ├─ comercio1@somosmoovy.com");
    console.log("   ├─ comercio2@somosmoovy.com");
    console.log("   └─ comercio3@somosmoovy.com");
    console.log("\n   REPARTIDORES:");
    console.log("   ├─ rider1@somosmoovy.com");
    console.log("   ├─ rider2@somosmoovy.com");
    console.log("   └─ rider3@somosmoovy.com");
    console.log("\n   CLIENTES:");
    console.log("   ├─ cliente1@somosmoovy.com");
    console.log("   ├─ cliente2@somosmoovy.com");
    console.log("   └─ cliente3@somosmoovy.com");
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
