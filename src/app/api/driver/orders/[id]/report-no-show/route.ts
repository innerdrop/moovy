// API Route: Driver marca "Cliente no responde" → estado RETURNING_TO_MERCHANT.
// Rama: feat/no-show-flow
//
// FLUJO:
//   1. Driver lleva 10+ min en WAITING_FOR_CUSTOMER (sin que el cliente
//      aparezca/dicte PIN).
//   2. Toca "Cliente no responde" → este endpoint:
//      - Valida que pasaron >= NO_SHOW_MIN_WAIT_MINUTES desde waitingStartedAt
//        (anti-fraude del driver: no puede marcar no-show inmediatamente).
//      - Setea driverStatus="RETURNING_TO_MERCHANT", noShowReportedAt=now,
//        noShowFlag=true, payoutHoldUntil=+24h (anti-fraude: si el cliente
//        impugna y prueba que estaba en casa, hay 24h de ventana para hold
//        del payout del driver).
//      - Push al cliente: "No te encontramos. Si fue un error, reportá ahora."
//      - Audit log: queda registrado para investigación si hay disputa.
//   3. El driver vuelve al comercio.
//   4. Endpoint /return-to-merchant cierra como RETURNED con PIN del comercio.
//
// CONSIDERACIÓN DE PRODUCTO (Biblia v3 / Argentina):
//   - El cliente paga 100% (es responsabilidad suya estar disponible).
//   - El comercio recibe lo suyo (ya cocinó/preparó).
//   - El driver recibe payout completo + bonus de $300 (compensación por viaje
//     perdido). Pero queda en HOLD 24h.
//   - Moovy come la comisión (gesto de buena fe).
//   Lógica de cobro implementada en order-totals.ts cuando noShowFlag=true.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";
import { notifyCustomerNoShowReported } from "@/lib/notifications";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/audit";

const noShowLogger = logger.child({ context: "driver-report-no-show" });

const NO_SHOW_MIN_WAIT_MINUTES = 10;
const PAYOUT_HOLD_HOURS = 24;

export async function POST(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const authResult = await requireDriverApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { driver, isAdmin } = authResult;

        const { id: orderId } = await params;

        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                userId: true,
                orderNumber: true,
                driverId: true,
                driverStatus: true,
                waitingStartedAt: true,
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

        // Defense: solo se puede marcar no-show desde WAITING_FOR_CUSTOMER
        if (order.driverStatus !== "WAITING_FOR_CUSTOMER") {
            return NextResponse.json(
                {
                    error: `No se puede reportar no-show desde el estado: ${order.driverStatus}`,
                    errorCode: "INVALID_STATE",
                    currentStatus: order.driverStatus,
                },
                { status: 409 },
            );
        }

        // Defense ANTI-FRAUDE: el driver NO puede marcar no-show inmediatamente.
        // Tiene que haber esperado al menos NO_SHOW_MIN_WAIT_MINUTES desde que
        // tocó "Llegué" (waitingStartedAt). Si no, es muy probable que esté
        // tratando de saltarse la entrega real.
        if (!order.waitingStartedAt) {
            return NextResponse.json(
                { error: "No se registró cuándo llegaste. Reportá a soporte." },
                { status: 500 },
            );
        }

        const now = Date.now();
        const elapsedMinutes = (now - order.waitingStartedAt.getTime()) / 60_000;

        // Admin puede saltarse el chequeo (override manual desde /ops)
        if (!isAdmin && elapsedMinutes < NO_SHOW_MIN_WAIT_MINUTES) {
            const remainingSeconds = Math.ceil((NO_SHOW_MIN_WAIT_MINUTES * 60) - (elapsedMinutes * 60));
            noShowLogger.warn(
                { orderId, driverId: driver?.id, elapsedMinutes },
                "Driver tried to report no-show too early",
            );
            return NextResponse.json(
                {
                    error: `Tenés que esperar al menos ${NO_SHOW_MIN_WAIT_MINUTES} minutos antes de marcar no-show.`,
                    errorCode: "WAIT_PERIOD_NOT_REACHED",
                    elapsedMinutes: Math.round(elapsedMinutes * 10) / 10,
                    requiredMinutes: NO_SHOW_MIN_WAIT_MINUTES,
                    remainingSeconds,
                },
                { status: 409 },
            );
        }

        // Update atómico
        const noShowReportedAt = new Date();
        const payoutHoldUntil = new Date(now + PAYOUT_HOLD_HOURS * 3_600_000);

        const updateResult = await prisma.order.updateMany({
            where: {
                id: orderId,
                driverStatus: "WAITING_FOR_CUSTOMER",
            },
            data: {
                driverStatus: "RETURNING_TO_MERCHANT",
                noShowReportedAt,
                noShowFlag: true,
                payoutHoldUntil,
            },
        });

        if (updateResult.count === 0) {
            return NextResponse.json(
                { error: "El pedido cambió de estado mientras procesábamos" },
                { status: 409 },
            );
        }

        noShowLogger.info(
            {
                orderId,
                driverId: driver?.id,
                orderNumber: order.orderNumber,
                elapsedMinutes: Math.round(elapsedMinutes),
            },
            "No-show reported by driver",
        );

        // Audit log
        await logAudit({
            action: "DRIVER_REPORTED_CUSTOMER_NO_SHOW",
            entityType: "Order",
            entityId: orderId,
            userId: order.userId,
            details: {
                orderNumber: order.orderNumber,
                driverId: driver?.id,
                waitingStartedAt: order.waitingStartedAt.toISOString(),
                noShowReportedAt: noShowReportedAt.toISOString(),
                elapsedMinutes: Math.round(elapsedMinutes * 10) / 10,
                payoutHoldUntil: payoutHoldUntil.toISOString(),
            },
        }).catch(() => { /* nice-to-have */ });

        // Push al cliente con tono empático (si fue error, puede impugnar)
        notifyCustomerNoShowReported(
            order.userId,
            order.orderNumber,
            order.id,
        ).catch((err) => {
            noShowLogger.error({ err, orderId }, "Failed to notify customer of no-show");
        });

        return NextResponse.json({
            success: true,
            message: "No-show registrado. Volvé al comercio para devolver el pedido.",
            noShowReportedAt: noShowReportedAt.toISOString(),
            payoutHoldUntil: payoutHoldUntil.toISOString(),
        });
    } catch (error) {
        noShowLogger.error({ error }, "Error in report-no-show");
        return NextResponse.json(
            { error: "Error al reportar no-show" },
            { status: 500 },
        );
    }
}
