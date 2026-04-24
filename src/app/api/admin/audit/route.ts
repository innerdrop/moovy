// OPS — Visor del AuditLog con filtros.
// GET: lista paginada con filtros combinables (action, entityType, entityId, userId, rango de fechas).
// Read-only. Restringido a role ADMIN. Rate limit 60/60s.

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
    try {
        const limited = await applyRateLimit(request, "admin:audit:list", 60, 60_000);
        if (limited) return limited;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const action = searchParams.get("action")?.trim() || undefined;
        const entityType = searchParams.get("entityType")?.trim() || undefined;
        const entityId = searchParams.get("entityId")?.trim() || undefined;
        const userId = searchParams.get("userId")?.trim() || undefined;
        const dateFrom = searchParams.get("dateFrom")?.trim() || undefined;
        const dateTo = searchParams.get("dateTo")?.trim() || undefined;

        const takeRaw = Number(searchParams.get("take") ?? 50);
        const skipRaw = Number(searchParams.get("skip") ?? 0);
        const take = Math.min(Math.max(1, Number.isFinite(takeRaw) ? takeRaw : 50), 200);
        const skip = Math.max(0, Number.isFinite(skipRaw) ? skipRaw : 0);

        const where: Prisma.AuditLogWhereInput = {};
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (entityId) where.entityId = { contains: entityId };
        if (userId) where.userId = userId;

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                const from = new Date(dateFrom);
                if (!isNaN(from.getTime())) {
                    (where.createdAt as Prisma.DateTimeFilter).gte = from;
                }
            }
            if (dateTo) {
                // Include the whole "to" day: if format YYYY-MM-DD, push to 23:59:59.999
                const to = new Date(dateTo);
                if (!isNaN(to.getTime())) {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
                        to.setHours(23, 59, 59, 999);
                    }
                    (where.createdAt as Prisma.DateTimeFilter).lte = to;
                }
            }
        }

        const [items, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take,
                skip,
                include: {
                    user: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.auditLog.count({ where }),
        ]);

        return NextResponse.json({ items, total });
    } catch (error) {
        console.error("[admin/audit] GET error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
