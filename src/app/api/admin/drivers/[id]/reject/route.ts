import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendDriverRejectionEmail } from "@/lib/email";

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
        const reason = body.reason || null;

        const driver = await prisma.driver.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, name: true, email: true } }
            }
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.driver.update({
                where: { id },
                data: {
                    approvalStatus: "REJECTED",
                    rejectionReason: reason,
                    isActive: false,
                }
            });
            // Deactivate DRIVER role
            await tx.userRole.updateMany({
                where: { userId: driver.userId, role: "DRIVER" },
                data: { isActive: false }
            });
        });

        // Send rejection email (non-blocking)
        if (driver.user.email) {
            sendDriverRejectionEmail(driver.user.email, driver.user.name || "Repartidor", reason || undefined);
        }

        return NextResponse.json({
            success: true,
            driver: { ...driver, approvalStatus: "REJECTED", isActive: false }
        });
    } catch (error) {
        console.error("Error rejecting driver:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
