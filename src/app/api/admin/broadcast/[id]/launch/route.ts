import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { countSegment, parseSegmentFilters } from "@/lib/user-segments";
import logger from "@/lib/logger";

/**
 * POST /api/admin/broadcast/[id]/launch
 * Pasa una campaña de DRAFT a SCHEDULED (si tiene scheduledAt futuro) o RUNNING
 * (si se va a disparar ya). Calcula totalRecipients contando el segmento
 * en ese momento.
 *
 * Si el admin confirma con body { immediate: true }, va directo a RUNNING
 * independientemente del scheduledAt.
 */
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:broadcast-launch", 10, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;
    const { id } = await params;

    let body: { immediate?: boolean } = {};
    try {
        body = await request.json();
    } catch {
        // body opcional
    }

    try {
        const campaign = await prisma.broadcastCampaign.findUnique({
            where: { id },
            include: { segment: true },
        });
        if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
        if (campaign.status !== "DRAFT" && campaign.status !== "SCHEDULED") {
            return NextResponse.json(
                { error: `No se puede lanzar desde status ${campaign.status}` },
                { status: 409 },
            );
        }

        // Contar recipients actuales del segmento
        const filters = parseSegmentFilters(campaign.segment.filters);
        if (!filters) {
            return NextResponse.json(
                { error: "El segmento de esta campaña tiene filtros inválidos" },
                { status: 400 },
            );
        }
        const totalRecipients = await countSegment(filters);

        if (totalRecipients === 0) {
            return NextResponse.json(
                { error: "El segmento no tiene recipients. Ajustá los filtros antes de lanzar." },
                { status: 400 },
            );
        }

        const now = new Date();
        const immediate = !!body.immediate || !campaign.scheduledAt || campaign.scheduledAt <= now;
        const nextStatus = immediate ? "RUNNING" : "SCHEDULED";

        const updated = await prisma.broadcastCampaign.update({
            where: { id },
            data: {
                status: nextStatus,
                totalRecipients,
                startedAt: immediate ? now : null,
                lastCursor: null, // reset del cursor por si estaba en DRAFT con basura
            },
        });

        await prisma.auditLog.create({
            data: {
                action: immediate ? "BROADCAST_LAUNCHED" : "BROADCAST_SCHEDULED",
                entityType: "BroadcastCampaign",
                entityId: id,
                userId: adminId,
                details: JSON.stringify({
                    name: campaign.name,
                    totalRecipients,
                    channel: campaign.channel,
                    scheduledAt: campaign.scheduledAt,
                }),
            },
        });

        return NextResponse.json({ ok: true, campaign: updated });
    } catch (error) {
        logger.error({ error }, "[admin/broadcast/[id]/launch POST] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
