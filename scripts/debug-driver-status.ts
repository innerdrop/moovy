import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkDriver() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'rider1@somosmoovy.com' },
            include: { driver: true }
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User ID:', user.id);
        if (user.driver) {
            console.log('Driver Status:', {
                id: user.driver.id,
                isActive: user.driver.isActive,
                isOnline: user.driver.isOnline,
                availabilityStatus: user.driver.availabilityStatus,
                latitude: user.driver.latitude,
                longitude: user.driver.longitude
            });
        } else {
            console.log('User is not a driver');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkDriver();
