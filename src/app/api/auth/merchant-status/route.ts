import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/auth/merchant-status
 * Check if the authenticated user has a merchant and its approval status.
 * No role check — any authenticated user can check their own merchant status.
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: {
                id: true,
                name: true,
                approvalStatus: true,
                isActive: true,
            },
        });

        if (!merchant) {
            return NextResponse.json({ exists: false });
        }

        return NextResponse.json({
            exists: true,
            approvalStatus: merchant.approvalStatus,
            isActive: merchant.isActive,
            name: merchant.name,
        });
    } catch (error) {
        console.error("[MerchantStatus] Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}