// API Route: GET últimos N errores de un cron específico (drawer del panel /ops/crons).
// Rama: chore/cron-monitoring-completo

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { getRecentCronErrors, CRON_EXPECTATIONS } from "@/lib/cron-health";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobName: string }> },
) {
    const limited = await applyRateLimit(request, "admin:crons:errors", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { jobName } = await params;
    if (!CRON_EXPECTATIONS[jobName]) {
        return NextResponse.json(
            { error: `Cron '${jobName}' no registrado` },
            { status: 404 },
        );
    }

    const url = new URL(request.url);
    const take = Math.min(parseInt(url.searchParams.get("take") || "20", 10), 50);

    try {
        const errors = await getRecentCronErrors(jobName, take);
        return NextResponse.json({ ok: true, jobName, errors });
    } catch (err) {
        return NextResponse.json(
            {
                error: "Error consultando errores",
                details: err instanceof Error ? err.message : String(err),
            },
            { status: 500 },
        );
    }
}
