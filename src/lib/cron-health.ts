/**
 * ISSUE-026: Healthcheck de crons.
 *
 * Wrapper reusable `recordCronRun(jobName, fn)` que persiste en `CronRunLog`
 * el start/end de cada ejecución de cron + `getCronsHealthSummary()` que el
 * dashboard OPS consume para mostrar alertas si un cron no corrió en su ventana.
 *
 * Motivación (caso `cleanup-location-history`): si el cron diario falla en silencio,
 * `DriverLocationHistory` crece sin límite (~100 filas por driver-orden activa cada
 * 10s de GPS). En una semana sin cleanup se degrada la DB entera. El healthcheck
 * evita que falle callado.
 *
 * Para agregar un cron nuevo: (1) envolver su handler con `recordCronRun`,
 * (2) agregar una entrada a `CRON_EXPECTATIONS` con el `maxHours` esperado.
 * No requiere cambios en el dashboard — se pinta automático.
 */

import { prisma } from "@/lib/prisma";

/**
 * Ejecuta `fn()` dentro de un registro de `CronRunLog`. Captura success/error,
 * duración y cantidad de items procesados. Re-throwea el error original si `fn` falla
 * para no ocultar fallas al caller (que debería seguir devolviendo 500 al cron runner).
 *
 * El `fn` SIEMPRE devuelve el shape `{ result, itemsProcessed }`. `recordCronRun`
 * extrae `result` y lo retorna al caller (T = tipo de `result`). `itemsProcessed`
 * se persiste en `CronRunLog` para el dashboard OPS. Si el cron no procesa items
 * contables (ej: healthcheck sin cleanup), pasá `itemsProcessed: 0`.
 */
export async function recordCronRun<T>(
    jobName: string,
    fn: () => Promise<{ result: T; itemsProcessed?: number }>
): Promise<T> {
    const run = await prisma.cronRunLog.create({
        data: {
            jobName,
            startedAt: new Date(),
            success: false,
        },
    });

    const startedAtMs = Date.now();

    try {
        const { result, itemsProcessed } = await fn();

        await prisma.cronRunLog.update({
            where: { id: run.id },
            data: {
                completedAt: new Date(),
                success: true,
                durationMs: Date.now() - startedAtMs,
                itemsProcessed: itemsProcessed ?? null,
            },
        });

        return result;
    } catch (error: any) {
        await prisma.cronRunLog
            .update({
                where: { id: run.id },
                data: {
                    completedAt: new Date(),
                    success: false,
                    durationMs: Date.now() - startedAtMs,
                    errorMessage: String(error?.message || error).slice(0, 500),
                },
            })
            .catch(() => {
                // Si Prisma falla al registrar el error, no se puede hacer más.
                // El error original se propaga igual.
            });

        // Rama chore/cron-monitoring-completo: disparar email al admin si este
        // cron acumula >=3 fallos consecutivos. Idempotente: si ya alertamos
        // en la última hora, no re-alertamos (evita spam).
        // Fire-and-forget: si falla el envío del email, no bloquea el throw del error real.
        sendCronFailureAlertIfNeeded(jobName, String(error?.message || error)).catch((err) => {
            console.error(`[recordCronRun] Failed to send failure alert for ${jobName}:`, err);
        });

        throw error;
    }
}

/**
 * Envía alerta por email si el cron acumula 3+ fallos consecutivos.
 * Idempotente via AuditLog: si ya alertamos en la última hora, skip.
 *
 * Implementado dentro del módulo de cron-health para mantener cohesión —
 * cuando algo falla, el sistema mismo notifica al admin sin requerir un
 * monitor externo.
 */
async function sendCronFailureAlertIfNeeded(
    jobName: string,
    errorMessage: string,
): Promise<void> {
    // Contar fallos consecutivos desde la corrida más reciente
    const recentRuns = await prisma.cronRunLog.findMany({
        where: { jobName, completedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 50,
        select: { success: true },
    });

    let consecutiveFailures = 0;
    for (const run of recentRuns) {
        if (run.success) break;
        consecutiveFailures++;
    }

    const shouldAlert = await shouldAlertCronFailures(jobName, consecutiveFailures);
    if (!shouldAlert) return;

    // Cargar metadata del cron
    const meta = CRON_EXPECTATIONS[jobName] || {
        label: jobName,
        maxHours: 0,
    };

    const alertEmail = process.env.NOTIFICATION_EMAIL || process.env.OPS_LOGIN_EMAIL;
    if (!alertEmail) {
        console.warn(`[cron-health] No NOTIFICATION_EMAIL configurado, skip alerta de ${jobName}`);
        return;
    }

    // Imports dinámicos para no romper el módulo si email no está configurado
    try {
        const { sendEmail, emailLayout, emailAlertBox, emailButton } = await import("@/lib/email");

        const html = emailLayout(`
            <h2 style="color: #dc2626; margin-top: 0;">⚠ Cron failing: ${meta.label}</h2>
            <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                El cron <code>${jobName}</code> acumuló <strong>${consecutiveFailures} fallos consecutivos</strong>
                sin éxito intermedio. Esto necesita atención.
            </p>
            ${emailAlertBox(`
                <strong>Cron:</strong> ${meta.label}<br/>
                <strong>jobName:</strong> ${jobName}<br/>
                <strong>Fallos consecutivos:</strong> ${consecutiveFailures}<br/>
                <strong>Último error:</strong><br/>
                <code style="display: block; padding: 8px; background: #f3f4f6; border-radius: 4px; margin-top: 4px; word-break: break-word;">${errorMessage.slice(0, 300)}</code>
            `, "error")}
            <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                Revisá el panel de monitoreo para ver el detalle completo y los errores recientes.
            </p>
            ${emailButton("Abrir panel /ops/crons", `${process.env.NEXT_PUBLIC_APP_URL || "https://somosmoovy.com"}/ops/crons`, "red")}
            <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
                Esta alerta se envía solo cuando un cron tiene 3+ fallos consecutivos. No se reenvía hasta 1 hora después de la primera alerta para evitar spam.
            </p>
        `);

        await sendEmail({
            to: alertEmail,
            subject: `🚨 [Moovy] Cron failing: ${meta.label} (${consecutiveFailures} fallos)`,
            html,
            tag: "cron_failure_alert",
        });

        // Audit log: marca que se envió la alerta para no repetir en 1h.
        // userId es required en el schema, así que asociamos la entrada al primer
        // admin del sistema (acción de sistema disparada en su nombre operativo).
        const firstAdmin = await prisma.user.findFirst({
            where: { role: "ADMIN" },
            select: { id: true },
        });
        if (firstAdmin) {
            await prisma.auditLog.create({
                data: {
                    action: "CRON_FAILURE_ALERT_EMAIL_SENT",
                    entityType: "Cron",
                    entityId: jobName,
                    userId: firstAdmin.id,
                    details: JSON.stringify({
                        jobName,
                        consecutiveFailures,
                        errorMessage: errorMessage.slice(0, 500),
                        sentTo: alertEmail,
                    }),
                },
            }).catch(() => {});
        }
    } catch (err) {
        console.error("[cron-health] Email send failed:", err);
    }
}

/**
 * Definición canónica de crons que el dashboard monitorea. Clave: `jobName`.
 *
 * - `maxHours`: si el último run exitoso fue hace MÁS de esto, se marca `stale` y se alerta.
 * - `label`: texto humano para mostrar en el dashboard.
 *
 * Al agregar un cron nuevo, sumalo acá — así el healthcheck lo rastrea automáticamente.
 * Si un cron registrado en `CRON_EXPECTATIONS` nunca corrió, se reporta `never-ran`.
 */
export const CRON_EXPECTATIONS: Record<string, { maxHours: number; label: string }> = {
    "cleanup-location-history": {
        maxHours: 30,
        label: "Limpieza de historial GPS",
    },
    "driver-presence-check": {
        maxHours: 1,
        label: "Detección de drivers fantasmas (sin GPS hace >90s)",
    },
    // Rama fix/onboarding-repartidor-complet: cron diario que avisa a repartidores
    // 7/3/1 días antes del vencimiento de licencia/seguro/RTO/cédula verde, y
    // auto-suspende al driver si el documento vence sin renovación.
    "driver-docs-expiry": {
        maxHours: 30,
        label: "Avisos de vencimiento de documentos de repartidor",
    },
    // CRM: procesa campañas de broadcast en status RUNNING en batches de 200
    // recipients por run. Si deja de correr, las campañas se estancan sin enviar.
    "process-broadcasts": {
        maxHours: 2,
        label: "Procesamiento de campañas de broadcast (push/email)",
    },
    // Rama feat/emails-lanzamiento-completo: cron diario que busca pedidos DELIVERED
    // hace 24-48h sin calificar y envia recordatorio por email al buyer.
    // Idempotente via Order.rateReminderSentAt.
    "rate-order-reminder": {
        maxHours: 30,
        label: "Recordatorio de calificación de pedidos",
    },
    // Rama feat/emails-lanzamiento-completo: cron diario que avisa a usuarios
    // con puntos MOOVER a >=150 días de inactividad (30 días antes de que
    // venzan los puntos por la regla de 6 meses de Biblia v3). Idempotente via
    // User.pointsExpiryNotifiedAt.
    "points-expiring-reminder": {
        maxHours: 30,
        label: "Aviso de puntos MOOVER próximos a vencer",
    },
    // Rama feat/payment-pending-cancellation: cron cada minuto que cancela
    // pedidos en paymentStatus AWAITING_PAYMENT/PENDING con createdAt > 30 min
    // (o lo que diga MoovyConfig.payment_pending_timeout_minutes). Restaura stock,
    // dispara refund automatico si MP confirmo despues del cancel, push al cliente.
    // Critico: si el cron deja de correr, pedidos fantasma se acumulan y stock
    // queda reservado indefinidamente.
    "cancel-stale-pending-payments": {
        maxHours: 1,
        label: "Auto-cancelar pedidos sin pago confirmado (timeout 30 min)",
    },
    // === Rama chore/cron-monitoring-completo: agregamos los 9 crons faltantes ===
    // Asignación de drivers: cada minuto procesa los expirados.
    "assignment-tick": {
        maxHours: 1,
        label: "Procesar timeouts de asignación de drivers",
    },
    // Comercio que no acepta pedido en X min (config MoovyConfig): auto-cancela.
    "merchant-timeout": {
        maxHours: 1,
        label: "Auto-cancelar pedidos sin confirmación del comercio",
    },
    // Reconciliación MP: atrapa pagos donde el webhook llegó tarde o no llegó.
    "mp-reconcile": {
        maxHours: 1,
        label: "Reconciliación de pagos MP perdidos",
    },
    // Reintenta asignación cuando ningún driver tomó el pedido.
    "retry-assignments": {
        maxHours: 1,
        label: "Reintentar asignación de drivers + escalar a admin",
    },
    // Pedidos programados (SCHEDULED): notifica + auto-cancela + dispara assignment.
    "scheduled-notify": {
        maxHours: 1,
        label: "Procesar pedidos programados (notify/cancel/assign)",
    },
    // Cierre de subastas marketplace. Hoy disabled para launch (ISSUE-002).
    "close-auctions": {
        maxHours: 2,
        label: "Cerrar subastas expiradas (deshabilitado para launch)",
    },
    // Recuperación de carritos abandonados — recordatorios por email + push.
    "cart-recovery": {
        maxHours: 2,
        label: "Recordatorios de carrito abandonado",
    },
    // Recálculo diario de tiers BRONCE/PLATA/ORO/DIAMANTE.
    "update-merchant-tiers": {
        maxHours: 30,
        label: "Recálculo de tiers de comercios",
    },
    // Vendedores marketplace: reanuda los pausados según su schedule.
    "seller-resume": {
        maxHours: 30,
        label: "Reanudación de vendedores pausados",
    },
    // Limpieza diaria de CronRunLog (retention 30 días configurable).
    // Sin esto, la tabla crece sin límite (~7000 filas/día) y degrada el panel.
    "cleanup-cron-runs": {
        maxHours: 30,
        label: "Limpieza de CronRunLog antiguos (retention 30d)",
    },
};

export type CronHealthStatus = "healthy" | "stale" | "never-ran" | "failing";

export interface CronHealth {
    jobName: string;
    label: string;
    maxHours: number;
    lastSuccessAt: Date | null;
    lastRunAt: Date | null;
    lastRunWasSuccess: boolean | null;
    ageHours: number | null;
    status: CronHealthStatus;
    errorMessage: string | null;
    // === Rama chore/cron-monitoring-completo: métricas avanzadas ===
    // Success rate y duración promedio en ventanas de tiempo. Permiten detectar
    // degradación gradual (cron que antes corría en 1s y ahora tarda 30s, o que
    // últimamente falla 50% del tiempo) antes de que pase a "stale" o "failing".
    successRate24h: number | null;        // 0-100, null si no hay corridas en 24h
    successRate7d: number | null;          // 0-100, null si no hay corridas en 7d
    avgDurationMs: number | null;          // promedio últimas 50 corridas exitosas
    totalRuns24h: number;                  // cantidad de corridas en últimas 24h
    totalRuns7d: number;                   // cantidad en últimos 7 días
    consecutiveFailures: number;           // cuántos fallos seguidos sin éxito intermedio
}

/**
 * Devuelve el estado de salud de cada cron listado en `CRON_EXPECTATIONS`.
 *
 * Estados:
 *   - `healthy`: corrió con éxito dentro de su ventana de `maxHours`.
 *   - `stale`: último success fue hace > `maxHours` (probablemente el cron runner falló).
 *   - `failing`: el último intento registrado terminó con `success: false`.
 *   - `never-ran`: jamás se registró un run (cron nuevo o runner mal configurado).
 */
export async function getCronsHealthSummary(): Promise<CronHealth[]> {
    const jobNames = Object.keys(CRON_EXPECTATIONS);
    if (jobNames.length === 0) return [];

    const results: CronHealth[] = [];
    const now = Date.now();
    const cutoff24h = new Date(now - 24 * 3_600_000);
    const cutoff7d = new Date(now - 7 * 24 * 3_600_000);

    for (const jobName of jobNames) {
        const { maxHours, label } = CRON_EXPECTATIONS[jobName];

        // Queries paralelas: último éxito + último intento + stats 24h + stats 7d +
        // últimas 50 corridas (para promedio de duración y consecutive failures).
        const [
            lastSuccessRow,
            lastAnyRow,
            count24h,
            successCount24h,
            count7d,
            successCount7d,
            avgDurationRow,
            recentRuns,
        ] = await Promise.all([
            prisma.cronRunLog.findFirst({
                where: { jobName, success: true, completedAt: { not: null } },
                orderBy: { completedAt: "desc" },
                select: { completedAt: true },
            }),
            prisma.cronRunLog.findFirst({
                where: { jobName },
                orderBy: { startedAt: "desc" },
                select: {
                    startedAt: true,
                    completedAt: true,
                    success: true,
                    errorMessage: true,
                },
            }),
            prisma.cronRunLog.count({
                where: { jobName, startedAt: { gte: cutoff24h } },
            }),
            prisma.cronRunLog.count({
                where: { jobName, success: true, startedAt: { gte: cutoff24h } },
            }),
            prisma.cronRunLog.count({
                where: { jobName, startedAt: { gte: cutoff7d } },
            }),
            prisma.cronRunLog.count({
                where: { jobName, success: true, startedAt: { gte: cutoff7d } },
            }),
            // Promedio de durationMs de últimas 50 corridas exitosas
            prisma.cronRunLog.aggregate({
                where: { jobName, success: true, durationMs: { not: null } },
                _avg: { durationMs: true },
                orderBy: { startedAt: "desc" },
                take: 50,
            } as any),
            // Últimas 50 corridas para calcular consecutiveFailures (de la más reciente
            // hacia atrás, contar hasta el primer success)
            prisma.cronRunLog.findMany({
                where: { jobName, completedAt: { not: null } },
                orderBy: { startedAt: "desc" },
                take: 50,
                select: { success: true },
            }),
        ]);

        const lastSuccessAt = lastSuccessRow?.completedAt ?? null;
        const lastRunAt = lastAnyRow?.startedAt ?? null;
        const ageHours = lastSuccessAt
            ? (now - lastSuccessAt.getTime()) / 3_600_000
            : null;

        let status: CronHealthStatus;
        if (!lastRunAt) {
            status = "never-ran";
        } else if (lastAnyRow && lastAnyRow.success === false && lastAnyRow.completedAt) {
            status = "failing";
        } else if (ageHours === null || ageHours > maxHours) {
            status = "stale";
        } else {
            status = "healthy";
        }

        // Calcular consecutive failures: contar fallos consecutivos desde la corrida
        // más reciente hacia atrás, hasta encontrar el primer success.
        let consecutiveFailures = 0;
        for (const run of recentRuns) {
            if (run.success) break;
            consecutiveFailures++;
        }

        // Success rate: si no hay corridas en la ventana, devolver null (no "0%")
        // para diferenciar "sin actividad" de "100% fallido".
        const successRate24h = count24h > 0 ? Math.round((successCount24h / count24h) * 100) : null;
        const successRate7d = count7d > 0 ? Math.round((successCount7d / count7d) * 100) : null;
        const avgDurationMs = (avgDurationRow as any)?._avg?.durationMs ?? null;

        results.push({
            jobName,
            label,
            maxHours,
            lastSuccessAt,
            lastRunAt,
            lastRunWasSuccess: lastAnyRow?.success ?? null,
            ageHours,
            status,
            errorMessage: lastAnyRow?.errorMessage ?? null,
            successRate24h,
            successRate7d,
            avgDurationMs,
            totalRuns24h: count24h,
            totalRuns7d: count7d,
            consecutiveFailures,
        });
    }

    return results;
}

/**
 * Devuelve los últimos N errores registrados para un cron específico.
 * Usado por el drawer del panel /ops/crons cuando el operador hace click
 * en un cron failing para ver detalles.
 */
export async function getRecentCronErrors(
    jobName: string,
    take: number = 10,
): Promise<Array<{
    id: string;
    startedAt: Date;
    completedAt: Date | null;
    durationMs: number | null;
    errorMessage: string;
}>> {
    const rows = await prisma.cronRunLog.findMany({
        where: {
            jobName,
            success: false,
            errorMessage: { not: null },
        },
        orderBy: { startedAt: "desc" },
        take,
        select: {
            id: true,
            startedAt: true,
            completedAt: true,
            durationMs: true,
            errorMessage: true,
        },
    });

    // Filtrar nulls a string vacío para tipos
    return rows.map((r) => ({
        id: r.id,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        durationMs: r.durationMs,
        errorMessage: r.errorMessage ?? "",
    }));
}

/**
 * Verifica si un cron debe disparar alerta por email.
 * Disparamos alerta cuando hay 3+ fallos consecutivos sin éxito intermedio.
 * Idempotencia: para no spamear, solo enviamos si la última alerta fue hace
 * MÁS de 1 hora para este jobName (verificable via AuditLog).
 */
export async function shouldAlertCronFailures(
    jobName: string,
    consecutiveFailures: number,
): Promise<boolean> {
    if (consecutiveFailures < 3) return false;

    // ¿Ya alertamos por este cron en la última hora?
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const recentAlert = await prisma.auditLog.findFirst({
        where: {
            action: "CRON_FAILURE_ALERT_EMAIL_SENT",
            entityType: "Cron",
            entityId: jobName,
            createdAt: { gte: oneHourAgo },
        },
        select: { id: true },
    });

    return !recentAlert;
}
