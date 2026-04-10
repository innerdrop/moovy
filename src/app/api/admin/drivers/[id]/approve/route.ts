import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendDriverApprovalEmail } from "@/lib/email";
import { approveDriverTransition } from "@/lib/roles";

// PUT - Approve driver application (admin only)
export async function PUT(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        // Check admin role
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;

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
        await approveDriverTransition(id, {
            adminId: session.user.id,
            adminEmail: session.user.email ?? "unknown",
        });

        // Send approval email (non-blocking)
        if (driver.user?.email) {
            sendDriverApprovalEmail(driver.user.email, driver.user.name || "Repartidor");
        }

        return NextResponse.json({
            success: true,
            driver: { id: driver.id, userId: driver.userId, approvalStatus: "APPROVED" },
        });
    } catch (error) {
        console.error("Error approving driver:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}