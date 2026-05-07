// API Route: Driver verifica PIN del comercio para cerrar como RETURNED
// (después del flow no-show, vuelve y entrega el pedido al comercio).
// Rama: feat/no-show-flow
//
// FLUJO:
//   1. Driver está en RETURNING_TO_MERCHANT (después de marcar no-show).
//   2. Vuelve físicamente al comercio (geofence chequeado).
//   3. El comercio le da su PIN (el mismo del pickup).
//   4. Driver lo ingresa → este endpoint valida con verifyOrderOrSubOrderPin.
//   5. Si OK:
//      - Setea driverStatus="RETURNED", merchantStatus="RETURNED", status="RETURNED".
//      - Audit log final.
//      - El cobro especial no-show ya fue marcado con noShowFlag=true en el
//        endpoint /report-no-show. La lógica de cobro vive en order-totals.ts.
//
// IMPORTANTE: el PIN que se valida es el MISMO del pickup (no es un nuevo PIN).
// El comercio recibe el pedido de vuelta como si fuera un "anti-pickup": se
// asegura que es el mismo driver que se llevó el pedido el que está devolviendo,
// y que no es alguien intentando estafar.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";
import { verifyOrderOrSubOrderPin } from "@/lib/pin-verification";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/audit";

const returnLogger = logger.child({ context: "driver-return-to-merchant" });

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { driver, isAdmin } = authResult;

        const { id: orderId } = await params;
        const body = await req.json().catch(() => ({}));
        const pinInput = body?.pin as string | undefined;
        const driverGps = body?.driverGps as { lat: number; lng: number; accuracy?: number } | undefined;

        if (!pinInput) {
            return NextResponse.json(
                { error: "Falta el PIN del comercio", errorCode: "MISSING_PIN" },
                { status: 400 },
            );
        }

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                orderNumber: true,
                driverId: true,
                driverStatus: true,
                merchantStatus: true,
                status: true,
                deletedAt: true,
            },
        });

        if (!order || order.deletedAt) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        if (driver && order.driverId !== driver.id && !isAdmin) {
            return NextResponse.json(
                { error: "Este pedido no está asignado a vos" },
                { status: 403 },
            );
        }

        // Defense: solo se puede cerrar como RETURNED desde RETURNING_TO_MERCHANT
        if (order.driverStatus !== "RETURNING_TO_MERCHANT") {
            return NextResponse.json(
                {
                    error: `No se puede devolver al comercio desde el estado: ${order.driverStatus}`,
                    errorCode: "INVALID_STATE",
                    currentStatus: order.driverStatus,
                },
                { status: 409 },
            );
        }

        // Validar PIN del comercio (el mismo del pickup). verifyOrderOrSubOrderPin
        // ya hace todo: rate limiting, timing-safe compare, geofence, fraudScore.
        // driverId: si es admin override (driver=null) usamos un placeholder
        // identificable en audit log. order.userId es el cliente del pedido
        // (mismo patrón que verify-pickup-pin existente).
        const pinResult = await verifyOrderOrSubOrderPin({
            entityType: "order",
            entityId: orderId,
            pinType: "pickup", // El PIN del comercio (mismo del pickup original)
            pinInput,
            driverId: driver?.id ?? "admin-override",
            userId: order.userId,
            driverGps,
        });

        if (!pinResult.success) {
            return NextResponse.json(
                {
                    error: pinResult.error,
                    errorCode: pinResult.errorCode,
                    remainingAttempts: pinResult.remainingAttempts,
                    distanceMeters: pinResult.distanceMeters,
                },
                { status: pinResult.status || 400 },
            );
        }

        // PIN OK: cerrar como RETURNED. Atómico para prevenir double-close.
        const updateResult = await prisma.order.updateMany({
            where: {
                id: orderId,
                driverStatus: "RETURNING_TO_MERCHANT",
            },
            data: {
                driverStatus: "RETURNED",
                merchantStatus: "RETURNED",
                status: "RETURNED",
            },
        });

        if (updateResult.count === 0) {
            return NextResponse.json(
                { error: "El pedido ya cerró por otro proceso" },
                { status: 409 },
            );
        }

        returnLogger.info(
            { orderId, driverId: driver?.id, orderNumber: order.orderNumber },
            "Order RETURNED to merchant after no-show",
        );

        // Audit log final
        await logAudit({
            action: "ORDER_RETURNED_TO_MERCHANT_AFTER_NOSHOW",
            entityType: "Order",
            entityId: orderId,
            userId: order.userId,
            details: {
                orderNumber: order.orderNumber,
                driverId: driver?.id,
                returnedAt: new Date().toISOString(),
            },
        }).catch(() => { /* nice-to-have */ });

        return NextResponse.json({
            success: true,
            message: "Pedido devuelto al comercio. Cerrado como RETURNED.",
        });
    } catch (error) {
        returnLogger.error({ error }, "Error in return-to-merchant");
        return NextResponse.json(
            { error: "Error al devolver el pedido al comercio" },
            { status: 500 },
        );
    }
}
