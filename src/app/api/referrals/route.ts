// API Route: Get user's referral statistics
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import Database from "better-sqlite3";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const dbPath = path.join(process.cwd(), "prisma", "dev.db");

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const db = new Database(dbPath);

        // Get user's referral code
        const user = db.prepare(
            "SELECT referralCode FROM User WHERE id = ?"
        ).get(session.user.id) as { referralCode: string } | undefined;

        // Count referrals made by this user
        const referralCount = db.prepare(
            "SELECT COUNT(*) as count FROM Referral WHERE referrerId = ?"
        ).get(session.user.id) as { count: number };

        // Sum of points earned from referrals
        const referralPoints = db.prepare(
            "SELECT COALESCE(SUM(referrerPoints), 0) as total FROM Referral WHERE referrerId = ?"
        ).get(session.user.id) as { total: number };

        // Get recent referrals with names
        const recentReferrals = db.prepare(`
            SELECT 
                r.id,
                r.createdAt,
                r.referrerPoints,
                u.name as refereeName
            FROM Referral r
            JOIN User u ON r.refereeId = u.id
            WHERE r.referrerId = ?
            ORDER BY r.createdAt DESC
            LIMIT 10
        `).all(session.user.id) as Array<{
            id: string;
            createdAt: string;
            referrerPoints: number;
            refereeName: string;
        }>;

        db.close();

        return NextResponse.json({
            referralCode: user?.referralCode || null,
            friendsInvited: referralCount.count,
            pointsFromReferrals: referralPoints.total,
            recentReferrals,
        });
    } catch (error) {
        console.error("Error fetching referral stats:", error);
        return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
    }
}
