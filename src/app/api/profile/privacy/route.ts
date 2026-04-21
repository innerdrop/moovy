// API Route: User Privacy Settings (Ley 25.326 - ARCO rights)
// GET: lista los consentimientos vigentes + historial
// PATCH: otorgar/revocar marketing consent (opt-in explícito)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordConsent } from "@/lib/consent";
import {
    MARKETING_CONSENT_VERSION,
    PRIVACY_POLICY_VERSION,
    TERMS_VERSION,
    COOKIES_POLICY_VERSION,
} from "@/lib/legal-versions";
import { applyRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

// GET - Estado actual de consentimientos + historial
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                termsConsentAt: true,
                termsConsentVersion: true,
                privacyConsentAt: true,
                privacyConsentVersion: true,
                marketingConsent: true,
                marketingConsentAt: true,
                marketingConsentRevokedAt: true,
                age18Confirmed: true,
                cookiesConsent: true,
                cookiesConsentAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Últimos 50 eventos de ConsentLog (historial ARCO auditable)
        const history = await prisma.consentLog.findMany({
            where: { userId: session.user.id },
            orderBy: { acceptedAt: "desc" },
            take: 50,
            select: {
                id: true,
                consentType: true,
                version: true,
                action: true,
                acceptedAt: true,
                ipAddress: true,
                userAgent: true,
                details: true,
            },
        });

        return NextResponse.json({
            current: {
                terms: {
                    version: user.termsConsentVersion,
                    acceptedAt: user.termsConsentAt,
                    latest: TERMS_VERSION,
                    upToDate: user.termsConsentVersion === TERMS_VERSION,
                },
                privacy: {
                    version: user.privacyConsentVersion,
                    acceptedAt: user.privacyConsentAt,
                    latest: PRIVACY_POLICY_VERSION,
                    upToDate: user.privacyConsentVersion === PRIVACY_POLICY_VERSION,
                },
                marketing: {
                    active: user.marketingConsent,
                    acceptedAt: user.marketingConsentAt,
                    revokedAt: user.marketingConsentRevokedAt,
                    version: MARKETING_CONSENT_VERSION,
                },
                cookies: {
                    preferences: user.cookiesConsent, // "all" | "essential" | JSON con detalle
                    acceptedAt: user.cookiesConsentAt,
                    version: COOKIES_POLICY_VERSION,
                },
                age18Confirmed: user.age18Confirmed,
            },
            history,
        });
    } catch (err) {
        console.error("[Privacy] GET error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

const patchSchema = z.object({
    marketingConsent: z.boolean().optional(),
});

// PATCH - Revocar/otorgar consentimiento de marketing
export async function PATCH(request: NextRequest) {
    // Rate limit: evitar que un usuario/bot spamee el endpoint
    const limited = await applyRateLimit(request, "profile:privacy", 10, 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Payload inválido", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const updates: any = {};

        if (parsed.data.marketingConsent !== undefined) {
            const now = new Date();
            if (parsed.data.marketingConsent === true) {
                // Otorgar (opt-in explícito conforme Ley 26.951 "No Llame")
                updates.marketingConsent = true;
                updates.marketingConsentAt = now;
                updates.marketingConsentRevokedAt = null;
            } else {
                // Revocar
                updates.marketingConsent = false;
                updates.marketingConsentRevokedAt = now;
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "Sin cambios" }, { status: 400 });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: updates,
        });

        // Registrar en ConsentLog (inmutable — auditable por AAIP)
        if (parsed.data.marketingConsent !== undefined) {
            try {
                await recordConsent({
                    userId: session.user.id,
                    consentType: "MARKETING",
                    version: MARKETING_CONSENT_VERSION,
                    action: parsed.data.marketingConsent ? "ACCEPT" : "REVOKE",
                    request,
                    details: { context: "profile_privacy_panel" },
                });
            } catch (err) {
                console.error("[Privacy] Failed to persist consent log:", err);
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("[Privacy] PATCH error:", err);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
