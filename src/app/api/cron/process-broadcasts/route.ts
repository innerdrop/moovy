import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyBearerToken } from "@/lib/env-validation";
import { recordCronRun } from "@/lib/cron-health";
import { parseSegmentFilters, buildSegmentWhere } from "@/lib/user-segments";
import { sendPushToUser } from "@/lib/push";
import { renderEmailTemplate } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { logger } from "@/lib/logger";

/**
 * POST /api/cron/process-broadcasts
 *
 * Cron que procesa campañas de broadcast en status RUNNING. Cada run toma
 * hasta PROCESS_CAMPAIGNS_PER_RUN campañas y envía BATCH_SIZE recipients por
 * campaña. Se espera que corra cada ~10-15 minutos (registrado en CRON_EXPECTATIONS
 * con maxHours: 2).
 *
 * El cursor (lastCursor) guarda el último userId procesado. Si el cron cae a
 * mitad de run, la próxima pasada retoma desde ahí. Puede haber duplicados
 * marginales si el cron muere JUSTO después del push/email pero antes del
 * update de sentCount+lastCursor — el costo es aceptable (un push extra).
 *
 * Auth: verifyBearerToken(authHeader, CRON_SECRET). Se chequea ANTES de
 * recordCronRun para no ensuciar el log con intentos unauth.
 */

const BATCH_SIZE = 200;
const PROCESS_CAMPAIGNS_PER_RUN = 5; // por run, para distribuir carga

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    if (!verifyBearerToken(authHeader ?? null, process.env.CRON_SECRET)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return recordCronRun("process-broadcasts", async () => {
        const now = new Date();

        // 1. Auto-promover campañas SCHEDULED con scheduledAt <= now a RUNNING
        const promoted = await prisma.broadcastCampaign.updateMany({
            where: {
                status: "SCHEDULED",
                scheduledAt: { lte: now },
            },
            data: {
                status: "RUNNING",
                startedAt: now,
            },
        });
        if (promoted.count > 0) {
            logger.info({ promoted: promoted.count }, "[cron/process-broadcasts] campañas promovidas a RUNNING");
        }

        // 2. Buscar hasta PROCESS_CAMPAIGNS_PER_RUN campañas RUNNING
        const campaigns = await prisma.broadcastCampaign.findMany({
            where: { status: "RUNNING" },
            include: { segment: true },
            orderBy: { startedAt: "asc" },
            take: PROCESS_CAMPAIGNS_PER_RUN,
        });

        let totalProcessed = 0;
        let totalSent = 0;
        let totalFailed = 0;

        for (const campaign of campaigns) {
            const filters = parseSegmentFilters(campaign.segment.filters);
            if (!filters) {
                await prisma.broadcastCampaign.update({
                    where: { id: campaign.id },
                    data: {
                        status: "FAILED",
                        completedAt: new Date(),
                        lastError: "Filtros del segmento inválidos",
                    },
                });
                logger.error(
                    { campaignId: campaign.id },
                    "[cron/process-broadcasts] segmento con filtros inválidos, fallando campaña",
                );
                continue;
            }

            // Tomar un batch usando cursor-based pagination sobre el segmento
            const where = buildSegmentWhere(filters);
            const batch = await prisma.user.findMany({
                where,
                select: { id: true, email: true, firstName: true, name: true, marketingConsent: true },
                orderBy: { id: "asc" },
                take: BATCH_SIZE,
                ...(campaign.lastCursor
                    ? { skip: 1, cursor: { id: campaign.lastCursor } }
                    : {}),
            });

            // Si no hay más recipients, marcar COMPLETED
            if (batch.length === 0) {
                await prisma.broadcastCampaign.update({
                    where: { id: campaign.id },
                    data: {
                        status: "COMPLETED",
                        completedAt: new Date(),
                    },
                });
                logger.info(
                    { campaignId: campaign.id, sent: campaign.sentCount, failed: campaign.failedCount },
                    "[cron/process-broadcasts] campaña completada",
                );
                continue;
            }

            let batchSent = 0;
            let batchFailed = 0;

            // Traer el template una vez si hay templateId
            let templateKey: string | null = null;
            let templateSubject: string | null = null;
            let templateBody: string | null = null;
            if (campaign.templateId) {
                const tpl = await prisma.emailTemplate.findUnique({ where: { id: campaign.templateId } });
                if (tpl) {
                    templateKey = tpl.key;
                    templateSubject = tpl.subject;
                    templateBody = tpl.bodyHtml;
                }
            }

            for (const user of batch) {
                try {
                    // PUSH
                    if (campaign.channel === "push" || campaign.channel === "both") {
                        const title = campaign.customTitle || templateSubject || campaign.name;
                        const body = campaign.customBody || "Nuevo mensaje de MOOVY";
                        await sendPushToUser(user.id, {
                            title,
                            body: stripHtml(body).substring(0, 180),
                            url: campaign.customUrl || undefined,
                            tag: `broadcast-${campaign.id}`,
                        });
                    }

                    // EMAIL
                    if (campaign.channel === "email" || campaign.channel === "both") {
                        const vars = {
                            firstName: user.firstName || user.name || "",
                            name: user.name || user.firstName || "",
                            email: user.email,
                        };

                        let subject: string;
                        let html: string;

                        if (templateKey) {
                            // Intentar renderizar desde el helper (DB o fallback)
                            const rendered = await renderEmailTemplate(templateKey, vars);
                            if (rendered) {
                                subject = rendered.subject;
                                html = rendered.bodyHtml;
                            } else {
                                // Fallback al content hardcoded del template original (por si isActive=false)
                                subject = renderPlaceholders(templateSubject || campaign.name, vars);
                                html = renderPlaceholders(templateBody || "", vars);
                            }
                        } else {
                            subject = renderPlaceholders(campaign.customTitle || campaign.name, vars);
                            html = renderPlaceholders(campaign.customBody || "", vars);
                        }

                        const ok = await sendEmail({ to: user.email, subject, html, tag: `broadcast-${campaign.id}` });
                        if (!ok) throw new Error("sendEmail returned false");
                    }

                    batchSent++;
                } catch (err) {
                    batchFailed++;
                    logger.error(
                        { err, campaignId: campaign.id, userId: user.id },
                        "[cron/process-broadcasts] falla en recipient",
                    );
                }
            }

            // Actualizar contadores + cursor
            const lastId = batch[batch.length - 1].id;
            await prisma.broadcastCampaign.update({
                where: { id: campaign.id },
                data: {
                    sentCount: { increment: batchSent },
                    failedCount: { increment: batchFailed },
                    lastCursor: lastId,
                },
            });

            totalProcessed++;
            totalSent += batchSent;
            totalFailed += batchFailed;
        }

        return {
            result: {
                campaignsProcessed: totalProcessed,
                totalSent,
                totalFailed,
            },
            itemsProcessed: totalSent + totalFailed,
        };
    });
}

// Helpers
function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

function renderPlaceholders(template: string, vars: Record<string, string | number>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
        const v = vars[key];
        return v === undefined || v === null ? "" : String(v);
    });
}
