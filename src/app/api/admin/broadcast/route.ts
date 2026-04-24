import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// GET /api/admin/broadcast — lista de campañas con paginación
export async function GET(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:broadcast-list", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const take = Math.min(parseInt(url.searchParams.get("take") || "50", 10), 200);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10);

    try {
        const [items, total] = await Promise.all([
            prisma.broadcastCampaign.findMany({
                where: status ? { status } : undefined,
                orderBy: { createdAt: "desc" },
                include: {
                    segment: { select: { id: true, name: true, lastCount: true } },
                },
                take,
                skip,
            }),
            prisma.broadcastCampaign.count({ where: status ? { status } : undefined }),
        ]);
        return NextResponse.json({ ok: true, items, total });
    } catch (error) {
        logger.error({ error }, "[admin/broadcast GET] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST /api/admin/broadcast — crear campaña en DRAFT
const CreateBroadcastSchema = z
    .object({
        name: z.string().trim().min(1).max(100),
        channel: z.enum(["push", "email", "both"]),
        segmentId: z.string().min(1),
        templateId: z.string().min(1).optional().nullable(),
        customTitle: z.string().trim().max(200).optional(),
        customBody: z.string().trim().max(10_000).optional(),
        customUrl: z.string().trim().max(500).optional(),
        scheduledAt: z.string().datetime().optional().nullable(),
    })
    .refine(
        (data) => {
            // Si NO hay templateId, se requiere customTitle + customBody (para push o subject/body de email)
            if (!data.templateId) {
                return !!data.customTitle && !!data.customBody;
            }
            return true;
        },
        { message: "Se requiere template o customTitle + customBody" },
    );

export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(request, "admin:broadcast-create", 20, 60_000);
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

    const parsed = CreateBroadcastSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    try {
        // Validar segment existe
        const segment = await prisma.userSegment.findUnique({ where: { id: parsed.data.segmentId } });
        if (!segment) return NextResponse.json({ error: "Segmento no encontrado" }, { status: 404 });

        // Si templateId viene, validar que exista
        if (parsed.data.templateId) {
            const tpl = await prisma.emailTemplate.findUnique({ where: { id: parsed.data.templateId } });
            if (!tpl) return NextResponse.json({ error: "Template no encontrado" }, { status: 404 });
        }

        const campaign = await prisma.broadcastCampaign.create({
            data: {
                name: parsed.data.name,
                channel: parsed.data.channel,
                segmentId: parsed.data.segmentId,
                templateId: parsed.data.templateId ?? null,
                customTitle: parsed.data.customTitle ?? null,
                customBody: parsed.data.customBody ?? null,
                customUrl: parsed.data.customUrl ?? null,
                scheduledAt: parsed.data.scheduledAt ? new Date(parsed.data.scheduledAt) : null,
                status: "DRAFT",
                createdBy: adminId,
            },
        });

        await prisma.auditLog.create({
            data: {
                action: "BROADCAST_CREATED",
                entityType: "BroadcastCampaign",
                entityId: campaign.id,
                userId: adminId,
                details: JSON.stringify({ name: campaign.name, channel: campaign.channel, segmentId: campaign.segmentId }),
            },
        });

        return NextResponse.json({ ok: true, campaign });
    } catch (error) {
        logger.error({ error }, "[admin/broadcast POST] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
