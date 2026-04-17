import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/active-orders
 * Lightweight endpoint for sidebar live indicator.
 * Returns only the count of active orders.
 */
export async function GET() {
    try {
        const session = await auth();
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ count: 0 });
        }

        const count = await prisma.order.count({
            where: { status: { in: ["CONFIRMED", "PREPARING", "READY", "IN_DELIVERY"] } },
        });

        return NextResponse.json({ count });
    } catch {
        return NextResponse.json({ count: 0 });
    }
}
