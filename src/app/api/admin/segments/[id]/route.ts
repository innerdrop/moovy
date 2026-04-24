import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { SegmentFiltersSchema, countSegment } from "@/lib/user-segments";
import { logger } from "@/lib/logger";

// GET /api/admin/segments/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:segments-get", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    try {
        const segment = await prisma.userSegment.findUnique({
            where: { id },
            include: { _count: { select: { campaigns: true } } },
        });
        if (!segment) return NextResponse.json({ error: "Segmento no encontrado" }, { status: 404 });
        return NextResponse.json({ ok: true, segment });
    } catch (error) {
        logger.error({ error }, "[admin/segments/[id] GET] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PATCH /api/admin/segments/[id]
const UpdateSegmentSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    description: z.string().trim().max(500).nullable().optional(),
    filters: SegmentFiltersSchema.optional(),
    isActive: z.boolean().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:segments-patch", 30, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;
    const { id } = await params;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = UpdateSegmentSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    try {
        const current = await prisma.userSegment.findUnique({ where: { id } });
        if (!current) return NextResponse.json({ error: "Segmento no encontrado" }, { status: 404 });

        const data: any = {};
        if (parsed.data.name !== undefined) data.name = parsed.data.name;
        if (parsed.data.description !== undefined) data.description = parsed.data.description;
        if (parsed.data.isActive !== undefined) data.isActive = parsed.data.isActive;

        if (parsed.data.filters) {
            data.filters = JSON.stringify(parsed.data.filters);
            // recalculamos count con los nuevos filtros
            const count = await countSegment(parsed.data.filters);
            data.lastCount = count;
            data.lastCountAt = new Date();
        }

        const segment = await prisma.userSegment.update({ where: { id }, data });

        await prisma.auditLog.create({
            data: {
                action: "USER_SEGMENT_UPDATED",
                entityType: "UserSegment",
                entityId: id,
                userId: adminId,
                details: JSON.stringify({
                    changes: Object.keys(parsed.data),
                    before: {
                        name: current.name,
                        filters: current.filters,
                        isActive: current.isActive,
                    },
                }),
            },
        });

        return NextResponse.json({ ok: true, segment });
    } catch (error) {
        logger.error({ error }, "[admin/segments/[id] PATCH] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE /api/admin/segments/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:segments-delete", 20, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;
    const { id } = await params;

    try {
        const segment = await prisma.userSegment.findUnique({
            where: { id },
            include: { _count: { select: { campaigns: true } } },
        });
        if (!segment) return NextResponse.json({ error: "Segmento no encontrado" }, { status: 404 });

        // Si tiene campañas asociadas, no lo borramos — solo desactivamos (integridad referencial)
        if (segment._count.campaigns > 0) {
            await prisma.userSegment.update({ where: { id }, data: { isActive: false } });
            await prisma.auditLog.create({
                data: {
                    action: "USER_SEGMENT_DEACTIVATED",
                    entityType: "UserSegment",
                    entityId: id,
                    userId: adminId,
                    details: JSON.stringify({
                        name: segment.name,
                        reason: "tiene campañas asociadas, no se puede borrar",
                    }),
                },
            });
            return NextResponse.json({ ok: true, deactivated: true });
        }

        await prisma.userSegment.delete({ where: { id } });
        await prisma.auditLog.create({
            data: {
                action: "USER_SEGMENT_DELETED",
                entityType: "UserSegment",
                entityId: id,
                userId: adminId,
                details: JSON.stringify({ name: segment.name }),
            },
        });

        return NextResponse.json({ ok: true, deleted: true });
    } catch (error) {
        logger.error({ error }, "[admin/segments/[id] DELETE] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
