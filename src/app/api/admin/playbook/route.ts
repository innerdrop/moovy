// API Route: Playbook Checklists — listar (GET) y crear (POST)
// Solo accesible por ADMIN. Las mutaciones generan AuditLog.
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { applyRateLimit } from "@/lib/rate-limit";

const ALLOWED_CATEGORIES = ["onboarding", "approval", "escalation", "incident", "other"] as const;
type PlaybookCategory = typeof ALLOWED_CATEGORIES[number];

// GET: lista todos los checklists. Query opcional ?category=onboarding
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:playbook:list", 60, 60_000);
        if (limited) return limited;

        const url = new URL(request.url);
        const category = url.searchParams.get("category");

        const where: any = {};
        if (category && (ALLOWED_CATEGORIES as readonly string[]).includes(category)) {
            where.category = category;
        }

        const checklists = await prisma.playbookChecklist.findMany({
            where,
            orderBy: [{ order: "asc" }, { createdAt: "desc" }],
            include: {
                _count: { select: { steps: true } },
            },
        });

        return NextResponse.json({ ok: true, data: checklists });
    } catch (error) {
        console.error("Error fetching playbook checklists:", error);
        return NextResponse.json(
            { error: "Error al obtener checklists" },
            { status: 500 }
        );
    }
}

const createSchema = z.object({
    name: z.string().min(1, "Nombre requerido").max(100, "Nombre demasiado largo"),
    description: z.string().max(500, "Descripción demasiado larga").optional(),
    category: z.enum(ALLOWED_CATEGORIES),
});

// POST: crear un checklist nuevo.
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:playbook:create", 20, 60_000);
        if (limited) return limited;

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

        // Calcular next order
        const last = await prisma.playbookChecklist.findFirst({
            orderBy: { order: "desc" },
            select: { order: true },
        });
        const nextOrder = (last?.order ?? 0) + 1;

        const created = await prisma.playbookChecklist.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                category: data.category,
                order: nextOrder,
            },
            include: {
                _count: { select: { steps: true } },
            },
        });

        await logAudit({
            action: "PLAYBOOK_CREATED",
            entityType: "PlaybookChecklist",
            entityId: created.id,
            userId: session.user.id,
            details: {
                name: created.name,
                category: created.category,
            },
        });

        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (error) {
        console.error("Error creating playbook checklist:", error);
        return NextResponse.json(
            { error: "Error al crear checklist" },
            { status: 500 }
        );
    }
}
