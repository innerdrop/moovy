// API Route: Single Playbook Step — PATCH, DELETE
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { applyRateLimit } from "@/lib/rate-limit";

const patchSchema = z.object({
    content: z.string().min(1, "Contenido requerido").max(500, "Contenido demasiado largo").optional(),
    required: z.boolean().optional(),
    order: z.number().int().min(0).optional(),
});

// PATCH: actualizar content, required y/o order del step.
// Si viene `order`, reordena el resto de los steps del checklist en una $transaction
// para mantener órdenes densas y coherentes (0..n-1).
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string; stepId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:playbook:step:update", 120, 60_000);
        if (limited) return limited;

        const { id: checklistId, stepId } = await context.params;

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

        // Validar que el step existe y pertenece al checklist
        const existing = await prisma.playbookStep.findUnique({
            where: { id: stepId },
            select: { id: true, checklistId: true, order: true, content: true },
        });
        if (!existing || existing.checklistId !== checklistId) {
            return NextResponse.json(
                { error: "Paso no encontrado" },
                { status: 404 }
            );
        }

        // Si viene order, reordenamos todos los steps del checklist atomicamente.
        if (data.order !== undefined && data.order !== existing.order) {
            const siblings = await prisma.playbookStep.findMany({
                where: { checklistId },
                orderBy: { order: "asc" },
                select: { id: true },
            });

            const ids = siblings.map(s => s.id);
            const currentIdx = ids.indexOf(stepId);
            if (currentIdx === -1) {
                return NextResponse.json(
                    { error: "Paso no encontrado en el checklist" },
                    { status: 404 }
                );
            }

            // Clamp new index to bounds
            const targetIdx = Math.max(0, Math.min(data.order, ids.length - 1));

            // Mover el id
            ids.splice(currentIdx, 1);
            ids.splice(targetIdx, 0, stepId);

            const updated = await prisma.$transaction(async (tx) => {
                // Primero, aplicamos patch al step objetivo (content/required) en la misma tx
                const updates: any = {};
                if (data.content !== undefined) updates.content = data.content;
                if (data.required !== undefined) updates.required = data.required;
                if (Object.keys(updates).length > 0) {
                    await tx.playbookStep.update({
                        where: { id: stepId },
                        data: updates,
                    });
                }

                // Reasignar órdenes 0..n-1 a todos
                for (let i = 0; i < ids.length; i++) {
                    await tx.playbookStep.update({
                        where: { id: ids[i] },
                        data: { order: i },
                    });
                }

                return tx.playbookStep.findUnique({
                    where: { id: stepId },
                });
            });

            await logAudit({
                action: "PLAYBOOK_STEP_UPDATED",
                entityType: "PlaybookStep",
                entityId: stepId,
                userId: session.user.id,
                details: {
                    checklistId,
                    changes: data,
                    fromOrder: existing.order,
                    toOrder: targetIdx,
                },
            });

            return NextResponse.json({ ok: true, data: updated });
        }

        // Sin cambio de orden, patch directo
        const updates: any = {};
        if (data.content !== undefined) updates.content = data.content;
        if (data.required !== undefined) updates.required = data.required;

        const updated = await prisma.playbookStep.update({
            where: { id: stepId },
            data: updates,
        });

        await logAudit({
            action: "PLAYBOOK_STEP_UPDATED",
            entityType: "PlaybookStep",
            entityId: stepId,
            userId: session.user.id,
            details: {
                checklistId,
                changes: data,
            },
        });

        return NextResponse.json({ ok: true, data: updated });
    } catch (error) {
        console.error("Error updating playbook step:", error);
        return NextResponse.json(
            { error: "Error al actualizar paso" },
            { status: 500 }
        );
    }
}

// DELETE: borra el step. No re-densifica (el drag&drop o nuevos inserts se encargan).
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string; stepId: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:playbook:step:delete", 60, 60_000);
        if (limited) return limited;

        const { id: checklistId, stepId } = await context.params;

        const existing = await prisma.playbookStep.findUnique({
            where: { id: stepId },
            select: { id: true, checklistId: true, content: true, order: true },
        });
        if (!existing || existing.checklistId !== checklistId) {
            return NextResponse.json(
                { error: "Paso no encontrado" },
                { status: 404 }
            );
        }

        await prisma.playbookStep.delete({ where: { id: stepId } });

        await logAudit({
            action: "PLAYBOOK_STEP_DELETED",
            entityType: "PlaybookStep",
            entityId: stepId,
            userId: session.user.id,
            details: {
                checklistId,
                content: existing.content,
                order: existing.order,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error deleting playbook step:", error);
        return NextResponse.json(
            { error: "Error al eliminar paso" },
            { status: 500 }
        );
    }
}
