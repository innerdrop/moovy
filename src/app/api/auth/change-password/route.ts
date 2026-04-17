// API Route: Change Password (for authenticated users)
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { validatePasswordStrength } from "@/lib/security";
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

        // Send confirmation email
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || "smtp.gmail.com",
                port: parseInt(process.env.SMTP_PORT || "587"),
                secure: false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            });

            const changeDate = new Date().toLocaleString("es-AR", {
                timeZone: "America/Argentina/Ushuaia",
                dateStyle: "full",
                timeStyle: "short"
            });

            await transporter.sendMail({
                from: `"MOOVY" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`,
                to: user.email,
                subject: "Tu contraseña fue modificada - MOOVY",
                html: `
                    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <img src="https://somosmoovy.com/logo-moovy.png" alt="MOOVY" style="height: 50px; width: auto;" />
                        </div>
                        <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px;">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <div style="display: inline-block; background-color: #dcfce7; border-radius: 50%; padding: 15px;">
                                    <span style="font-size: 24px;">🔐</span>
                                </div>
                            </div>
                            <h2 style="color: #111827; margin-top: 0; text-align: center;">Contraseña actualizada</h2>
                            <p style="color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                                Hola ${user.name || ""},<br/>
                                Tu contraseña de MOOVY fue modificada exitosamente.
                            </p>
                            <div style="background-color: #fff; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e5e7eb;">
                                <p style="margin: 0; color: #6b7280; font-size: 14px;">
                                    <strong>Fecha del cambio:</strong><br/>
                                    ${changeDate}
                                </p>
                            </div>
                            <div style="background-color: #fef3c7; border-radius: 8px; padding: 16px; border-left: 4px solid #f59e0b;">
                                <p style="margin: 0; color: #92400e; font-size: 14px;">
                                    <strong>⚠️ ¿No fuiste vos?</strong><br/>
                                    Si no realizaste este cambio, tu cuenta puede estar comprometida. 
                                    Contactanos inmediatamente a <a href="mailto:soporte@somosmoovy.com" style="color: #e60012;">soporte@somosmoovy.com</a>
                                </p>
                            </div>
                        </div>
                        <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                            <p>Este es un mensaje automático de seguridad.</p>
                            <p>© ${new Date().getFullYear()} MOOVY™. Ushuaia, Tierra del Fuego.</p>
                        </div>
                    </div>
                `,
            });
        } catch (emailError) {
            // Log but don't fail the request if email fails
            console.error("Error sending confirmation email:", emailError);
        }

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
