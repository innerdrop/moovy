// API Route: User Registration with Referral System
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

// Generate a user-friendly referral code
function generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'MOOV-';
    for (let i = 0; i < 6; i++) {
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

        // Base signup bonus (5000 points = $500)
        const signupBonus = 5000;
        // Referral bonus
        const referralBonus = 2500; // Points given to referrer ($250)

        // Use a transaction to ensure everything is created or nothing is
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create the new user
            const newUser = await tx.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: fullName,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    role: 'USER',
                    pointsBalance: signupBonus, // Start with bonus
                    referralCode: newUserReferralCode,
                    referredById: referrerId
                }
            });

            // 2. Award signup bonus transaction record
            await tx.pointsTransaction.create({
                data: {
                    userId: newUser.id,
                    type: 'BONUS',
                    amount: signupBonus,
                    balanceAfter: signupBonus,
                    description: '¡Bienvenido a MOOVER! Bono de registro'
                }
            });

            // 3. If referred, handle referrer rewards
            if (referrerId && referrerInfo) {
                const newReferrerBalance = referrerInfo.pointsBalance + referralBonus;

                // Update referrer balance
                await tx.user.update({
                    where: { id: referrerId },
                    data: { pointsBalance: newReferrerBalance }
                });

                // Create transaction for referrer
                await tx.pointsTransaction.create({
                    data: {
                        userId: referrerId,
                        type: 'REFERRAL',
                        amount: referralBonus,
                        balanceAfter: newReferrerBalance,
                        description: `¡${data.firstName} se registró con tu código!`
                    }
                });

                // Create Referral record linkage
                await tx.referral.create({
                    data: {
                        referrerId: referrerId,
                        refereeId: newUser.id,
                        codeUsed: data.referralCode.trim().toUpperCase(),
                        referrerPoints: referralBonus,
                        refereePoints: signupBonus,
                        status: 'COMPLETED'
                    }
                });
            }

            // 4. Create default address if provided (Not in form currently, but logic kept optional)
            // Skipping to simplify as the new form doesn't send address in this step usually.

            return newUser;
        });

        console.log("[Register] New user created successfully:", data.email);

        return NextResponse.json({
            success: true,
            message: referrerId
                ? "¡Registro exitoso! Vos y tu amigo ganaron puntos 🎉"
                : "Usuario registrado exitosamente",
            referralCode: newUserReferralCode,
        });

    } catch (error: any) {
        console.error("[Register] Error:", error?.message || error);
        return NextResponse.json(
            { error: `Error al registrar usuario: ${error?.message || "Error desconocido"}` },
            { status: 500 }
        );
    }
}
