import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { error: "Email es requerido" },
                { status: 400 }
            );
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        // Always return success to prevent email enumeration
        if (!user) {
            return NextResponse.json({ success: true });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");
        const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

        // Save token to user
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });

        // Create reset link
        const baseUrl = process.env.NEXTAUTH_URL || "https://somosmoovy.com";
        const resetLink = `${baseUrl}/restablecer-contrasena?token=${resetToken}`;

        // Send email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || "smtp.gmail.com",
            port: parseInt(process.env.SMTP_PORT || "587"),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        await transporter.sendMail({
            from: `"MOOVY" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`,
            to: email,
            subject: "Restablecer contraseña - MOOVY",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #e60012; font-size: 32px; margin: 0;">MOOVY</h1>
                    </div>
                    <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px;">
                        <h2 style="color: #111827; margin-top: 0;">Restablecer contraseña</h2>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                            Recibimos una solicitud para restablecer tu contraseña. 
                            Hacé click en el botón de abajo para crear una nueva contraseña.
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" 
                               style="display: inline-block; background: linear-gradient(to right, #e60012, #ff4444); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                Restablecer Contraseña
                            </a>
                        </div>
                        <p style="color: #9ca3af; font-size: 14px;">
                            Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, 
                            podés ignorar este correo.
                        </p>
                    </div>
                    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} MOOVY™. Ushuaia, Tierra del Fuego.</p>
                    </div>
                </div>
            `,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Password recovery error:", error);
        return NextResponse.json(
            { error: "Error al procesar la solicitud" },
            { status: 500 }
        );
    }
}
