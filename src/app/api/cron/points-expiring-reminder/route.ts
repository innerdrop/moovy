/**
 * Cron: Aviso de puntos MOOVER próximos a vencer.
 *
 * POST /api/cron/points-expiring-reminder
 * Corre diariamente (ver runner externo).
 *
 * Regla Biblia v3: los puntos vencen después de 6 meses (180 días) SIN actividad
 * de pedidos. El aviso se manda cuando el user lleva >=150 días (5 meses) sin
 * hacer un pedido, dándole 30 días de margen para reactivar.
 *
 * Idempotencia: User.pointsExpiryNotifiedAt se setea cuando mandamos el aviso,
 * y se resetea a null cuando el user crea un nuevo pedido (src/app/api/orders/route.ts)
 * o cuando una orden pasa a DELIVERED (src/lib/points.ts awardOrderPointsIfDelivered).
 * Patrón atómico: updateMany WHERE pointsExpiryNotifiedAt IS NULL + check count===1
 * antes de mandar el email para no doble disparar si dos runs del cron pisan la
 * misma hora.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRequestLogger } from "@/lib/logger";
import { recordCronRun } from "@/lib/cron-health";
import { sendPointsExpiringEmail } from "@/lib/email-admin-ops";

const logger = createRequestLogger("points-expiring-reminder");

const POINTS_EXPIRY_DAYS = 180; // 6 meses (Biblia v3)
const NOTIFY_AT_DAYS_INACTIVE = 150; // Se avisa a los 5 meses de inactividad
const BATCH_SIZE = 500;

export const dynamic = "force-dynamic";

interface Stats {
    candidates: number;
    notified: number;
    skippedNoEmail: number;
    skippedAlreadyNotified: number;
    errors: number;
}

export async function POST(req: NextRequest) {
    // Auth ANTES de recordCronRun — intentos no autorizados no ensucian el healthcheck.
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { verifyBearerToken } = await import("@/lib/env-validation");
    if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
        logger.warn({ token: token?.slice(0, 8) }, "Unauthorized points-expiring-reminder request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stats = await recordCronRun("points-expiring-reminder", async () => {
            const result: Stats = {
                candidates: 0,
                notified: 0,
                skippedNoEmail: 0,
                skippedAlreadyNotified: 0,
                errors: 0,
            };

            const now = new Date();
            // Threshold: "última actividad antes de esta fecha" = usuario llegó al umbral
            // de 150 días sin pedido.
            const inactivityCutoff = new Date(now);
            inactivityCutoff.setDate(inactivityCutoff.getDate() - NOTIFY_AT_DAYS_INACTIVE);

            // Cutoff de expiración real (180d). Para cada candidato calcularemos
            // daysUntilExpiry = 180 - daysSinceLastOrder.
            //
            // Query: users con pointsBalance > 0, pointsExpiryNotifiedAt null
            // (aún no avisados este ciclo), no borrados, y que NO tengan ningún
            // pedido creado después del inactivityCutoff.
            //
            // Uso `_count` + filtro por `orders` con where: se traduce a subquery
            // SQL: `WHERE (SELECT COUNT(*) FROM Order WHERE userId=u.id AND createdAt > cutoff) = 0`.
            // Más correcto en Prisma: usar `NOT: { orders: { some: {...} } }`.
            const candidates = await prisma.user.findMany({
                where: {
                    pointsBalance: { gt: 0 },
                    pointsExpiryNotifiedAt: null,
                    deletedAt: null,
                    isSuspended: false,
                    NOT: {
                        orders: {
                            some: {
                                createdAt: { gt: inactivityCutoff },
                            },
                        },
                    },
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    name: true,
                    pointsBalance: true,
                    orders: {
                        select: { createdAt: true },
                        orderBy: { createdAt: "desc" },
                        take: 1,
                    },
                },
                take: BATCH_SIZE,
            });

            result.candidates = candidates.length;

            for (const user of candidates) {
                if (!user.email) {
                    result.skippedNoEmail++;
                    continue;
                }
                const lastOrderAt = user.orders[0]?.createdAt ?? null;

                // Si el user nunca pidió nada, ignoramos — el signup bonus todavía
                // está pending (bonusActivated=false). Los puntos legítimos acá son
                // solo de usuarios que SÍ pidieron alguna vez pero se fueron apagando.
                if (!lastOrderAt) {
                    result.skippedAlreadyNotified++;
                    continue;
                }

                const daysSinceLastOrder = Math.floor(
                    (now.getTime() - lastOrderAt.getTime()) / (1000 * 60 * 60 * 24)
                );
                const daysUntilExpiry = Math.max(0, POINTS_EXPIRY_DAYS - daysSinceLastOrder);

                try {
                    // Update atómico: solo gana si pointsExpiryNotifiedAt sigue null.
                    // Si count === 0, otro run del cron (o el user pidió) ya reseteó el flag.
                    const updated = await prisma.user.updateMany({
                        where: { id: user.id, pointsExpiryNotifiedAt: null },
                        data: { pointsExpiryNotifiedAt: now },
                    });
                    if (updated.count !== 1) {
                        result.skippedAlreadyNotified++;
                        continue;
                    }

                    const firstName =
                        user.firstName || user.name || "Hola";

                    sendPointsExpiringEmail({
                        email: user.email,
                        firstName,
                        pointsBalance: user.pointsBalance,
                        daysUntilExpiry,
                        lastActivityDate: lastOrderAt,
                    }).catch((err) =>
                        logger.error(
                            { err, userId: user.id },
                            "Error sending points-expiring email"
                        )
                    );

                    result.notified++;
                } catch (err) {
                    result.errors++;
                    logger.error({ err, userId: user.id }, "Error processing points-expiring candidate");
                }
            }

            return { result, itemsProcessed: result.notified };
        });

        logger.info(stats, "Points expiring reminder cron completed");

        return NextResponse.json({
            success: true,
            ...stats,
        });
    } catch (error) {
        logger.error({ error }, "Error in points-expiring-reminder cron");
        return NextResponse.json(
            { error: "Error al procesar avisos de puntos por vencer" },
            { status: 500 }
        );
    }
}
