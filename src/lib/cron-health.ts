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
        throw error;
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

    for (const jobName of jobNames) {
        const { maxHours, label } = CRON_EXPECTATIONS[jobName];

        // Dos queries en paralelo: último éxito + último intento cualquiera (para detectar "failing")
        const [lastSuccessRow, lastAnyRow] = await Promise.all([
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
        ]);

        const lastSuccessAt = lastSuccessRow?.completedAt ?? null;
        const lastRunAt = lastAnyRow?.startedAt ?? null;
        const ageHours = lastSuccessAt
            ? (Date.now() - lastSuccessAt.getTime()) / 3_600_000
            : null;

        let status: CronHealthStatus;
        if (!lastRunAt) {
            status = "never-ran";
        } else if (lastAnyRow && lastAnyRow.success === false && lastAnyRow.completedAt) {
            // Último intento terminó con fallo registrado (completedAt seteado + success:false)
            status = "failing";
        } else if (ageHours === null || ageHours > maxHours) {
            status = "stale";
        } else {
            status = "healthy";
        }

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
        });
    }

    return results;
}
