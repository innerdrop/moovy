import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendDriverRejectedEmail } from "@/lib/email-p0";
import { rejectDriverTransition } from "@/lib/roles";
import { emitRoleUpdate } from "@/lib/role-change-notify";

// PUT/POST - Reject driver application (admin only).
// POST es wrapper sobre PUT para matchear la convención que usa el frontend
// (usuarios/[id]/page.tsx llama con method: "POST"). Mismo patrón que
// /api/admin/merchants/[id]/reject.
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

        const driver = await prisma.driver.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        // Transición centralizada con audit log. No tocamos UserRole.
        await rejectDriverTransition(id, reason, {
            adminId: admin.userId,
            adminEmail: admin.email ?? "unknown",
            notified: notify,
        });

        // Send rejection email (non-blocking). Versión oficial del registry.
        // Solo si el admin dejó tildado "Notificar al usuario por email" (default).
        if (notify && driver.user?.email) {
            sendDriverRejectedEmail({
                email: driver.user.email,
                driverName: driver.user.name || "Repartidor",
                reason,
            });
        }

        // Refresh JWT para revocar el rol DRIVER sin requerir logout/login.
        emitRoleUpdate({
            userId: driver.userId,
            role: "DRIVER",
            action: "REJECTED",
            message: `Tu solicitud de repartidor fue rechazada: ${reason}`,
        });

        return NextResponse.json({
            success: true,
            driver: { id: driver.id, userId: driver.userId, approvalStatus: "REJECTED" },
        });
    } catch (error) {
        console.error("Error rejecting driver:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
