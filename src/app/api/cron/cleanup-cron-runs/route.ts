// API Route: Cleanup de CronRunLog antiguos (retention 30 días)
// Rama: chore/cron-monitoring-completo
//
// Si no se limpia, CronRunLog crece sin límite (16 crons × ~1440 corridas/día
// para los de cada minuto = ~7000 filas/día). En 6 meses serían ~1.2M filas
// que ralentizan el panel y consumen disco.
//
// Frecuencia recomendada: diario a las 2:30 AM (hora valle)
// Configurable: MoovyConfig.cron_runs_retention_days (default 30)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recordCronRun } from "@/lib/cron-health";
import { verifyBearerToken } from "@/lib/env-validation";

const DEFAULT_RETENTION_DAYS = 30;

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        return await recordCronRun<NextResponse>("cleanup-cron-runs", async () => {
            const configRow = await prisma.moovyConfig.findUnique({
                where: { key: "cron_runs_retention_days" },
            });
            const retentionDays = configRow ? parseInt(configRow.value, 10) : DEFAULT_RETENTION_DAYS;

            if (isNaN(retentionDays) || retentionDays < 7) {
                return {
                    result: NextResponse.json(
                        { error: "Invalid retention config (mínimo 7 días)" },
                        { status: 500 },
                    ) as NextResponse,
                    itemsProcessed: 0,
                };
            }

            const cutoff = new Date(Date.now() - retentionDays * 24 * 3_600_000);

            // Borrar CronRunLog viejos (todos: success y failed)
            const deleted = await prisma.cronRunLog.deleteMany({
                where: { startedAt: { lt: cutoff } },
            });

            console.log(
                `[CleanupCronRuns] Deleted ${deleted.count} CronRunLog rows older than ${retentionDays} days`,
            );

            return {
                result: NextResponse.json({
                    success: true,
                    deleted: deleted.count,
                    retentionDays,
                    cutoffDate: cutoff.toISOString(),
                }) as NextResponse,
                itemsProcessed: deleted.count,
            };
        });
    } catch (error) {
        console.error("[CleanupCronRuns] Error:", error);
        return NextResponse.json(
            { error: "Error processing cleanup" },
            { status: 500 },
        );
    }
}
