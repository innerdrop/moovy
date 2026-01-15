const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAdminPassword() {
    const newPassword = 'admin123';  // Temporary password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email: 'admin@somosmoovy.com' },
        data: { password: hashedPassword }
    });

    console.log('✅ Password reset successful!');
    console.log('Email: admin@somosmoovy.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Change this password in production!');

    await prisma.$disconnect();
}

resetAdminPassword().catch(console.error);
