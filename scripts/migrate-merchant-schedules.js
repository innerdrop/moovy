/**
 * Migración: Asignar horario default a merchants sin scheduleJson.
 *
 * Este script es IDEMPOTENTE — puede ejecutarse múltiples veces sin efectos
 * secundarios. Solo actualiza merchants que no tienen scheduleJson configurado.
 *
 * Horario default: Lun-Vie 09:00-21:00, Sáb 10:00-14:00, Dom cerrado.
 *
 * Uso: node scripts/migrate-merchant-schedules.js
 *
 * Última actualización: 2026-04-03
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DEFAULT_SCHEDULE = JSON.stringify({
    "1": [{ open: "09:00", close: "21:00" }],
    "2": [{ open: "09:00", close: "21:00" }],
    "3": [{ open: "09:00", close: "21:00" }],
    "4": [{ open: "09:00", close: "21:00" }],
    "5": [{ open: "09:00", close: "21:00" }],
    "6": [{ open: "10:00", close: "14:00" }],
    "7": null,
});

async function main() {
    console.log("🕐 Migrando merchants sin horario configurado...\n");

    // Buscar merchants sin scheduleJson
    const merchantsWithoutSchedule = await prisma.merchant.findMany({
        where: {
            OR: [
                { scheduleJson: null },
                { scheduleJson: "" },
            ],
        },
        select: {
            id: true,
            name: true,
            businessName: true,
            scheduleEnabled: true,
        },
    });

    if (merchantsWithoutSchedule.length === 0) {
        console.log("✅ Todos los merchants ya tienen horario configurado. Nada que hacer.");
        return;
    }

    console.log(`📋 ${merchantsWithoutSchedule.length} merchant(s) sin horario:\n`);

    for (const merchant of merchantsWithoutSchedule) {
        const displayName = merchant.businessName || merchant.name || merchant.id;
        console.log(`  → ${displayName}`);

        await prisma.merchant.update({
            where: { id: merchant.id },
            data: {
                scheduleJson: DEFAULT_SCHEDULE,
                scheduleEnabled: true,
            },
        });

        console.log(`    ✅ Horario default asignado + scheduleEnabled = true`);
    }

    console.log(`\n✅ Migración completada. ${merchantsWithoutSchedule.length} merchant(s) actualizados.`);
    console.log("   Horario asignado: Lun-Vie 09:00-21:00, Sáb 10:00-14:00, Dom cerrado.");
}

main()
    .catch((e) => {
        console.error("❌ Error en la migración:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
