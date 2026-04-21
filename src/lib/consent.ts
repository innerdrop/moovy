// Ley 25.326 + AAIP: helpers para registrar consentimientos en ConsentLog.
// Cada ACCEPT/REVOKE deja un asiento inmutable con versión, IP y user-agent.

import { prisma } from "@/lib/prisma";
import type { ConsentType, ConsentAction } from "@/lib/legal-versions";

/**
 * Extrae IP del request respetando proxies/load balancers.
 */
export function extractClientIp(request: Request): string | null {
    const forwarded = request.headers.get("x-forwarded-for");
    if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
    const real = request.headers.get("x-real-ip");
    return real ?? null;
}

/**
 * Extrae User-Agent truncado a 500 chars (para no explotar la columna).
 */
export function extractUserAgent(request: Request): string | null {
    const ua = request.headers.get("user-agent");
    if (!ua) return null;
    return ua.length > 500 ? ua.slice(0, 500) : ua;
}

export interface RecordConsentInput {
    userId: string;
    consentType: ConsentType;
    version: string;
    action?: ConsentAction;
    request?: Request;
    details?: Record<string, unknown>;
}

/**
 * Registra un consentimiento (o revocación) en ConsentLog.
 * Siempre es INSERT, nunca update — el log es inmutable.
 */
export async function recordConsent(input: RecordConsentInput) {
    const {
        userId,
        consentType,
        version,
        action = "ACCEPT",
        request,
        details,
    } = input;

    await prisma.consentLog.create({
        data: {
            userId,
            consentType,
            version,
            action,
            ipAddress: request ? extractClientIp(request) : null,
            userAgent: request ? extractUserAgent(request) : null,
            details: details ? JSON.stringify(details) : null,
        },
    });
}
