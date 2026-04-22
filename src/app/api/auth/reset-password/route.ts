import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { validatePasswordStrength } from "@/lib/security";

/**
 * ISSUE-027: validación timing-safe del token de reset.
 *
 * Flujo:
 * 1. /forgot-password guarda `sha256(token)` en `User.resetToken` y manda el
 *    token plaintext por email.
 * 2. /reset-password recibe el plaintext, lo hashea, busca el user por hash
 *    + expiry > now, y luego compara el hash recibido vs el de la DB con
 *    `crypto.timingSafeEqual`. Aunque Prisma ya parametriza la query
 *    (PostgreSQL no expone timing diferenciado byte-a-byte en igualdad de
 *    strings cortos), la comparación constante en JS evita cualquier side
 *    channel residual (cache, B-tree lookups, etc.) — defensa en profundidad.
 */
function timingSafeEqualHex(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
    } catch {
        return false;
    }
}

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password || typeof token !== "string") {
            return NextResponse.json(
                { error: "Token y contraseña son requeridos" },
                { status: 400 }
            );
        }

        // V-027 FIX: Use unified password strength validation
        const pwCheck = validatePasswordStrength(password);
        if (!pwCheck.valid) {
            return NextResponse.json(
                { error: `Contraseña débil: ${pwCheck.errors.join(", ")}` },
                { status: 400 }
            );
        }

        // ISSUE-027: hash incoming plaintext token, then look up by hash
        const tokenHash = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Find user with valid (hashed) token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: tokenHash,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
            select: {
                id: true,
                resetToken: true,
            },
        });

        // Defense in depth: even though the WHERE clause already filtered by
        // hash, do a constant-time comparison before trusting the lookup.
        // Prevents any residual timing leak from the DB layer.
        if (!user || !user.resetToken || !timingSafeEqualHex(user.resetToken, tokenHash)) {
            return NextResponse.json(
                { error: "Token inválido o expirado" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Update user password and clear reset token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Password reset error:", error);
        return NextResponse.json(
            { error: "Error al restablecer la contraseña" },
            { status: 500 }
        );
    }
}
