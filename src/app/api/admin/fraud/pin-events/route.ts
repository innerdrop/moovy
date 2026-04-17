// API Route: Admin PIN fraud events
// ISSUE-001: agrega eventos de auditoría relacionados al PIN doble (fallos,
// bloqueos, auto-suspensiones) + lista de drivers con fraudScore > 0.
// Usado por /ops/fraude para monitoreo y triage.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const PIN_AUDIT_ACTIONS = [
    "PIN_VERIFIED",
    "PIN_VERIFICATION_FAIL",
    "PIN_LOCKED",
    "PIN_GEOFENCE_FAIL",
    "DRIVER_AUTO_SUSPENDED",
] as const;

export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const limit = Math.min(200, Number(searchParams.get("limit") ?? 100));
        const since = searchParams.get("since"); // ISO date opcional

        const whereClause: any = {
            action: { in: [...PIN_AUDIT_ACTIONS] },
        };
        if (since) {
            const sinceDate = new Date(since);
            if (!isNaN(sinceDate.getTime())) {
                whereClause.createdAt = { gte: sinceDate };
            }
        }

        const [events, flaggedDrivers, suspendedCount] = await Promise.all([
            prisma.auditLog.findMany({
                where: whereClause,
                orderBy: { createdAt: "desc" },
                take: limit,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.driver.findMany({
                where: { fraudScore: { gt: 0 } },
                orderBy: [{ fraudScore: "desc" }, { updatedAt: "desc" }],
                take: 50,
                select: {
                    id: true,
                    fraudScore: true,
                    isSuspended: true,
                    suspendedAt: true,
                    suspensionReason: true,
                    totalDeliveries: true,
                    user: { select: { id: true, name: true, email: true, phone: true } },
                },
            }),
            prisma.driver.count({ where: { isSuspended: true } }),
        ]);

        // Parseamos details (string JSON) para el front
        const parsedEvents = events.map((e) => {
            let details: any = null;
            if (e.details) {
                try {
                    details = JSON.parse(e.details);
                } catch {
                    details = e.details; // fallback: string raw
                }
            }
            return {
                id: e.id,
                action: e.action,
                entityType: e.entityType,
                entityId: e.entityId,
                createdAt: e.createdAt,
                userId: e.userId,
                user: e.user,
                details,
            };
        });

        return NextResponse.json({
            events: parsedEvents,
            flaggedDrivers,
            stats: {
                totalEvents: parsedEvents.length,
                suspendedDrivers: suspendedCount,
                flaggedDriversCount: flaggedDrivers.length,
            },
        });
    } catch (error) {
        console.error("[admin/fraud/pin-events] error:", error);
        return NextResponse.json({ error: "Error al obtener eventos" }, { status: 500 });
    }
}
