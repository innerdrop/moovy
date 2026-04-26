// API: Admin unlock user account (reset login rate limit)
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { resetRateLimit } from "@/lib/security";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/security";

export async function POST(request: Request) {
    try {
        const session = await auth();
        const isAdmin = hasAnyRole(session, ["ADMIN"]);

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { email } = await request.json();

        if (!email || typeof email !== "string") {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Verify user exists + leer estado de bloqueo previo para auditoría
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: {
                id: true,
                name: true,
                email: true,
                failedLoginAttempts: true,
                loginLockedUntil: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // ISSUE-062: defense in depth — desbloquear las DOS capas.
        // (1) Rate limit Redis/memory (ephemeral, 15min TTL)
        // (2) Lock persistente en DB (User.failedLoginAttempts + loginLockedUntil)
        // Sin (2), el botón parecía no funcionar después de 15min porque el rate
        // limit ya se había auto-expirado pero el user veía "no pasó nada".
        const rateLimitKey = `login:${normalizedEmail}`;
        await resetRateLimit(rateLimitKey);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: 0,
                loginLockedUntil: null,
            },
        });

        // Audit log
        auditLog({
            timestamp: new Date().toISOString(),
            userId: session?.user?.id,
            action: "USER_LOGIN_UNLOCKED_BY_ADMIN",
            resource: "User",
            resourceId: user.id,
            details: {
                unlockedEmail: user.email,
                unlockedBy: session?.user?.email,
                previousAttempts: user.failedLoginAttempts,
                previousLockUntil: user.loginLockedUntil?.toISOString() ?? null,
            },
        });

        console.log(`[Admin] Account unlocked: ${user.email} by ${session?.user?.email} (was attempts=${user.failedLoginAttempts}, lockUntil=${user.loginLockedUntil?.toISOString() ?? "null"})`);

        return NextResponse.json({
            success: true,
            message: `Cuenta de ${user.name || user.email} desbloqueada`,
            previousState: {
                failedLoginAttempts: user.failedLoginAttempts,
                wasLocked: user.loginLockedUntil !== null && user.loginLockedUntil > new Date(),
            },
        });
    } catch (error) {
        console.error("Error unlocking account:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
