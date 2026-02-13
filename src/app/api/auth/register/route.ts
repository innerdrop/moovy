// API Route: User Registration with Referral System
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";

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
