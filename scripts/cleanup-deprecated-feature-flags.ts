/**
 * MOOVY — Cleanup: eliminar FeatureFlags huérfanos
 *
 * Contexto (rama fix/restaurar-moover-y-marketplace-sin-flags, 2026-05-17):
 *
 * El sistema de feature flags (rama feat/feature-flags-ops, 2026-05-13)
 * introdujo dos flags que NO debieron haber existido nunca:
 *
 *   - buyer.marketplace      → ocultaba el botón Marketplace del BottomNav
 *   - buyer.puntos-moover    → ocultaba el botón MOOVER del BottomNav
 *
 * Marketplace y MOOVER son producto core y no deben poder ocultarse desde
 * OPS. En esta rama eliminamos el código que los consumía + el seed que
 * los crea, pero las filas que ya existen en la DB siguen apareciendo en
 * el panel /ops/feature-flags (porque ese panel lee toda la tabla, no le
 * importa si el código las consume).
 *
 * Actualización (chore/quitar-flag-efectivo, 2026-06-17): se suma una tercera
 * key, `buyer.cash-payment`. El checkout pasó a ser electrónico-only el
 * 2026-06-06 y ese flag quedó como interruptor "fantasma" que no cableaba nada.
 * El código de efectivo queda dormido en orders/route.ts por si se reactiva en
 * una Fase 2; sólo borramos la fila del flag para que no confunda en el panel.
 *
 * Este script borra esas filas. Idempotente.
 *
 * Uso:
 *   DRY RUN (default, solo cuenta):
 *     npx tsx scripts/cleanup-deprecated-feature-flags.ts
 *
 *   EJECUTAR (requiere confirmación "SI LIMPIAR"):
 *     npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute
 *
 * Cuando correrlo:
 *   1. Una vez en tu DB local (DATABASE_URL apunta a localhost:5436)
 *   2. Después de devmain.ps1, una vez en la DB de prod
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const EXECUTE = process.argv.includes("--execute");
const prisma = new PrismaClient();

const DEPRECATED_KEYS = [
    "buyer.marketplace",
    "buyer.puntos-moover",
    // chore/quitar-flag-efectivo (2026-06-17): el checkout es electronico-only,
    // este flag habia quedado como interruptor "fantasma" sin cablear.
    "buyer.cash-payment",
];

function log(msg: string) {
    console.log(msg);
}

async function prompt(question: string): Promise<string> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (answer) => { rl.close(); resolve(answer); }));
}

async function main() {
    log("");
    log("═══════════════════════════════════════════════════════════════════");
    log("  MOOVY — Cleanup: FeatureFlags huérfanos");
    log("═══════════════════════════════════════════════════════════════════");
    log("");
    log(`  Modo: ${EXECUTE ? "🔥 EJECUTAR (delete real)" : "🔍 DRY RUN (solo conteo)"}`);
    log(`  DB:   ${process.env.DATABASE_URL?.replace(/:\/\/[^@]+@/, "://***@") || "(no DATABASE_URL)"}`);
    log("");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL no está seteado. Abortando por seguridad.");
        process.exit(1);
    }

    // Identificar admin para firmar el audit log
    const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", deletedAt: null },
        select: { id: true, email: true, name: true },
        orderBy: { createdAt: "asc" },
    });

    if (!admin) {
        console.error("❌ No hay usuario admin activo para firmar el audit log. Abortando.");
        process.exit(1);
    }

    log(`  Admin auditor: ${admin.email} (${admin.name || "sin nombre"}) id=${admin.id}`);
    log("");

    // Buscar candidatos
    const flags = await prisma.featureFlag.findMany({
        where: { key: { in: DEPRECATED_KEYS } },
        select: {
            id: true,
            key: true,
            label: true,
            isActive: true,
            updatedAt: true,
        },
    });

    log("─── Flags a eliminar ────────────────────────────────────────────────");
    log("");
    log(`  Total encontrados: ${flags.length} / ${DEPRECATED_KEYS.length} esperados`);
    log("");

    if (flags.length === 0) {
        log("✅ Nada que hacer. La DB ya está limpia.");
        await prisma.$disconnect();
        return;
    }

    for (const f of flags) {
        const status = f.isActive ? "🟢 ACTIVO" : "⚪ INACTIVO";
        log(`    • ${f.key.padEnd(28)} ${status}  (${f.label})`);
    }
    log("");

    // DRY RUN — terminar acá
    if (!EXECUTE) {
        log("🔍 DRY RUN — no se borra nada.");
        log("   Para borrar de verdad: npx tsx scripts/cleanup-deprecated-feature-flags.ts --execute");
        log("");
        await prisma.$disconnect();
        return;
    }

    // Confirmación interactiva
    log(`⚠️  Vas a BORRAR ${flags.length} filas de la tabla FeatureFlag.`);
    log("    Esto es IRREVERSIBLE. Las claves son las correctas:");
    for (const k of DEPRECATED_KEYS) log(`      - ${k}`);
    log("");
    const answer = await prompt("    Escribí 'SI LIMPIAR' (sin comillas) para confirmar: ");
    if (answer.trim() !== "SI LIMPIAR") {
        log("");
        log("❌ Confirmación incorrecta. Abortando sin tocar nada.");
        await prisma.$disconnect();
        process.exit(1);
    }
    log("");
    log("🔥 Confirmado. Eliminando...");
    log("");

    // Ejecutar dentro de una transaction
    const result = await prisma.$transaction(async (tx) => {
        const deleteRes = await tx.featureFlag.deleteMany({
            where: { key: { in: DEPRECATED_KEYS } },
        });

        await tx.auditLog.create({
            data: {
                action: "CLEANUP_DEPRECATED_FEATURE_FLAGS",
                entityType: "FeatureFlag",
                entityId: "BULK",
                userId: admin.id,
                details: JSON.stringify({
                    deletedCount: deleteRes.count,
                    keys: flags.map((f) => f.key),
                    reason: "Limpieza de FeatureFlags huérfanos: over-reach marketplace/puntos (fix/restaurar-moover-y-marketplace-sin-flags) + flag de efectivo fantasma (chore/quitar-flag-efectivo)",
                    script: "scripts/cleanup-deprecated-feature-flags.ts",
                    executedAt: new Date().toISOString(),
                }),
            },
        });

        return deleteRes;
    }, { isolationLevel: "Serializable" });

    log("─── Resultado ───────────────────────────────────────────────────────");
    log("");
    log(`  ✅ Flags eliminados: ${result.count}`);
    log(`  ✅ Audit log:        registro creado (action=CLEANUP_DEPRECATED_FEATURE_FLAGS)`);
    log("");
    log("✅ Listo. El panel /ops/feature-flags ya no debería mostrar esos flags.");
    log("");

    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error("❌ Error inesperado:", err);
    await prisma.$disconnect();
    process.exit(1);
});
