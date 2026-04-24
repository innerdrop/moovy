// API Route: Seed de templates de email desde el registro de código.
// Endpoint one-time (idempotente) que carga en DB los ~50 templates actuales
// de src/lib/email-registry.ts para que puedan editarse desde OPS.
//
// Lógica: para cada entrada del EMAIL_REGISTRY, si no existe en DB un row
// con la misma `key` (= registry.id), crea uno con subject + bodyHtml
// generado por `generatePreview()`. Los que ya existen se skippean.
//
// Se puede re-correr sin efectos colaterales — solo agrega los faltantes.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { applyRateLimit } from "@/lib/rate-limit";
import { invalidateTemplateCache } from "@/lib/email-templates";
import { EMAIL_REGISTRY } from "@/lib/email-registry";
import { emailLogger } from "@/lib/logger";

const ALLOWED_CATEGORIES = new Set(["transactional", "marketing", "system"]);
const ALLOWED_RECIPIENTS = new Set(["comprador", "comercio", "repartidor", "vendedor", "admin", "owner"]);

/**
 * Mapea la categoría del registry (ej: "Registro y Onboarding") a una de las
 * 3 categorías del schema (transactional | marketing | system). Todos los
 * emails del registry son transaccionales por naturaleza del flujo, pero los
 * del destinatario "admin"/"owner" son del sistema.
 */
function mapCategory(recipient: string): string {
    if (recipient === "admin" || recipient === "owner") return "system";
    return "transactional";
}

function mapRecipient(recipient: string): string {
    // El registry usa "owner" además de los 4 estándares. El schema lo admite.
    if (ALLOWED_RECIPIENTS.has(recipient)) return recipient;
    // Fallback conservador.
    return "admin";
}

/**
 * Extrae placeholders del string buscando patrones {{variable}}. Sirve para
 * documentar qué variables se usan en el template aunque el body esté
 * renderizado con datos de ejemplo (post-generatePreview, los placeholders
 * ya fueron reemplazados — devolverá array vacío en ese caso, que es lo correcto
 * porque el HTML ya no tiene placeholders). El admin puede editar los
 * placeholders manualmente después.
 */
function extractPlaceholders(text: string): string[] {
    const set = new Set<string>();
    const re = /\{\{(\w+)\}\}/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
        set.add(match[1]);
    }
    return Array.from(set);
}

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const limited = await applyRateLimit(request, "admin:email-templates:seed", 5, 60_000);
        if (limited) return limited;

        let created = 0;
        let skipped = 0;
        const errors: Array<{ key: string; error: string }> = [];

        for (const entry of EMAIL_REGISTRY) {
            try {
                const existing = await prisma.emailTemplate.findUnique({
                    where: { key: entry.id },
                    select: { id: true },
                });
                if (existing) {
                    skipped++;
                    continue;
                }

                // `generatePreview` arma el HTML con datos de ejemplo. Al
                // sembrarlo como template inicial, el admin puede después
                // reemplazar los valores hardcodeados por placeholders {{x}}.
                let bodyHtml = "";
                try {
                    bodyHtml = entry.generatePreview();
                } catch (err) {
                    errors.push({
                        key: entry.id,
                        error: `generatePreview threw: ${(err as Error).message}`,
                    });
                    continue;
                }

                const placeholders = Array.from(
                    new Set([
                        ...extractPlaceholders(entry.subject),
                        ...extractPlaceholders(bodyHtml),
                    ])
                );

                await prisma.emailTemplate.create({
                    data: {
                        key: entry.id,
                        name: entry.name,
                        subject: entry.subject,
                        bodyHtml,
                        placeholders: JSON.stringify(placeholders),
                        category: mapCategory(entry.recipient),
                        recipient: mapRecipient(entry.recipient),
                        isActive: true,
                        lastEditedBy: session.user.id,
                    },
                });
                invalidateTemplateCache(entry.id);
                created++;
            } catch (err) {
                errors.push({
                    key: entry.id,
                    error: (err as Error).message || "Error desconocido",
                });
            }
        }

        await logAudit({
            action: "EMAIL_TEMPLATE_SEEDED",
            entityType: "EmailTemplate",
            entityId: "bulk",
            userId: session.user.id,
            details: { created, skipped, totalInRegistry: EMAIL_REGISTRY.length, errors },
        });

        return NextResponse.json({
            ok: true,
            created,
            skipped,
            totalInRegistry: EMAIL_REGISTRY.length,
            errors,
        });
    } catch (err) {
        emailLogger.error({ err }, "admin/email-templates/seed: error");
        return NextResponse.json({ error: "Error al sembrar templates" }, { status: 500 });
    }
}
