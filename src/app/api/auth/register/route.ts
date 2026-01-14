// API Route: User Registration with Referral System
import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

// Force Node.js runtime (not Edge) for better-sqlite3 compatibility
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

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
    let db: Database.Database | null = null;

    try {
        const data = await request.json();
        console.log("[Register] Received data:", {
            name: data.name,
            email: data.email,
            phone: data.phone,
            referralCode: data.referralCode || "none"
        });

        // Validate required fields
        if (!data.name || !data.email || !data.password || !data.phone) {
            return NextResponse.json(
                { error: "Nombre, email, teléfono y contraseña son requeridos" },
                { status: 400 }
            );
        }

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

        // Open database
        db = new Database(dbPath);
        console.log("[Register] Database opened:", dbPath);

        // Check if email already exists
        const existingUser = db.prepare("SELECT id FROM User WHERE email = ?").get(data.email) as { id: string } | undefined;
        if (existingUser) {
            db.close();
            return NextResponse.json(
                { error: "Ya existe una cuenta con ese email" },
                { status: 409 }
            );
        }

        // Check if referral code is valid and find referrer
        let referrerId: string | null = null;
        let referrerInfo: { id: string; name: string; pointsBalance: number } | null = null;

        if (data.referralCode && data.referralCode.trim()) {
            const referralCodeClean = data.referralCode.trim().toUpperCase();
            referrerInfo = db.prepare(
                "SELECT id, name, pointsBalance FROM User WHERE referralCode = ?"
            ).get(referralCodeClean) as { id: string; name: string; pointsBalance: number } | undefined || null;

            if (referrerInfo) {
                referrerId = referrerInfo.id;
                console.log("[Register] Valid referral code from:", referrerInfo.name);
            } else {
                console.log("[Register] Invalid referral code:", referralCodeClean);
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user with referral info
        const userId = crypto.randomUUID();
        const newUserReferralCode = generateReferralCode();
        const now = new Date().toISOString();

        // Base signup bonus (5000 points = $500)
        const signupBonus = 5000;
        // Extra bonus if referred (already included in base, but tracked)
        const referralBonus = 2500; // Points given to referrer ($250)

        db.prepare(`
            INSERT INTO User (id, email, password, name, phone, role, pointsBalance, referralCode, referredById, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 'USER', ?, ?, ?, ?, ?)
        `).run(userId, data.email, hashedPassword, data.name, data.phone, signupBonus, newUserReferralCode, referrerId, now, now);

        console.log("[Register] User created:", userId, "with code:", newUserReferralCode);

        // Award signup bonus points transaction
        const transactionId1 = crypto.randomUUID();
        db.prepare(`
            INSERT INTO PointsTransaction (id, userId, type, amount, balanceAfter, description, createdAt)
            VALUES (?, ?, 'BONUS', ?, ?, '¡Bienvenido a MOOVER! Bono de registro', ?)
        `).run(transactionId1, userId, signupBonus, signupBonus, now);

        console.log("[Register] Signup bonus awarded:", signupBonus, "points");

        // If user was referred, award points to referrer and create Referral record
        if (referrerId && referrerInfo) {
            // Update referrer's points balance
            const newReferrerBalance = referrerInfo.pointsBalance + referralBonus;
            db.prepare(
                "UPDATE User SET pointsBalance = ?, updatedAt = ? WHERE id = ?"
            ).run(newReferrerBalance, now, referrerId);

            // Create points transaction for referrer
            const transactionId2 = crypto.randomUUID();
            db.prepare(`
                INSERT INTO PointsTransaction (id, userId, type, amount, balanceAfter, description, createdAt)
                VALUES (?, ?, 'REFERRAL', ?, ?, ?, ?)
            `).run(transactionId2, referrerId, referralBonus, newReferrerBalance, `¡${data.name} se registró con tu código!`, now);

            // Create Referral record
            const referralId = crypto.randomUUID();
            db.prepare(`
                INSERT INTO Referral (id, referrerId, refereeId, codeUsed, referrerPoints, refereePoints, status, createdAt)
                VALUES (?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
            `).run(referralId, referrerId, userId, data.referralCode.trim().toUpperCase(), referralBonus, signupBonus, now);

            console.log("[Register] Referral bonus awarded:", referralBonus, "points to", referrerInfo.name);
        }

        // Create address if provided
        if (data.address && data.address.trim()) {
            const addressId = crypto.randomUUID();
            db.prepare(`
                INSERT INTO Address (id, userId, label, street, "number", city, province, isDefault, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).run(addressId, userId, "Casa", data.address, "S/N", "Ushuaia", "Tierra del Fuego", now, now);
            console.log("[Register] Address created:", addressId);
        }

        db.close();

        console.log("[Register] New user created successfully:", data.email);

        return NextResponse.json({
            success: true,
            message: referrerId
                ? "¡Registro exitoso! Vos y tu amigo ganaron puntos 🎉"
                : "Usuario registrado exitosamente",
            referralCode: newUserReferralCode, // Return user's new referral code
        });
    } catch (error: any) {
        console.error("[Register] Error:", error?.message || error);

        if (db) {
            try { db.close(); } catch (e) { /* ignore */ }
        }

        return NextResponse.json(
            { error: `Error al registrar usuario: ${error?.message || "Error desconocido"}` },
            { status: 500 }
        );
    }
}
