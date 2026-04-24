// API Route: Email Template individual — GET / PATCH / DELETE
// Solo accesible por ADMIN. PATCH incrementa version + invalida cache + audit.
// DELETE es soft (isActive: false) para que el fallback al hardcode se active.
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

// GET: detalle completo del template (incluye bodyHtml)
export async function GET(
    _request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id } = await context.params;

        const template = await prisma.emailTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return NextResponse.json({ error: "Template no encontrado" }, { status: 404 });
        }

        return NextResponse.json({ ok: true, data: template });
    } catch (err) {
        emailLogger.error({ err }, "admin/email-templates/[id] GET: error");
        return NextResponse.json({ error: "Error al obtener template" }, { status: 500 });
    }
}

const patchSchema = z
    .object({
        name: z.string().min(1).max(200).optional(),
        subject: z.string().min(1).max(500).optional(),
        bodyHtml: z.string().min(1).optional(),
        placeholders: z.array(z.string()).optional(),
        category: z
            .string()
            .refine((v) => ALLOWED_CATEGORIES.has(v), "Categoría inválida")
            .optional(),
        recipient: z
            .string()
            .refine((v) => ALLOWED_RECIPIENTS.has(v), "Destinatario inválido")
            .optional(),
        isActive: z.boolean().optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, "No hay campos para actualizar");

// PATCH: edita el template. Incrementa version, actualiza lastEditedBy,
// invalida el cache y guarda before/after de subject+bodyHtml en audit.
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:email-templates", 30, 60_000);
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

        const existing = await prisma.emailTemplate.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Template no encontrado" }, { status: 404 });
        }

        const updateData: any = {
            version: { increment: 1 },
            lastEditedBy: session.user.id,
        };
        if (data.name !== undefined) updateData.name = data.name;
        if (data.subject !== undefined) updateData.subject = data.subject;
        if (data.bodyHtml !== undefined) updateData.bodyHtml = data.bodyHtml;
        if (data.placeholders !== undefined) {
            updateData.placeholders = JSON.stringify(data.placeholders);
        }
        if (data.category !== undefined) updateData.category = data.category;
        if (data.recipient !== undefined) updateData.recipient = data.recipient;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const updated = await prisma.emailTemplate.update({
            where: { id },
            data: updateData,
        });

        invalidateTemplateCache(existing.key);

        await logAudit({
            action: "EMAIL_TEMPLATE_UPDATED",
            entityType: "EmailTemplate",
            entityId: id,
            userId: session.user.id,
            details: {
                key: existing.key,
                version: updated.version,
                before: {
                    subject: existing.subject,
                    bodyHtml: existing.bodyHtml,
                },
                after: {
                    subject: updated.subject,
                    bodyHtml: updated.bodyHtml,
                },
                changedFields: Object.keys(data),
            },
        });

        return NextResponse.json({ ok: true, data: updated });
    } catch (err) {
        emailLogger.error({ err }, "admin/email-templates/[id] PATCH: error");
        return NextResponse.json({ error: "Error al actualizar template" }, { status: 500 });
    }
}

// DELETE: soft delete (isActive: false). No hard-delete para preservar
// la historia de versiones y para que el fallback al hardcode se active
// naturalmente (renderEmailTemplate retorna null si isActive === false).
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:email-templates", 30, 60_000);
        if (limited) return limited;

        const { id } = await context.params;

        const existing = await prisma.emailTemplate.findUnique({ where: { id } });
        if (!existing) {
            return NextResponse.json({ error: "Template no encontrado" }, { status: 404 });
        }

        if (!existing.isActive) {
            return NextResponse.json(
                { error: "El template ya estaba desactivado" },
                { status: 409 }
            );
        }

        const updated = await prisma.emailTemplate.update({
            where: { id },
            data: {
                isActive: false,
                version: { increment: 1 },
                lastEditedBy: session.user.id,
            },
        });

        invalidateTemplateCache(existing.key);

        await logAudit({
            action: "EMAIL_TEMPLATE_DELETED",
            entityType: "EmailTemplate",
            entityId: id,
            userId: session.user.id,
            details: {
                key: existing.key,
                name: existing.name,
                version: updated.version,
            },
        });

        return NextResponse.json({ ok: true, data: updated });
    } catch (err) {
        emailLogger.error({ err }, "admin/email-templates/[id] DELETE: error");
        return NextResponse.json({ error: "Error al desactivar template" }, { status: 500 });
    }
}
