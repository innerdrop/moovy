// API Route: Trigger manual de un cron desde el panel /ops/crons.
// Rama: chore/cron-monitoring-completo
//
// Uso desde el frontend (botón "Ejecutar ahora" en cada card del cron):
//   POST /api/admin/crons/{jobName}/trigger
//
// Internamente hace fetch al endpoint del cron específico con el CRON_SECRET
// (mismo path que usa el crontab del VPS), así reutilizamos la lógica completa
// del cron sin duplicar código. Es el equivalente programático de correr a mano:
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" /api/cron/{jobName}
//
// Por qué no llamar la función directa: cada cron tiene su propio handler con
// auth + recordCronRun + lógica. Hacer fetch interno preserva el patrón canónico
// y aprovecha el wrapper que ya escribe en CronRunLog (entonces aparece en el panel).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyRateLimit } from "@/lib/rate-limit";
import { CRON_EXPECTATIONS } from "@/lib/cron-health";
import { logAudit } from "@/lib/audit";
import logger from "@/lib/logger";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ jobName: string }> },
) {
    // Rate limit: 10 triggers manuales por minuto por admin
    const limited = await applyRateLimit(request, "admin:crons:trigger", 10, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { jobName } = await params;

    // Validar que el cron exista en el registro canónico (defensa contra inputs raros)
    if (!CRON_EXPECTATIONS[jobName]) {
        return NextResponse.json(
            { error: `Cron '${jobName}' no existe en CRON_EXPECTATIONS` },
            { status: 404 },
        );
    }

    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
        return NextResponse.json(
            { error: "CRON_SECRET no configurado en el server" },
            { status: 500 },
        );
    }

    // Resolver la URL absoluta del endpoint del cron
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const cronUrl = `${baseUrl}/api/cron/${jobName}`;

    const startedAt = Date.now();
    let cronResponse: Response;
    try {
        cronResponse = await fetch(cronUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${cronSecret}`,
            },
        });
    } catch (err) {
        logger.error({ err, jobName }, "[admin/crons/trigger] Fetch al cron falló");
        return NextResponse.json(
            {
                error: "No se pudo invocar el cron",
                details: err instanceof Error ? err.message : String(err),
            },
            { status: 500 },
        );
    }

    const durationMs = Date.now() - startedAt;
    const cronBody = await cronResponse.json().catch(() => ({}));

    // Audit log: queda registrado quién disparó qué cron y cuándo.
    // logAudit espera `details` como objeto (Record<string, any>), no como string.
    await logAudit({
        action: "CRON_TRIGGERED_MANUALLY",
        entityType: "Cron",
        entityId: jobName,
        userId: session.user.id,
        details: {
            jobName,
            statusCode: cronResponse.status,
            durationMs,
            adminEmail: session.user.email,
            response: cronBody,
        },
    }).catch(() => {});

    return NextResponse.json({
        ok: cronResponse.ok,
        statusCode: cronResponse.status,
        durationMs,
        response: cronBody,
    });
}
