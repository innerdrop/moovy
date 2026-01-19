import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Get user's redemptions (point transactions with negative amounts for redemptions)
        const redemptions = await prisma.pointTransaction.findMany({
            where: {
                userId: session.user.id,
                type: "REDEMPTION",
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 20,
        });

        // Transform data for frontend
        const transformedRedemptions = redemptions.map((r) => ({
            id: r.id,
            pointsUsed: Math.abs(r.amount),
            rewardName: r.description,
            createdAt: r.createdAt,
            code: r.referenceId || null,
        }));

        return NextResponse.json({ redemptions: transformedRedemptions });
    } catch (error) {
        console.error("Error fetching redemptions:", error);
        return NextResponse.json({ error: "Error al obtener canjes" }, { status: 500 });
    }
}
