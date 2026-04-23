/**
 * Cron: Avisos de vencimiento de documentos de repartidor + auto-suspensión.
 *
 * POST /api/cron/driver-docs-expiry
 * Corre diariamente (ver runner externo). Idempotente: usa <field>NotifiedStage
 * para no re-enviar avisos.
 *
 * Para cada uno de los 4 docs con vencimiento (licenciaUrl, seguroUrl, vtvUrl,
 * cedulaVerdeUrl):
 *   - Stage 0 → 1: doc aprobado, vence en ≤7d, todavía no avisado. Envía aviso
 *     preventivo (email + push) e incrementa stage a 1.
 *   - Stage 1 → 2: vence en ≤3d. Email urgente (warning rojo) + push.
 *   - Stage 2 → 3: vence en ≤1d. Última llamada + push.
 *   - Stage 3 → 4: ya venció. Email de expiración + push + auto-suspende al
 *     driver SI el doc es requerido para su vehicleType. Marca el campo
 *     <field>Status como "EXPIRED" y el NotifiedStage a 4. Suspensión via
 *     isSuspended: true + suspensionReason: "Documento vencido: <label>".
 *
 * Importante: la suspensión es idempotente (si ya está suspendido, skipea).
 * Si el driver renueva el doc (sube uno nuevo con expiresAt futuro), el
 * resetDriverDocumentToPending resetea stage a 0 y una aprobación futura
 * puede reactivar al driver manualmente desde OPS.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRequestLogger } from "@/lib/logger";
import { recordCronRun } from "@/lib/cron-health";
import { logAudit } from "@/lib/audit";
import { sendPushToUser } from "@/lib/push";
import {
    sendDriverDocExpiringEmail,
    sendDriverDocExpiredEmail,
} from "@/lib/email";
import {
    DRIVER_DOCUMENT_COLUMNS,
    getRequiredDriverDocumentFields,
    type DriverDocumentField,
} from "@/lib/driver-document-approval";

const logger = createRequestLogger("driver-docs-expiry");

/**
 * Los 4 docs con vencimiento trackeable. Deben coincidir 1:1 con los campos
 * <field>ExpiresAt + <field>NotifiedStage del schema Driver.
 */
const EXPIRING_FIELDS: DriverDocumentField[] = [
    "licenciaUrl",
    "seguroUrl",
    "vtvUrl",
    "cedulaVerdeUrl",
];

type StageThreshold = { stage: 1 | 2 | 3; label: "7d" | "3d" | "1d"; days: number };

const STAGE_THRESHOLDS: StageThreshold[] = [
    { stage: 3, label: "1d", days: 1 },
    { stage: 2, label: "3d", days: 3 },
    { stage: 1, label: "7d", days: 7 },
];

interface DriverDocRow {
    id: string;
    userId: string;
    vehicleType: string | null;
    user: { email: string | null; name: string | null } | null;
}

interface RunStats {
    notified7d: number;
    notified3d: number;
    notified1d: number;
    expired: number;
    suspended: number;
    errors: number;
}

function daysBetween(now: Date, target: Date): number {
    const ms = target.getTime() - now.getTime();
    return ms / (1000 * 60 * 60 * 24);
}

export async function POST(req: NextRequest) {
    // Auth ANTES de recordCronRun — intentos no autorizados no ensucian el healthcheck.
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { verifyBearerToken } = await import("@/lib/env-validation");
    if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
        logger.warn({ token: token?.slice(0, 8) }, "Unauthorized driver-docs-expiry request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stats = await recordCronRun("driver-docs-expiry", async () => {
            const result: RunStats = {
                notified7d: 0,
                notified3d: 0,
                notified1d: 0,
                expired: 0,
                suspended: 0,
                errors: 0,
            };

            const now = new Date();

            for (const field of EXPIRING_FIELDS) {
                const cols = DRIVER_DOCUMENT_COLUMNS[field];
                if (!cols.hasExpiration || !cols.expirationColumn || !cols.notifiedStageColumn) {
                    continue;
                }
                const expCol = cols.expirationColumn;
                const stageCol = cols.notifiedStageColumn;
                const statusCol = cols.statusColumn;

                // (1) PATH EXPIRED: drivers cuyo doc ya venció y stage < 4.
                const expiredCutoff = now;
                const expiredDrivers = await prisma.driver.findMany({
                    where: {
                        [expCol]: { lt: expiredCutoff },
                        [stageCol]: { lt: 4 },
                        // Solo docs que estuvieron APPROVED — los PENDING/REJECTED no tienen
                        // fecha real vigente que avisar.
                        [statusCol]: "APPROVED",
                    },
                    select: {
                        id: true,
                        userId: true,
                        vehicleType: true,
                        isSuspended: true,
                        user: { select: { email: true, name: true } },
                        [expCol]: true,
                    } as any,
                    take: 500,
                });

                for (const d of expiredDrivers as any[]) {
                    const row = d as DriverDocRow & { isSuspended: boolean } & Record<string, any>;
                    const expiresAt = row[expCol] as Date;

                    try {
                        // Marcar doc como EXPIRED + stage=4 atómico (solo si stage sigue < 4).
                        const updated = await prisma.driver.updateMany({
                            where: { id: row.id, [stageCol]: { lt: 4 } },
                            data: {
                                [statusCol]: "EXPIRED",
                                [stageCol]: 4,
                            },
                        });
                        if (updated.count === 0) continue; // race: otro run ya lo marcó

                        result.expired++;

                        // Auto-suspender si el doc es requerido para este vehicleType.
                        const required = getRequiredDriverDocumentFields(row.vehicleType);
                        const docIsRequired = required.includes(field);
                        if (docIsRequired && !row.isSuspended) {
                            await prisma.driver.update({
                                where: { id: row.id },
                                data: {
                                    isSuspended: true,
                                    suspendedAt: now,
                                    suspensionReason: `Documento vencido: ${cols.label}`,
                                    isOnline: false,
                                    availabilityStatus: "FUERA_DE_SERVICIO",
                                },
                            });
                            result.suspended++;

                            await logAudit({
                                action: "DRIVER_AUTO_SUSPENDED_BY_EXPIRY",
                                entityType: "Driver",
                                entityId: row.id,
                                userId: row.userId,
                                details: {
                                    documentField: field,
                                    documentLabel: cols.label,
                                    expiredAt: expiresAt.toISOString(),
                                },
                            });
                        }

                        // Email + push del doc vencido.
                        if (row.user?.email) {
                            sendDriverDocExpiredEmail(
                                row.user.email,
                                row.user.name || "Repartidor",
                                cols.label,
                                expiresAt
                            ).catch((err) =>
                                logger.error(
                                    { err, driverId: row.id, field },
                                    "Error sending expired email"
                                )
                            );
                        }
                        sendPushToUser(row.userId, {
                            title: "⛔ Documento vencido",
                            body: `Tu ${cols.label} venció. Actualizalo en tu perfil para volver a recibir pedidos.`,
                            url: "/repartidor/perfil",
                            tag: `driver-doc-expired-${field}`,
                        }).catch((err) =>
                            logger.error({ err, driverId: row.id, field }, "Error sending expired push")
                        );
                    } catch (err) {
                        result.errors++;
                        logger.error({ err, driverId: row.id, field }, "Error processing expired driver");
                    }
                }

                // (2) PATH WARNINGS: iterar thresholds 1d → 3d → 7d, el más cercano primero
                // para no mandar doble aviso si cae en dos ventanas.
                for (const threshold of STAGE_THRESHOLDS) {
                    const windowEnd = new Date(now.getTime() + threshold.days * 24 * 60 * 60 * 1000);

                    // Drivers cuyo doc vence en ≤ threshold.days días, status APPROVED,
                    // y cuyo stage es MENOR al stage que vamos a enviar (idempotencia).
                    const candidates = await prisma.driver.findMany({
                        where: {
                            [statusCol]: "APPROVED",
                            [expCol]: {
                                gte: now, // todavía no venció (el path expired cubre eso)
                                lte: windowEnd,
                            },
                            [stageCol]: { lt: threshold.stage },
                        },
                        select: {
                            id: true,
                            userId: true,
                            vehicleType: true,
                            user: { select: { email: true, name: true } },
                            [expCol]: true,
                        } as any,
                        take: 500,
                    });

                    for (const d of candidates as any[]) {
                        const row = d as DriverDocRow & Record<string, any>;
                        const expiresAt = row[expCol] as Date;
                        const daysRemaining = Math.max(0, Math.ceil(daysBetween(now, expiresAt)));

                        try {
                            // Bump atómico: solo gana si stage sigue < threshold.stage.
                            const updated = await prisma.driver.updateMany({
                                where: { id: row.id, [stageCol]: { lt: threshold.stage } },
                                data: { [stageCol]: threshold.stage },
                            });
                            if (updated.count === 0) continue; // race perdido

                            if (threshold.stage === 3) result.notified1d++;
                            else if (threshold.stage === 2) result.notified3d++;
                            else result.notified7d++;

                            if (row.user?.email) {
                                sendDriverDocExpiringEmail(
                                    row.user.email,
                                    row.user.name || "Repartidor",
                                    cols.label,
                                    daysRemaining,
                                    expiresAt
                                ).catch((err) =>
                                    logger.error(
                                        { err, driverId: row.id, field, stage: threshold.stage },
                                        "Error sending expiring email"
                                    )
                                );
                            }

                            const pushTitle =
                                threshold.stage === 3
                                    ? "⚠️ Tu documento vence mañana"
                                    : threshold.stage === 2
                                    ? "⚠️ Tu documento vence en 3 días"
                                    : "📄 Tu documento vence pronto";
                            const pushBody =
                                threshold.stage === 3
                                    ? `${cols.label}: última llamada. Subí el nuevo hoy para no quedar inactivo.`
                                    : threshold.stage === 2
                                    ? `${cols.label}: actualizalo antes del vencimiento para seguir recibiendo pedidos.`
                                    : `${cols.label} vence en ${daysRemaining} días. Renoválo sin apuros.`;

                            sendPushToUser(row.userId, {
                                title: pushTitle,
                                body: pushBody,
                                url: "/repartidor/perfil",
                                tag: `driver-doc-expiring-${field}-stage${threshold.stage}`,
                            }).catch((err) =>
                                logger.error(
                                    { err, driverId: row.id, field, stage: threshold.stage },
                                    "Error sending expiring push"
                                )
                            );
                        } catch (err) {
                            result.errors++;
                            logger.error(
                                { err, driverId: row.id, field, stage: threshold.stage },
                                "Error processing expiring driver"
                            );
                        }
                    }
                }
            }

            const itemsProcessed =
                result.notified7d + result.notified3d + result.notified1d + result.expired;

            return { result, itemsProcessed };
        });

        logger.info(stats, "Driver docs expiry cron completed");

        return NextResponse.json({
            success: true,
            ...stats,
        });
    } catch (error) {
        logger.error({ error }, "Error in driver-docs-expiry cron");
        return NextResponse.json(
            { error: "Error al procesar vencimientos de documentos" },
            { status: 500 }
        );
    }
}
