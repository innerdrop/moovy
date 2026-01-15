const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ select: { id: true, email: true, name: true, role: true } })
    .then(users => console.log(users))
    .finally(() => p.$disconnect());
