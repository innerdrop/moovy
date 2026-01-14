// API Route: User Profile - Using Direct SQLite
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Direct database access to avoid Prisma adapter issues
async function getDatabase() {
    const Database = (await import("better-sqlite3")).default;
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    return new Database(dbPath);
}

// GET - Get current user profile
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const db = await getDatabase();

        try {
            // Get user
            const user = db.prepare(`
                SELECT id, name, email, phone, image, role 
                FROM User 
                WHERE id = ?
            `).get(session.user.id) as any;

            if (!user) {
                db.close();
                return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
            }

            // Get addresses
            const addresses = db.prepare(`
                SELECT id, label, street, number, apartment, neighborhood, city, province, zipCode, isDefault
                FROM Address 
                WHERE userId = ?
                ORDER BY isDefault DESC, createdAt DESC
            `).all(session.user.id) as any[];

            db.close();

            return NextResponse.json({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                image: user.image,
                addresses: addresses.map(addr => ({
                    ...addr,
                    isDefault: Boolean(addr.isDefault)
                }))
            });
        } catch (err) {
            db.close();
            throw err;
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ error: "Error al obtener perfil" }, { status: 500 });
    }
}

// PATCH - Update current user profile
export async function PATCH(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const data = await request.json();
        const db = await getDatabase();

        try {
            const updates: string[] = [];
            const values: any[] = [];

            if (data.name !== undefined) {
                updates.push("name = ?");
                values.push(data.name);
            }
            if (data.phone !== undefined) {
                updates.push("phone = ?");
                values.push(data.phone);
            }

            if (updates.length > 0) {
                values.push(session.user.id);
                db.prepare(`
                    UPDATE User 
                    SET ${updates.join(", ")}, updatedAt = datetime('now')
                    WHERE id = ?
                `).run(...values);
            }

            // Get updated user
            const user = db.prepare(`
                SELECT id, name, email, phone
                FROM User 
                WHERE id = ?
            `).get(session.user.id) as any;

            db.close();

            return NextResponse.json(user);
        } catch (err) {
            db.close();
            throw err;
        }
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ error: "Error al actualizar perfil" }, { status: 500 });
    }
}

