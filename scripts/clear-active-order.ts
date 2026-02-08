import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const email = 'ing.iyad@gmail.com'

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            orders: {
                where: {
                    status: {
                        notIn: ['DELIVERED', 'CANCELLED']
                    }
                }
            }
        }
    })

    if (!user) {
        console.log(`Usuario con email ${email} no encontrado.`)
        return
    }

    console.log(`Usuario encontrado: ${user.name} (${user.id})`)
    console.log(`${user.orders.length} pedidos activos encontrados.`)

    for (const order of user.orders) {
        console.log(`Cancelando pedido ${order.orderNumber} (ID: ${order.id})...`)
        await prisma.order.update({
            where: { id: order.id },
            data: {
                status: 'CANCELLED',
                cancelReason: 'Limpieza administrativa - El pedido ya no existe'
            }
        })
    }

    console.log('Limpieza completada.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
