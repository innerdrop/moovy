import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/email";
import { applyRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
    // Rate limit: max 5 password resets per 15 minutes per IP
    const limited = applyRateLimit(request, "auth:forgot-password", 5, 15 * 60_000);
    if (limited) return limited;

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
        await sendPasswordResetEmail(email, resetLink);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Password recovery error:", error);
        return NextResponse.json(
            { error: "Error al procesar la solicitud" },
            { status: 500 }
        );
    }
}
