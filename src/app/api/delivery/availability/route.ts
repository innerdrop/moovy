// API Route: GET /api/delivery/availability
// Devuelve cuántos drivers hay disponibles para entregar un pedido.
//
// Rama: feat/driver-availability-checkout
//
// USO:
//   GET /api/delivery/availability               -> count global (todos los drivers online)
//   GET /api/delivery/availability?merchantId=X  -> count en radio del comercio (PostGIS)
//
// PROPÓSITO:
// Antes del POST /api/orders (checkout), el frontend consulta este endpoint
// para decidir qué banner mostrar:
//   - 0 drivers → rojo "Sin repartidores disponibles" (deshabilita pago)
//   - 1 driver  → amarillo "Solo 1 disponible — puede haber demora"
//   - 2+ drivers → sin banner (flujo normal)
//
// Esto previene el escenario "cliente pagó y no había drivers" que termina
// en auto-cancel + refund automático del cron retry-assignments. Mejor
// avisarle ANTES de cobrarle.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

const availabilityLogger = logger.child({ context: "delivery-availability" });

export async function GET(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const merchantId = url.searchParams.get("merchantId");

        // Leer radio configurable desde MoovyConfig (default 50km).
        // Coincide con assignment-engine para que la pre-validación tenga el
        // mismo criterio que la búsqueda real post-pago.
        const radiusConfig = await prisma.moovyConfig.findUnique({
            where: { key: "driver_search_radius_meters" },
        });
        const radiusMeters = radiusConfig ? parseInt(radiusConfig.value, 10) : 50_000;

        let availableDrivers = 0;

        if (merchantId) {
            // Buscar el comercio para obtener su ubicación
            const merchant = await prisma.merchant.findUnique({
                where: { id: merchantId },
                select: { id: true, latitude: true, longitude: true, isActive: true },
            });

            if (!merchant) {
                return NextResponse.json(
                    { error: "Comercio no encontrado", availableDrivers: 0, hasDrivers: false },
                    { status: 404 },
                );
            }

            if (!merchant.isActive) {
                return NextResponse.json({
                    availableDrivers: 0,
                    hasDrivers: false,
                    estimatedWaitMinutes: null,
                    radiusMeters,
                    reason: "merchant_inactive",
                });
            }

            // Si el comercio no tiene coordenadas, fallback al count global
            if (merchant.latitude == null || merchant.longitude == null) {
                availabilityLogger.warn(
                    { merchantId },
                    "[availability] Merchant sin coordenadas, fallback a count global",
                );
                availableDrivers = await prisma.driver.count({
                    where: {
                        isOnline: true,
                        isActive: true,
                        approvalStatus: "APPROVED",
                        availabilityStatus: "DISPONIBLE",
                    },
                });
            } else {
                // Query PostGIS: drivers online + activos + aprobados, en radio del comercio.
                // Mismo criterio que assignment-engine usa para asignar.
                const result = await prisma.$queryRaw<Array<{ count: bigint }>>`
                    SELECT COUNT(*)::bigint AS count
                    FROM "Driver" d
                    WHERE d."isOnline" = true
                      AND d."isActive" = true
                      AND d."approvalStatus" = 'APPROVED'
                      AND d."availabilityStatus" = 'DISPONIBLE'
                      AND d.ubicacion IS NOT NULL
                      AND ST_DWithin(
                          d.ubicacion::geography,
                          ST_SetSRID(ST_MakePoint(${merchant.longitude}, ${merchant.latitude}), 4326)::geography,
                          ${radiusMeters}
                      )
                `;
                availableDrivers = Number(result[0]?.count ?? 0);
            }
        } else {
            // Sin merchantId: count global de drivers disponibles (compat retro)
            availableDrivers = await prisma.driver.count({
                where: {
                    isOnline: true,
                    isActive: true,
                    approvalStatus: "APPROVED",
                    availabilityStatus: "DISPONIBLE",
                },
            });
        }

        // Estimación rough de wait time:
        // - 0 drivers → null (no hay)
        // - 1 driver → 8-15 min (depende si está libre o terminando otro pedido)
        // - 2-3 drivers → 5-10 min
        // - 4+ drivers → ~3-5 min (toma rápido)
        let estimatedWaitMinutes: number | null = null;
        if (availableDrivers === 1) estimatedWaitMinutes = 12;
        else if (availableDrivers >= 2 && availableDrivers <= 3) estimatedWaitMinutes = 8;
        else if (availableDrivers >= 4) estimatedWaitMinutes = 5;

        return NextResponse.json({
            availableDrivers,
            hasDrivers: availableDrivers > 0,
            estimatedWaitMinutes,
            radiusMeters: merchantId ? radiusMeters : null,
        });
    } catch (error) {
        availabilityLogger.error({ error }, "[availability] Error checking driver availability");
        return NextResponse.json(
            { error: "Error checking driver availability", availableDrivers: 0, hasDrivers: false },
            { status: 500 },
        );
    }
}
