// API Route for MOOVER friends list
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Get list of friends invited by the user with monthly stats
export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Get first day of current month
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Get all referrals made by this user
        const referrals = await prisma.referral.findMany({
            where: { referrerId: session.user.id },
            orderBy: { createdAt: "desc" }
        });

        // Get referee user info for each referral
        const refereeIds = referrals.map(r => r.refereeId);
        const refereeUsers = await prisma.user.findMany({
            where: { id: { in: refereeIds } },
            select: { id: true, name: true }
        });

        // Create a map for quick lookup
        const userMap = new Map(refereeUsers.map(u => [u.id, u]));

        // Format the response
        const friends = referrals.map(r => {
            const user = userMap.get(r.refereeId);
            return {
                id: r.refereeId,
                name: user?.name || "Usuario",
                pointsEarned: r.referrerPoints,
                joinedAt: r.createdAt
            };
        });

        // Calculate monthly stats
        const monthlyReferrals = referrals.filter(r => r.createdAt >= firstDayOfMonth);
        const monthlyFriendsCount = monthlyReferrals.length;
        const monthlyPointsEarned = monthlyReferrals.reduce((sum, r) => sum + r.referrerPoints, 0);

        // Total stats
        const totalFriendsCount = referrals.length;
        const totalPointsEarned = referrals.reduce((sum, r) => sum + r.referrerPoints, 0);

        return NextResponse.json({
            friends,
            stats: {
                monthly: {
                    friendsCount: monthlyFriendsCount,
                    pointsEarned: monthlyPointsEarned,
                    monthName: now.toLocaleDateString("es-AR", { month: "long" })
                },
                total: {
                    friendsCount: totalFriendsCount,
                    pointsEarned: totalPointsEarned
                }
            }
        });
    } catch (error) {
        console.error("Error fetching friends:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
