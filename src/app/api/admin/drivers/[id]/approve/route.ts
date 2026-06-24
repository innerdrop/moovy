import { NextResponse } from "next/server";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sendDriverApprovalEmail } from "@/lib/email";
import { approveDriverTransition } from "@/lib/roles";
import { emitRoleUpdate } from "@/lib/role-change-notify";

// PUT/POST - Approve driver application (admin only).
// POST es wrapper sobre PUT para matchear la convención que usa el frontend
// (usuarios/[id]/page.tsx llama con method: "POST"). Mismo patrón que
// /api/admin/merchants/[id]/approve.
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

        // feat/ops-notificacion-opcional-aprobacion: el admin puede aprobar sin
        // mandar email (checkbox en OPS). default = notificar (notify !== false),
        // retrocompatible con callers que no mandan body.
        const body = await request.json().catch(() => ({}));
        const notify = body?.notify !== false;

        const driver = await prisma.driver.findUnique({
            where: { id },
            select: {
                id: true,
                userId: true,
                approvalStatus: true,
                isActive: true,
                user: { select: { id: true, name: true, email: true } },
            },
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        if (driver.approvalStatus === "APPROVED" && driver.isActive) {
            return NextResponse.json({ error: "El repartidor ya está aprobado" }, { status: 409 });
        }

        // Transición centralizada: escribe approvalStatus, flags legacy y audit log.
        // No tocamos UserRole: el rol DRIVER se deriva de Driver.approvalStatus
        // en cada request. Ver src/lib/roles.ts.
        // fix/aprobacion-sin-foto-driver (2026-04-28): ya no chequeamos PHOTO_MISSING.
        // La foto del driver es requisito de visibilidad/UX (defense in depth en
        // tracking con fallback a avatar default), NO de capacidad operativa.
        await approveDriverTransition(id, {
            adminId: admin.userId,
            adminEmail: admin.email ?? "unknown",
            notified: notify,
        });

        // Send approval email (non-blocking). Solo si el admin dejó tildado
        // "Notificar al usuario por email" (default). El cambio de rol toma efecto
        // igual via emitRoleUpdate más abajo.
        if (notify && driver.user?.email) {
            sendDriverApprovalEmail(driver.user.email, driver.user.name || "Repartidor");
        }

        // Refresh JWT del driver para que pueda entrar al panel sin logout/login.
        emitRoleUpdate({
            userId: driver.userId,
            role: "DRIVER",
            action: "APPROVED",
            message: "¡Tu cuenta de repartidor fue aprobada! Ya podés conectarte y recibir pedidos.",
            portalUrl: "/repartidor/dashboard",
        });

        return NextResponse.json({
            success: true,
            driver: { id: driver.id, userId: driver.userId, approvalStatus: "APPROVED" },
        });
    } catch (error) {
        console.error("Error approving driver:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}