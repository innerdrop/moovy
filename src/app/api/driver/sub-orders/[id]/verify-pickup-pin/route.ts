// API Route: Driver verifica el PIN de retiro del comercio (SubOrder multi-vendor)
// POST /api/driver/sub-orders/[id]/verify-pickup-pin
// ISSUE-001: PIN doble de entrega
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";
import { verifyOrderOrSubOrderPin } from "@/lib/pin-verification";
import logger from "@/lib/logger";

const pinLogger = logger.child({ context: "verify-pickup-pin-sub" });

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const limited = await applyRateLimit(request, "pin:verify-pickup-sub", 5, 10 * 60 * 1000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        if (!hasAnyRole(session, ["DRIVER", "ADMIN"])) {
            return NextResponse.json({ error: "Solo repartidores" }, { status: 403 });
        }

        const { id: subOrderId } = await params;
        const body = await request.json().catch(() => ({}));
        const { pin, gps } = body as {
            pin?: string;
            gps?: { lat: number; lng: number; accuracy?: number } | null;
        };

        if (typeof pin !== "string") {
            return NextResponse.json({ error: "Falta el PIN" }, { status: 400 });
        }

        const driver = await prisma.driver.findUnique({
            where: { userId: session.user.id },
            select: { id: true },
        });

        if (!driver) {
            return NextResponse.json({ error: "No sos repartidor registrado" }, { status: 403 });
        }

        const result = await verifyOrderOrSubOrderPin({
            entityType: "subOrder",
            entityId: subOrderId,
            pinType: "pickup",
            pinInput: pin,
            driverId: driver.id,
            userId: session.user.id,
            driverGps: gps || null,
        });

        return NextResponse.json(
            {
                success: result.success,
                ...(result.error ? { error: result.error } : {}),
                ...(result.errorCode ? { errorCode: result.errorCode } : {}),
                ...(result.remainingAttempts !== undefined ? { remainingAttempts: result.remainingAttempts } : {}),
                ...(result.distanceMeters !== undefined ? { distanceMeters: result.distanceMeters } : {}),
                ...(result.verifiedAt ? { verifiedAt: result.verifiedAt } : {}),
                ...(result.alreadyVerified ? { alreadyVerified: true } : {}),
            },
            { status: result.status }
        );
    } catch (error) {
        pinLogger.error({ error }, "Error verifying pickup PIN (sub-order)");
        return NextResponse.json(
            { error: "Error al verificar el PIN" },
            { status: 500 }
        );
    }
}
