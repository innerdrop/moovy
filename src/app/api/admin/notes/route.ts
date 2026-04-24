// OPS/CRM — Notas internas del admin sobre un User.
// POST: crea nota (rate limit 20/60s). GET: lista notas de un user (rate limit 60/60s).
// Ambos restringidos a role ADMIN. Ownership y hard-delete en [id]/route.ts.

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const createNoteSchema = z.object({
    userId: z.string().min(1, "userId requerido"),
    content: z
        .string()
        .min(1, "La nota no puede estar vacía")
        .max(2000, "Máximo 2000 caracteres"),
    pinned: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
    try {
        const limited = await applyRateLimit(request, "admin:notes:create", 20, 60_000);
        if (limited) return limited;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const body = await request.json().catch(() => null);
        const parsed = createNoteSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message || "Datos inválidos" },
                { status: 400 }
            );
        }

        const { userId, content, pinned } = parsed.data;

        // Verify target user exists (avoid FK error)
        const targetUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!targetUser) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        const note = await prisma.adminNote.create({
            data: {
                userId,
                adminId: session.user.id,
                content: content.trim(),
                pinned,
            },
            include: {
                admin: { select: { id: true, name: true, email: true } },
            },
        });

        await logAudit({
            action: "ADMIN_NOTE_CREATED",
            entityType: "AdminNote",
            entityId: note.id,
            userId: session.user.id,
            details: { targetUserId: userId, pinned, length: content.length },
        });

        return NextResponse.json({ note });
    } catch (error) {
        console.error("[admin/notes] POST error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}

export async function GET(request: Request) {
    try {
        const limited = await applyRateLimit(request, "admin:notes:list", 60, 60_000);
        if (limited) return limited;

        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");
        if (!userId) {
            return NextResponse.json({ error: "userId requerido" }, { status: 400 });
        }

        const takeRaw = Number(searchParams.get("take") ?? 50);
        const skipRaw = Number(searchParams.get("skip") ?? 0);
        const take = Math.min(Math.max(1, Number.isFinite(takeRaw) ? takeRaw : 50), 200);
        const skip = Math.max(0, Number.isFinite(skipRaw) ? skipRaw : 0);

        const [items, total] = await Promise.all([
            prisma.adminNote.findMany({
                where: { userId },
                orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
                take,
                skip,
                include: {
                    admin: { select: { id: true, name: true, email: true } },
                },
            }),
            prisma.adminNote.count({ where: { userId } }),
        ]);

        return NextResponse.json({ items, total });
    } catch (error) {
        console.error("[admin/notes] GET error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
