import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

/**
 * POST /api/auth/cancel-driver
 * Cancel a pending driver request. Only works if approvalStatus is PENDING.
 * Deletes the Driver record and the DRIVER UserRole.
 */
export async function POST(request: NextRequest) {
    const limited = await applyRateLimit(request, "auth:cancel-driver", 5, 15 * 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const userId = (session.user as any).id;

        const driver = await prisma.driver.findUnique({
            where: { userId },
        });

        if (!driver) {
            return NextResponse.json(
                { error: "No tenés solicitud de repartidor" },
                { status: 404 }
            );
        }

        if (driver.approvalStatus !== "PENDING") {
            return NextResponse.json(
                { error: "Solo se pueden cancelar solicitudes pendientes" },
                { status: 400 }
            );
        }

        // Delete driver record and UserRole in a transaction
        await prisma.$transaction(async (tx) => {
            await tx.driver.delete({ where: { userId } });
            await tx.userRole.deleteMany({
                where: { userId, role: "DRIVER" },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[CancelDriver] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}