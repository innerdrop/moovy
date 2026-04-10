import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendMerchantRejectionEmail } from "@/lib/email";
import { rejectMerchantTransition } from "@/lib/roles";

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
        const reason: string = typeof body.reason === "string" && body.reason.trim().length > 0
            ? body.reason.trim()
            : "Sin motivo especificado";

        const merchant = await prisma.merchant.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                ownerId: true,
                owner: { select: { id: true, name: true, email: true } },
            },
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        // Transición centralizada con audit log. No tocamos UserRole.
        await rejectMerchantTransition(id, reason, {
            adminId: session.user.id,
            adminEmail: session.user.email ?? "unknown",
        });

        // Send rejection email (non-blocking)
        if (merchant.owner?.email) {
            sendMerchantRejectionEmail(merchant.owner.email, merchant.name, reason);
        }

        return NextResponse.json({
            success: true,
            merchant: { id: merchant.id, name: merchant.name, approvalStatus: "REJECTED" },
        });
    } catch (error) {
        console.error("Error rejecting merchant:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}