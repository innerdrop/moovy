import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendMerchantRejectedEmail } from "@/lib/email-p0";
import { rejectMerchantTransition } from "@/lib/roles";
import { emitRoleUpdate } from "@/lib/role-change-notify";

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
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await context.params;
        const body = await request.json().catch(() => ({}));
        const reason: string = typeof body.reason === "string" && body.reason.trim().length > 0
            ? body.reason.trim()
            : "Sin motivo especificado";
        // feat/ops-notificacion-opcional-aprobacion: notificar por email es opcional
        // (checkbox en OPS). default = notificar. El audit log siempre registra.
        const notify = body?.notify !== false;

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
            adminId: admin.userId,
            adminEmail: admin.email ?? "unknown",
            notified: notify,
        });

        // Send rejection email (non-blocking). Versión oficial del registry.
        // Solo si el admin dejó tildado "Notificar al usuario por email" (default).
        if (notify && merchant.owner?.email) {
            sendMerchantRejectedEmail({
                email: merchant.owner.email,
                businessName: merchant.name,
                contactName: merchant.owner.name || "",
                reason,
            });
        }

        // Refresh JWT del merchant para revocar el rol COMERCIO sin requerir
        // logout/login. El listener cliente además muestra un toast con el motivo.
        emitRoleUpdate({
            userId: merchant.ownerId,
            role: "MERCHANT",
            action: "REJECTED",
            message: `Tu solicitud de comercio fue rechazada: ${reason}`,
        });

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