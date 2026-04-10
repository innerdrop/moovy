import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { sendDriverApprovalEmail } from "@/lib/email";

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
            include: {
                user: { select: { id: true, name: true, email: true } }
            },
        });

        if (!driver) {
            return NextResponse.json({ error: "Repartidor no encontrado" }, { status: 404 });
        }

        if (driver.approvalStatus === "APPROVED" && driver.isActive) {
            return NextResponse.json({ error: "El repartidor ya está aprobado" }, { status: 409 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.driver.update({
                where: { id },
                data: {
                    isActive: true,
                    approvalStatus: "APPROVED",
                    approvedAt: new Date(),
                    rejectionReason: null,
                }
            });
            // Upsert: activate existing UserRole or create if missing
            // (handles drivers registered before activate-driver created UserRole)
            const existing = await tx.userRole.findUnique({
                where: { userId_role: { userId: driver.userId, role: "DRIVER" } },
            });
            if (existing) {
                await tx.userRole.update({
                    where: { userId_role: { userId: driver.userId, role: "DRIVER" } },
                    data: { isActive: true },
                });
            } else {
                await tx.userRole.create({
                    data: { userId: driver.userId, role: "DRIVER", isActive: true },
                });
            }
        });

        // Send approval email (non-blocking)
        if (driver.user.email) {
            sendDriverApprovalEmail(driver.user.email, driver.user.name || "Repartidor");
        }

        return NextResponse.json({
            success: true,
            driver: { ...driver, isActive: true }
        });
    } catch (error) {
        console.error("Error approving driver:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}