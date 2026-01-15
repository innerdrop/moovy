const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('123456', 10);

    const users = [
        { email: 'admin@moovy.com', role: 'ADMIN', name: 'Admin Moovy' },
        { email: 'comercio@moovy.com', role: 'MERCHANT', name: 'Comercio Test' },
        { email: 'conductor@moovy.com', role: 'DRIVER', name: 'Conductor Test' },
        { email: 'cliente@moovy.com', role: 'USER', name: 'Cliente Test' }
    ];

    console.log('--- Checking/Creating Test Users ---');

    for (const u of users) {
        const existing = await prisma.user.findUnique({ where: { email: u.email } });
        if (existing) {
            console.log(`Updating existing user: ${u.email} (${u.role})`);
            await prisma.user.update({
                where: { email: u.email },
                data: {
                    role: u.role,
                    password: passwordHash
                }
            });
        } else {
            console.log(`Creating new user: ${u.email} (${u.role})`);
            await prisma.user.create({
                data: {
                    email: u.email,
                    name: u.name,
                    password: passwordHash,
                    role: u.role
                }
            });
        }
    }

    console.log('--- Done. All passwords set to: 123456 ---');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
