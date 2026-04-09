import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendMerchantApprovalEmail } from "@/lib/email";

// PUT/POST - Approve merchant application (admin only)
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

        const merchant = await prisma.merchant.findUnique({
            where: { id },
            include: {
                owner: { select: { id: true, name: true, email: true } }
            }
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        if (merchant.approvalStatus === "APPROVED") {
            return NextResponse.json({ error: "El comercio ya está aprobado" }, { status: 409 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.merchant.update({
                where: { id },
                data: {
                    approvalStatus: "APPROVED",
                    approvedAt: new Date(),
                    rejectionReason: null,
                    isActive: true,
                    isVerified: true,
                }
            });
            // Ensure COMERCIO role is active
            await tx.userRole.updateMany({
                where: { userId: merchant.ownerId, role: "COMERCIO" },
                data: { isActive: true }
            });
        });

        // Send approval email (non-blocking)
        if (merchant.owner.email) {
            sendMerchantApprovalEmail(merchant.owner.email, merchant.name);
        }

        return NextResponse.json({
            success: true,
            merchant: { ...merchant, approvalStatus: "APPROVED", isActive: true, isVerified: true }
        });
    } catch (error) {
        console.error("Error approving merchant:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}