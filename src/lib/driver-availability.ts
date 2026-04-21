// ISSUE-054: Notificación a suscriptores cuando un driver pasa a online.
// Se llama fire-and-forget desde `PUT /api/driver/status` cuando el driver
// acaba de conectarse (isOnline: false → true). Busca suscripciones activas
// y dispara push a los buyers cuya ubicación está dentro del radio configurado.

import { prisma } from "./prisma";
import { calculateDistance } from "./geo";
import { sendPushToUser } from "./push";
import logger from "./logger";

const NOTIFY_RADIUS_KM = 5; // mismo radio que deliveryRadiusKm por defecto del merchant
const PUSH_CONCURRENCY = 10; // limitar pushes en paralelo

interface NotifyResult {
    candidates: number;
    notified: number;
    errors: number;
}

/**
 * Cuando un driver pasa a online, buscar buyers que se suscribieron al aviso
 * "avisame cuando haya driver" y cuya ubicación está dentro del radio del driver.
 *
 * Idempotencia: cada suscripción se marca `notifiedAt` la primera vez; no se
 * re-notifica en siguientes conexiones. Si varios drivers se conectan al mismo
 * tiempo, el update condicional (`where: { notifiedAt: null }`) previene doble
 * push — solo el primer driver gana la carrera.
 *
 * Non-blocking: los errores se loguean, nunca se propagan al caller.
 */
export async function notifyAvailabilitySubscribers(params: {
    driverId: string;
    driverLat: number;
    driverLng: number;
}): Promise<NotifyResult> {
    const { driverId, driverLat, driverLng } = params;
    const now = new Date();

    try {
        // Traemos todas las suscripciones activas (notifiedAt null, no expiradas).
        // Filtramos por distancia en memoria — esperamos decenas, no miles, en una
        // ciudad de 80k hab. Si crece, migramos a PostGIS.
        const subs = await prisma.driverAvailabilitySubscription.findMany({
            where: {
                notifiedAt: null,
                expiresAt: { gt: now },
            },
            select: {
                id: true,
                userId: true,
                latitude: true,
                longitude: true,
                merchantId: true,
            },
            take: 500, // cap defensivo
        });

        if (subs.length === 0) {
            return { candidates: 0, notified: 0, errors: 0 };
        }

        // Filtrar por radio. Si la suscripción tiene merchantId, el criterio es
        // "driver dentro del radio del BUYER" (no del comercio) — el buyer es quien
        // espera en su dirección; el driver se moverá hacia el comercio después.
        const inRange = subs.filter((s) => {
            const distanceKm = calculateDistance(driverLat, driverLng, s.latitude, s.longitude);
            return distanceKm <= NOTIFY_RADIUS_KM;
        });

        if (inRange.length === 0) {
            return { candidates: subs.length, notified: 0, errors: 0 };
        }

        let notified = 0;
        let errors = 0;

        // Procesar en chunks para no saturar el servicio de push.
        for (let i = 0; i < inRange.length; i += PUSH_CONCURRENCY) {
            const chunk = inRange.slice(i, i + PUSH_CONCURRENCY);
            const results = await Promise.allSettled(
                chunk.map(async (sub) => {
                    // Intento atómico de marcar como notificado. Si otro proceso
                    // ya la marcó (driver paralelo), updateMany devuelve count:0 y
                    // skipeamos el push para evitar duplicado.
                    const marked = await prisma.driverAvailabilitySubscription.updateMany({
                        where: { id: sub.id, notifiedAt: null },
                        data: { notifiedAt: new Date() },
                    });
                    if (marked.count === 0) {
                        return { skipped: true } as const;
                    }

                    await sendPushToUser(sub.userId, {
                        title: "🏍️ ¡Ya hay repartidor en tu zona!",
                        body: "Entrá al checkout y completá tu pedido antes que vuelva a subir la demanda.",
                        url: "/checkout",
                        tag: `driver-available-${sub.id}`,
                    });
                    return { skipped: false } as const;
                })
            );

            for (const r of results) {
                if (r.status === "fulfilled") {
                    if (!r.value.skipped) notified++;
                } else {
                    errors++;
                    logger.warn({ error: r.reason }, "Failed to notify availability subscriber");
                }
            }
        }

        if (notified > 0) {
            logger.info(
                { driverId, candidates: inRange.length, notified, errors },
                "Driver online — availability subscribers notified"
            );
        }

        return { candidates: inRange.length, notified, errors };
    } catch (error) {
        logger.error(
            { error: error instanceof Error ? error.message : String(error), driverId },
            "notifyAvailabilitySubscribers failed"
        );
        return { candidates: 0, notified: 0, errors: 1 };
    }
}
