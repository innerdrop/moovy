const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const merchantId = 'cmkeck3cx000fmwsnr65ui0yu'; // Burgers Joe
    const newOwnerId = 'cmkfm9dib0002lbhco7wwgdo2'; // Comercio Test

    console.log(`Updating Merchant ${merchantId} to have owner ${newOwnerId}...`);

    await prisma.merchant.update({
        where: { id: merchantId },
        data: { ownerId: newOwnerId },
    });

    console.log("Update successful!");
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
