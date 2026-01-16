const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("--- USERS ---");
    const users = await prisma.user.findMany();
    users.forEach(u => console.log(`${u.id} | ${u.email} | ${u.name} | ${u.role}`));

    console.log("\n--- MERCHANTS ---");
    const merchants = await prisma.merchant.findMany();
    merchants.forEach(m => console.log(`${m.id} | ${m.name} | Owner: ${m.ownerId}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
