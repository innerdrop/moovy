/**
 * ISSUE-013 — Driver proximity detection.
 *
 * Cuando el repartidor está entregando (deliveryStatus en PICKED_UP o IN_DELIVERY)
 * y pasa por primera vez bajo 300m del destino, se le envía un push al buyer
 * recordándole el PIN de entrega. La idempotencia está garantizada por el flag
 * `nearDestinationNotified` en Order / SubOrder: solo disparamos el push si el
 * `updateMany` atómico (con guard `nearDestinationNotified: false`) afecta 1 fila.
 *
 * Single-vendor: se usa Order.nearDestinationNotified.
 * Multi-vendor:  se usa SubOrder.nearDestinationNotified (cada SubOrder tiene su
 *                propio driver y dispara su propio push — al buyer pueden
 *                llegarle N pushes si tiene N vendedores en el pedido).
 *
 * La función es fire-and-forget: el caller NO debe bloquear la respuesta HTTP
 * esperando el resultado. Los errores se loguean con pino, nunca throwean.
 */

import { prisma } from "./prisma";
import { calculateDistance } from "./geo";
import { notifyBuyerDriverNear } from "./notifications";

/** Radio de detección — Biblia UX: 300m ≈ 3-5 minutos caminando en Ushuaia */
const NEAR_DESTINATION_METERS = 300;

/** Estados de delivery en los que tiene sentido notificar proximidad */
const DELIVERY_ACTIVE_STATES = ["PICKED_UP", "IN_DELIVERY"] as const;

/**
 * Chequea si el driver está a <300m del destino de alguna de sus entregas activas.
 * Para las que encaje, dispara el push al buyer (una única vez por Order/SubOrder).
 *
 * @param driverId - El Driver.id (no userId)
 * @param driverLat - Latitud actual del driver
 * @param driverLng - Longitud actual del driver
 */
export async function checkAndNotifyNearDestination({
    driverId,
    driverLat,
    driverLng,
}: {
    driverId: string;
    driverLat: number;
    driverLng: number;
}): Promise<{ checked: number; notified: number; errors: number }> {
    let checked = 0;
    let notified = 0;
    let errors = 0;

    try {
        // Path 1 (single-vendor): Order.driverId + Order.deliveryStatus + Order.nearDestinationNotified
        const orders = await prisma.order.findMany({
            where: {
                driverId,
                deliveryStatus: { in: [...DELIVERY_ACTIVE_STATES] },
                nearDestinationNotified: false,
                deletedAt: null,
            },
            select: {
                id: true,
                userId: true,
                orderNumber: true,
                deliveryPin: true,
                address: {
                    select: { latitude: true, longitude: true },
                },
            },
            take: 10, // cap defensivo — un driver no debería tener >10 órdenes simultáneas
        });

        for (const order of orders) {
            checked++;
            const destLat = order.address?.latitude;
            const destLng = order.address?.longitude;

            // Dirección sin coords (caso raro) — skip, no podemos medir distancia
            if (destLat == null || destLng == null) continue;

            const distanceKm = calculateDistance(
                driverLat,
                driverLng,
                destLat,
                destLng
            );
            const distanceMeters = distanceKm * 1000;

            if (distanceMeters >= NEAR_DESTINATION_METERS) continue;

            // Atómico: solo notificamos si ganamos la carrera (nadie más seteó el flag)
            const update = await prisma.order.updateMany({
                where: { id: order.id, nearDestinationNotified: false },
                data: { nearDestinationNotified: true },
            });

            if (update.count === 0) continue; // otra request ya notificó

            try {
                await notifyBuyerDriverNear(
                    order.userId,
                    order.orderNumber,
                    order.id,
                    order.deliveryPin
                );
                notified++;
            } catch (pushErr) {
                errors++;
                console.error(
                    "[Proximity] Push al buyer falló (order)",
                    { orderId: order.id, err: pushErr }
                );
            }
        }

        // Path 2 (multi-vendor): SubOrder.driverId + SubOrder.deliveryStatus + SubOrder.nearDestinationNotified
        const subOrders = await prisma.subOrder.findMany({
            where: {
                driverId,
                deliveryStatus: { in: [...DELIVERY_ACTIVE_STATES] },
                nearDestinationNotified: false,
                order: { deletedAt: null },
            },
            select: {
                id: true,
                order: {
                    select: {
                        id: true,
                        userId: true,
                        orderNumber: true,
                        address: {
                            select: { latitude: true, longitude: true },
                        },
                    },
                },
                deliveryPin: true,
            },
            take: 10,
        });

        for (const sub of subOrders) {
            checked++;
            const destLat = sub.order.address?.latitude;
            const destLng = sub.order.address?.longitude;

            if (destLat == null || destLng == null) continue;

            const distanceKm = calculateDistance(
                driverLat,
                driverLng,
                destLat,
                destLng
            );
            const distanceMeters = distanceKm * 1000;

            if (distanceMeters >= NEAR_DESTINATION_METERS) continue;

            const update = await prisma.subOrder.updateMany({
                where: { id: sub.id, nearDestinationNotified: false },
                data: { nearDestinationNotified: true },
            });

            if (update.count === 0) continue;

            try {
                await notifyBuyerDriverNear(
                    sub.order.userId,
                    sub.order.orderNumber,
                    sub.order.id,
                    sub.deliveryPin
                );
                notified++;
            } catch (pushErr) {
                errors++;
                console.error(
                    "[Proximity] Push al buyer falló (subOrder)",
                    { subOrderId: sub.id, err: pushErr }
                );
            }
        }
    } catch (err) {
        errors++;
        console.error("[Proximity] Error chequeando proximidad", { driverId, err });
    }

    return { checked, notified, errors };
}
