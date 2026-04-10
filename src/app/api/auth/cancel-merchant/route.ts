import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/cancel-merchant
 * Cancel a pending merchant request. Only works if approvalStatus is PENDING.
 * Deletes the Merchant record and the COMERCIO UserRole.
 */
export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(request, "auth:cancel-merchant", 5, 15 * 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: userId },
        });

        if (!merchant) {
            return NextResponse.json(
                { error: "No tenés solicitud de comercio" },
                { status: 404 }
            );
        }

        if (merchant.approvalStatus !== "PENDING") {
            return NextResponse.json(
                { error: "Solo se pueden cancelar solicitudes pendientes" },
                { status: 400 }
            );
        }

        // Delete merchant record and UserRole in a transaction
        await prisma.$transaction(async (tx) => {
            await tx.merchant.delete({ where: { id: merchant.id } });
            await tx.userRole.deleteMany({
                where: { userId, role: "COMERCIO" },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CancelMerchant] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}