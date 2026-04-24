// API Route: Playbook Steps Reorder — bulk reorder en una sola transacción.
// Pensado para drag&drop: client pasa el array de stepIds en el nuevo orden
// y acá los actualizamos en batch (más eficiente que N PATCHes individuales).
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { applyRateLimit } from "@/lib/rate-limit";

const reorderSchema = z.object({
    stepIds: z.array(z.string().min(1)).min(1, "stepIds no puede estar vacío"),
});

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:playbook:reorder", 60, 60_000);
        if (limited) return limited;

        const { id: checklistId } = await context.params;

        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
        }

        const parsed = reorderSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", issues: parsed.error.issues },
                { status: 400 }
            );
        }
        const { stepIds } = parsed.data;

        // Verificar que el checklist existe
        const checklist = await prisma.playbookChecklist.findUnique({
            where: { id: checklistId },
            select: { id: true, name: true },
        });
        if (!checklist) {
            return NextResponse.json(
                { error: "Checklist no encontrado" },
                { status: 404 }
            );
        }

        // Verificar que todos los stepIds pertenecen a este checklist y que
        // recibimos exactamente todos los steps (no se pueden agregar ni omitir).
        const existing = await prisma.playbookStep.findMany({
            where: { checklistId },
            select: { id: true },
        });
        const existingIds = new Set(existing.map(s => s.id));
        const receivedIds = new Set(stepIds);

        if (existingIds.size !== receivedIds.size) {
            return NextResponse.json(
                {
                    error: `Se esperaban ${existingIds.size} steps, se recibieron ${receivedIds.size}`,
                },
                { status: 400 }
            );
        }
        for (const id of stepIds) {
            if (!existingIds.has(id)) {
                return NextResponse.json(
                    { error: `El step ${id} no pertenece al checklist` },
                    { status: 400 }
                );
            }
        }
        if (receivedIds.size !== stepIds.length) {
            return NextResponse.json(
                { error: "Hay stepIds duplicados en el request" },
                { status: 400 }
            );
        }

        // Update en transacción
        await prisma.$transaction(
            stepIds.map((id, index) =>
                prisma.playbookStep.update({
                    where: { id },
                    data: { order: index },
                })
            )
        );

        await logAudit({
            action: "PLAYBOOK_STEPS_REORDERED",
            entityType: "PlaybookChecklist",
            entityId: checklistId,
            userId: session.user.id,
            details: {
                checklistName: checklist.name,
                stepCount: stepIds.length,
                newOrder: stepIds,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Error reordering playbook steps:", error);
        return NextResponse.json(
            { error: "Error al reordenar pasos" },
            { status: 500 }
        );
    }
}
