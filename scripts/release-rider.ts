import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function releaseDriver() {
    try {
        const email = 'rider1@somosmoovy.com';
        const user = await prisma.user.findUnique({
            where: { email },
            include: { driver: true }
        });

        if (!user || !user.driver) {
            console.log('Driver not found');
            return;
        }

        await prisma.driver.update({
            where: { id: user.driver.id },
            data: { availabilityStatus: 'DISPONIBLE' }
        });

        console.log(`Driver ${email} released successfully (availabilityStatus set to DISPONIBLE)`);

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

releaseDriver();
