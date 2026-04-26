// Login lock status check (peek-only, no side effects)
//
// ISSUE-062 fix: el endpoint anterior llamaba a checkRateLimit() que INCREMENTABA
// el contador del rate limit cada vez que el frontend lo consultaba. Resultado:
// cada intento de login fallido contaba 2× (una desde authorize() y otra desde
// este endpoint). El frontend efectivamente reducía la cuota de intentos a la mitad.
//
// Este endpoint ahora es PEEK-ONLY:
//   - Lee User.failedLoginAttempts y User.loginLockedUntil (no incrementa).
//   - Para emails no registrados devuelve respuesta idéntica a "user limpio"
//     (anti-enumeration — un atacante no puede saber si el email existe).
//   - El bloqueo persistente del User es la fuente canónica; el rate limit Redis
//     queda como defensa adicional dentro de authorize().
//
// Rate limit: 30 requests/min por IP — defensa contra scraping del estado.
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

const MAX_LOGIN_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
    try {
        // Rate limit por IP (no por email — eso lo controla el authorize).
        const limited = await applyRateLimit(req, "auth:check-rate-limit", 30, 60_000);
        if (limited) return limited;

        const body = await req.json().catch(() => ({}));
        const rawEmail = typeof body?.email === "string" ? body.email : "";
        const email = rawEmail.toLowerCase().trim();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const now = new Date();
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                failedLoginAttempts: true,
                loginLockedUntil: true,
            },
        });

        // Anti-enumeration: si el user no existe, respuesta IDÉNTICA a un user limpio
        // (sin fallos, no bloqueado). Un atacante no puede deducir si el email existe.
        if (!user) {
            return NextResponse.json({
                rateLimited: false,
                isLocked: false,
                remainingSeconds: 0,
                remainingAttempts: MAX_LOGIN_ATTEMPTS,
            });
        }

        const failedAttempts = user.failedLoginAttempts ?? 0;
        const lockedUntil = user.loginLockedUntil;
        const isLocked = lockedUntil !== null && lockedUntil > now;

        if (isLocked) {
            const remainingMs = lockedUntil!.getTime() - now.getTime();
            return NextResponse.json(
                {
                    rateLimited: true,
                    isLocked: true,
                    remainingSeconds: Math.ceil(remainingMs / 1000),
                    remainingAttempts: 0,
                    message: `Cuenta bloqueada. Esperá ${Math.max(1, Math.ceil(remainingMs / 60_000))} minuto(s).`,
                },
                { status: 200 } // Devolvemos 200 — el frontend decide qué hacer con isLocked.
            );
        }

        return NextResponse.json({
            rateLimited: false,
            isLocked: false,
            remainingSeconds: 0,
            remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - failedAttempts),
        });
    } catch (error) {
        console.error("[check-rate-limit] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
