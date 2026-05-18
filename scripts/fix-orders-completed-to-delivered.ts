/**
 * MOOVY — Cleanup: pedidos con status="COMPLETED" → "DELIVERED"
 *
 * Contexto (rama fix/orden-vuelve-a-pendiente-tras-calificar, 2026-05-17):
 *
 * Entre la rama feat/propinas-y-ratings-post-entrega y el fix mencionado,
 * el endpoint `POST /api/orders/[id]/rate` cambiaba el status del Order a
 * "COMPLETED" al guardar la calificación del repartidor. Pero ese estado
 * NO existe en `statusConfig` de la UI (/mis-pedidos hace
 * `statusConfig[order.status] || statusConfig.PENDING`), entonces los
 * pedidos calificados se mostraban como "Pendiente".
 *
 * El código ya está fixeado: el rate route ya no toca el status. Pero los
 * pedidos que se calificaron mientras el bug estaba vivo quedaron con
 * status="COMPLETED" en la DB. Este script los pasa a "DELIVERED" (su
 * estado real) para que se rendericen bien.
 *
 * Filtro de seguridad: SOLO pasa a DELIVERED los Orders que cumplan:
 *   - status == "COMPLETED"
 *   - driverRating != null   (confirma que es un pedido calificado, no otra cosa)
 *
 * Por qué doble filtro: aunque nada del código nuevo escribe "COMPLETED" a
 * Order.status, si alguien manualmente puso "COMPLETED" por otro motivo
 * (audit manual, prueba) y el pedido NO tiene driverRating, NO lo tocamos.
 *
 * Uso:
 *   DRY RUN (default, solo muestra cuántos cambiarían):
 *     npx tsx scripts/fix-orders-completed-to-delivered.ts
 *
 *   EJECUTAR (requiere confirmación interactiva "SI MIGRAR"):
 *     npx tsx scripts/fix-orders-completed-to-delivered.ts --execute
 *
 * Requisitos:
 *   - DATABASE_URL seteado (apunta a la DB objetivo: local o VPS)
 *   - Al menos un User con role = 'ADMIN' para firmar el audit log
 *
 * El script es idempotente: corrido dos veces no rompe nada (la segunda
 * corrida encuentra 0 candidatos porque ya están todos en DELIVERED).
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import readline from "readline";

dotenv.config();

const EXECUTE = process.argv.includes("--execute");
const prisma = new PrismaClient();

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
    log("  MOOVY — Fix: Order.status COMPLETED → DELIVERED");
    log("═══════════════════════════════════════════════════════════════════");
    log("");
    log(`  Modo: ${EXECUTE ? "🔥 EJECUTAR (update real)" : "🔍 DRY RUN (solo conteo)"}`);
    log(`  DB:   ${process.env.DATABASE_URL?.replace(/:\/\/[^@]+@/, "://***@") || "(no DATABASE_URL)"}`);
    log("");

    if (!process.env.DATABASE_URL) {
        console.error("❌ DATABASE_URL no está seteado. Abortando por seguridad.");
        process.exit(1);
    }

    // ─── Identificar admin para firmar el audit log ─────────────────────
    const admin = await prisma.user.findFirst({
        where: { role: "ADMIN", deletedAt: null },
        select: { id: true, email: true, name: true },
        orderBy: { createdAt: "asc" },
    });

    if (!admin) {
        console.error("❌ No hay usuario admin activo para firmar el audit log. Abortando.");
        console.error("   Corré primero: npx tsx scripts/create-admin.ts [email]");
        process.exit(1);
    }

    log(`  Admin auditor: ${admin.email} (${admin.name || "sin nombre"}) id=${admin.id}`);
    log("");

    // ─── Buscar candidatos ──────────────────────────────────────────────
    // Filtro estricto: status=COMPLETED Y driverRating != null. Esto garantiza
    // que solo tocamos los pedidos afectados por el bug del rate route, no
    // otros con status=COMPLETED puesto manualmente.
    const candidates = await prisma.order.findMany({
        where: {
            status: "COMPLETED",
            driverRating: { not: null },
        },
        select: {
            id: true,
            orderNumber: true,
            driverRating: true,
            ratedAt: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" },
    });

    log("─── Candidatos ──────────────────────────────────────────────────────");
    log("");
    log(`  Total a migrar: ${candidates.length}`);
    log("");

    if (candidates.length === 0) {
        log("✅ Nada que hacer. La DB ya está limpia.");
        await prisma.$disconnect();
        return;
    }

    // Sample para que el operador vea qué se va a tocar (primeros 5 + últimos 2)
    const sample = candidates.length <= 7
        ? candidates
        : [...candidates.slice(0, 5), ...candidates.slice(-2)];

    log("  Muestra:");
    for (const o of sample) {
        const created = o.createdAt.toISOString().slice(0, 16).replace("T", " ");
        const rated = o.ratedAt ? o.ratedAt.toISOString().slice(0, 16).replace("T", " ") : "(sin ratedAt)";
        log(`    • #${o.orderNumber.padEnd(12)} rating=${o.driverRating}  rated=${rated}  created=${created}`);
    }
    if (candidates.length > 7) {
        log(`    ... (${candidates.length - 7} más en el medio)`);
    }
    log("");

    // ─── DRY RUN — terminar acá ─────────────────────────────────────────
    if (!EXECUTE) {
        log("🔍 DRY RUN — no se modifica nada.");
        log(`   Para ejecutar de verdad: npx tsx scripts/fix-orders-completed-to-delivered.ts --execute`);
        log("");
        await prisma.$disconnect();
        return;
    }

    // ─── Confirmación interactiva ───────────────────────────────────────
    log(`⚠️  Vas a hacer UPDATE de ${candidates.length} pedidos de COMPLETED → DELIVERED.`);
    log("    Esto NO toca driverRating, ratedAt, ni ningún otro campo. Solo el status.");
    log("    NO se puede deshacer fácilmente (no hay rollback automático).");
    log("");
    const answer = await prompt("    Escribí 'SI MIGRAR' (sin comillas) para confirmar: ");
    if (answer.trim() !== "SI MIGRAR") {
        log("");
        log("❌ Confirmación incorrecta. Abortando sin tocar nada.");
        await prisma.$disconnect();
        process.exit(1);
    }
    log("");
    log("🔥 Confirmado. Ejecutando migración...");
    log("");

    // ─── Ejecutar dentro de una transaction ─────────────────────────────
    // Usamos Serializable porque tocamos status en bulk y queremos garantizar
    // que ningún otro proceso modifique estos rows mientras corremos.
    const result = await prisma.$transaction(async (tx) => {
        // Update masivo con el MISMO filtro: solo afecta los que ya validamos.
        // Si alguien rateó otro pedido entre el SELECT y el UPDATE, también se
        // incluye (el filtro lo captura). Si alguien cambió manualmente un row
        // a COMPLETED sin driverRating, NO se toca.
        const updateRes = await tx.order.updateMany({
            where: {
                status: "COMPLETED",
                driverRating: { not: null },
            },
            data: { status: "DELIVERED" },
        });

        // Audit log único con la lista de IDs afectados (para AAIP/AFIP y
        // forense por si alguien pregunta "¿quién cambió esto?").
        await tx.auditLog.create({
            data: {
                action: "BULK_FIX_ORDER_STATUS_COMPLETED_TO_DELIVERED",
                entityType: "Order",
                entityId: "BULK",
                userId: admin.id,
                details: JSON.stringify({
                    affectedCount: updateRes.count,
                    orderIds: candidates.map((c) => c.id),
                    orderNumbers: candidates.map((c) => c.orderNumber),
                    reason: "fix/orden-vuelve-a-pendiente-tras-calificar — rate route bug",
                    script: "scripts/fix-orders-completed-to-delivered.ts",
                    executedAt: new Date().toISOString(),
                }),
            },
        });

        return updateRes;
    }, { isolationLevel: "Serializable" });

    log("─── Resultado ───────────────────────────────────────────────────────");
    log("");
    log(`  ✅ Pedidos migrados: ${result.count}`);
    log(`  ✅ Audit log:        registro creado (action=BULK_FIX_ORDER_STATUS_COMPLETED_TO_DELIVERED, userId=${admin.id})`);
    log("");

    if (result.count !== candidates.length) {
        log(`⚠️  Atención: el conteo inicial era ${candidates.length} pero updateMany afectó ${result.count}.`);
        log("    Probablemente algún pedido cambió de estado entre el SELECT y el UPDATE.");
        log("    No es necesariamente un problema, pero vale la pena revisar.");
        log("");
    }

    log("✅ Listo. Los pedidos calificados ahora se renderizan como 'Entregado'.");
    log("");

    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error("❌ Error inesperado:", err);
    await prisma.$disconnect();
    process.exit(1);
});
