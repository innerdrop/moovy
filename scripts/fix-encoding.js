const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixEncoding() {
    console.log('Fixing encoding issues...');

    // Fix categories
    await prisma.category.updateMany({
        where: { id: 'cmkeck32i0000mwsnfsv487r7' },
        data: { name: 'Lácteos' }
    });

    await prisma.category.updateMany({
        where: { id: 'cmkeck32r0004mwsnjm7m107k' },
        data: { name: 'Almacén' }
    });

    await prisma.category.updateMany({
        where: { id: 'cmkeck32o0002mwsntgpeshg6' },
        data: { name: 'Sandwichería' }
    });

    // Fix products
    await prisma.product.updateMany({
        where: { id: 'cmkeck3d4000hmwsnu6wvvev2' },
        data: { name: 'Leche La Serenísima 1L' }
    });

    await prisma.product.updateMany({
        where: { id: 'cmkeck3dj000xmwsn62ebserm' },
        data: { name: 'Sándwich de Miga J&Q' }
    });

    await prisma.product.updateMany({
        where: { id: 'cmkeck3e0001hmwsnaz6ex5io' },
        data: { name: 'Lavandina Ayudín 1L' }
    });

    console.log('Done! Verifying...');

    const categories = await prisma.category.findMany();
    console.log('\nCategories:');
    categories.forEach(c => console.log(`  - ${c.name}`));

    const products = await prisma.product.findMany({ take: 10 });
    console.log('\nProducts (first 10):');
    products.forEach(p => console.log(`  - ${p.name}`));

    await prisma.$disconnect();
}

fixEncoding().catch(console.error);
