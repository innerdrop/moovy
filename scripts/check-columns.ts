import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Order'
      ORDER BY column_name;
    `;
        console.log(`Total columns in Order table: ${(columns as any[]).length}`);
        console.log('Column names:');
        console.log((columns as any[]).map(c => c.column_name).join(', '));

        // Also check if isPickup specifically exists
        const hasIsPickup = (columns as any[]).some(c => c.column_name === 'isPickup');
        console.log('\nHas isPickup:', hasIsPickup);
    } catch (error) {
        console.error('Error checking columns:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
