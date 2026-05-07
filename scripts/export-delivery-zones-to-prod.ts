/**
 * export-delivery-zones-to-prod.ts
 * Rama: chore/export-delivery-zones-to-prod
 *
 * PROPÓSITO:
 * Lee las zonas de delivery del DB local (con polígonos PostGIS) y genera un
 * archivo SQL idempotente listo para correr contra la DB de producción.
 *
 * MOTIVACIÓN:
 * Los polígonos PostGIS son tipo `Unsupported(geometry(Polygon, 4326))` en
 * Prisma. `prisma db push` solo sincroniza schema, NO copia data. Los seeds
 * normales no pueden insertar polígonos via Prisma Client. La forma robusta
 * de transferir zonas a producción es generar SQL con ST_GeomFromText() y
 * ejecutarlo con psql.
 *
 * USO:
 *   # Preview (default, no genera nada — solo muestra qué se exportaría)
 *   npx tsx scripts/export-delivery-zones-to-prod.ts
 *
 *   # Genera el archivo SQL
 *   npx tsx scripts/export-delivery-zones-to-prod.ts --write
 *
 * OUTPUT:
 *   scripts/seed-delivery-zones-prod.sql
 *
 * APLICACIÓN EN PRODUCCIÓN (después del deploy de código):
 *   1. npx prisma db push                              # crea tabla si no existe
 *   2. npx tsx scripts/apply-postgis-zones-index.ts    # crea índice GIST
 *   3. psql $DATABASE_URL -f scripts/seed-delivery-zones-prod.sql
 *
 * IDEMPOTENCIA:
 * El SQL generado usa `INSERT ... ON CONFLICT (name) DO NOTHING`. Si la zona
 * ya existe en producción con ese nombre, NO se sobreescribe (defensa contra
 * correr el script dos veces por error). Si querés reemplazar una zona en
 * producción, borrala primero desde /ops/zonas-delivery o con DELETE manual.
 */

import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config();

const WRITE = process.argv.includes("--write");
const prisma = new PrismaClient();

interface ZoneRow {
    id: string;
    name: string;
    color: string;
    multiplier: number;
    driverBonus: number;
    polygon_wkt: string | null;
    isActive: boolean;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Escapa string para SQL (single quotes -> doble single quote).
 * Solo necesario para campos string del usuario (name, color).
 */
function sqlString(s: string): string {
    return `'${s.replace(/'/g, "''")}'`;
}

async function main() {
    console.log("");
    console.log("===================================================================");
    console.log("  Export de Delivery Zones para producción");
    console.log("===================================================================");
    console.log("");
    console.log(`  Modo: ${WRITE ? "WRITE (genera archivo SQL)" : "PREVIEW (dry-run)"}`);
    console.log(`  DB:   ${process.env.DATABASE_URL?.replace(/:\/\/[^@]+@/, "://***@") || "(no DATABASE_URL)"}`);
    console.log("");

    if (!process.env.DATABASE_URL) {
        console.error("ERROR: DATABASE_URL no está seteado. Abortando.");
        process.exit(1);
    }

    // Leer zonas con $queryRaw porque polygon es Unsupported() en Prisma.
    // Convertimos polygon a WKT (Well-Known Text) para portar a producción.
    const rows = await prisma.$queryRaw<ZoneRow[]>`
        SELECT
            id,
            name,
            color,
            multiplier,
            "driverBonus",
            ST_AsText(polygon) AS polygon_wkt,
            "isActive",
            "displayOrder",
            "createdAt",
            "updatedAt"
        FROM "DeliveryZone"
        ORDER BY "displayOrder" DESC, "createdAt" ASC
    `;

    if (rows.length === 0) {
        console.log("  No hay zonas en la DB local. Nada que exportar.");
        console.log("");
        await prisma.$disconnect();
        return;
    }

    console.log(`  Zonas encontradas: ${rows.length}`);
    console.log("");
    console.log("  ┌─────────────────────────────┬────────┬───────┬───────┬──────────┬─────────┐");
    console.log("  │ Nombre                      │ Activa │ Mult  │ Bonus │ Vértices │ Orden   │");
    console.log("  ├─────────────────────────────┼────────┼───────┼───────┼──────────┼─────────┤");

    let zonesWithPolygon = 0;
    let zonesWithoutPolygon = 0;

    for (const row of rows) {
        // El WKT de un polígono es algo como "POLYGON((-68.3 -54.8,-68.2 -54.8,...))"
        // Contamos los vértices contando comas dentro del primer ring + 1.
        let vertexCount = 0;
        if (row.polygon_wkt) {
            const ringMatch = row.polygon_wkt.match(/\(\(([^)]+)\)\)/);
            if (ringMatch) {
                vertexCount = ringMatch[1].split(",").length;
            }
            zonesWithPolygon++;
        } else {
            zonesWithoutPolygon++;
        }

        const name = row.name.padEnd(27).slice(0, 27);
        const active = row.isActive ? "  Sí  " : "  NO  ";
        const mult = `×${row.multiplier.toFixed(2)}`.padStart(5);
        const bonus = `+$${row.driverBonus}`.padStart(5);
        const verts = vertexCount > 0 ? String(vertexCount).padStart(8) : "      —";
        const order = String(row.displayOrder).padStart(7);
        console.log(`  │ ${name} │ ${active} │ ${mult} │ ${bonus} │ ${verts} │ ${order} │`);
    }
    console.log("  └─────────────────────────────┴────────┴───────┴───────┴──────────┴─────────┘");
    console.log("");
    console.log(`  Zonas con polígono dibujado: ${zonesWithPolygon}`);
    console.log(`  Zonas sin polígono (default a 1.0×): ${zonesWithoutPolygon}`);
    console.log("");

    if (zonesWithoutPolygon > 0) {
        console.log("  AVISO: las zonas sin polígono se exportarán igual (su INSERT no incluye");
        console.log("         polygon, queda NULL en producción). Si querés que tengan polígono,");
        console.log("         dibujalas en /ops/zonas-delivery y volvé a correr el export.");
        console.log("");
    }

    if (!WRITE) {
        console.log("  [PREVIEW] No se generó nada. Para escribir el SQL: --write");
        console.log("");
        await prisma.$disconnect();
        return;
    }

    // === Generar SQL ===
    const lines: string[] = [];
    lines.push("-- ============================================================");
    lines.push("-- DeliveryZone seed para producción");
    lines.push(`-- Generado el: ${new Date().toISOString()}`);
    lines.push(`-- Origen: ${process.env.DATABASE_URL?.replace(/:\/\/[^@]+@/, "://***@")}`);
    lines.push(`-- Cantidad de zonas: ${rows.length}`);
    lines.push("--");
    lines.push("-- IDEMPOTENCIA: usa ON CONFLICT (name) DO NOTHING. Correrlo dos veces");
    lines.push("-- es seguro — si la zona existe, se preserva la versión de producción.");
    lines.push("--");
    lines.push("-- Pre-requisitos en producción:");
    lines.push("--   1. La tabla DeliveryZone debe existir (npx prisma db push)");
    lines.push("--   2. La extensión PostGIS debe estar habilitada");
    lines.push("--   3. El índice GIST puede crearse después con apply-postgis-zones-index.ts");
    lines.push("--");
    lines.push("-- Aplicación: psql $DATABASE_URL -f scripts/seed-delivery-zones-prod.sql");
    lines.push("-- ============================================================");
    lines.push("");
    lines.push("BEGIN;");
    lines.push("");

    for (const row of rows) {
        lines.push(`-- Zona: ${row.name} (${row.isActive ? "activa" : "INACTIVA"})`);

        if (row.polygon_wkt) {
            lines.push(`INSERT INTO "DeliveryZone" (`);
            lines.push(`    id, name, color, multiplier, "driverBonus",`);
            lines.push(`    polygon, "isActive", "displayOrder",`);
            lines.push(`    "createdAt", "updatedAt"`);
            lines.push(`) VALUES (`);
            lines.push(`    ${sqlString(row.id)},`);
            lines.push(`    ${sqlString(row.name)},`);
            lines.push(`    ${sqlString(row.color)},`);
            lines.push(`    ${row.multiplier},`);
            lines.push(`    ${row.driverBonus},`);
            lines.push(`    ST_GeomFromText(${sqlString(row.polygon_wkt)}, 4326),`);
            lines.push(`    ${row.isActive},`);
            lines.push(`    ${row.displayOrder},`);
            lines.push(`    ${sqlString(row.createdAt.toISOString())},`);
            lines.push(`    ${sqlString(row.updatedAt.toISOString())}`);
            lines.push(`)`);
            lines.push(`ON CONFLICT (name) DO NOTHING;`);
        } else {
            lines.push(`INSERT INTO "DeliveryZone" (`);
            lines.push(`    id, name, color, multiplier, "driverBonus",`);
            lines.push(`    "isActive", "displayOrder",`);
            lines.push(`    "createdAt", "updatedAt"`);
            lines.push(`) VALUES (`);
            lines.push(`    ${sqlString(row.id)},`);
            lines.push(`    ${sqlString(row.name)},`);
            lines.push(`    ${sqlString(row.color)},`);
            lines.push(`    ${row.multiplier},`);
            lines.push(`    ${row.driverBonus},`);
            lines.push(`    ${row.isActive},`);
            lines.push(`    ${row.displayOrder},`);
            lines.push(`    ${sqlString(row.createdAt.toISOString())},`);
            lines.push(`    ${sqlString(row.updatedAt.toISOString())}`);
            lines.push(`)`);
            lines.push(`ON CONFLICT (name) DO NOTHING;`);
        }
        lines.push("");
    }

    lines.push("COMMIT;");
    lines.push("");
    lines.push("-- Verificación post-aplicación (ejecutar en producción para confirmar):");
    lines.push("-- SELECT id, name, multiplier, \"driverBonus\", \"isActive\", \"displayOrder\",");
    lines.push("--        ST_NPoints(polygon) AS vertex_count");
    lines.push("-- FROM \"DeliveryZone\" ORDER BY \"displayOrder\" DESC;");
    lines.push("");

    const sqlContent = lines.join("\n");
    const outPath = join(process.cwd(), "scripts", "seed-delivery-zones-prod.sql");
    writeFileSync(outPath, sqlContent, "utf8");

    console.log(`  [OK] SQL generado: ${outPath}`);
    console.log(`  Tamaño: ${(sqlContent.length / 1024).toFixed(1)} KB`);
    console.log("");
    console.log("  Próximos pasos para deployar a producción:");
    console.log("    1. .\\scripts\\devmain.ps1                                  # deploy de código");
    console.log("    2. (en el servidor de producción)");
    console.log("       npx prisma db push                                       # sincroniza schema");
    console.log("       npx tsx scripts/apply-postgis-zones-index.ts             # crea índice GIST");
    console.log("       psql $DATABASE_URL -f scripts/seed-delivery-zones-prod.sql  # carga las zonas");
    console.log("");

    await prisma.$disconnect();
}

main().catch((err) => {
    console.error("ERROR:", err);
    prisma.$disconnect();
    process.exit(1);
});
