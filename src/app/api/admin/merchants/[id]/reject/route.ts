import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendMerchantRejectionEmail } from "@/lib/email";

// PUT/POST - Reject merchant application (admin only)
export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    return PUT(request, context);
}

export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;
        const body = await request.json().catch(() => ({}));
        const reason = body.reason || null;

        const merchant = await prisma.merchant.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, email: true } }
            }
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.merchant.update({
                where: { id },
                data: {
                    approvalStatus: "REJECTED",
                    rejectionReason: reason,
                    isActive: false,
                    isVerified: false,
                }
            });
            // Deactivate COMERCIO role
            await tx.userRole.updateMany({
                where: { userId: merchant.ownerId, role: "COMERCIO" },
                data: { isActive: false }
            });
        });

        // Send rejection email (non-blocking)
        if (merchant.owner.email) {
            sendMerchantRejectionEmail(merchant.owner.email, merchant.name, reason || undefined);
        }

        return NextResponse.json({
            success: true,
            merchant: { ...merchant, approvalStatus: "REJECTED", isActive: false }
        });
    } catch (error) {
        console.error("Error rejecting merchant:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}