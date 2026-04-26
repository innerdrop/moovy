// Cron: Driver Presence Check (Capa 2 de fix/driver-presence-detection)
// POST /api/cron/driver-presence-check
//
// Marca offline a los drivers que tienen isOnline=true pero su lastLocationAt
// es más viejo de 90 segundos. Es defense in depth para los casos donde la
// Capa 1 (Socket.IO disconnect handler con debounce) falla:
//   - Server de socket reinicia y pierde los timeouts en memoria.
//   - Race condition en el socket handler.
//   - Driver con conexión inestable que el socket-server no detecta.
//
// El driver dashboard manda GPS cada 10-30s al endpoint /api/driver/location,
// que actualiza lastLocationAt. Si lastLocationAt < now - 90s mientras el
// driver está marcado isOnline=true, eso significa que el dashboard está roto
// (cerró tab, perdió conexión, etc) — marcamos offline.
//
// Threshold 90s = 3x el ciclo más largo de GPS polling (30s) — defensa contra
// falsos positivos por hiccup temporal de la red. Si dejamos pasar 60s, drivers
// con señal flaky se marcarían offline incorrectamente.

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRequestLogger } from "@/lib/logger";
import { recordCronRun } from "@/lib/cron-health";
import { auditLog } from "@/lib/security";

const logger = createRequestLogger("driver-presence-check");

// 3x el ciclo de GPS polling más largo (30s). Suficiente para evitar falsos
// positivos por señal débil pero corto para detectar drivers fantasmas rápido.
const PRESENCE_TIMEOUT_MS = 90_000;

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { verifyBearerToken } = await import("@/lib/env-validation");
    if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
        logger.warn({ token: token?.slice(0, 8) }, "Unauthorized presence check");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const result = await recordCronRun("driver-presence-check", async () => {
            const cutoff = new Date(Date.now() - PRESENCE_TIMEOUT_MS);

            // Buscar drivers fantasmas: isOnline=true pero sin GPS reciente.
            // Limitamos take a 100 — Ushuaia no debería tener > 100 drivers
            // online simultáneamente; si pasa, hay algo más raro.
            const ghosts = await prisma.driver.findMany({
                where: {
                    isOnline: true,
                    OR: [
                        { lastLocationAt: { lt: cutoff } },
                        { lastLocationAt: null },
                    ],
                },
                select: {
                    id: true,
                    userId: true,
                    lastLocationAt: true,
                    user: { select: { name: true, email: true } },
                },
                take: 100,
            });

            if (ghosts.length === 0) {
                return { result: { count: 0 }, itemsProcessed: 0 };
            }

            // Marcar a todos como offline en bulk
            const updated = await prisma.driver.updateMany({
                where: {
                    id: { in: ghosts.map((d) => d.id) },
                    isOnline: true, // double-check por race condition
                },
                data: {
                    isOnline: false,
                    availabilityStatus: "FUERA_DE_SERVICIO",
                },
            });

            // Audit log por driver detectado
            for (const g of ghosts) {
                try {
                    auditLog({
                        timestamp: new Date().toISOString(),
                        userId: g.userId,
                        action: "DRIVER_AUTO_OFFLINE_BY_PRESENCE",
                        resource: "Driver",
                        resourceId: g.id,
                        details: {
                            driverEmail: g.user?.email ?? null,
                            driverName: g.user?.name ?? null,
                            lastLocationAt: g.lastLocationAt?.toISOString() ?? null,
                            secondsSinceLastLocation: g.lastLocationAt
                                ? Math.floor((Date.now() - g.lastLocationAt.getTime()) / 1000)
                                : null,
                            reason: "no_gps_for_90s",
                        },
                    });
                } catch (err) {
                    // Audit log es nice-to-have — nunca bloquea el cron
                    logger.error({ err, driverId: g.id }, "Failed to write audit log");
                }
            }

            logger.info(
                {
                    detectedCount: ghosts.length,
                    updatedCount: updated.count,
                    driverIds: ghosts.map((d) => d.id),
                },
                "Driver presence check completed"
            );

            return { result: updated, itemsProcessed: updated.count };
        });

        return NextResponse.json({
            success: true,
            count: result.count,
            message: `${result.count} driver(s) marcados offline por falta de GPS reciente.`,
        });
    } catch (error: any) {
        logger.error({ err: error }, "Driver presence check failed");
        return NextResponse.json(
            { error: error?.message || "Error interno" },
            { status: 500 }
        );
    }
}
