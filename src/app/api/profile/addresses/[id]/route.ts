// API Route: Single Address Operations - Using Direct SQLite
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Direct database access
async function getDatabase() {
    const Database = (await import("better-sqlite3")).default;
    const path = await import("path");
    const dbPath = path.join(process.cwd(), "prisma", "dev.db");
    return new Database(dbPath);
}

// GET - Get single address
export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const db = await getDatabase();

        try {
            const address = db.prepare(`
                SELECT * FROM Address WHERE id = ? AND userId = ?
            `).get(id, session.user.id) as any;

            db.close();

            if (!address) {
                return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
            }

            return NextResponse.json({
                ...address,
                isDefault: Boolean(address.isDefault)
            });
        } catch (err) {
            db.close();
            throw err;
        }
    } catch (error) {
        console.error("Error fetching address:", error);
        return NextResponse.json({ error: "Error al obtener dirección" }, { status: 500 });
    }
}

// PATCH - Update address
export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const data = await request.json();
        const db = await getDatabase();

        try {
            // Verify ownership
            const existing = db.prepare(`
                SELECT id FROM Address WHERE id = ? AND userId = ?
            `).get(id, session.user.id);

            if (!existing) {
                db.close();
                return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
            }

            // If setting as default, unset other defaults first
            if (data.isDefault === true) {
                db.prepare(`
                    UPDATE Address SET isDefault = 0 WHERE userId = ? AND id != ?
                `).run(session.user.id, id);
            }

            const updates: string[] = [];
            const values: any[] = [];

            if (data.label !== undefined) { updates.push("label = ?"); values.push(data.label); }
            if (data.street !== undefined) { updates.push("street = ?"); values.push(data.street); }
            if (data.number !== undefined) { updates.push("number = ?"); values.push(data.number); }
            if (data.apartment !== undefined) { updates.push("apartment = ?"); values.push(data.apartment); }
            if (data.neighborhood !== undefined) { updates.push("neighborhood = ?"); values.push(data.neighborhood); }
            if (data.city !== undefined) { updates.push("city = ?"); values.push(data.city); }
            if (data.province !== undefined) { updates.push("province = ?"); values.push(data.province); }
            if (data.isDefault !== undefined) { updates.push("isDefault = ?"); values.push(data.isDefault ? 1 : 0); }

            if (updates.length > 0) {
                updates.push("updatedAt = datetime('now')");
                values.push(id);
                db.prepare(`
                    UPDATE Address SET ${updates.join(", ")} WHERE id = ?
                `).run(...values);
            }

            const address = db.prepare(`SELECT * FROM Address WHERE id = ?`).get(id) as any;
            db.close();

            return NextResponse.json({
                ...address,
                isDefault: Boolean(address.isDefault)
            });
        } catch (err) {
            db.close();
            throw err;
        }
    } catch (error) {
        console.error("Error updating address:", error);
        return NextResponse.json({ error: "Error al actualizar dirección" }, { status: 500 });
    }
}

// DELETE - Delete address
export async function DELETE(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const { id } = await context.params;
        const db = await getDatabase();

        try {
            // Verify ownership
            const existing = db.prepare(`
                SELECT id FROM Address WHERE id = ? AND userId = ?
            `).get(id, session.user.id);

            if (!existing) {
                db.close();
                return NextResponse.json({ error: "Dirección no encontrada" }, { status: 404 });
            }

            db.prepare(`DELETE FROM Address WHERE id = ?`).run(id);
            db.close();

            return NextResponse.json({ success: true, message: "Dirección eliminada" });
        } catch (err) {
            db.close();
            throw err;
        }
    } catch (error) {
        console.error("Error deleting address:", error);
        return NextResponse.json({ error: "Error al eliminar dirección" }, { status: 500 });
    }
}
