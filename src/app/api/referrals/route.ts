// API Route: Get user's referral statistics
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Get user's referral code
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { referralCode: true }
        });

        // Count referrals made by this user
        const referralCount = await prisma.referral.count({
            where: { referrerId: session.user.id, status: 'COMPLETED' }
        });

        // Sum of points earned from referrals
        const pointsAgg = await prisma.referral.aggregate({
            where: { referrerId: session.user.id, status: 'COMPLETED' },
            _sum: { referrerPoints: true }
        });
        const pointsFromReferrals = pointsAgg._sum.referrerPoints || 0;

        // Get recent referrals with names
        const recentReferralsRaw = await prisma.referral.findMany({
            where: { referrerId: session.user.id },
            include: {
                referee: {
                    select: { name: true, firstName: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        const recentReferrals = recentReferralsRaw.map(r => ({
            id: r.id,
            createdAt: r.createdAt.toISOString(),
            referrerPoints: r.referrerPoints,
            refereeName: r.referee.firstName || r.referee.name || "Usuario"
        }));

        return NextResponse.json({
            referralCode: user?.referralCode || null,
            friendsInvited: referralCount,
            pointsFromReferrals,
            recentReferrals,
        });

    } catch (error) {
        console.error("Error fetching referral stats:", error);
        return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 });
    }
}
