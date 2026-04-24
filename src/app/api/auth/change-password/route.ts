// API Route: Change Password (for authenticated users)
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { validatePasswordStrength } from "@/lib/security";
import { sendPasswordChangedEmail } from "@/lib/email";
import { logUserActivity, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { currentPassword, newPassword, confirmPassword } = await request.json();

        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            return NextResponse.json(
                { error: "Todos los campos son requeridos" },
                { status: 400 }
            );
        }

        if (newPassword !== confirmPassword) {
            return NextResponse.json(
                { error: "Las contraseñas nuevas no coinciden" },
                { status: 400 }
            );
        }

        // V-027 FIX: Use unified password strength validation
        const pwCheck = validatePasswordStrength(newPassword);
        if (!pwCheck.valid) {
            return NextResponse.json(
                { error: `Contraseña débil: ${pwCheck.errors.join(", ")}` },
                { status: 400 }
            );
        }

        if (currentPassword === newPassword) {
            return NextResponse.json(
                { error: "La nueva contraseña debe ser diferente a la actual" },
                { status: 400 }
            );
        }

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { id: true, email: true, name: true, password: true }
        });

        if (!user) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        if (!isValidPassword) {
            return NextResponse.json(
                { error: "La contraseña actual es incorrecta" },
                { status: 400 }
            );
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        // Send confirmation email (fire-and-forget; no bloquea la respuesta)
        sendPasswordChangedEmail(user.email, user.name).catch((emailError) => {
            console.error("Error sending confirmation email:", emailError);
        });

        // Log password change activity (fire-and-forget)
        const { ipAddress, userAgent } = extractRequestInfo(request);
        logUserActivity({
            userId: session.user.id,
            action: ACTIVITY_ACTIONS.PASSWORD_CHANGED,
            entityType: "User",
            entityId: session.user.id,
            ipAddress,
            userAgent,
        }).catch((err) => console.error("[ChangePassword] Failed to log password change activity:", err));

        return NextResponse.json({
            success: true,
            message: "Contraseña actualizada correctamente"
        });

    } catch (error) {
        console.error("Change password error:", error);
        return NextResponse.json(
            { error: "Error al cambiar la contraseña" },
            { status: 500 }
        );
    }
}
