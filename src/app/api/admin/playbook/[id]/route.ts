// API Route: Single Playbook Checklist — GET, PATCH, DELETE
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { applyRateLimit } from "@/lib/rate-limit";

const ALLOWED_CATEGORIES = ["onboarding", "approval", "escalation", "incident", "other"] as const;

// GET: devuelve el checklist con sus steps ordenados
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await context.params;

        const checklist = await prisma.playbookChecklist.findUnique({
            where: { id },
            include: {
                steps: { orderBy: { order: "asc" } },
            },
        });

        if (!checklist) {
            return NextResponse.json(
                { error: "Checklist no encontrado" },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true, data: checklist });
    } catch (error) {
        console.error("Error fetching playbook checklist:", error);
        return NextResponse.json(
            { error: "Error al obtener checklist" },
            { status: 500 }
        );
    }
}

const patchSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
    category: z.enum(ALLOWED_CATEGORIES).optional(),
    isActive: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
});

// PATCH: actualiza campos del checklist.
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:playbook:update", 60, 60_000);
        if (limited) return limited;

        const { id } = await context.params;

        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
        }

        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", issues: parsed.error.issues },
                { status: 400 }
            );
        }
        const data = parsed.data;

        // Check existence
        const existing = await prisma.playbookChecklist.findUnique({
            where: { id },
            select: { id: true, name: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Checklist no encontrado" },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.category !== undefined) updateData.category = data.category;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;
        if (data.order !== undefined) updateData.order = data.order;

        const updated = await prisma.playbookChecklist.update({
            where: { id },
            data: updateData,
            include: {
                _count: { select: { steps: true } },
            },
        });

        await logAudit({
            action: "PLAYBOOK_UPDATED",
            entityType: "PlaybookChecklist",
            entityId: updated.id,
            userId: session.user.id,
            details: {
                name: updated.name,
                changes: data,
            },
        });

        return NextResponse.json({ ok: true, data: updated });
    } catch (error) {
        console.error("Error updating playbook checklist:", error);
        return NextResponse.json(
            { error: "Error al actualizar checklist" },
            { status: 500 }
        );
    }
}

// DELETE: hard delete (cascade borra steps).
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:playbook:delete", 20, 60_000);
        if (limited) return limited;

        const { id } = await context.params;

        const existing = await prisma.playbookChecklist.findUnique({
            where: { id },
            select: { id: true, name: true, category: true },
        });
        if (!existing) {
            return NextResponse.json(
                { error: "Checklist no encontrado" },
                { status: 404 }
            );
        }

        await prisma.playbookChecklist.delete({ where: { id } });

        await logAudit({
            action: "PLAYBOOK_DELETED",
            entityType: "PlaybookChecklist",
            entityId: id,
            userId: session.user.id,
            details: {
                name: existing.name,
                category: existing.category,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting playbook checklist:", error);
        return NextResponse.json(
            { error: "Error al eliminar checklist" },
            { status: 500 }
        );
    }
}
