/**
 * Sentry PII Scrubbing — fuente de verdad de datos sensibles a redactar
 * antes de enviar eventos a Sentry.
 *
 * Cumple Ley 25.326 (AAIP) — datos personales NO deben salir de la
 * jurisdicción de Moovy salvo agregados/anonimizados. Sentry es un
 * proveedor externo (US-based), por lo que aplica scrubbing estricto.
 *
 * Aplica a:
 *  - Mensajes de error y stack traces
 *  - URLs (path + query string)
 *  - Breadcrumbs (data + message)
 *  - Headers (Authorization, Cookie, x-api-key)
 *  - Body de requests (cualquier campo PII)
 *
 * Lista de patrones — el orden importa: tokens MP primero (más específicos)
 * para evitar que el regex de DNI los descomponga.
 */

const SCRUB_PATTERNS: Array<{ pattern: RegExp; replacement: string; label: string }> = [
    // MercadoPago access tokens (producción y sandbox)
    { pattern: /APP_USR-[A-Za-z0-9_-]{20,}/g, replacement: "[MP_TOKEN]", label: "mp_token" },
    { pattern: /TEST-[A-Za-z0-9_-]{20,}/g, replacement: "[MP_TEST_TOKEN]", label: "mp_test_token" },

    // Bearer tokens / JWT-like
    { pattern: /Bearer\s+[A-Za-z0-9_.\-+/=]{20,}/gi, replacement: "Bearer [TOKEN]", label: "bearer" },
    { pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_.\-+/=]{10,}/g, replacement: "[JWT]", label: "jwt" },

    // Email — debe ir antes que CBU/DNI para evitar matches parciales en dominios
    { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, replacement: "[EMAIL]", label: "email" },

    // CBU argentino — exactamente 22 dígitos
    { pattern: /(?<!\d)\d{22}(?!\d)/g, replacement: "[CBU]", label: "cbu" },

    // CUIT/CUIL argentino — formato XX-XXXXXXXX-X o 11 dígitos
    { pattern: /\b\d{2}-\d{8}-\d\b/g, replacement: "[CUIT]", label: "cuit_dashed" },
    { pattern: /(?<!\d)\d{11}(?!\d)/g, replacement: "[CUIT]", label: "cuit_compact" },

    // DNI argentino — 7 u 8 dígitos. Aplica DESPUÉS de CUIT/CBU para no comerlos.
    // Riesgo: pueden ser falsos positivos (IDs internos), pero preferimos sobre-redactar.
    { pattern: /(?<!\d)\d{7,8}(?!\d)/g, replacement: "[DNI]", label: "dni" },

    // PIN de 4 dígitos en contextos típicos (pin: 1234, pin=1234, "pin":"1234")
    { pattern: /(["']?pin["']?\s*[:=]\s*["']?)\d{4}(["']?)/gi, replacement: "$1[PIN]$2", label: "pin" },

    // Tarjetas de crédito — 13-19 dígitos contiguos o con separadores
    { pattern: /\b(?:\d[ -]?){13,19}\b/g, replacement: "[CARD]", label: "card" },
];

/**
 * Aplica scrubbing a un string. Devuelve el string redactado.
 */
export function scrubText(text: string | undefined | null): string {
    if (typeof text !== "string") return "";
    let scrubbed = text;
    for (const { pattern, replacement } of SCRUB_PATTERNS) {
        scrubbed = scrubbed.replace(pattern, replacement);
    }
    return scrubbed;
}

/**
 * Aplica scrubbing a una URL (path + query). Mantiene la estructura
 * para que en Sentry se siga viendo qué endpoint falló.
 */
export function scrubUrl(url: string | undefined | null): string {
    if (typeof url !== "string") return "";
    return scrubText(url);
}

/**
 * Aplica scrubbing recursivo a un objeto.
 * - Strings: scrubText
 * - Arrays/objetos: recurse
 * - Otros: pass through
 *
 * Profundidad máx 6 para evitar recursión infinita en objetos circulares.
 */
export function scrubObject(obj: unknown, depth = 0): unknown {
    if (depth > 6) return "[DEPTH_LIMIT]";
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === "string") return scrubText(obj);
    if (typeof obj === "number" || typeof obj === "boolean") return obj;
    if (Array.isArray(obj)) {
        return obj.map((item) => scrubObject(item, depth + 1));
    }
    if (typeof obj === "object") {
        const result: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
            // Redactar campos sensibles por nombre, regardless del contenido
            const lowerKey = key.toLowerCase();
            if (
                lowerKey === "password" ||
                lowerKey === "token" ||
                lowerKey === "secret" ||
                lowerKey === "authorization" ||
                lowerKey === "cookie" ||
                lowerKey === "x-api-key" ||
                lowerKey === "mpaccesstoken" ||
                lowerKey === "mp_access_token" ||
                lowerKey === "bankcbu" ||
                lowerKey === "cuit" ||
                lowerKey === "dni"
            ) {
                result[key] = "[REDACTED]";
                continue;
            }
            result[key] = scrubObject(value, depth + 1);
        }
        return result;
    }
    return obj;
}

/**
 * Headers que SIEMPRE deben removerse del request antes de mandar a Sentry.
 */
export const SENSITIVE_HEADERS = [
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "x-auth-token",
    "x-cron-secret",
    "x-mp-signature",
];

/**
 * Limpia headers de un objeto request-like.
 */
export function scrubHeaders(headers: Record<string, unknown> | undefined): Record<string, unknown> {
    if (!headers) return {};
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(headers)) {
        if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
            cleaned[key] = "[REDACTED]";
        } else if (typeof value === "string") {
            cleaned[key] = scrubText(value);
        } else {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

/**
 * Hook beforeSend canónico para Sentry. Aplica scrubbing a:
 * - request.url, request.headers, request.data
 * - exception values
 * - message
 * - breadcrumbs
 * - extra/contexts/tags
 */
export function scrubSentryEvent(event: any): any {
    // Mensaje principal
    if (event.message && typeof event.message === "string") {
        event.message = scrubText(event.message);
    }

    // Excepciones (stack traces y mensajes)
    if (event.exception?.values && Array.isArray(event.exception.values)) {
        for (const exc of event.exception.values) {
            if (exc.value && typeof exc.value === "string") {
                exc.value = scrubText(exc.value);
            }
        }
    }

    // Request
    if (event.request) {
        if (event.request.url) {
            event.request.url = scrubUrl(event.request.url);
        }
        if (event.request.headers) {
            event.request.headers = scrubHeaders(event.request.headers);
        }
        if (event.request.data) {
            event.request.data = scrubObject(event.request.data);
        }
        if (event.request.query_string) {
            event.request.query_string = scrubText(event.request.query_string);
        }
    }

    // Breadcrumbs
    if (event.breadcrumbs && Array.isArray(event.breadcrumbs)) {
        for (const bc of event.breadcrumbs) {
            if (bc.message && typeof bc.message === "string") {
                bc.message = scrubText(bc.message);
            }
            if (bc.data) {
                bc.data = scrubObject(bc.data);
            }
        }
    }

    // Extra y contexts
    if (event.extra) {
        event.extra = scrubObject(event.extra);
    }
    if (event.contexts) {
        // Mantener structure de contexts (browser, os, etc) pero scrub strings
        event.contexts = scrubObject(event.contexts);
    }

    // User — mantener id pero scrub email/username/ip
    if (event.user) {
        if (event.user.email) event.user.email = "[REDACTED]";
        if (event.user.username) event.user.username = "[REDACTED]";
        if (event.user.ip_address) event.user.ip_address = "[REDACTED]";
        // event.user.id se mantiene — es necesario para debugging y NO es PII directo
    }

    return event;
}
