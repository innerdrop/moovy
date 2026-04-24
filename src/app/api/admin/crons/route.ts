import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { getCronsHealthSummary, CRON_EXPECTATIONS } from "@/lib/cron-health";
import logger from "@/lib/logger";

/**
 * GET /api/admin/crons
 *
 * Devuelve dos piezas:
 *  - health: estado de cada cron registrado (healthy / stale / failing / never-ran)
 *  - runs:   últimas N corridas del CronRunLog, filtrables por jobName y rango de fechas
 *
 * Query params:
 *   jobName    — filtrar por nombre de cron
 *   take       — cuántos runs devolver (default 50, max 500)
 *   skip       — offset para paginación
 *   dateFrom   — ISO date, inicio del rango
 *   dateTo     — ISO date, fin del rango
 */
export async function GET(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:crons", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const jobName = url.searchParams.get("jobName");
    const take = Math.min(parseInt(url.searchParams.get("take") || "50", 10), 500);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");

    try {
        const where: any = {};
        if (jobName) where.jobName = jobName;
        if (dateFrom || dateTo) {
            where.startedAt = {};
            if (dateFrom) where.startedAt.gte = new Date(dateFrom);
            if (dateTo) where.startedAt.lte = new Date(dateTo);
        }

        const [health, runs, total] = await Promise.all([
            getCronsHealthSummary(),
            prisma.cronRunLog.findMany({
                where,
                orderBy: { startedAt: "desc" },
                take,
                skip,
            }),
            prisma.cronRunLog.count({ where }),
        ]);

        // Listado canónico de los crons que deberían existir (para UI)
        const registered = Object.entries(CRON_EXPECTATIONS).map(([jobName, meta]) => ({
            jobName,
            label: meta.label,
            maxHours: meta.maxHours,
        }));

        return NextResponse.json({
            ok: true,
            health,
            registered,
            runs,
            total,
        });
    } catch (error) {
        logger.error({ error }, "[admin/crons GET] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
