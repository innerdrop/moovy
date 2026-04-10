const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await bcrypt.hash('demo123', 10);

    const users = [
        { email: 'admin@somosmoovy.com', roles: ['ADMIN'], firstName: 'Admin', lastName: 'Moovy' },
        { email: 'test-comercio@somosmoovy.com', roles: ['COMERCIO'], firstName: 'Carlos', lastName: 'Comercio' },
        { email: 'test-driver@somosmoovy.com', roles: ['DRIVER'], firstName: 'Pablo', lastName: 'Repartidor' },
        { email: 'test-buyer@somosmoovy.com', roles: ['USER'], firstName: 'María', lastName: 'Compradora' },
        { email: 'test-seller@somosmoovy.com', roles: ['SELLER'], firstName: 'Laura', lastName: 'Vendedora' },
    ];

    console.log('--- Creando/Actualizando Usuarios de Prueba ---');
    console.log('Dominio: @somosmoovy.com | Clave: demo123\n');

    for (const u of users) {
        const fullName = `${u.firstName} ${u.lastName}`;
        const existing = await prisma.user.findUnique({ where: { email: u.email } });

        if (existing) {
            await prisma.user.update({
                where: { email: u.email },
                data: { password: passwordHash, firstName: u.firstName, lastName: u.lastName, name: fullName }
            });

            for (const role of u.roles) {
                await prisma.userRole.upsert({
                    where: { userId_role: { userId: existing.id, role } },
                    update: { isActive: true },
                    create: { userId: existing.id, role }
                });
            }

            console.log(`✓ Actualizado: ${u.email} (${u.roles.join(', ')})`);
        } else {
            await prisma.user.create({
                data: {
                    email: u.email,
                    name: fullName,
                    firstName: u.firstName,
                    lastName: u.lastName,
                    password: passwordHash,
                    roles: {
                        create: u.roles.map(role => ({ role }))
                    }
                }
            });

            console.log(`+ Creado: ${u.email} (${u.roles.join(', ')})`);
        }
    }

    // --- Crear Merchant de prueba para test-comercio ---
    const comercioUser = await prisma.user.findUnique({ where: { email: 'test-comercio@somosmoovy.com' } });
    if (comercioUser) {
        const existingMerchant = await prisma.merchant.findFirst({ where: { ownerId: comercioUser.id } });
        if (!existingMerchant) {
            await prisma.merchant.create({
                data: {
                    name: 'Comercio Test Moovy',
                    slug: 'comercio-test-moovy',
                    description: 'Comercio de prueba para smoke testing',
                    category: 'Almacén/Despensa',
                    email: 'test-comercio@somosmoovy.com',
                    phone: '2901000000',
                    address: 'San Martín 500, Ushuaia',
                    latitude: -54.8019,
                    longitude: -68.3030,
                    deliveryRadiusKm: 5,
                    deliveryTimeMin: 30,
                    deliveryTimeMax: 45,
                    minOrderAmount: 0,
                    allowPickup: false,
                    isActive: true,
                    isOpen: true,
                    approvalStatus: 'APPROVED',
                    approvedAt: new Date(),
                    commissionRate: 8,
                    ownerId: comercioUser.id,
                }
            });
            console.log('+ Creado: Merchant "Comercio Test Moovy" (APPROVED)');
        } else {
            // Asegurar que esté aprobado
            await prisma.merchant.update({
                where: { id: existingMerchant.id },
                data: { approvalStatus: 'APPROVED', approvedAt: existingMerchant.approvedAt || new Date() }
            });
            console.log('✓ Merchant ya existe, verificado APPROVED');
        }
    }

    // --- Crear Driver de prueba para test-driver ---
    const driverUser = await prisma.user.findUnique({ where: { email: 'test-driver@somosmoovy.com' } });
    if (driverUser) {
        const existingDriver = await prisma.driver.findFirst({ where: { userId: driverUser.id } });
        if (!existingDriver) {
            await prisma.driver.create({
                data: {
                    userId: driverUser.id,
                    vehicleType: 'MOTO',
                    licensePlate: 'TEST-001',
                    isActive: true,
                    isOnline: false,
                    approvalStatus: 'APPROVED',
                    rating: 5.0,
                }
            });
            console.log('+ Creado: Driver "Pablo Repartidor" (APPROVED, MOTO)');
        } else {
            await prisma.driver.update({
                where: { id: existingDriver.id },
                data: { approvalStatus: 'APPROVED' }
            });
            console.log('✓ Driver ya existe, verificado APPROVED');
        }
    }

    // --- Crear SellerProfile de prueba para test-seller ---
    const sellerUser = await prisma.user.findUnique({ where: { email: 'test-seller@somosmoovy.com' } });
    if (sellerUser) {
        const existingSeller = await prisma.sellerProfile.findFirst({ where: { userId: sellerUser.id } });
        if (!existingSeller) {
            await prisma.sellerProfile.create({
                data: {
                    userId: sellerUser.id,
                    displayName: 'Laura Vendedora',
                    bio: 'Vendedora de prueba para smoke testing',
                    commissionRate: 12,
                    rating: 5.0,
                    isActive: true,
                }
            });
            console.log('+ Creado: SellerProfile "Laura Vendedora"');
        } else {
            console.log('✓ SellerProfile ya existe');
        }
    }

    console.log('\n--- Listo ---');
    console.log('Cuentas de prueba:');
    console.log('  admin@somosmoovy.com        → Panel OPS');
    console.log('  test-comercio@somosmoovy.com → Portal Comercio (con Merchant APPROVED)');
    console.log('  test-driver@somosmoovy.com   → Portal Repartidor (con Driver APPROVED)');
    console.log('  test-buyer@somosmoovy.com    → Tienda (comprador)');
    console.log('  test-seller@somosmoovy.com   → Portal Vendedor (con SellerProfile)');
    console.log('  Clave para todas: demo123');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
