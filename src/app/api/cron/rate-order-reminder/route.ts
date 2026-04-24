/**
 * Cron: Recordatorio de calificaci\u00f3n de pedidos.
 *
 * POST /api/cron/rate-order-reminder
 * Corre diariamente. Busca pedidos DELIVERED hace entre 24h y 48h sin calificar
 * (ratedAt IS NULL) y sin recordatorio ya enviado (rateReminderSentAt IS NULL),
 * env\u00eda el email una sola vez por pedido y marca el timestamp para idempotencia.
 *
 * Ventana 24-48h (no solo "hace m\u00e1s de 24h"):
 *   - El piso de 24h evita molestar al buyer recien entregado.
 *   - El techo de 48h evita spamear pedidos viejos que recien ahora entraron al
 *     cron (ej: primer deploy, rama que se activ\u00f3 despu\u00e9s). Si alguien no
 *     alcanza a ser notificado dentro de esa ventana, dejamos de insistir.
 *
 * Defense in depth:
 *   - Auth ANTES de recordCronRun para no ensuciar el healthcheck con 401.
 *   - updateMany atomico (WHERE rateReminderSentAt IS NULL) previene doble envio
 *     si dos runs del cron solapan.
 *   - Email es fire-and-forget: el timestamp se marca siempre aunque el SMTP
 *     falle, para no re-intentar indefinidamente sobre el mismo pedido.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRequestLogger } from "@/lib/logger";
import { recordCronRun } from "@/lib/cron-health";
import { sendRateOrderReminderEmail } from "@/lib/email-legal-ux";
import { verifyBearerToken } from "@/lib/env-validation";

const logger = createRequestLogger("rate-order-reminder");

// Paginado conservador: si un d\u00eda hay pico de entregas, no saturamos el
// transporter de Nodemailer en una sola corrida.
const BATCH_SIZE = 200;

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
        logger.warn({ token: token?.slice(0, 8) }, "Unauthorized rate-order-reminder request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const stats = await recordCronRun("rate-order-reminder", async () => {
            const now = new Date();
            const windowStart = new Date(now.getTime() - 48 * 60 * 60 * 1000); // hace 48h
            const windowEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);   // hace 24h

            const candidates = await prisma.order.findMany({
                where: {
                    status: "DELIVERED",
                    deliveredAt: { gte: windowStart, lte: windowEnd },
                    ratedAt: null,
                    rateReminderSentAt: null,
                    deletedAt: null,
                },
                select: {
                    id: true,
                    orderNumber: true,
                    userId: true,
                    merchantId: true,
                    user: { select: { email: true, firstName: true } },
                    merchant: { select: { name: true } },
                },
                take: BATCH_SIZE,
            });

            let sent = 0;
            let skipped = 0;
            let errors = 0;

            for (const order of candidates) {
                try {
                    // Marcar ANTES del env\u00edo: el updateMany atomico evita doble trigger.
                    const updated = await prisma.order.updateMany({
                        where: { id: order.id, rateReminderSentAt: null },
                        data: { rateReminderSentAt: now },
                    });

                    if (updated.count === 0) {
                        // Race perdido contra otro run simultaneo.
                        skipped++;
                        continue;
                    }

                    if (!order.user?.email) {
                        skipped++;
                        continue;
                    }

                    // Si no hay merchant (pedido marketplace puro) usamos un label generico.
                    const merchantName = order.merchant?.name ?? "el vendedor";

                    // Fire-and-forget: si falla el send, aceptamos perder ese recordatorio
                    // antes que re-disparar en el siguiente run (evita duplicados molestos).
                    await sendRateOrderReminderEmail({
                        buyerEmail: order.user.email,
                        buyerName: order.user.firstName ?? null,
                        orderNumber: order.orderNumber,
                        merchantName,
                        orderId: order.id,
                    });

                    sent++;
                } catch (err) {
                    errors++;
                    logger.error({ err, orderId: order.id }, "Error processing rate reminder");
                }
            }

            logger.info({ sent, skipped, errors, totalCandidates: candidates.length }, "Rate reminder cron run complete");

            return {
                result: { sent, skipped, errors, candidates: candidates.length },
                itemsProcessed: sent,
            };
        });

        return NextResponse.json({ success: true, ...stats });
    } catch (error) {
        logger.error({ error }, "Error in rate-order-reminder cron");
        return NextResponse.json(
            { error: "Error al procesar recordatorios de calificacion" },
            { status: 500 }
        );
    }
}
