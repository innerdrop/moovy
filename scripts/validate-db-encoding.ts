/**
 * Detecta mojibake (UTF-8 mal interpretado como CP-437/CP-1252/Latin-1)
 * en columnas de texto de la DB.
 *
 * Sale con codigo 1 si encuentra. Pensado como pre-commit check del
 * pipeline de export antes de commitear database_dump.sql.
 *
 * Run: npx tsx scripts/validate-db-encoding.ts
 *
 * Patron tipico: "Pizzería" almacenado mal aparece como "Pizzer├¡a" o
 * "PizzerÃ­a". Esto indica que el dump del pipeline corrompio bytes UTF-8
 * en algun paso intermedio (PowerShell, redirect, encoding de consola).
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Patrones de mojibake comunes:
// - CP-437/CP-850 leyendo UTF-8: ├¡, ├│, ├¬, ├½, ├▒, ├í, ├®, ├╣
// - Latin-1 leyendo UTF-8: Ãí, Ã©, Ã­, Ã³, Ãº, Ã±
// - Markers tipicos de double-encoded UTF-8: Â¡, Â¿
const MOJIBAKE_PATTERNS: RegExp[] = [
    /├[¡│¬½▒íé®╣╡]/,
    /Ã[¡©­³ºñÁÉÍÓÚÑ¶µ]/,
    /Â[¡¿]/,
    /\?\?\?\?/,
];

interface Row {
    id: string;
    text: string;
    column: string;
}

function findMojibake(rows: Row[], table: string): string[] {
    const issues: string[] = [];
    for (const row of rows) {
        if (!row.text) continue;
        for (const pattern of MOJIBAKE_PATTERNS) {
            if (pattern.test(row.text)) {
                issues.push(`${table}.${row.column} id=${row.id}: "${row.text}"`);
                break;
            }
        }
    }
    return issues;
}

async function main(): Promise<void> {
    console.log("Verificando encoding UTF-8 en columnas de texto de la DB local...\n");

    const issues: string[] = [];

    const categories = await prisma.category.findMany({
        select: { id: true, name: true, description: true },
    });
    issues.push(
        ...findMojibake(
            categories.map((c) => ({ id: c.id, text: c.name, column: "name" })),
            "Category",
        ),
    );
    issues.push(
        ...findMojibake(
            categories.map((c) => ({ id: c.id, text: c.description ?? "", column: "description" })),
            "Category",
        ),
    );

    const products = await prisma.product.findMany({
        select: { id: true, name: true, description: true },
        take: 1000,
    });
    issues.push(
        ...findMojibake(
            products.map((p) => ({ id: p.id, text: p.name, column: "name" })),
            "Product",
        ),
    );
    issues.push(
        ...findMojibake(
            products.map((p) => ({ id: p.id, text: p.description ?? "", column: "description" })),
            "Product",
        ),
    );

    const merchants = await prisma.merchant.findMany({
        select: { id: true, name: true, description: true },
        take: 500,
    });
    issues.push(
        ...findMojibake(
            merchants.map((m) => ({ id: m.id, text: m.name, column: "name" })),
            "Merchant",
        ),
    );
    issues.push(
        ...findMojibake(
            merchants.map((m) => ({ id: m.id, text: m.description ?? "", column: "description" })),
            "Merchant",
        ),
    );

    if (issues.length > 0) {
        console.error(`Mojibake detectado en ${issues.length} fila(s):\n`);
        issues.slice(0, 30).forEach((i) => console.error(`  - ${i}`));
        if (issues.length > 30) console.error(`  ... y ${issues.length - 30} mas`);
        console.error(
            "\nLa data en DB tiene tildes corruptas. Posibles causas:\n" +
                "  1. Pipeline de import (sync.ps1) cargo un dump corrupto.\n" +
                "  2. Algun seed escribio strings mal codificadas.\n" +
                "  3. El dump previo a este (commit anterior) estaba roto.\n\n" +
                "Antes de commitear database_dump.sql nuevo, limpia la DB.",
        );
        process.exit(1);
    }

    console.log("OK: no se detecto mojibake en Category/Product/Merchant.");
    console.log("Encoding UTF-8 limpio en la DB local.");
}

main()
    .catch((e) => {
        console.error("Error ejecutando validate-db-encoding:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
