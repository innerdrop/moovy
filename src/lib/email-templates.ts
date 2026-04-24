/**
 * MOOVY — Helper para renderizar templates de email desde DB.
 *
 * Este módulo hace lookup a `EmailTemplate` en la DB (editado desde OPS)
 * y si no encuentra / está inactivo, retorna null para que el caller
 * caiga al hardcode histórico (src/lib/email.ts, email-p0.ts).
 *
 * Uso típico:
 *
 *   const tpl = await renderEmailTemplate("welcome", { firstName: "Maria" });
 *   if (tpl) {
 *     await sendMail({ to, subject: tpl.subject, html: tpl.bodyHtml });
 *   } else {
 *     // fallback al hardcode existente
 *   }
 *
 * Cache in-memory con TTL 60s para evitar query por cada email enviado
 * en bulk (ej: cron de avisos de vencimiento). Invalidable vía
 * invalidateTemplateCache(key?).
 */

import { prisma } from "@/lib/prisma";
import { emailLogger } from "@/lib/logger";

/** Valor resuelto de una entrada del cache. `null` = "no existe en DB" (también se cachea para evitar DB lookups repetidos). */
interface CacheEntry {
    value: { subject: string; bodyHtml: string; placeholders: string[] } | null;
    expiresAt: number;
}

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, CacheEntry>();

/**
 * Escape básico de HTML para valores interpolados.
 * Cubre los 5 chars críticos: & < > " ' — suficiente para evitar
 * que un nombre de usuario con markup se renderice como HTML arbitrario.
 * Para contextos donde el valor va dentro de un atributo HTML,
 * usar la versión con comillas escapadas de arriba.
 */
function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Reemplaza placeholders `{{variable}}` en un template por los values de `vars`.
 * Si una variable no está en `vars`, se reemplaza por string vacío (no deja `{{x}}`
 * colgando en el email, que se vería como un bug al usuario final).
 *
 * @param escapeValues Si true, aplica escape HTML a cada value. Usar true para
 *                     bodyHtml (seguridad), false para subject (plaintext).
 */
function renderTemplate(
    template: string,
    vars: Record<string, string | number>,
    escapeValues: boolean
): string {
    return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
        const raw = vars[key];
        if (raw === undefined || raw === null) return "";
        const str = String(raw);
        return escapeValues ? escapeHtml(str) : str;
    });
}

/**
 * Busca un template en DB por key y lo renderiza con los values de `vars`.
 *
 * - Si el template existe y está activo: retorna `{ subject, bodyHtml }` con
 *   los placeholders reemplazados.
 * - Si no existe o está inactivo: retorna `null` — el caller debe usar el hardcode.
 *
 * NUNCA throwea: ante error de DB loguea y retorna null (fallback seguro).
 */
export async function renderEmailTemplate(
    key: string,
    vars: Record<string, string | number> = {}
): Promise<{ subject: string; bodyHtml: string } | null> {
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && cached.expiresAt > now) {
        if (!cached.value) return null;
        return {
            subject: renderTemplate(cached.value.subject, vars, false),
            bodyHtml: renderTemplate(cached.value.bodyHtml, vars, true),
        };
    }

    try {
        const row = await prisma.emailTemplate.findUnique({
            where: { key },
            select: {
                subject: true,
                bodyHtml: true,
                placeholders: true,
                isActive: true,
            },
        });

        if (!row || !row.isActive) {
            cache.set(key, { value: null, expiresAt: now + CACHE_TTL_MS });
            return null;
        }

        let placeholders: string[] = [];
        if (row.placeholders) {
            try {
                const parsed = JSON.parse(row.placeholders);
                if (Array.isArray(parsed)) {
                    placeholders = parsed.filter((p): p is string => typeof p === "string");
                }
            } catch {
                // JSON corrupto en DB — lo ignoramos, no impide renderizar.
            }
        }

        const entry: CacheEntry = {
            value: {
                subject: row.subject,
                bodyHtml: row.bodyHtml,
                placeholders,
            },
            expiresAt: now + CACHE_TTL_MS,
        };
        cache.set(key, entry);

        return {
            subject: renderTemplate(row.subject, vars, false),
            bodyHtml: renderTemplate(row.bodyHtml, vars, true),
        };
    } catch (err) {
        emailLogger.error({ err, key }, "renderEmailTemplate: error al buscar template en DB, cayendo al fallback");
        // No cacheamos el error — la próxima llamada reintenta contra DB.
        return null;
    }
}

/**
 * Invalida el cache. Sin argumento limpia todo el cache.
 * Con `key` solo limpia esa entrada.
 *
 * Se debe llamar tras cada create/update/delete de EmailTemplate
 * para que el siguiente email renderice la versión nueva sin esperar
 * los 60s del TTL.
 */
export function invalidateTemplateCache(key?: string): void {
    if (key) {
        cache.delete(key);
    } else {
        cache.clear();
    }
}

/**
 * Export interno solo para testing — permite inspeccionar el cache.
 * No usar en producción.
 */
export function __getCacheSizeForTesting(): number {
    return cache.size;
}
