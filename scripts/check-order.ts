import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    const orderId = 'cmlcf8aoz0009n1z3kfdaga3x'
    const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { address: true }
    })
    console.log('ORDER DATA:', JSON.stringify(order, null, 2))
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
