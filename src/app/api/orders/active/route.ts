// API Route: Get active orders for current user
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Active order statuses (not completed or cancelled)
const ACTIVE_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "ON_THE_WAY"];

export async function GET() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json({ order: null });
        }

        // Find most recent active order
        const activeOrder = await prisma.order.findFirst({
            where: {
                userId: session.user.id,
                status: { in: ACTIVE_STATUSES }
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                total: true,
                createdAt: true
            }
        });

        return NextResponse.json({ order: activeOrder });
    } catch (error) {
        console.error("Error fetching active orders:", error);
        return NextResponse.json({ order: null });
    }
}
