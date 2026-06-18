/**
 * MOOVY — Verificación: campana de notificaciones de OPS
 *
 * Rama feat/ops-campana-notificaciones (2026-06-17).
 *
 * Corre las MISMAS 4 queries que el endpoint /api/admin/notifications contra la
 * DB real (sin mocks) e imprime el conteo por fuente. Sirve para:
 *   - Confirmar que los nombres de modelos/campos existen (Prisma no explota).
 *   - Ver qué pendientes hay hoy en la DB antes de probar la campana en el panel.
 *   - Detectar el caso "vacío" (todo en cero -> la campana debe mostrar "Sin novedades").
 *
 * Read-only: NO escribe nada. No requiere --execute.
 *
 * Uso:
 *   npx tsx scripts/verify-ops-notifications.ts
 *
 * Cuándo:
 *   1. En local (DATABASE_URL -> localhost:5436) durante el QA de la rama.
 *   2. Opcional: en prod tras el deploy, para ver el estado real de las colas.
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();

const PIN_ISSUE_WINDOW_HOURS = 48;
const prisma = new PrismaClient();

async function main() {
    console.log("\n=== Verificación campana de notificaciones OPS ===\n");

    let total = 0;
    const line = (label: string, n: number) => {
        total += n;
        console.log(`  ${n.toString().padStart(4)}  ${label}`);
    };

    // 1. Aprobaciones pendientes
    try {
        const [merchants, drivers] = await Promise.all([
            prisma.merchant.count({ where: { approvalStatus: "PENDING", owner: { deletedAt: null } } }),
            prisma.driver.count({ where: { approvalStatus: "PENDING", user: { deletedAt: null } } }),
        ]);
        console.log("[1] Aprobaciones pendientes");
        line("comercios PENDING", merchants);
        line("repartidores PENDING", drivers);
    } catch (err) {
        console.error("[1] FALLÓ fuente aprobaciones:", err);
    }

    // 2. Change-requests de documentos abiertos
    try {
        const [merchantCRs, driverCRs] = await Promise.all([
            prisma.merchantDocumentChangeRequest.count({ where: { status: "PENDING" } }),
            prisma.driverDocumentChangeRequest.count({ where: { status: "PENDING" } }),
        ]);
        console.log("[2] Change-requests de documentos");
        line("change-requests comercio PENDING", merchantCRs);
        line("change-requests repartidor PENDING", driverCRs);
    } catch (err) {
        console.error("[2] FALLÓ fuente change-requests:", err);
    }

    // 3. Reseñas en moderación
    try {
        const reviews = await prisma.order.count({
            where: {
                OR: [
                    { driverRatingModerationStatus: "PENDING" },
                    { merchantRatingModerationStatus: "PENDING" },
                    { sellerRatingModerationStatus: "PENDING" },
                ],
            },
        });
        console.log("[3] Reseñas en moderación");
        line("pedidos con reseña PENDING", reviews);
    } catch (err) {
        console.error("[3] FALLÓ fuente reseñas:", err);
    }

    // 4. Incidentes de PIN (ventana reciente)
    try {
        const since = new Date(Date.now() - PIN_ISSUE_WINDOW_HOURS * 60 * 60 * 1000);
        const pinIssues = await prisma.auditLog.count({
            where: { action: "DRIVER_PIN_ISSUE_REPORTED", createdAt: { gte: since } },
        });
        console.log(`[4] Incidentes de PIN (últimas ${PIN_ISSUE_WINDOW_HOURS}h)`);
        line("reportes de PIN", pinIssues);
    } catch (err) {
        console.error("[4] FALLÓ fuente incidentes PIN:", err);
    }

    console.log("\n  ----");
    console.log(`  ${total.toString().padStart(4)}  TOTAL de notificaciones`);
    if (total === 0) {
        console.log("\n  -> Sin pendientes: la campana debe mostrar \"Sin novedades\".");
    } else {
        console.log("\n  -> Hay pendientes: el badge debe mostrar el conteo de no-vistos.");
    }
    console.log("");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
