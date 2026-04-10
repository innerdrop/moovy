/**
 * Seed: 3 comercios de prueba con 3 productos cada uno
 * USO: node scripts/seed-test-merchants.js
 * SOLO para testing local — no va a producción
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const MERCHANTS = [
    {
        user: {
            email: "panaderia@somosmoovy.com",
            password: "demo123",
            firstName: "Laura",
            lastName: "Martínez",
            phone: "2901555001",
        },
        merchant: {
            name: "Panadería del Sur",
            slug: "panaderia-del-sur",
            businessName: "Panadería del Sur",
            description: "Pan artesanal, facturas y tortas caseras. Horneamos todos los días desde las 6 AM.",
            category: "Panadería",
            address: "San Martín 450, Ushuaia",
            latitude: -54.8069,
            longitude: -68.3073,
            phone: "2901555001",
            email: "panaderia@somosmoovy.com",
            deliveryTimeMin: 20,
            deliveryTimeMax: 35,
            deliveryRadiusKm: 5,
            commissionRate: 8,
        },
        products: [
            {
                name: "Docena de Medialunas",
                slug: "docena-medialunas-panaderia-sur",
                description: "Medialunas de manteca recién horneadas. Crujientes por fuera, tiernas por dentro.",
                price: 4500,
                costPrice: 2200,
                stock: 30,
                image: "https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=500&h=500&fit=crop",
            },
            {
                name: "Torta de Chocolate",
                slug: "torta-chocolate-panaderia-sur",
                description: "Torta artesanal de chocolate con ganache. Ideal para cumpleaños y reuniones.",
                price: 12000,
                costPrice: 5500,
                stock: 8,
                image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&h=500&fit=crop",
            },
            {
                name: "Pan de Campo",
                slug: "pan-de-campo-panaderia-sur",
                description: "Pan casero de campo, cocido en horno de piedra. Perfecto para acompañar un asado.",
                price: 3200,
                costPrice: 1400,
                stock: 20,
                image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&h=500&fit=crop",
            },
        ],
    },
    {
        user: {
            email: "sushi@somosmoovy.com",
            password: "demo123",
            firstName: "Kenji",
            lastName: "Tanaka",
            phone: "2901555002",
        },
        merchant: {
            name: "Ushuaia Sushi",
            slug: "ushuaia-sushi",
            businessName: "Ushuaia Sushi",
            description: "Sushi fresco con pescados patagónicos. Rolls creativos y clásicos japoneses.",
            category: "Restaurante",
            address: "Gobernador Paz 86, Ushuaia",
            latitude: -54.8085,
            longitude: -68.3120,
            phone: "2901555002",
            email: "sushi@somosmoovy.com",
            deliveryTimeMin: 30,
            deliveryTimeMax: 50,
            deliveryRadiusKm: 4,
            commissionRate: 8,
        },
        products: [
            {
                name: "Combinado 30 Piezas",
                slug: "combinado-30-ushuaia-sushi",
                description: "Mix de 30 piezas: nigiri de salmón, Philadelphia roll, tempura roll y California roll.",
                price: 18500,
                costPrice: 8000,
                stock: 15,
                image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&h=500&fit=crop",
            },
            {
                name: "Ramen de Centolla",
                slug: "ramen-centolla-ushuaia-sushi",
                description: "Ramen especial con centolla fueguina, caldo miso, huevo marinado y nori.",
                price: 14000,
                costPrice: 6500,
                stock: 10,
                image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&h=500&fit=crop",
            },
            {
                name: "Gyozas de Cordero (6 unidades)",
                slug: "gyozas-cordero-ushuaia-sushi",
                description: "Empanaditas japonesas rellenas de cordero patagónico con salsa ponzu.",
                price: 7500,
                costPrice: 3200,
                stock: 20,
                image: "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=500&h=500&fit=crop",
            },
        ],
    },
    {
        user: {
            email: "farmacia@somosmoovy.com",
            password: "demo123",
            firstName: "María",
            lastName: "González",
            phone: "2901555003",
        },
        merchant: {
            name: "Farmacia Central Ushuaia",
            slug: "farmacia-central-ushuaia",
            businessName: "Farmacia Central Ushuaia",
            description: "Medicamentos, perfumería y cuidado personal. Envíos rápidos en toda la ciudad.",
            category: "Farmacia",
            address: "Av. Maipú 240, Ushuaia",
            latitude: -54.8042,
            longitude: -68.3048,
            phone: "2901555003",
            email: "farmacia@somosmoovy.com",
            deliveryTimeMin: 15,
            deliveryTimeMax: 30,
            deliveryRadiusKm: 6,
            commissionRate: 8,
        },
        products: [
            {
                name: "Pack Gripe Invernal",
                slug: "pack-gripe-invernal-farmacia",
                description: "Paracetamol + Vitamina C efervescente + Pastillas para la garganta. Todo para el invierno.",
                price: 8900,
                costPrice: 5200,
                stock: 25,
                image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&h=500&fit=crop",
            },
            {
                name: "Protector Solar FPS 50",
                slug: "protector-solar-fps50-farmacia",
                description: "Protector solar alta protección, resistente al agua. Ideal para nieve y actividades al aire libre.",
                price: 12500,
                costPrice: 7000,
                stock: 15,
                image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop",
            },
            {
                name: "Kit Higiene Viajero",
                slug: "kit-higiene-viajero-farmacia",
                description: "Cepillo de dientes + pasta mini + desodorante travel + jabón líquido. Perfecto para turistas.",
                price: 6200,
                costPrice: 3100,
                stock: 30,
                image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&h=500&fit=crop",
            },
        ],
    },
];

async function main() {
    const hashedPassword = await bcrypt.hash("demo123", 10);

    for (const data of MERCHANTS) {
        console.log(`\n📦 Creando: ${data.merchant.name}`);

        // 1. Upsert user
        const user = await prisma.user.upsert({
            where: { email: data.user.email },
            update: {},
            create: {
                email: data.user.email,
                password: hashedPassword,
                name: `${data.user.firstName} ${data.user.lastName}`,
                firstName: data.user.firstName,
                lastName: data.user.lastName,
                phone: data.user.phone,
                role: "COMERCIO",
            },
        });
        console.log(`  ✅ Usuario: ${user.email} (${user.id})`);

        // 2. Upsert UserRole
        await prisma.userRole.upsert({
            where: { userId_role: { userId: user.id, role: "COMERCIO" } },
            update: {},
            create: { userId: user.id, role: "COMERCIO" },
        });
        console.log(`  ✅ Rol: COMERCIO`);

        // 3. Upsert Merchant
        const merchant = await prisma.merchant.upsert({
            where: { slug: data.merchant.slug },
            update: {},
            create: {
                name: data.merchant.name,
                slug: data.merchant.slug,
                businessName: data.merchant.businessName,
                description: data.merchant.description,
                category: data.merchant.category,
                address: data.merchant.address,
                latitude: data.merchant.latitude,
                longitude: data.merchant.longitude,
                phone: data.merchant.phone,
                email: data.merchant.email,
                deliveryTimeMin: data.merchant.deliveryTimeMin,
                deliveryTimeMax: data.merchant.deliveryTimeMax,
                deliveryRadiusKm: data.merchant.deliveryRadiusKm,
                commissionRate: data.merchant.commissionRate,
                isOpen: true,
                isActive: true,
                approvalStatus: "APPROVED",
                approvedAt: new Date(),
                ownerId: user.id,
            },
        });
        console.log(`  ✅ Comercio: ${merchant.name} (${merchant.id})`);

        // 4. Create products
        for (const prod of data.products) {
            const existing = await prisma.product.findUnique({ where: { slug: prod.slug } });
            if (existing) {
                console.log(`  ⏭️  Producto ya existe: ${prod.name}`);
                continue;
            }

            const product = await prisma.product.create({
                data: {
                    name: prod.name,
                    slug: prod.slug,
                    description: prod.description,
                    price: prod.price,
                    costPrice: prod.costPrice,
                    stock: prod.stock,
                    isActive: true,
                    merchantId: merchant.id,
                    images: {
                        create: {
                            url: prod.image,
                            alt: prod.name,
                            order: 0,
                        },
                    },
                },
            });
            console.log(`  ✅ Producto: ${product.name} ($${product.price})`);
        }
    }

    // Also ensure categories exist for the store
    const categorySlugs = ["panaderia", "restaurante", "farmacia"];
    const categoryNames = ["Panadería", "Restaurante", "Farmacia"];

    for (let i = 0; i < categorySlugs.length; i++) {
        await prisma.category.upsert({
            where: { slug: categorySlugs[i] },
            update: {},
            create: {
                name: categoryNames[i],
                slug: categorySlugs[i],
                isActive: true,
                scope: "STORE",
                order: i + 1,
            },
        });
    }
    console.log("\n✅ Categorías creadas/verificadas");

    console.log("\n🎉 Seed completado! 3 comercios + 9 productos listos");
    console.log("   Usuarios: panaderia@somosmoovy.com / sushi@somosmoovy.com / farmacia@somosmoovy.com");
    console.log("   Password: demo123");
}

main()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
