// OPS/CRM — Editar o borrar una nota interna.
// PATCH: solo el autor de la nota puede editar (ownership check).
// DELETE: el autor o cualquier ADMIN puede borrar (hard delete).
// Ambos endpoints restringidos a role ADMIN.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const updateNoteSchema = z
    .object({
        content: z
            .string()
            .min(1, "La nota no puede estar vacía")
            .max(2000, "Máximo 2000 caracteres")
            .optional(),
        pinned: z.boolean().optional(),
    })
    .refine(
        (data) => data.content !== undefined || data.pinned !== undefined,
        { message: "Debe enviarse content o pinned" }
    );

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const limited = await applyRateLimit(request, "admin:notes:update", 30, 60_000);
        if (limited) return limited;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;

        const note = await prisma.adminNote.findUnique({
            where: { id },
            select: { id: true, adminId: true, content: true, pinned: true, userId: true },
        });
        if (!note) {
            return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
        }

        // Ownership: solo el autor puede editar el contenido
        if (note.adminId !== session.user.id) {
            return NextResponse.json(
                { error: "Solo el autor de la nota puede editarla" },
                { status: 403 }
            );
        }

        const body = await request.json().catch(() => null);
        const parsed = updateNoteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Datos inválidos" },
                { status: 400 }
            );
        }

        const data: { content?: string; pinned?: boolean } = {};
        if (parsed.data.content !== undefined) data.content = parsed.data.content.trim();
        if (parsed.data.pinned !== undefined) data.pinned = parsed.data.pinned;

        const updated = await prisma.adminNote.update({
            where: { id },
            data,
            include: {
                admin: { select: { id: true, name: true, email: true } },
            },
        });

        await logAudit({
            action: "ADMIN_NOTE_UPDATED",
            entityType: "AdminNote",
            entityId: updated.id,
            userId: session.user.id,
            details: {
                targetUserId: note.userId,
                changed: Object.keys(data),
                pinned: updated.pinned,
            },
        });

        return NextResponse.json({ note: updated });
    } catch (error) {
        console.error("[admin/notes] PATCH error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const limited = await applyRateLimit(request, "admin:notes:delete", 30, 60_000);
        if (limited) return limited;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;

        const note = await prisma.adminNote.findUnique({
            where: { id },
            select: {
                id: true,
                adminId: true,
                userId: true,
                content: true,
                pinned: true,
            },
        });
        if (!note) {
            return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 });
        }

        // Cualquier ADMIN puede borrar (ya verificamos rol arriba).
        // La regla del autor-only aplica a editar, no a borrar.
        await prisma.adminNote.delete({ where: { id } });

        await logAudit({
            action: "ADMIN_NOTE_DELETED",
            entityType: "AdminNote",
            entityId: note.id,
            userId: session.user.id,
            details: {
                targetUserId: note.userId,
                authorId: note.adminId,
                pinned: note.pinned,
                content: note.content,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[admin/notes] DELETE error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
