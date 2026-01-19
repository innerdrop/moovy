// Export data from SQLite to JSON for migration to PostgreSQL
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set SQLite database URL BEFORE importing Prisma
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
process.env.DATABASE_URL = `file:${dbPath}`;

// Now import Prisma
const { PrismaClient } = await import('@prisma/client');
const fs = await import('fs');

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: `file:${dbPath}`
        }
    }
});

async function exportData() {
    console.log('📤 Exporting data from SQLite...');
    console.log(`📂 Database: ${dbPath}\n`);

    try {
        // Export all critical data
        const data = {
            users: await prisma.user.findMany(),
            storeSettings: await prisma.storeSettings.findMany(),
            categories: await prisma.category.findMany(),
            products: await prisma.product.findMany({
                include: {
                    images: true,
                    categories: true,
                }
            }),
            addresses: await prisma.address.findMany(),
        };

        console.log('✅ Data exported:');
        console.log(`   - Users: ${data.users.length}`);
        console.log(`   - Store Settings: ${data.storeSettings.length}`);
        console.log(`   - Categories: ${data.categories.length}`);
        console.log(`   - Products: ${data.products.length}`);
        console.log(`   - Addresses: ${data.addresses.length}`);

        // Save to JSON file
        const exportPath = path.join(__dirname, '..', 'data-export.json');
        fs.writeFileSync(exportPath, JSON.stringify(data, null, 2));

        console.log(`\n💾 Data saved to: ${exportPath}`);
        console.log('\n📋 Admin users found:');
        data.users
            .filter(u => u.role === 'ADMIN')
            .forEach(u => console.log(`   - ${u.email} (${u.name})`));

    } catch (error) {
        console.error('❌ Error exporting data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
