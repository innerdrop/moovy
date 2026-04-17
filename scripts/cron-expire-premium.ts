/**
 * Cron: Expiración de Premium Merchants
 *
 * Ejecutar diariamente. Revoca isPremium en merchants cuyo premiumUntil ya pasó.
 * Envía notificación 7 días antes del vencimiento.
 *
 * Uso: npx tsx scripts/cron-expire-premium.ts
 * Cron: 0 3 * * * (todos los días a las 3 AM)
 *
 * Requiere: CRON_SECRET en headers si se ejecuta vía API
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log(`[cron-expire-premium] Ejecutando: ${now.toISOString()}`);

    // 1. Revocar premium expirados
    const expired = await prisma.merchant.updateMany({
        where: {
            isPremium: true,
            premiumUntil: {
                not: null,
                lt: now,
            },
        },
        data: {
            isPremium: false,
            premiumTier: "basic",
        },
    });

    if (expired.count > 0) {
        console.log(`[cron-expire-premium] ✅ ${expired.count} merchant(s) premium expirado(s) y revocado(s)`);

        // Log detalle de los expirados
        const expiredMerchants = await prisma.merchant.findMany({
            where: {
                isPremium: false,
                premiumUntil: {
                    not: null,
                    lt: now,
                },
            },
            select: { id: true, name: true, premiumUntil: true },
        });

        for (const m of expiredMerchants) {
            console.log(`   - ${m.name} (expiró: ${m.premiumUntil?.toISOString()})`);
        }
    } else {
        console.log("[cron-expire-premium] Sin merchants premium expirados");
    }

    // 2. Alertar los que expiran en 7 días (solo log por ahora, email cuando SMTP esté configurado)
    const expiringSoon = await prisma.merchant.findMany({
        where: {
            isPremium: true,
            premiumUntil: {
                not: null,
                gt: now,
                lt: sevenDaysFromNow,
            },
        },
        select: { id: true, name: true, premiumTier: true, premiumUntil: true },
    });

    if (expiringSoon.length > 0) {
        console.log(`[cron-expire-premium] ⚠️ ${expiringSoon.length} merchant(s) por expirar en 7 días:`);
        for (const m of expiringSoon) {
            const daysLeft = Math.ceil((m.premiumUntil!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            console.log(`   - ${m.name} [${m.premiumTier}] — ${daysLeft} día(s) restante(s)`);
            // TODO: Enviar email de recordatorio cuando SMTP esté configurado
            // await sendPremiumExpiryReminder(m);
        }
    }

    // 3. Resumen
    const activePremium = await prisma.merchant.count({
        where: { isPremium: true },
    });

    console.log(`[cron-expire-premium] Resumen: ${activePremium} merchant(s) premium activo(s)`);
    console.log(`[cron-expire-premium] Finalizado: ${new Date().toISOString()}`);
}

main()
    .catch((e) => {
        console.error("[cron-expire-premium] ERROR:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
