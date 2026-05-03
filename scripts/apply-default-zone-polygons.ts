/**
 * Apply default zone polygons (Zonas A / B / C de Ushuaia)
 * Rama: feat/zonas-delivery-multiplicador
 *
 * Aplica polígonos predefinidos a las 3 zonas seedeadas (A/B/C). Los polígonos
 * son aproximaciones rectangulares basadas en investigación de la geografía
 * de Ushuaia y los barrios reales:
 *
 *   ZONA A — Centro / Costa (baja dificultad)
 *     • Casco histórico, Av. San Martín, Av. Maipú, puerto, Casa de Gobierno
 *     • Pendiente leve, accesible todo el año
 *     • Multiplicador 1.0, sin bonus driver
 *
 *   ZONA B — Intermedia (media dificultad)
 *     • Norte de Av. Maipú: Don Bosco, Yaganes, Kuanip, Fueguia Básquet
 *     • Pendiente moderada, dificultad con nieve fuerte
 *     • Multiplicador 1.15, +$150 driver
 *
 *   ZONA C — Alta / Difícil (alta dificultad)
 *     • Andorra (Valle), Pioneros Fueguinos, La Cantera, Magallanes,
 *       El Progreso, Nueva Provincia, Río Pipo, Alakalufes
 *     • Calles empinadas, hielo/nieve frecuente, riesgo para drivers
 *     • Multiplicador 1.35, +$350 driver
 *
 * IDEMPOTENTE — solo aplica polígono a zonas que NO tienen uno (polygon IS NULL).
 * Si el admin ya dibujó zonas custom desde /ops/zonas-delivery, NO las sobrescribe.
 *
 * Uso:
 *   npx tsx scripts/apply-default-zone-polygons.ts
 *   npx tsx scripts/apply-default-zone-polygons.ts --force   # sobrescribe zonas con polígono custom
 *
 * IMPORTANTE: estos polígonos son rectángulos APROXIMADOS. El admin debe
 * refinarlos en /ops/zonas-delivery con el mapa para reflejar contornos
 * reales (ej: seguir Av. Perito Moreno como límite norte de Zona B).
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const isForce = process.argv.includes("--force");
// Doble confirmación para sobrescribir polígonos manuales — `--force` solo
// muestra preview, hay que sumar `--confirm SOBRESCRIBIR` para aplicar.
// Esto evita el accidente de Mauro 2026-04-30: un --force ciego le borró las
// zonas que había dibujado a mano. Regla canónica #26: operaciones destructivas
// requieren confirmación textual literal.
const confirmIdx = process.argv.indexOf("--confirm");
const confirmValue = confirmIdx >= 0 ? process.argv[confirmIdx + 1] : null;
const isReallyForce = isForce && confirmValue === "SOBRESCRIBIR";

// Polígonos GeoJSON [lng, lat] (convención RFC 7946).
// Coordenadas basadas en geografía real de Ushuaia (centro ~ -54.8019, -68.3030).
// El primer y último punto deben ser iguales (polígono cerrado).

interface ZonePolygon {
    name: string;
    polygon: [number, number][];
    description: string;
}

const ZONE_POLYGONS: ZonePolygon[] = [
    {
        name: "Zona A — Centro",
        description: "Desde el Canal Beagle hasta calle Alem (Ruta 3): San Martín, Maipú, puerto, casco histórico",
        polygon: [
            [-68.330, -54.815], // SW — extremo oeste costa
            [-68.255, -54.815], // SE — extremo este costa (hacia aeropuerto)
            [-68.255, -54.804], // NE — Alem (Ruta 3) lado este
            [-68.330, -54.804], // NW — Alem (Ruta 3) lado oeste
            [-68.330, -54.815], // close
        ],
    },
    {
        name: "Zona B — Intermedia",
        description: "Desde Alem (Ruta 3) hasta calle Las Primulas: residencial intermedia, pendiente moderada",
        polygon: [
            [-68.335, -54.804], // SW — Alem oeste
            [-68.255, -54.804], // SE — Alem este
            [-68.255, -54.794], // NE — Las Primulas este
            [-68.335, -54.794], // NW — Las Primulas oeste
            [-68.335, -54.804], // close
        ],
    },
    {
        name: "Zona C — Alta / Difícil",
        description: "Desde Las Primulas hacia las montañas: Andorra, Pioneros Fueguinos, La Cantera, Magallanes, Río Pipo",
        polygon: [
            [-68.345, -54.794], // SW — Las Primulas oeste, pegado a Zona B
            [-68.255, -54.794], // SE — Las Primulas este, pegado a Zona B
            [-68.230, -54.778], // E — Valle de Andorra (noreste)
            [-68.270, -54.760], // NE — extremo norte Andorra
            [-68.345, -54.770], // N — extremo norte oeste (Río Pipo / Pioneros Fueguinos)
            [-68.380, -54.785], // NW — Río Pipo lejano
            [-68.345, -54.794], // close
        ],
    },
];

async function main() {
    const mode = isReallyForce ? "[FORCE+CONFIRM]" : isForce ? "[FORCE-PREVIEW]" : "[APPLY]";
    console.log(`\n${mode} Default polygons para Zonas A/B/C de Ushuaia`);
    console.log("─".repeat(60));

    // Si el usuario pasa --force pero NO confirmó, mostrar qué zonas tienen
    // polígono manual y abortar antes de tocar nada.
    if (isForce && !isReallyForce) {
        console.log("\n⚠️  MODO --force SIN CONFIRMACIÓN");
        console.log("    Este comando va a SOBRESCRIBIR polígonos que dibujaste a mano.");
        console.log("    Los polígonos viejos NO se pueden recuperar (a menos que tengas backup pg_dump).\n");

        type ZoneRow = { id: string; name: string; hasPolygon: boolean; vertexCount: number };
        const rows = await prisma.$queryRaw<ZoneRow[]>`
            SELECT
                id, name,
                (polygon IS NOT NULL) AS "hasPolygon",
                CASE WHEN polygon IS NULL THEN 0
                    ELSE ST_NPoints(polygon) END AS "vertexCount"
            FROM "DeliveryZone"
            ORDER BY "displayOrder"
        `;

        console.log("    Estado actual de las zonas:");
        for (const r of rows) {
            const status = r.hasPolygon ? `✓ ${r.vertexCount} vértices` : "✗ vacía";
            console.log(`      · ${r.name} → ${status}`);
        }

        const wouldOverwrite = rows.filter((r) => r.hasPolygon && ZONE_POLYGONS.some((p) => p.name === r.name)).length;
        console.log(`\n    Se sobrescribirían ${wouldOverwrite} zonas con polígono dibujado.`);
        console.log("\n    Si REALMENTE querés sobrescribir, agregá la confirmación textual:");
        console.log("      npx tsx scripts/apply-default-zone-polygons.ts --force --confirm SOBRESCRIBIR\n");
        console.log("    Si no querés perder los dibujos, simplemente cancelá (Ctrl+C) y editá");
        console.log("    los polígonos desde /ops/zonas-delivery con el panel OPS.\n");
        process.exit(0);
    }

    let applied = 0;
    let skipped = 0;
    let notFound = 0;

    for (const def of ZONE_POLYGONS) {
        const zone = await prisma.deliveryZone.findUnique({ where: { name: def.name } });
        if (!zone) {
            console.log(`  ✖ ${def.name} NO existe en DB. Corré primero seed-delivery-zones.ts`);
            notFound++;
            continue;
        }

        // Chequear si ya tiene polígono dibujado
        type CheckRow = { hasPolygon: boolean };
        const check = await prisma.$queryRaw<CheckRow[]>`
            SELECT (polygon IS NOT NULL) AS "hasPolygon" FROM "DeliveryZone" WHERE id = ${zone.id}
        `;
        const hasPolygon = check[0]?.hasPolygon ?? false;

        if (hasPolygon && !isReallyForce) {
            console.log(`  · ${def.name} ya tiene polígono dibujado. Skip.`);
            skipped++;
            continue;
        }

        const geoJson = JSON.stringify({ type: "Polygon", coordinates: [def.polygon] });

        await prisma.$executeRaw`
            UPDATE "DeliveryZone"
            SET polygon = ST_SetSRID(ST_GeomFromGeoJSON(${geoJson}), 4326),
                "updatedAt" = NOW()
            WHERE id = ${zone.id}
        `;

        console.log(`  ✓ ${def.name}`);
        console.log(`      ${def.description}`);
        console.log(`      ${def.polygon.length - 1} vértices`);
        applied++;
    }

    console.log("─".repeat(60));
    console.log(`Applied: ${applied}  ·  Skipped: ${skipped}  ·  Not found: ${notFound}`);
    if (applied > 0) {
        console.log("\n✓ Polígonos aplicados.");
        console.log("\n  IMPORTANTE: estos son rectángulos APROXIMADOS basados en investigación.");
        console.log("  Refinalos en /ops/zonas-delivery dibujando contornos reales.");
    }
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
