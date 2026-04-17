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

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            select: { id: true, name: true, email: true },
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Reset the login rate limit for this email
        const rateLimitKey = `login:${normalizedEmail}`;
        await resetRateLimit(rateLimitKey);

        // Audit log
        auditLog({
            timestamp: new Date().toISOString(),
            userId: session?.user?.id,
            action: "UNLOCK_ACCOUNT",
            resource: "User",
            resourceId: user.id,
            details: {
                unlockedEmail: user.email,
                unlockedBy: session?.user?.email,
            },
        });

        console.log(`[Admin] Account unlocked: ${user.email} by ${session?.user?.email}`);

        return NextResponse.json({
            success: true,
            message: `Cuenta de ${user.name || user.email} desbloqueada`,
        });
    } catch (error) {
        console.error("Error unlocking account:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
