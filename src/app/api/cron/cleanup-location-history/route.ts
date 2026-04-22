// Cron: Delete location history older than 30 days
// POST /api/cron/cleanup-location-history
// Designed to run daily or weekly to manage storage

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRequestLogger } from "@/lib/logger";
// ISSUE-026: envolver en recordCronRun para que el dashboard OPS alerte si este cron no corre.
import { recordCronRun } from "@/lib/cron-health";

const logger = createRequestLogger("cleanup-location-history");

export async function POST(req: NextRequest) {
    // Auth: CRON_SECRET (se valida ANTES de registrar el run para que intentos
    // no autorizados no ensucien el healthcheck con runs spurios).
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { verifyBearerToken } = await import("@/lib/env-validation");
    if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
        logger.warn({ token: token?.slice(0, 8) }, "Unauthorized cleanup request");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        // Calculate cutoff: 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        logger.info(
            { cutoffDate: thirtyDaysAgo.toISOString() },
            "Starting location history cleanup"
        );

        const del = await recordCronRun("cleanup-location-history", async () => {
            const deleted = await prisma.driverLocationHistory.deleteMany({
                where: {
                    createdAt: { lt: thirtyDaysAgo },
                },
            });
            return { result: deleted, itemsProcessed: deleted.count };
        });

        logger.info(
            {
                deleted: del.count,
                cutoffDate: thirtyDaysAgo.toISOString(),
            },
            "Location history cleanup completed"
        );

        return NextResponse.json({
            deleted: del.count,
            message: `${del.count} registro(s) de ubicación eliminados (anteriores a ${thirtyDaysAgo.toLocaleDateString("es-AR")})`,
            cutoffDate: thirtyDaysAgo.toISOString(),
        });
    } catch (error) {
        logger.error({ error }, "Error in location history cleanup");
        return NextResponse.json(
            { error: "Error al limpiar historial de ubicación" },
            { status: 500 }
        );
    }
}
