/**
 * Seed: DeliveryZone defaults (Zona A / B / C según Biblia v3)
 * Rama: feat/zonas-delivery-multiplicador
 *
 * Crea las 3 zonas canónicas con sus multiplicadores y bonus driver, PERO con
 * polígonos vacíos. El admin las dibuja desde /ops/zonas-delivery.
 *
 * Mientras los polígonos estén vacíos, el helper getZoneForLocation devuelve
 * null y el sistema cae a default (multiplier 1.0, sin bonus). Cuando el admin
 * dibuja una zona, esa zona empieza a aplicar a los pedidos cuya dirección
 * caiga dentro del polígono.
 *
 * IDEMPOTENTE: si la zona ya existe (por nombre), no la sobreescribe. Si querés
 * resetear los valores a Biblia v3, primero borrá la fila desde DB o ejecutá el
 * script con flag --reset.
 *
 * Uso:
 *   npx tsx scripts/seed-delivery-zones.ts            # crea solo las que faltan
 *   npx tsx scripts/seed-delivery-zones.ts --reset    # resetea valores (no toca polígonos)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const isReset = process.argv.includes("--reset");

interface ZoneDefault {
    name: string;
    color: string;
    multiplier: number;
    driverBonus: number;
    displayOrder: number;
}

// Defaults según CLAUDE.md / Biblia Financiera v3.
// Zona C tiene displayOrder más alto para ganar overlaps con A/B.
const DEFAULT_ZONES: ZoneDefault[] = [
    {
        name: "Zona A — Centro",
        color: "#22c55e", // verde
        multiplier: 1.0,
        driverBonus: 0,
        displayOrder: 1,
    },
    {
        name: "Zona B — Intermedia",
        color: "#eab308", // amarillo
        multiplier: 1.15,
        driverBonus: 150,
        displayOrder: 2,
    },
    {
        name: "Zona C — Alta / Difícil",
        color: "#ef4444", // rojo
        multiplier: 1.35,
        driverBonus: 350,
        displayOrder: 3,
    },
];

async function main() {
    console.log(`\n${isReset ? "[RESET]" : "[SEED]"} Delivery Zones (Biblia Financiera v3)`);
    console.log("─".repeat(60));

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const def of DEFAULT_ZONES) {
        const existing = await prisma.deliveryZone.findUnique({ where: { name: def.name } });

        if (!existing) {
            // Insert con polígono NULL (admin lo dibuja después).
            // Generamos id manual porque Prisma no soporta scalar fields con default(cuid())
            // en raw inserts cuando hay Unsupported types involucrados.
            const id = `zone_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            await prisma.$executeRaw`
                INSERT INTO "DeliveryZone"
                    (id, name, color, multiplier, "driverBonus", "displayOrder", "isActive", polygon, "createdAt", "updatedAt")
                VALUES (
                    ${id},
                    ${def.name},
                    ${def.color},
                    ${def.multiplier},
                    ${def.driverBonus},
                    ${def.displayOrder},
                    true,
                    NULL,
                    NOW(),
                    NOW()
                )
            `;
            console.log(`  + ${def.name} → ×${def.multiplier} +$${def.driverBonus} driver`);
            created++;
        } else if (isReset) {
            // Reset valores manteniendo el polígono dibujado
            await prisma.deliveryZone.update({
                where: { name: def.name },
                data: {
                    color: def.color,
                    multiplier: def.multiplier,
                    driverBonus: def.driverBonus,
                    displayOrder: def.displayOrder,
                    isActive: true,
                },
            });
            console.log(`  ↻ ${def.name} → reset a defaults Biblia v3`);
            updated++;
        } else {
            console.log(`  · ${def.name} → ya existe, no se modifica`);
            skipped++;
        }
    }

    console.log("─".repeat(60));
    console.log(`Created: ${created}  ·  Updated: ${updated}  ·  Skipped: ${skipped}`);
    console.log("\n✓ Seed completo. Las zonas tienen polígonos vacíos hasta que el admin");
    console.log("  las dibuje desde /ops/zonas-delivery con el mapa de Google.");
    console.log("");
}

main()
    .catch((err) => {
        console.error("✖ Error:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
