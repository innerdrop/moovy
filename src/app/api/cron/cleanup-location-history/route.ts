// Cron: Delete location history older than 30 days
// POST /api/cron/cleanup-location-history
// Designed to run daily or weekly to manage storage

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createRequestLogger } from "@/lib/logger";

const logger = createRequestLogger("cleanup-location-history");

export async function POST(req: NextRequest) {
    try {
        // Auth: CRON_SECRET
        const authHeader = req.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        // V-028 FIX: timing-safe comparison
        const { verifyBearerToken } = await import("@/lib/env-validation");
        if (!verifyBearerToken(token, process.env.CRON_SECRET)) {
            logger.warn({ token: token?.slice(0, 8) }, "Unauthorized cleanup request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Calculate cutoff: 30 days ago
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        logger.info(
            { cutoffDate: thirtyDaysAgo.toISOString() },
            "Starting location history cleanup"
        );

        // Delete old location history
        const result = await prisma.driverLocationHistory.deleteMany({
            where: {
                createdAt: { lt: thirtyDaysAgo },
            },
        });

        logger.info(
            {
                deleted: result.count,
                cutoffDate: thirtyDaysAgo.toISOString(),
            },
            "Location history cleanup completed"
        );

        return NextResponse.json({
            deleted: result.count,
            message: `${result.count} registro(s) de ubicación eliminados (anteriores a ${thirtyDaysAgo.toLocaleDateString("es-AR")})`,
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
