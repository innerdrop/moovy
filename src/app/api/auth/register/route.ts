// API Route: User Registration with Referral System
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

// Send welcome email function
async function sendWelcomeEmail(email: string, firstName: string, referralCode: string) {
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

        const baseUrl = process.env.NEXTAUTH_URL || "https://somosmoovy.com";

        await transporter.sendMail({
            from: `"MOOVY" <${process.env.SMTP_USER || "somosmoovy@gmail.com"}>`,
            to: email,
            subject: "¡Bienvenido a MOOVY! 🎉",
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <img src="https://somosmoovy.com/logo-moovy.png" alt="MOOVY" style="height: 50px; width: auto;" />
                    </div>
                    <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px;">
                        <h2 style="color: #111827; margin-top: 0;">¡Hola ${firstName}! 👋</h2>
                        <p style="color: #6b7280; font-size: 16px; line-height: 1.6;">
                            ¡Bienvenido a la comunidad MOOVY! Ya podés empezar a disfrutar de todos los beneficios.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%); border-radius: 10px; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                            <h3 style="color: #b45309; margin: 0 0 10px 0; font-size: 16px;">⭐ Tu código de referido</h3>
                            <p style="color: #78350f; font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 2px;">${referralCode}</p>
                            <p style="color: #92400e; font-size: 12px; margin: 8px 0 0 0;">Compartílo y gana puntos MOOVER cuando tus amigos compren</p>
                        </div>

                        <h3 style="color: #111827; font-size: 16px; margin-top: 25px;">¿Qué podés hacer con MOOVY?</h3>
                        <ul style="color: #6b7280; font-size: 14px; line-height: 1.8; padding-left: 20px;">
                            <li>🛍️ <strong>Comprar</strong> en cientos de comercios locales</li>
                            <li>🚀 <strong>Recibir</strong> tus pedidos en minutos</li>
                            <li>⭐ <strong>Sumar puntos MOOVER</strong> con cada compra</li>
                            <li>🎁 <strong>Canjear</strong> tus puntos por descuentos exclusivos</li>
                            <li>👥 <strong>Referir amigos</strong> y ganar más puntos</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${baseUrl}/tienda" 
                               style="display: inline-block; background: linear-gradient(to right, #e60012, #ff4444); color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
                                Empezar a comprar
                            </a>
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 30px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} MOOVY™. Ushuaia, Tierra del Fuego.</p>
                    </div>
                </div>
            `,
        });
        console.log("[Register] Welcome email sent to:", email);
    } catch (error) {
        console.error("[Register] Error sending welcome email:", error);
        // Don't throw - email failure shouldn't break registration
    }
}

export const dynamic = "force-dynamic";

// Generate a user-friendly referral code (MOV-XXXX format)
function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MOV-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

export async function POST(request: NextRequest) {
    try {
        const data = await request.json();
        console.log("[Register] Received data:", {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            referralCode: data.referralCode || "none"
        });

        // Validate required fields
        if (!data.firstName || !data.lastName || !data.email || !data.password || !data.phone) {
            return NextResponse.json(
                { error: "Todos los campos obligatorios deben ser completados." },
                { status: 400 }
            );
        }

        const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`;

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            return NextResponse.json(
                { error: "Email inválido" },
                { status: 400 }
            );
        }

        // Validate password length
        if (data.password.length < 6) {
            return NextResponse.json(
                { error: "La contraseña debe tener al menos 6 caracteres" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
            select: { id: true }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "Ya existe una cuenta con ese email" },
                { status: 409 }
            );
        }

        // Check if referral code is valid and find referrer
        let referrerId: string | null = null;
        let referrerInfo: { id: string; name: string | null; pointsBalance: number } | null = null;

        if (data.referralCode && data.referralCode.trim()) {
            const referralCodeClean = data.referralCode.trim().toUpperCase();
            referrerInfo = await prisma.user.findUnique({
                where: { referralCode: referralCodeClean },
                select: { id: true, name: true, pointsBalance: true }
            });

            if (referrerInfo) {
                referrerId = referrerInfo.id;
                console.log("[Register] Valid referral code from:", referrerInfo.name);
            } else {
                console.log("[Register] Invalid referral code:", referralCodeClean);
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const newUserReferralCode = generateReferralCode();

        // Pending signup bonus (activates after first qualifying purchase)
        const pendingBonus = 250;

        // Use a transaction to ensure everything is created or nothing is
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the new user with PENDING bonus (not credited yet)
            const newUser = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: fullName,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: 'USER',
                    pointsBalance: 0,  // Start with 0, bonus is pending
                    pendingBonusPoints: pendingBonus,  // Pending until first purchase
                    bonusActivated: false,  // Not yet activated
                    referralCode: newUserReferralCode,
                    referredById: referrerId
                }
            });

            // 2. If referred, create Referral record (but NO points yet)
            // Points will be awarded when new user makes their first qualifying purchase
            if (referrerId && referrerInfo) {
                await tx.referral.create({
                    data: {
                        referrerId: referrerId,
                        refereeId: newUser.id,
                        codeUsed: data.referralCode.trim().toUpperCase(),
                        referrerPoints: 500,  // Will be awarded when user makes purchase
                        refereePoints: 250,   // Will be awarded when user makes purchase
                        status: 'PENDING'     // Changed to PENDING until activated
                    }
                });
            }

            return newUser;
        });

        console.log("[Register] New user created successfully:", data.email);

        // Send welcome email (non-blocking)
        sendWelcomeEmail(data.email, data.firstName, newUserReferralCode);

        return NextResponse.json({
            success: true,
            message: referrerId
                ? "¡Registro exitoso! Tus puntos se activarán con tu primera compra 🎉"
                : "¡Bienvenido! Tus puntos de bienvenida se activarán con tu primera compra",
            referralCode: newUserReferralCode,
            pendingPoints: pendingBonus
        });

    } catch (error: any) {
        console.error("[Register] Error:", error?.message || error);
        return NextResponse.json(
            { error: `Error al registrar usuario: ${error?.message || "Error desconocido"}` },
            { status: 500 }
        );
    }
}
