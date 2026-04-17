// API Route: Admin reset driver fraud flags
// ISSUE-001: permite al admin (tras revisar el contexto) limpiar fraudScore
// y/o levantar la suspensión de un driver. Cada reset queda auditado.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const { id: driverId } = await params;
        const body = await request.json().catch(() => ({}));
        const {
            resetScore = true,
            unsuspend = false,
            note,
        }: { resetScore?: boolean; unsuspend?: boolean; note?: string } = body;

        const driver = await prisma.driver.findUnique({
            where: { id: driverId },
            select: { id: true, fraudScore: true, isSuspended: true },
        });

        if (!driver) {
            return NextResponse.json({ error: "Driver no encontrado" }, { status: 404 });
        }

        const updateData: any = {};
        if (resetScore) updateData.fraudScore = 0;
        if (unsuspend) {
            updateData.isSuspended = false;
            updateData.suspendedAt = null;
            updateData.suspensionReason = null;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
        }

        await prisma.driver.update({ where: { id: driverId }, data: updateData });

        await logAudit({
            action: "DRIVER_FRAUD_RESET",
            entityType: "Driver",
            entityId: driverId,
            userId: session.user.id,
            details: {
                previousFraudScore: driver.fraudScore,
                previousSuspended: driver.isSuspended,
                resetScore,
                unsuspend,
                note: note ?? null,
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[admin/fraud/drivers/reset] error:", error);
        return NextResponse.json({ error: "Error al actualizar driver" }, { status: 500 });
    }
}
