/**
 * migrate-roles.ts
 * 
 * Migra los roles existentes del campo `user.role` (String)
 * a la nueva tabla pivot `UserRole`.
 * 
 * Uso: npx tsx scripts/migrate-roles.ts
 */

import { PrismaClient, UserRoleType } from '@prisma/client';

const prisma = new PrismaClient();

const VALID_ROLES: Record<string, UserRoleType> = {
    USER: UserRoleType.USER,
    CLIENT: UserRoleType.USER,  // Legacy load-test role → USER
    ADMIN: UserRoleType.ADMIN,
    COMERCIO: UserRoleType.COMERCIO,
    MERCHANT: UserRoleType.COMERCIO, // Legacy seed role → COMERCIO
    DRIVER: UserRoleType.DRIVER,
    SELLER: UserRoleType.SELLER,
};

async function main() {
    console.log('🚀 Iniciando migración de roles...\n');

    const users = await prisma.user.findMany({
        select: { id: true, email: true, role: true },
    });

    console.log(`📋 Encontrados ${users.length} usuarios para migrar.\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const user of users) {
        const mappedRole = VALID_ROLES[user.role];

        if (!mappedRole) {
            console.warn(`⚠️  Usuario ${user.email} tiene rol desconocido: "${user.role}" — saltado.`);
            skipped++;
            continue;
        }

        try {
            await prisma.userRole.upsert({
                where: {
                    userId_role: {
                        userId: user.id,
                        role: mappedRole,
                    },
                },
                update: {},  // Si ya existe, no hacer nada
                create: {
                    userId: user.id,
                    role: mappedRole,
                    isActive: true,
                },
            });
            migrated++;
        } catch (err: any) {
            console.error(`❌ Error migrando ${user.email}: ${err.message}`);
            errors++;
        }
    }

    console.log('\n════════════════════════════════════');
    console.log(`✅ Migrados:  ${migrated}`);
    console.log(`⏭️  Saltados:  ${skipped}`);
    console.log(`❌ Errores:   ${errors}`);
    console.log(`📊 Total:     ${users.length}`);
    console.log('════════════════════════════════════\n');
}

main()
    .catch((e) => {
        console.error('💥 Error fatal:', e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
