import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { SegmentFiltersSchema, countSegment } from "@/lib/user-segments";
import { logger } from "@/lib/logger";

// GET /api/admin/segments — lista de segmentos guardados
export async function GET(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:segments", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const isActive = url.searchParams.get("isActive");

    try {
        const segments = await prisma.userSegment.findMany({
            where: {
                ...(isActive === "true" ? { isActive: true } : {}),
                ...(isActive === "false" ? { isActive: false } : {}),
            },
            orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
            include: {
                _count: { select: { campaigns: true } },
            },
        });

        return NextResponse.json({ ok: true, segments });
    } catch (error) {
        logger.error({ error }, "[admin/segments GET] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST /api/admin/segments — crear un segmento nuevo
const CreateSegmentSchema = z.object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(500).optional(),
    filters: SegmentFiltersSchema,
});

export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:segments-create", 20, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const parsed = CreateSegmentSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    try {
        // Calculamos el count inicial para cachear en lastCount
        const count = await countSegment(parsed.data.filters);

        const segment = await prisma.userSegment.create({
            data: {
                name: parsed.data.name,
                description: parsed.data.description ?? null,
                filters: JSON.stringify(parsed.data.filters),
                lastCount: count,
                lastCountAt: new Date(),
                createdBy: adminId,
                isActive: true,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "USER_SEGMENT_CREATED",
                entityType: "UserSegment",
                entityId: segment.id,
                userId: adminId,
                details: JSON.stringify({ name: segment.name, count, filters: parsed.data.filters }),
            },
        });

        return NextResponse.json({ ok: true, segment });
    } catch (error) {
        logger.error({ error }, "[admin/segments POST] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
