// API Route: Cookies consent (Ley 25.326 + Directiva AAIP)
// Guarda la preferencia del usuario sobre categorías de cookies.
// Si el usuario está logueado, persiste en User.cookiesConsent + ConsentLog.
// Si no, el cliente guarda en localStorage y se sincroniza al login.
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";
import { applyRateLimit } from "@/lib/rate-limit";
import { recordConsent } from "@/lib/consent";
import { COOKIES_POLICY_VERSION } from "@/lib/legal-versions";

const consentSchema = z.object({
    essential: z.literal(true), // siempre true — no se puede rechazar
    analytics: z.boolean(),
    functional: z.boolean(),
    marketing: z.boolean().optional().default(false),
});

export type CookiePreferences = z.infer<typeof consentSchema>;

/**
 * GET /api/cookies/consent — devuelve preferencia guardada (si hay user).
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ preferences: null, version: COOKIES_POLICY_VERSION });
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { cookiesConsent: true, cookiesConsentAt: true },
        });

        if (!user?.cookiesConsent) {
            return NextResponse.json({ preferences: null, version: COOKIES_POLICY_VERSION });
        }

        return NextResponse.json({
            preferences: JSON.parse(user.cookiesConsent),
            acceptedAt: user.cookiesConsentAt,
            version: COOKIES_POLICY_VERSION,
        });
    } catch (error) {
        logger.error({ error }, "cookies consent GET error");
        return NextResponse.json({ error: "Error al obtener preferencias" }, { status: 500 });
    }
}

/**
 * POST /api/cookies/consent — guarda la preferencia.
 * Si el user está logueado, persiste en DB + ConsentLog.
 * Si no, devuelve 200 para que el client guarde en localStorage (no falla).
 */
export async function POST(request: Request) {
    const rateLimited = await applyRateLimit(request, "cookies:consent", 10, 60_000);
    if (rateLimited) return rateLimited;

    try {
        const body = await request.json().catch(() => null);
        const parsed = consentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Preferencias inválidas", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const preferences = parsed.data;
        const session = await auth();
        const now = new Date();

        // Si no hay sesión, devolvemos la versión para que el client la guarde
        // junto con las preferences en localStorage. Esto evita forzar login.
        if (!session?.user?.id) {
            return NextResponse.json({
                ok: true,
                persistedTo: "client",
                version: COOKIES_POLICY_VERSION,
                acceptedAt: now,
            });
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                cookiesConsent: JSON.stringify(preferences),
                cookiesConsentAt: now,
            },
        });

        await recordConsent({
            userId: session.user.id,
            consentType: "COOKIES",
            version: COOKIES_POLICY_VERSION,
            action: "ACCEPT",
            request,
            details: preferences,
        });

        return NextResponse.json({
            ok: true,
            persistedTo: "db",
            version: COOKIES_POLICY_VERSION,
            acceptedAt: now,
        });
    } catch (error) {
        logger.error({ error }, "cookies consent POST error");
        return NextResponse.json({ error: "Error al guardar preferencias" }, { status: 500 });
    }
}
