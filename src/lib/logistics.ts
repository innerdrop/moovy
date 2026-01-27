// Logistics utilities for real-time driver assignment
// Uses Haversine formula for distance calculation (mobile-ready, no PostGIS dependency)

import { prisma } from "./prisma";
import { calculateDistance } from "./geo";

export interface DriverWithDistance {
    id: string;
    userId: string;
    latitude: number;
    longitude: number;
    vehicleType: string | null;
    distance: number; // km from merchant
}

/**
 * Find available drivers sorted by proximity to a merchant using PostGIS
 * @param merchantLat Merchant latitude
 * @param merchantLng Merchant longitude
 * @param excludeDriverIds Array of driver IDs to exclude (already attempted)
 * @param maxDistanceKm Maximum search radius in km (default: 15km for Ushuaia)
 */
export async function findNearestAvailableDrivers(
    merchantLat: number,
    merchantLng: number,
    excludeDriverIds: string[] = [],
    maxDistanceKm: number = 20
): Promise<DriverWithDistance[]> {
    // PostGIS query for proximity using the <-> operator (index-powered)
    // ST_Distance returns meters for geography, so we divide by 1000 for km
    // excludeDriverIds needs to be handled carefully in raw SQL

    try {
        const drivers = await prisma.$queryRaw`
            SELECT 
                d.id, 
                d."userId", 
                d.latitude, 
                d.longitude, 
                d."vehicleType",
                ST_Distance(d.ubicacion, ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326)) / 1000 as distance
            FROM "Driver" d
            WHERE d."availabilityStatus" = 'DISPONIBLE'
                AND d."isActive" = true
                AND d.ubicacion IS NOT NULL
                AND d.id NOT IN (${excludeDriverIds.length > 0 ? excludeDriverIds : ['none']})
                AND ST_DWithin(d.ubicacion, ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326), ${maxDistanceKm * 1000})
            ORDER BY d.ubicacion <-> ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326)
            LIMIT 5
        ` as any[];

        return drivers.map(d => ({
            ...d,
            distance: Number(d.distance)
        }));
    } catch (error) {
        console.error("[Logistics] Error in PostGIS query, falling back to Haversine:", error);

        // Fallback to basic prisma query + haversine if PostGIS fails (safety)
        const drivers = await prisma.driver.findMany({
            where: {
                availabilityStatus: "DISPONIBLE",
                isActive: true,
                latitude: { not: null },
                longitude: { not: null },
                id: { notIn: excludeDriverIds },
            },
        });

        return drivers
            .map((driver) => ({
                id: driver.id,
                userId: driver.userId,
                latitude: driver.latitude!,
                longitude: driver.longitude!,
                vehicleType: driver.vehicleType,
                distance: calculateDistance(
                    merchantLat,
                    merchantLng,
                    driver.latitude!,
                    driver.longitude!
                ),
            }))
            .filter((d) => d.distance <= maxDistanceKm)
            .sort((a, b) => a.distance - b.distance);
    }
}

/**
 * Assign order to nearest available driver
 * Sets pendingDriverId and assignmentExpiresAt (60 seconds from now)
 */
export async function assignOrderToNearestDriver(
    orderId: string
): Promise<{ success: boolean; driverId?: string; error?: string }> {
    try {
        // Get order with merchant location
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                merchant: {
                    select: { latitude: true, longitude: true, name: true },
                },
            },
        });

        if (!order) {
            return { success: false, error: "Pedido no encontrado" };
        }

        if (order.driverId) {
            return { success: false, error: "El pedido ya tiene repartidor asignado" };
        }

        // Merchant must have coordinates
        if (!order.merchant?.latitude || !order.merchant?.longitude) {
            return { success: false, error: "El comercio no tiene coordenadas configuradas" };
        }

        // Parse excluded drivers from previous attempts
        const attemptedDriverIds: string[] = order.attemptedDriverIds
            ? JSON.parse(order.attemptedDriverIds)
            : [];

        // Find nearest available driver
        const nearbyDrivers = await findNearestAvailableDrivers(
            order.merchant.latitude,
            order.merchant.longitude,
            attemptedDriverIds
        );

        if (nearbyDrivers.length === 0) {
            // No drivers available - mark for manual assignment
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    assignmentAttempts: { increment: 1 },
                    lastAssignmentAt: new Date(),
                },
            });
            return { success: false, error: "No hay repartidores disponibles en la zona" };
        }

        const nearestDriver = nearbyDrivers[0];
        const expiresAt = new Date(Date.now() + 300 * 1000); // 5 minutes timeout

        // Update order with pending assignment
        await prisma.order.update({
            where: { id: orderId },
            data: {
                pendingDriverId: nearestDriver.id,
                assignmentExpiresAt: expiresAt,
                lastAssignmentAt: new Date(),
                assignmentAttempts: { increment: 1 },
            },
        });

        console.log(
            `[Logistics] Order ${order.orderNumber} offered to driver ${nearestDriver.id} (${nearestDriver.distance.toFixed(2)}km away). Expires at ${expiresAt.toISOString()}`
        );

        return { success: true, driverId: nearestDriver.id };
    } catch (error) {
        console.error("[Logistics] Error assigning order:", error);
        return { success: false, error: "Error interno al asignar repartidor" };
    }
}

/**
 * Process expired assignment offers and cascade to next driver
 * Should be called periodically (e.g., every 10 seconds)
 */
export async function processExpiredAssignments(): Promise<number> {
    const now = new Date();
    const maxAttempts = 5; // After 5 attempts, require manual assignment

    // Find orders with expired pending assignments
    const expiredOrders = await prisma.order.findMany({
        where: {
            pendingDriverId: { not: null },
            assignmentExpiresAt: { lt: now },
            driverId: null, // Not yet accepted
            status: "READY",
        },
    });

    let processed = 0;

    for (const order of expiredOrders) {
        // Add current pending driver to attempted list
        const attemptedIds: string[] = order.attemptedDriverIds
            ? JSON.parse(order.attemptedDriverIds)
            : [];

        if (order.pendingDriverId) {
            attemptedIds.push(order.pendingDriverId);
        }

        // Clear pending assignment and update attempted list
        await prisma.order.update({
            where: { id: order.id },
            data: {
                pendingDriverId: null,
                assignmentExpiresAt: null,
                attemptedDriverIds: JSON.stringify(attemptedIds),
            },
        });

        // If under max attempts, try next driver
        if (order.assignmentAttempts < maxAttempts) {
            const result = await assignOrderToNearestDriver(order.id);
            console.log(
                `[Logistics] Timeout cascade for order ${order.orderNumber}: ${result.success ? "assigned to " + result.driverId : result.error}`
            );
        } else {
            console.log(
                `[Logistics] Order ${order.orderNumber} reached max attempts (${maxAttempts}). Requires manual assignment.`
            );
        }

        processed++;
    }

    return processed;
}

/**
 * Driver accepts a pending order
 */
export async function driverAcceptOrder(
    driverId: string,
    orderId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return { success: false, error: "Pedido no encontrado" };
        }

        if (order.driverId) {
            return { success: false, error: "El pedido ya fue aceptado por otro repartidor" };
        }

        if (order.pendingDriverId !== driverId) {
            return { success: false, error: "Este pedido no está asignado a ti" };
        }

        if (order.assignmentExpiresAt && new Date(Date.now() - 10000) > order.assignmentExpiresAt) {
            return { success: false, error: "La oferta ha expirado" };
        }

        // Accept the order
        await prisma.$transaction([
            prisma.order.update({
                where: { id: orderId },
                data: {
                    driverId: driverId,
                    pendingDriverId: null,
                    assignmentExpiresAt: null,
                    status: "DRIVER_ASSIGNED",
                    deliveryStatus: "ASSIGNED",
                },
            }),
            prisma.driver.update({
                where: { id: driverId },
                data: {
                    availabilityStatus: "OCUPADO",
                },
            }),
        ]);

        console.log(`[Logistics] Driver ${driverId} accepted order ${order.orderNumber}`);
        return { success: true };
    } catch (error) {
        console.error("[Logistics] Error accepting order:", error);
        return { success: false, error: "Error al aceptar el pedido" };
    }
}

/**
 * Driver rejects a pending order - immediately try next driver
 */
export async function driverRejectOrder(
    driverId: string,
    orderId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });

        if (!order) {
            return { success: false, error: "Pedido no encontrado" };
        }

        if (order.pendingDriverId !== driverId) {
            return { success: false, error: "Este pedido no está asignado a ti" };
        }

        // Add to attempted list and clear pending
        const attemptedIds: string[] = order.attemptedDriverIds
            ? JSON.parse(order.attemptedDriverIds)
            : [];
        attemptedIds.push(driverId);

        await prisma.order.update({
            where: { id: orderId },
            data: {
                pendingDriverId: null,
                assignmentExpiresAt: null,
                attemptedDriverIds: JSON.stringify(attemptedIds),
            },
        });

        // Immediately try next driver
        const result = await assignOrderToNearestDriver(orderId);

        console.log(
            `[Logistics] Driver ${driverId} rejected order ${order.orderNumber}. Next: ${result.success ? result.driverId : result.error}`
        );

        return { success: true };
    } catch (error) {
        console.error("[Logistics] Error rejecting order:", error);
        return { success: false, error: "Error al rechazar el pedido" };
    }
}
