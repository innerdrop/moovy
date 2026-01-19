// Import data from JSON to PostgreSQL
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function importData() {
    console.log('📥 Importing data to PostgreSQL...\n');

    try {
        // Read exported data
        const exportPath = path.join(process.cwd(), 'data-export.json');
        const data = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

        // Import Store Settings
        console.log('⚙️  Importing store settings...');
        for (const setting of data.storeSettings) {
            await prisma.storeSettings.upsert({
                where: { id: setting.id },
                update: setting,
                create: setting,
            });
        }

        // Import Users
        console.log('👤 Importing users...');
        for (const user of data.users) {
            await prisma.user.upsert({
                where: { email: user.email },
                update: user,
                create: user,
            });
        }

        // Import Categories
        console.log('📦 Importing categories...');
        for (const category of data.categories) {
            await prisma.category.upsert({
                where: { slug: category.slug },
                update: category,
                create: category,
            });
        }

        // Import Addresses
        console.log('🏠 Importing addresses...');
        for (const address of data.addresses) {
            await prisma.address.upsert({
                where: { id: address.id },
                update: address,
                create: address,
            });
        }

        // Import Products with their images and categories
        console.log('🛍️  Importing products...');
        for (const product of data.products) {
            const { images, categories, ...productData } = product;

            await prisma.product.upsert({
                where: { slug: product.slug },
                update: productData,
                create: productData,
            });

            // Import product images
            if (images && images.length > 0) {
                for (const image of images) {
                    await prisma.productImage.upsert({
                        where: { id: image.id },
                        update: image,
                        create: image,
                    });
                }
            }

            // Import product categories
            if (categories && categories.length > 0) {
                for (const cat of categories) {
                    await prisma.productCategory.upsert({
                        where: {
                            productId_categoryId: {
                                productId: cat.productId,
                                categoryId: cat.categoryId,
                            }
                        },
                        update: cat,
                        create: cat,
                    });
                }
            }
        }

        console.log('\n✅ Import completed successfully!');
        console.log('\n🔐 Admin credentials:');
        const admins = data.users.filter(u => u.role === 'ADMIN');
        admins.forEach(u => console.log(`   - ${u.email} (Password from local DB)`));

    } catch (error) {
        console.error('❌ Error importing data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importData();
