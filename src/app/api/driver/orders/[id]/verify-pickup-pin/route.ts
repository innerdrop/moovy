// API Route: Driver verifica el PIN de retiro del comercio (pickupPin)
// POST /api/driver/orders/[id]/verify-pickup-pin
// ISSUE-001: PIN doble de entrega
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rate-limit";
import { verifyOrderOrSubOrderPin } from "@/lib/pin-verification";
import { requireDriverApi } from "@/lib/driver-auth";
import logger from "@/lib/logger";

const pinLogger = logger.child({ context: "verify-pickup-pin" });

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    // Rate limit: 5 intentos por 10 min por IP
    const limited = await applyRateLimit(request, "pin:verify-pickup", 5, 10 * 60 * 1000);
    if (limited) return limited;

    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { driver, userId } = authResult;

        if (!driver) {
            return NextResponse.json({ error: "No sos repartidor registrado" }, { status: 403 });
        }

        const { id: orderId } = await params;
        const body = await request.json().catch(() => ({}));
        const { pin, gps } = body as {
            pin?: string;
            gps?: { lat: number; lng: number; accuracy?: number } | null;
        };

        if (typeof pin !== "string") {
            return NextResponse.json({ error: "Falta el PIN" }, { status: 400 });
        }

        const result = await verifyOrderOrSubOrderPin({
            entityType: "order",
            entityId: orderId,
            pinType: "pickup",
            pinInput: pin,
            driverId: driver.id,
            userId,
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
        pinLogger.error({ error }, "Error verifying pickup PIN");
        return NextResponse.json(
            { error: "Error al verificar el PIN" },
            { status: 500 }
        );
    }
}
