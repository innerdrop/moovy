import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:broadcast-get", 60, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    try {
        const campaign = await prisma.broadcastCampaign.findUnique({
            where: { id },
            include: { segment: { select: { id: true, name: true, lastCount: true, filters: true } } },
        });
        if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
        return NextResponse.json({ ok: true, campaign });
    } catch (error) {
        logger.error({ error }, "[admin/broadcast/[id] GET] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PATCH solo permitido en DRAFT o SCHEDULED
const UpdateBroadcastSchema = z.object({
    name: z.string().trim().min(1).max(100).optional(),
    channel: z.enum(["push", "email", "both"]).optional(),
    segmentId: z.string().min(1).optional(),
    templateId: z.string().min(1).nullable().optional(),
    customTitle: z.string().trim().max(200).nullable().optional(),
    customBody: z.string().trim().max(10_000).nullable().optional(),
    customUrl: z.string().trim().max(500).nullable().optional(),
    scheduledAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:broadcast-patch", 30, 60_000);
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

    const parsed = UpdateBroadcastSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    try {
        const current = await prisma.broadcastCampaign.findUnique({ where: { id } });
        if (!current) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

        if (current.status !== "DRAFT" && current.status !== "SCHEDULED") {
            return NextResponse.json(
                { error: `No se puede editar campaña en status ${current.status}` },
                { status: 409 },
            );
        }

        const data: any = {};
        for (const key of Object.keys(parsed.data) as (keyof typeof parsed.data)[]) {
            const v = parsed.data[key];
            if (v === undefined) continue;
            if (key === "scheduledAt" && v !== null) {
                data[key] = new Date(v as string);
            } else {
                data[key] = v;
            }
        }

        const campaign = await prisma.broadcastCampaign.update({ where: { id }, data });

        await prisma.auditLog.create({
            data: {
                action: "BROADCAST_UPDATED",
                entityType: "BroadcastCampaign",
                entityId: id,
                userId: adminId,
                details: JSON.stringify({ changes: Object.keys(parsed.data) }),
            },
        });

        return NextResponse.json({ ok: true, campaign });
    } catch (error) {
        logger.error({ error }, "[admin/broadcast/[id] PATCH] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// DELETE solo permitido en DRAFT
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    const limited = await applyRateLimit(request, "admin:broadcast-delete", 20, 60_000);
    if (limited) return limited;

    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const adminId = (session.user as any).id as string;
    const { id } = await params;

    try {
        const current = await prisma.broadcastCampaign.findUnique({ where: { id } });
        if (!current) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

        if (current.status !== "DRAFT") {
            return NextResponse.json(
                { error: "Solo se pueden borrar campañas en DRAFT. Cancelá la campaña en su lugar." },
                { status: 409 },
            );
        }

        await prisma.broadcastCampaign.delete({ where: { id } });
        await prisma.auditLog.create({
            data: {
                action: "BROADCAST_DELETED",
                entityType: "BroadcastCampaign",
                entityId: id,
                userId: adminId,
                details: JSON.stringify({ name: current.name }),
            },
        });

        return NextResponse.json({ ok: true, deleted: true });
    } catch (error) {
        logger.error({ error }, "[admin/broadcast/[id] DELETE] error");
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
