/**
 * Verificación — feat/home-builder-pagina-inicio
 *
 * 1. Seed idempotente: tras el sync, TODA key del registry tiene fila en HomeSection.
 * 2. Sin huérfanas: no hay filas en DB con una key que ya no exista en el registry.
 * 3. resolveHomeLayout() devuelve exactamente las secciones del registry, sin duplicados.
 * 4. Imprime el orden efectivo del home (para verificar a ojo).
 *
 * NO escribe nada destructivo: solo siembra las filas faltantes (idempotente), igual
 * que la API de OPS. Uso: npx tsx scripts/verify-home-sections.ts
 */

import { prisma } from "../src/lib/prisma";
import { HOME_SECTIONS, HOME_SECTION_KEYS, resolveHomeLayout } from "../src/lib/home/sections";

let passed = 0;
let failed = 0;

function check(cond: boolean, msg: string) {
    if (cond) {
        passed++;
        console.log(`  ✅ ${msg}`);
    } else {
        failed++;
        console.log(`  ❌ ${msg}`);
    }
}

async function main() {
    console.log("── Verificación Home Builder ──\n");

    // Seed idempotente de las filas faltantes (espejo de la API de OPS).
    const existing = await prisma.homeSection.findMany({ select: { key: true } });
    const existingKeys = new Set(existing.map((s) => s.key));
    const missing = HOME_SECTIONS.filter((d) => !existingKeys.has(d.key));
    if (missing.length > 0) {
        await prisma.homeSection.createMany({
            data: missing.map((d) => ({
                key: d.key,
                label: d.label,
                order: d.defaultOrder,
                enabled: true,
            })),
            skipDuplicates: true,
        });
        console.log(`Sembradas ${missing.length} secciones faltantes: ${missing.map((m) => m.key).join(", ")}\n`);
    }

    const rows = await prisma.homeSection.findMany({
        select: { key: true, order: true, enabled: true },
    });

    // 1. Cada key del registry tiene fila.
    for (const def of HOME_SECTIONS) {
        check(rows.some((r) => r.key === def.key), `Registry key en DB: ${def.key}`);
    }

    // 2. Sin filas huérfanas.
    const orphans = rows.filter((r) => !HOME_SECTION_KEYS.includes(r.key));
    check(orphans.length === 0, `Sin filas huérfanas (${orphans.map((o) => o.key).join(", ") || "ninguna"})`);

    // 3. resolveHomeLayout: todas las secciones, sin duplicados.
    const layout = resolveHomeLayout(rows);
    check(layout.length === HOME_SECTIONS.length, `resolveHomeLayout devuelve ${HOME_SECTIONS.length} secciones (dio ${layout.length})`);
    const uniq = new Set(layout.map((l) => l.key));
    check(uniq.size === layout.length, "Sin keys duplicadas en el layout");

    console.log("\nOrden efectivo del home:");
    layout.forEach((l, i) => console.log(`  ${i + 1}. ${l.key}${l.enabled ? "" : "  (oculta)"}`));

    console.log(`\n${passed} OK, ${failed} fallos`);
    await prisma.$disconnect();
    process.exit(failed > 0 ? 1 : 0);
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
