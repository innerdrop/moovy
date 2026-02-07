const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanOrphanProducts() {
    console.log('Buscando productos sin comercio asignado...');

    const orphanProducts = await prisma.product.findMany({
        where: { merchantId: null },
        select: { id: true, name: true, stock: true }
    });

    console.log(`Encontrados ${orphanProducts.length} productos sin comercio:`);
    orphanProducts.forEach(p => {
        console.log(`  - ${p.name} (stock: ${p.stock})`);
    });

    if (orphanProducts.length > 0) {
        // Delete related records first
        const ids = orphanProducts.map(p => p.id);

        console.log('\nEliminando imágenes relacionadas...');
        await prisma.productImage.deleteMany({
            where: { productId: { in: ids } }
        });

        console.log('Eliminando categorías relacionadas...');
        await prisma.productCategory.deleteMany({
            where: { productId: { in: ids } }
        });

        console.log('Eliminando productos huérfanos...');
        const result = await prisma.product.deleteMany({
            where: { merchantId: null }
        });

        console.log(`\n✅ Eliminados ${result.count} productos sin comercio.`);
    } else {
        console.log('\n✅ No hay productos huérfanos para eliminar.');
    }

    await prisma.$disconnect();
}

cleanOrphanProducts().catch(console.error);
