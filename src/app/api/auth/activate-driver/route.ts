import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDriverRequestNotification } from "@/lib/email";

// POST - Request DRIVER role activation (pending admin approval)
export async function POST() {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        // Check if already a driver
        const existingDriver = await prisma.driver.findUnique({
            where: { userId }
        });
        if (existingDriver) {
            return NextResponse.json({
                error: existingDriver.isActive
                    ? "Ya sos repartidor activo"
                    : "Tu solicitud está pendiente de aprobación",
                status: existingDriver.isActive ? "ACTIVE" : "PENDING_VERIFICATION"
            }, { status: 409 });
        }

        await prisma.$transaction(async (tx) => {
            await tx.driver.create({
                data: { userId, isActive: false }
            });
            await tx.userRole.create({
                data: { userId, role: "DRIVER", isActive: false }
            });
        });

        // Send admin notification email (non-blocking)
        sendDriverRequestNotification(
            session.user.name || null,
            session.user.email || null
        );

        return NextResponse.json({ success: true, status: "PENDING_VERIFICATION" });
    } catch (error) {
        console.error("Error activating driver:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
