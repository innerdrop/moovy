import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Create master category "Kioscos y Almacenes"
    const masterCategory = await prisma.category.create({
        data: {
            name: "Kioscos y Almacenes",
            slug: "kioscos-y-almacenes",
            description: "Paquete completo para kioscos y almacenes. Incluye todas las subcategorías de productos.",
            price: 25000,
            allowIndividualPurchase: true,
            order: 0,
            isActive: true
        }
    });

    console.log(`✅ Creada categoría padre: ${masterCategory.name} (ID: ${masterCategory.id})`);

    // 2. Get all existing categories (except the new master)
    const existingCategories = await prisma.category.findMany({
        where: {
            id: { not: masterCategory.id },
            parentId: null
        }
    });

    console.log(`📦 Encontradas ${existingCategories.length} categorías para mover`);

    // 3. Move all existing categories under the master
    for (const cat of existingCategories) {
        await prisma.category.update({
            where: { id: cat.id },
            data: { parentId: masterCategory.id }
        });
        console.log(`   → Movida: ${cat.name}`);
    }

    console.log(`\n✅ Todas las categorías ahora están bajo "${masterCategory.name}"`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
