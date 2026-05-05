/**
 * Seed: PackageCategory + DeliveryRate (Biblia Financiera v3)
 * Rama: chore/seed-mundo-real
 *
 * Crea las 6 categorías de paquete canónicas y sus delivery rates asociados,
 * según la Biblia Financiera v3:
 *
 *   SOBRE   0–2 kg    base $800   precio/km $15   vehículos: BIKE, MOTO
 *   PEQUEÑO 2–5 kg    base $1.200 precio/km $73   vehículos: MOTO, CAR
 *   MEDIANO 5–15 kg   base $2.500 precio/km $193  vehículos: CAR
 *   GRANDE  15–30 kg  base $3.500 precio/km $222  vehículos: CAR
 *   XL      30–70 kg  base $5.000 precio/km $269  vehículos: CAR, TRUCK
 *   FLETE   70+ kg    base $8.000 precio/km $329  vehículos: TRUCK
 *
 * Estos valores son los del Motor Logístico (CLAUDE.md, sección "Motor Logístico").
 * El admin puede editarlos desde /ops/config-biblia post-launch (regla canónica
 * #10: todo parámetro editable desde panel OPS).
 *
 * IDEMPOTENTE: si la categoría ya existe (por nombre único), no se sobreescribe.
 * Para resetear valores a defaults Biblia v3, pasar `--reset`.
 *
 * Uso:
 *   npx tsx scripts/seed-package-categories.ts            # crea solo las que faltan
 *   npx tsx scripts/seed-package-categories.ts --reset    # resetea a defaults Biblia v3
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const isReset = process.argv.includes("--reset");

interface CategoryDef {
    name: string;
    maxWeightGrams: number;
    maxLengthCm: number;
    maxWidthCm: number;
    maxHeightCm: number;
    volumeScore: number;
    allowedVehicles: string[];
    displayOrder: number;
    // Delivery rate (separate model)
    basePriceArs: number;
    pricePerKmArs: number;
}

// Biblia Financiera v3 — fuente única de verdad. Los precios de combustible
// y mantenimiento se definen aparte en StoreSettings; estos son los pricing
// específicos por categoría de paquete (override por tipo de envío).
const CATEGORIES: CategoryDef[] = [
    {
        name: "MICRO",
        maxWeightGrams: 200,
        maxLengthCm: 20, maxWidthCm: 15, maxHeightCm: 5,
        volumeScore: 1,
        allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"],
        displayOrder: 1,
        basePriceArs: 800,
        pricePerKmArs: 15,
    },
    {
        name: "SMALL",
        maxWeightGrams: 2000,
        maxLengthCm: 30, maxWidthCm: 25, maxHeightCm: 15,
        volumeScore: 3,
        allowedVehicles: ["BIKE", "MOTO", "CAR", "TRUCK"],
        displayOrder: 2,
        basePriceArs: 1200,
        pricePerKmArs: 73,
    },
    {
        name: "MEDIUM",
        maxWeightGrams: 15000,
        maxLengthCm: 50, maxWidthCm: 40, maxHeightCm: 30,
        volumeScore: 6,
        allowedVehicles: ["MOTO", "CAR", "TRUCK"],
        displayOrder: 3,
        basePriceArs: 2500,
        pricePerKmArs: 193,
    },
    {
        name: "LARGE",
        maxWeightGrams: 30000,
        maxLengthCm: 80, maxWidthCm: 60, maxHeightCm: 50,
        volumeScore: 10,
        allowedVehicles: ["CAR", "TRUCK"],
        displayOrder: 4,
        basePriceArs: 3500,
        pricePerKmArs: 222,
    },
    {
        name: "XL",
        maxWeightGrams: 70000,
        maxLengthCm: 120, maxWidthCm: 80, maxHeightCm: 80,
        volumeScore: 20,
        allowedVehicles: ["CAR", "TRUCK"],
        displayOrder: 5,
        basePriceArs: 5000,
        pricePerKmArs: 269,
    },
    {
        name: "FLETE",
        maxWeightGrams: 200000,
        maxLengthCm: 250, maxWidthCm: 150, maxHeightCm: 150,
        volumeScore: 50,
        allowedVehicles: ["TRUCK"],
        displayOrder: 6,
        basePriceArs: 8000,
        pricePerKmArs: 329,
    },
];

async function main() {
    console.log(`\n${isReset ? "[RESET]" : "[SEED]"} PackageCategory + DeliveryRate (Biblia v3)`);
    console.log("─".repeat(60));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const def of CATEGORIES) {
        const existing = await prisma.packageCategory.findUnique({
            where: { name: def.name },
            include: { deliveryRate: true },
        });

        if (!existing) {
            const cat = await prisma.packageCategory.create({
                data: {
                    name: def.name,
                    maxWeightGrams: def.maxWeightGrams,
                    maxLengthCm: def.maxLengthCm,
                    maxWidthCm: def.maxWidthCm,
                    maxHeightCm: def.maxHeightCm,
                    volumeScore: def.volumeScore,
                    allowedVehicles: def.allowedVehicles,
                    displayOrder: def.displayOrder,
                    isActive: true,
                },
            });
            await prisma.deliveryRate.create({
                data: {
                    categoryId: cat.id,
                    basePriceArs: def.basePriceArs,
                    pricePerKmArs: def.pricePerKmArs,
                    isActive: true,
                },
            });
            console.log(`  + ${def.name.padEnd(7)} → ${def.maxWeightGrams.toString().padStart(6)}g · base $${def.basePriceArs} · $${def.pricePerKmArs}/km · ${def.allowedVehicles.join(",")}`);
            created++;
        } else if (isReset) {
            await prisma.packageCategory.update({
                where: { id: existing.id },
                data: {
                    maxWeightGrams: def.maxWeightGrams,
                    maxLengthCm: def.maxLengthCm,
                    maxWidthCm: def.maxWidthCm,
                    maxHeightCm: def.maxHeightCm,
                    volumeScore: def.volumeScore,
                    allowedVehicles: def.allowedVehicles,
                    displayOrder: def.displayOrder,
                    isActive: true,
                },
            });
            if (existing.deliveryRate) {
                await prisma.deliveryRate.update({
                    where: { id: existing.deliveryRate.id },
                    data: {
                        basePriceArs: def.basePriceArs,
                        pricePerKmArs: def.pricePerKmArs,
                        isActive: true,
                    },
                });
            } else {
                await prisma.deliveryRate.create({
                    data: {
                        categoryId: existing.id,
                        basePriceArs: def.basePriceArs,
                        pricePerKmArs: def.pricePerKmArs,
                        isActive: true,
                    },
                });
            }
            console.log(`  ↻ ${def.name.padEnd(7)} → reset a defaults Biblia v3`);
            updated++;
        } else {
            console.log(`  · ${def.name.padEnd(7)} → ya existe, no se modifica`);
            skipped++;
        }
    }

    console.log("─".repeat(60));
    console.log(`Created: ${created}  ·  Updated: ${updated}  ·  Skipped: ${skipped}`);
    console.log("\n✓ PackageCategory + DeliveryRate listos.");
    console.log("  Editables desde /ops/config-biblia (regla canónica #10).\n");
}

main()
    .catch((err) => {
        console.error("✖ Error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
