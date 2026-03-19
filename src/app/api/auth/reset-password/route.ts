import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validatePasswordStrength } from "@/lib/security";

export async function POST(request: NextRequest) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
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

        // Find user with valid token
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });

        if (!user) {
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
