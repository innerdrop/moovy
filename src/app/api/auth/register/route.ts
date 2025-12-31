// API Route: User Registration
import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

// Force Node.js runtime (not Edge) for better-sqlite3 compatibility
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

export async function POST(request: NextRequest) {
    let db: Database.Database | null = null;

    try {
        const data = await request.json();
        console.log("[Register] Received data:", { name: data.name, email: data.email, phone: data.phone });

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
        const existingUser = db.prepare("SELECT id FROM User WHERE email = ?").get(data.email);
        if (existingUser) {
            db.close();
            return NextResponse.json(
                { error: "Ya existe una cuenta con ese email" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // Create user
        const userId = crypto.randomUUID();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO User (id, email, password, name, phone, role, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, 'USER', ?, ?)
        `).run(userId, data.email, hashedPassword, data.name, data.phone, now, now);

        console.log("[Register] User created:", userId);

        // Create address if provided
        if (data.address && data.address.trim()) {
            const addressId = crypto.randomUUID();
            db.prepare(`
                INSERT INTO Address (id, userId, label, street, "number", city, province, isDefault, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
            `).run(addressId, userId, "Casa", data.address, "S/N", "San Juan", "San Juan", now, now);
            console.log("[Register] Address created:", addressId);
        }

        db.close();

        console.log("[Register] New user created successfully:", data.email);

        return NextResponse.json({
            success: true,
            message: "Usuario registrado exitosamente",
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
