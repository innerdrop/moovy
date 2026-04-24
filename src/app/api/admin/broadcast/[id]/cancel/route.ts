import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

// POST /api/admin/broadcast/[id]/cancel
// Permite cancelar campañas en SCHEDULED o RUNNING. Si estaba RUNNING, el cron
// la ve como CANCELLED en su próxima pasada y deja de procesar.
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:broadcast-cancel", 20, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;
    const { id } = await params;

    try {
        const campaign = await prisma.broadcastCampaign.findUnique({ where: { id } });
        if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

        if (campaign.status !== "SCHEDULED" && campaign.status !== "RUNNING") {
            return NextResponse.json(
                { error: `No se puede cancelar desde status ${campaign.status}` },
                { status: 409 },
            );
        }

        const updated = await prisma.broadcastCampaign.update({
            where: { id },
            data: { status: "CANCELLED", completedAt: new Date() },
        });

        await prisma.auditLog.create({
            data: {
                action: "BROADCAST_CANCELLED",
                entityType: "BroadcastCampaign",
                entityId: id,
                userId: adminId,
                details: JSON.stringify({
                    name: campaign.name,
                    priorStatus: campaign.status,
                    sentSoFar: campaign.sentCount,
                    totalRecipients: campaign.totalRecipients,
                }),
            },
        });

        return NextResponse.json({ ok: true, campaign: updated });
    } catch (error) {
        logger.error({ error }, "[admin/broadcast/[id]/cancel POST] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
