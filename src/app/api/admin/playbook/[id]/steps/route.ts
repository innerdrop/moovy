// API Route: Playbook Steps — crear un step nuevo dentro de un checklist
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { applyRateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
    content: z.string().min(1, "Contenido requerido").max(500, "Contenido demasiado largo"),
    required: z.boolean().optional().default(true),
});

// POST: crear un step nuevo dentro del checklist. Se asigna al final (order = max+1).
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:playbook:step:create", 60, 60_000);
        if (limited) return limited;

        const { id: checklistId } = await context.params;

        // Verificar que el checklist exista
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

        const body = await request.json().catch(() => null);
        if (!body) {
            return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
        }

        const parsed = createSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Datos inválidos", issues: parsed.error.issues },
                { status: 400 }
            );
        }
        const data = parsed.data;

        // Calcular next order dentro del checklist
        const lastStep = await prisma.playbookStep.findFirst({
            where: { checklistId },
            orderBy: { order: "desc" },
            select: { order: true },
        });
        const nextOrder = (lastStep?.order ?? -1) + 1;

        const step = await prisma.playbookStep.create({
            data: {
                checklistId,
                content: data.content,
                required: data.required,
                order: nextOrder,
            },
        });

        await logAudit({
            action: "PLAYBOOK_STEP_CREATED",
            entityType: "PlaybookStep",
            entityId: step.id,
            userId: session.user.id,
            details: {
                checklistId,
                checklistName: checklist.name,
                content: step.content,
                required: step.required,
                order: step.order,
            },
        });

        return NextResponse.json({ ok: true, data: step }, { status: 201 });
    } catch (error) {
        console.error("Error creating playbook step:", error);
        return NextResponse.json(
            { error: "Error al crear paso" },
            { status: 500 }
        );
    }
}
