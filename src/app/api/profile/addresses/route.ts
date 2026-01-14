// API Route: User Addresses - Using Direct SQLite
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

// Direct database access
async function getDatabase() {
    const Database = (await import("better-sqlite3")).default;
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    return new Database(dbPath);
}

// GET - Get all user addresses
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const db = await getDatabase();

        try {
            const addresses = db.prepare(`
                SELECT id, label, street, number, apartment, neighborhood, city, province, zipCode, isDefault
                FROM Address 
                WHERE userId = ?
                ORDER BY isDefault DESC, createdAt DESC
            `).all(session.user.id) as any[];

            db.close();

            return NextResponse.json(addresses.map(addr => ({
                ...addr,
                isDefault: Boolean(addr.isDefault)
            })));
        } catch (err) {
            db.close();
            throw err;
        }
    } catch (error) {
        console.error("Error fetching addresses:", error);
        return NextResponse.json({ error: "Error al obtener direcciones" }, { status: 500 });
    }
}

// POST - Create new address
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const db = await getDatabase();

        try {
            // If this is set as default, unset other defaults first
            if (data.isDefault) {
                db.prepare(`
                    UPDATE Address SET isDefault = 0 WHERE userId = ?
                `).run(session.user.id);
            }

            const id = uuidv4();
            const now = new Date().toISOString();

            db.prepare(`
                INSERT INTO Address (id, userId, label, street, number, apartment, neighborhood, city, province, zipCode, isDefault, createdAt, updatedAt)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
                id,
                session.user.id,
                data.label || "Casa",
                data.street,
                data.number,
                data.apartment || null,
                data.neighborhood || null,
                data.city || "Ushuaia",
                data.province || "Tierra del Fuego",
                data.zipCode || null,
                data.isDefault ? 1 : 0,
                now,
                now
            );

            const address = db.prepare(`SELECT * FROM Address WHERE id = ?`).get(id) as any;
            db.close();

            return NextResponse.json({
                ...address,
                isDefault: Boolean(address.isDefault)
            }, { status: 201 });
        } catch (err) {
            db.close();
            throw err;
        }
    } catch (error) {
        console.error("Error creating address:", error);
        return NextResponse.json({ error: "Error al crear dirección" }, { status: 500 });
    }
}

