// API Route: Email Templates — listar (GET) y crear (POST)
// Solo accesible por ADMIN. Las mutaciones invalidan el cache in-memory
// de src/lib/email-templates.ts y generan AuditLog.
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { applyRateLimit } from "@/lib/rate-limit";
import { invalidateTemplateCache } from "@/lib/email-templates";
import { emailLogger } from "@/lib/logger";

const ALLOWED_CATEGORIES = new Set(["transactional", "marketing", "system"]);
const ALLOWED_RECIPIENTS = new Set(["comprador", "comercio", "repartidor", "vendedor", "admin", "owner"]);

// GET: listar templates con filtros opcionales (category, recipient, isActive, q)
export async function GET(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const url = new URL(request.url);
        const category = url.searchParams.get("category");
        const recipient = url.searchParams.get("recipient");
        const isActiveParam = url.searchParams.get("isActive");
        const q = url.searchParams.get("q");

        const where: any = {};
        if (category && ALLOWED_CATEGORIES.has(category)) where.category = category;
        if (recipient && ALLOWED_RECIPIENTS.has(recipient)) where.recipient = recipient;
        if (isActiveParam === "true") where.isActive = true;
        if (isActiveParam === "false") where.isActive = false;
        if (q && q.trim()) {
            const query = q.trim();
            where.OR = [
                { key: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
                { subject: { contains: query, mode: "insensitive" } },
            ];
        }

        const templates = await prisma.emailTemplate.findMany({
            where,
            orderBy: [{ category: "asc" }, { name: "asc" }],
            select: {
                id: true,
                key: true,
                name: true,
                subject: true,
                placeholders: true,
                category: true,
                recipient: true,
                isActive: true,
                version: true,
                lastEditedBy: true,
                createdAt: true,
                updatedAt: true,
                // bodyHtml no se devuelve en la lista — puede ser grande.
                // Se pide via GET /[id] al abrir el editor.
            },
        });

        return NextResponse.json({ ok: true, data: templates });
    } catch (err) {
        emailLogger.error({ err }, "admin/email-templates GET: error");
        return NextResponse.json({ error: "Error al listar templates" }, { status: 500 });
    }
}

const createSchema = z.object({
    key: z
        .string()
        .min(1, "Key requerida")
        .max(100, "Key demasiado larga")
        .regex(/^[a-zA-Z0-9_\-:.]+$/, "Key solo puede contener letras, números, _ - : ."),
    name: z.string().min(1).max(200),
    subject: z.string().min(1).max(500),
    bodyHtml: z.string().min(1),
    placeholders: z.array(z.string()).default([]),
    category: z.string().refine((v) => ALLOWED_CATEGORIES.has(v), "Categoría inválida"),
    recipient: z.string().refine((v) => ALLOWED_RECIPIENTS.has(v), "Destinatario inválido"),
    isActive: z.boolean().optional().default(true),
});

// POST: crear un template nuevo. Falla si la key ya existe (409).
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:email-templates", 30, 60_000);
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

        // Verificar que la key no exista
        const existing = await prisma.emailTemplate.findUnique({
            where: { key: data.key },
            select: { id: true },
        });
        if (existing) {
            return NextResponse.json(
                { error: `Ya existe un template con la key "${data.key}"` },
                { status: 409 }
            );
        }

        const created = await prisma.emailTemplate.create({
            data: {
                key: data.key,
                name: data.name,
                subject: data.subject,
                bodyHtml: data.bodyHtml,
                placeholders: JSON.stringify(data.placeholders),
                category: data.category,
                recipient: data.recipient,
                isActive: data.isActive,
                lastEditedBy: session.user.id,
            },
        });

        invalidateTemplateCache(created.key);

        await logAudit({
            action: "EMAIL_TEMPLATE_CREATED",
            entityType: "EmailTemplate",
            entityId: created.id,
            userId: session.user.id,
            details: {
                key: created.key,
                name: created.name,
                category: created.category,
                recipient: created.recipient,
            },
        });

        return NextResponse.json({ ok: true, data: created }, { status: 201 });
    } catch (err) {
        emailLogger.error({ err }, "admin/email-templates POST: error");
        return NextResponse.json({ error: "Error al crear template" }, { status: 500 });
    }
}
