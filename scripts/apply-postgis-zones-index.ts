/**
 * Aplicar índice GiST sobre DeliveryZone.polygon
 * Rama: feat/zonas-delivery-multiplicador
 *
 * Reemplazo portable del comando `docker exec ... psql -f setup-postgis-zones.sql`.
 * Funciona desde cualquier ambiente (Windows/Mac/Linux/CI) sin depender de
 * conocer el nombre exacto del container Docker.
 *
 * Uso:
 *   npx tsx scripts/apply-postgis-zones-index.ts
 *
 * Idempotente: usa CREATE INDEX IF NOT EXISTS, podés correrlo varias veces.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("\n[POSTGIS] Aplicando índice GiST sobre DeliveryZone.polygon");
    console.log("─".repeat(60));

    // 1. Verificar que PostGIS está instalado (Moovy ya lo usa para tracking GPS).
    type ExtRow = { extname: string; extversion: string };
    const extension = await prisma.$queryRaw<ExtRow[]>`
        SELECT extname, extversion FROM pg_extension WHERE extname = 'postgis'
    `;
    if (extension.length === 0) {
        console.log("  ⚠ PostGIS no está instalado. Habilitando…");
        await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS postgis`);
        console.log("  ✓ PostGIS habilitado");
    } else {
        console.log(`  ✓ PostGIS detectado (versión ${extension[0].extversion})`);
    }

    // 2. Crear el índice GiST. Idempotente.
    await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "DeliveryZone_polygon_gist_idx"
            ON "DeliveryZone"
            USING GIST ("polygon")
    `);
    console.log("  ✓ Índice DeliveryZone_polygon_gist_idx creado/verificado");

    // 3. Verificar índices de DeliveryZone
    type IdxRow = { indexname: string };
    const indexes = await prisma.$queryRaw<IdxRow[]>`
        SELECT indexname FROM pg_indexes WHERE tablename = 'DeliveryZone' ORDER BY indexname
    `;
    console.log(`\n  Índices presentes en DeliveryZone:`);
    for (const idx of indexes) {
        console.log(`    · ${idx.indexname}`);
    }

    console.log("\n✓ Setup PostGIS completado.\n");
}

main()
    .catch((err) => {
        console.error("✖ Error aplicando índice:", err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
