import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendDriverRejectionEmail } from "@/lib/email";
import { rejectDriverTransition } from "@/lib/roles";

// PUT - Reject driver application (admin only)
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
            adminId: session.user.id,
            adminEmail: session.user.email ?? "unknown",
        });

        // Send rejection email (non-blocking)
        if (driver.user?.email) {
            sendDriverRejectionEmail(driver.user.email, driver.user.name || "Repartidor", reason);
        }

        return NextResponse.json({
            success: true,
            driver: { id: driver.id, userId: driver.userId, approvalStatus: "REJECTED" },
        });
    } catch (error) {
        console.error("Error rejecting driver:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
