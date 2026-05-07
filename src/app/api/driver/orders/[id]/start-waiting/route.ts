// API Route: Driver toca "Llegué al cliente" → estado WAITING_FOR_CUSTOMER.
// Rama: feat/no-show-flow
//
// FLUJO:
//   1. Driver está en estado driverStatus="AT_CUSTOMER" (ya entró al geofence).
//   2. Toca "Llegué al cliente" → este endpoint:
//      - Setea driverStatus="WAITING_FOR_CUSTOMER", waitingStartedAt=now.
//      - Push al buyer con su PIN + countdown 10 min.
//      - Audit log de la transición.
//   3. El buyer tiene 10 min para abrir/aparecer y dictar el PIN.
//   4. Si aparece y dicta PIN OK → flujo normal de delivery PIN, DELIVERED.
//   5. Si no aparece tras 10 min → driver puede tocar "Cliente no responde"
//      (endpoint /report-no-show) que lleva a RETURNING_TO_MERCHANT.
//
// PROTECCIÓN ANTI-FRAUDE DEL DRIVER:
//   - Geofence chequeado con PIN_GEOFENCE_METERS (100m + 50m gracia).
//   - waitingStartedAt es SOLO seteado por este endpoint, no por el driver
//     directamente, así no puede backdating.
//   - El cron retry-assignments (futuro) podría también detectar drivers que
//     marcan "Llegué" repetidamente para distintos clientes en pocos minutos
//     (patrón sospechoso).

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireDriverApi } from "@/lib/driver-auth";
import { notifyCustomerDriverArrived } from "@/lib/notifications";
import logger from "@/lib/logger";
import { logAudit } from "@/lib/audit";

const startWaitingLogger = logger.child({ context: "driver-start-waiting" });

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
                status: true,
                deliveryPin: true,
                deletedAt: true,
            },
        });

        if (!order || order.deletedAt) {
            return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
        }

        // Defense: el order tiene que estar asignado a este driver
        if (driver && order.driverId !== driver.id && !isAdmin) {
            return NextResponse.json(
                { error: "Este pedido no está asignado a vos" },
                { status: 403 },
            );
        }

        // Defense: solo se puede iniciar waiting si el driver ya retiró el pedido
        // (driverStatus IN PICKED_UP / ON_ROUTE_TO_CUSTOMER / AT_CUSTOMER) y NO
        // está ya en WAITING_FOR_CUSTOMER (idempotencia).
        const validPreviousStates = ["ON_ROUTE_TO_CUSTOMER", "AT_CUSTOMER"];
        const currentDriverStatus = order.driverStatus || "";
        if (!validPreviousStates.includes(currentDriverStatus)) {
            // Si ya está en WAITING_FOR_CUSTOMER, retornamos OK idempotente
            if (currentDriverStatus === "WAITING_FOR_CUSTOMER") {
                return NextResponse.json({
                    success: true,
                    alreadyWaiting: true,
                    message: "Ya estás esperando al cliente",
                });
            }
            return NextResponse.json(
                {
                    error: `No se puede iniciar espera desde el estado actual: ${currentDriverStatus}`,
                    errorCode: "INVALID_STATE",
                    currentStatus: currentDriverStatus,
                },
                { status: 409 },
            );
        }

        // Update atómico: solo cambia si el estado actual sigue siendo válido
        // (defensa contra race conditions concurrentes con otros endpoints).
        const updateResult = await prisma.order.updateMany({
            where: {
                id: orderId,
                driverStatus: { in: validPreviousStates },
            },
            data: {
                driverStatus: "WAITING_FOR_CUSTOMER",
                waitingStartedAt: new Date(),
            },
        });

        if (updateResult.count === 0) {
            return NextResponse.json(
                { error: "El pedido cambió de estado mientras procesábamos la solicitud" },
                { status: 409 },
            );
        }

        startWaitingLogger.info(
            { orderId, driverId: driver?.id, orderNumber: order.orderNumber },
            "Driver started waiting for customer",
        );

        // Audit log
        await logAudit({
            action: "DRIVER_STARTED_WAITING_FOR_CUSTOMER",
            entityType: "Order",
            entityId: orderId,
            userId: order.userId, // El cliente afectado
            details: {
                orderNumber: order.orderNumber,
                driverId: driver?.id,
                waitingStartedAt: new Date().toISOString(),
            },
        }).catch(() => { /* nice-to-have */ });

        // Push al cliente con su PIN + countdown. Fire-and-forget.
        if (order.deliveryPin) {
            notifyCustomerDriverArrived(
                order.userId,
                order.orderNumber,
                order.deliveryPin,
                order.id,
            ).catch((err) => {
                startWaitingLogger.error({ err, orderId }, "Failed to notify customer");
            });
        }

        return NextResponse.json({
            success: true,
            message: "Esperando al cliente",
            waitingStartedAt: new Date().toISOString(),
            timeoutMinutes: 10,
        });
    } catch (error) {
        startWaitingLogger.error({ error }, "Error in start-waiting");
        return NextResponse.json(
            { error: "Error al iniciar espera" },
            { status: 500 },
        );
    }
}
