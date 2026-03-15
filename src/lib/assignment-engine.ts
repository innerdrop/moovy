// Assignment Engine — Driver assignment with PostGIS, rating priority, and race condition prevention
// Replaces the legacy logistics.ts assignment logic

import { prisma } from "./prisma";
import { calculateDistance, estimateTravelTime } from "./geo";
import { sendNewOfferNotification, sendPushToUser } from "./push";
import { notifyBuyer } from "./notifications";

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface DriverWithDistance {
    id: string;
    userId: string;
    latitude: number;
    longitude: number;
    vehicleType: string | null;
    rating: number | null;
    distance: number; // km from merchant
}

export interface OrderCategory {
    category: string;
    totalScore: number;
    allowedVehicles: string[];
}

// Score-to-category thresholds
const SCORE_THRESHOLDS: { max: number; category: string }[] = [
    { max: 5, category: "MICRO" },
    { max: 15, category: "SMALL" },
    { max: 30, category: "MEDIUM" },
    { max: 60, category: "LARGE" },
    { max: Infinity, category: "XL" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

/** Read a MoovyConfig value by key */
async function getConfig(key: string): Promise<string> {
    const config = await prisma.moovyConfig.findUnique({ where: { key } });
    if (!config) throw new Error(`MoovyConfig key "${key}" not found`);
    return config.value;
}

/** Emit a socket event (fire-and-forget) */
async function emitSocket(event: string, room: string, data: Record<string, unknown>): Promise<void> {
    const socketUrl = process.env.SOCKET_INTERNAL_URL || "http://localhost:3001";
    await fetch(`${socketUrl}/emit`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.CRON_SECRET}`,
        },
        body: JSON.stringify({ event, room, data }),
    });
}

/** Notify all ADMIN users via push */
async function notifyOps(title: string, body: string, orderId?: string): Promise<void> {
    const adminRoles = await prisma.userRole.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { userId: true },
    });
    for (const { userId } of adminRoles) {
        sendPushToUser(userId, { title, body, url: "/ops", tag: "ops-alert", orderId }).catch(
            (err) => console.error("[Push] Ops notification error:", err)
        );
    }
}

// ─── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Calculate the aggregate package category for an order based on its items.
 * Each item's packageCategory is looked up in the PackageCategory table for its volumeScore.
 * Items without a packageCategory default to MICRO.
 */
export async function calculateOrderCategory(
    items: Array<{ packageCategory?: string | null; quantity: number }>
): Promise<OrderCategory> {
    const categories = await prisma.packageCategory.findMany({ where: { isActive: true } });
    const scoreMap = new Map(categories.map((c) => [c.name, c.volumeScore]));
    const vehicleMap = new Map(categories.map((c) => [c.name, c.allowedVehicles]));

    let totalScore = 0;
    for (const item of items) {
        const catName = item.packageCategory || "MICRO";
        const score = scoreMap.get(catName) ?? 1; // default to MICRO score
        totalScore += score * item.quantity;
    }

    // Derive final category from totalScore
    const derived = SCORE_THRESHOLDS.find((t) => totalScore <= t.max)!;
    const allowedVehicles = vehicleMap.get(derived.category) ?? ["BIKE", "MOTO", "CAR", "TRUCK"];

    return { category: derived.category, totalScore, allowedVehicles };
}

/**
 * Find the next eligible driver sorted by distance, with rating priority within a radius.
 * Uses PostGIS with Haversine fallback.
 */
export async function findNextEligibleDriver(
    merchantLat: number,
    merchantLng: number,
    requiredVehicles: string[],
    excludeDriverIds: string[]
): Promise<DriverWithDistance | null> {
    const ratingRadiusStr = await getConfig("assignment_rating_radius_meters");
    const ratingRadius = parseInt(ratingRadiusStr, 10) || 300;

    const searchRadiusStr = await getConfig("driver_search_radius_meters").catch(() => "50000");
    const searchRadius = parseInt(searchRadiusStr, 10) || 50000;

    // Ensure excludeDriverIds is never empty for SQL ANY() — use a dummy value
    const excludeIds = excludeDriverIds.length > 0 ? excludeDriverIds : ["none"];

    try {
        const drivers = await prisma.$queryRaw`
            SELECT
                d.id,
                d."userId",
                d.latitude,
                d.longitude,
                d."vehicleType",
                d.rating,
                ST_Distance(
                    d.ubicacion,
                    ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326)
                ) / 1000 AS distance
            FROM "Driver" d
            WHERE d."isOnline" = true
                AND d."isActive" = true
                AND d.ubicacion IS NOT NULL
                AND d."vehicleType" = ANY(${requiredVehicles})
                AND NOT (d.id = ANY(${excludeIds}))
                AND ST_DWithin(
                    d.ubicacion,
                    ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326),
                    ${searchRadius}
                )
            ORDER BY
                CASE WHEN ST_Distance(
                    d.ubicacion,
                    ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326)
                ) <= ${ratingRadius} THEN 0 ELSE 1 END ASC,
                CASE WHEN ST_Distance(
                    d.ubicacion,
                    ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326)
                ) <= ${ratingRadius} THEN -COALESCE(d.rating, 0) ELSE 0 END ASC,
                ST_Distance(
                    d.ubicacion,
                    ST_SetSRID(ST_MakePoint(${merchantLng}, ${merchantLat}), 4326)
                ) ASC
            LIMIT 1
        ` as any[];

        if (drivers.length === 0) return null;

        const d = drivers[0];
        return {
            id: d.id,
            userId: d.userId,
            latitude: Number(d.latitude),
            longitude: Number(d.longitude),
            vehicleType: d.vehicleType,
            rating: d.rating != null ? Number(d.rating) : null,
            distance: Number(d.distance),
        };
    } catch (error) {
        console.error("[AssignmentEngine] PostGIS query failed, falling back to Haversine:", error);

        // Haversine fallback
        const drivers = await prisma.driver.findMany({
            where: {
                isOnline: true,
                isActive: true,
                latitude: { not: null },
                longitude: { not: null },
                vehicleType: { in: requiredVehicles },
                id: { notIn: excludeDriverIds },
            },
        });

        const ratingRadiusKm = ratingRadius / 1000;

        const withDistance = drivers
            .map((driver) => ({
                id: driver.id,
                userId: driver.userId,
                latitude: driver.latitude!,
                longitude: driver.longitude!,
                vehicleType: driver.vehicleType,
                rating: driver.rating,
                distance: calculateDistance(merchantLat, merchantLng, driver.latitude!, driver.longitude!),
            }))
            .filter((d) => d.distance <= 50);

        // Two-tier sort: within rating radius, sort by rating DESC; outside, by distance ASC
        withDistance.sort((a, b) => {
            const aInRadius = a.distance <= ratingRadiusKm ? 0 : 1;
            const bInRadius = b.distance <= ratingRadiusKm ? 0 : 1;
            if (aInRadius !== bInRadius) return aInRadius - bInRadius;
            if (aInRadius === 0) return (b.rating ?? 0) - (a.rating ?? 0);
            return a.distance - b.distance;
        });

        return withDistance[0] ?? null;
    }
}

/**
 * Start the assignment cycle for an order.
 * Creates a PendingAssignment and offers to the nearest eligible driver.
 */
export async function startAssignmentCycle(
    orderId: string
): Promise<{ success: boolean; driverId?: string; error?: string }> {
    try {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                merchant: { select: { latitude: true, longitude: true, name: true } },
                items: {
                    select: {
                        quantity: true,
                        name: true,
                        packageCategoryName: true,
                        product: {
                            select: { packageCategory: { select: { name: true } } },
                        },
                    },
                },
                address: { select: { latitude: true, longitude: true, street: true, number: true } },
                user: { select: { id: true } },
            },
        });

        if (!order) return { success: false, error: "Pedido no encontrado" };
        if (order.driverId) return { success: false, error: "El pedido ya tiene repartidor asignado" };
        if (!order.merchant?.latitude || !order.merchant?.longitude) {
            return { success: false, error: "El comercio no tiene coordenadas configuradas" };
        }

        // Determine package category from items
        const itemCategories = order.items.map((item) => ({
            packageCategory: item.packageCategoryName || item.product?.packageCategory?.name || null,
            quantity: item.quantity,
        }));
        const orderCategory = await calculateOrderCategory(itemCategories);

        // Read timeout from config
        const timeoutStr = await getConfig("driver_response_timeout_seconds");
        const timeoutSeconds = parseInt(timeoutStr, 10) || 20;
        const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

        // Upsert PendingAssignment
        await prisma.pendingAssignment.upsert({
            where: { orderId },
            update: {
                status: "WAITING",
                attemptNumber: 1,
                expiresAt,
                currentDriverId: null,
            },
            create: {
                orderId,
                status: "WAITING",
                attemptNumber: 1,
                expiresAt,
            },
        });

        // Find next eligible driver
        const driver = await findNextEligibleDriver(
            order.merchant.latitude,
            order.merchant.longitude,
            orderCategory.allowedVehicles,
            []
        );

        if (!driver) {
            await handleNoDriverFound(orderId, order.user.id, order.orderNumber);
            return { success: false, error: "No hay repartidores disponibles en la zona" };
        }

        // Update PendingAssignment with driver
        await prisma.pendingAssignment.update({
            where: { orderId },
            data: { currentDriverId: driver.id },
        });

        // Sync legacy Order fields for backward compat
        await prisma.order.update({
            where: { id: orderId },
            data: {
                pendingDriverId: driver.id,
                assignmentExpiresAt: expiresAt,
                lastAssignmentAt: new Date(),
                assignmentAttempts: { increment: 1 },
            },
        });

        // Calculate delivery details for the offer
        const distanceToMerchant = driver.distance;
        const distanceToCustomer =
            order.address?.latitude && order.address?.longitude
                ? calculateDistance(
                      order.merchant.latitude,
                      order.merchant.longitude,
                      order.address.latitude,
                      order.address.longitude
                  )
                : null;

        const estimatedEarnings = await calculateEstimatedEarnings(orderCategory.category, distanceToMerchant + (distanceToCustomer ?? 0));
        const estimatedTime = estimateTravelTime(distanceToMerchant + (distanceToCustomer ?? 0), driver.vehicleType || "MOTO");
        const productDescription = order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");

        // Push notification to driver
        sendNewOfferNotification(
            driver.userId,
            order.merchant.name || "Comercio",
            estimatedEarnings,
            orderId
        ).catch((err) => console.error("[AssignmentEngine] Push error:", err));

        // Socket event to driver
        emitSocket("new_delivery_offer", `driver:${driver.id}`, {
            orderId,
            orderNumber: order.orderNumber,
            merchantName: order.merchant.name || "Comercio",
            packageCategory: orderCategory.category,
            distanceToMerchant: Math.round(distanceToMerchant * 10) / 10,
            distanceToCustomer: distanceToCustomer != null ? Math.round(distanceToCustomer * 10) / 10 : null,
            estimatedEarnings,
            estimatedTime,
            expiresAt: expiresAt.toISOString(),
            productDescription,
        }).catch((err) => console.error("[AssignmentEngine] Socket error:", err));

        // Notify admin
        emitSocket("assignment_started", "admin:orders", {
            orderId,
            orderNumber: order.orderNumber,
            driverId: driver.id,
            attemptNumber: 1,
        }).catch((err) => console.error("[AssignmentEngine] Socket admin error:", err));

        console.log(
            `[AssignmentEngine] Order ${order.orderNumber} offered to driver ${driver.id} (${driver.distance.toFixed(2)}km away). Expires at ${expiresAt.toISOString()}`
        );

        return { success: true, driverId: driver.id };
    } catch (error) {
        console.error("[AssignmentEngine] Error starting assignment cycle:", error);
        return { success: false, error: "Error interno al asignar repartidor" };
    }
}

/**
 * Process all expired pending assignments (cron tick).
 * Cascades to next driver or marks as UNASSIGNABLE.
 */
export async function processExpiredAssignments(): Promise<number> {
    const now = new Date();

    const expired = await prisma.pendingAssignment.findMany({
        where: {
            status: "WAITING",
            expiresAt: { lt: now },
        },
        include: {
            order: {
                select: {
                    id: true,
                    orderNumber: true,
                    driverId: true,
                    userId: true,
                    merchant: { select: { latitude: true, longitude: true, name: true } },
                    items: {
                        select: {
                            quantity: true,
                            name: true,
                            packageCategoryName: true,
                            product: { select: { packageCategory: { select: { name: true } } } },
                        },
                    },
                    address: { select: { latitude: true, longitude: true } },
                },
            },
        },
    });

    let processed = 0;
    const maxAttemptsStr = await getConfig("max_assignment_attempts").catch(() => "5");
    const maxAttempts = parseInt(maxAttemptsStr, 10) || 5;
    const timeoutStr = await getConfig("driver_response_timeout_seconds").catch(() => "20");
    const timeoutSeconds = parseInt(timeoutStr, 10) || 20;

    for (const assignment of expired) {
        // Skip if order already has a driver (accepted between query and processing)
        if (assignment.order.driverId) {
            await prisma.pendingAssignment.update({
                where: { id: assignment.id },
                data: { status: "COMPLETED" },
            });
            processed++;
            continue;
        }

        // Log the timeout for the current driver
        if (assignment.currentDriverId) {
            await prisma.assignmentLog.create({
                data: {
                    orderId: assignment.orderId,
                    driverId: assignment.currentDriverId,
                    attemptNumber: assignment.attemptNumber,
                    notifiedAt: assignment.updatedAt,
                    respondedAt: now,
                    outcome: "TIMEOUT",
                },
            });
        }

        // Collect all previously attempted driver IDs
        const previousLogs = await prisma.assignmentLog.findMany({
            where: { orderId: assignment.orderId },
            select: { driverId: true },
        });
        const excludeDriverIds = [...new Set(previousLogs.map((l) => l.driverId))];

        if (assignment.attemptNumber >= maxAttempts) {
            await handleNoDriverFound(assignment.orderId, assignment.order.userId, assignment.order.orderNumber);
            console.log(
                `[AssignmentEngine] Order ${assignment.order.orderNumber} reached max attempts (${maxAttempts}). Marked UNASSIGNABLE.`
            );
            processed++;
            continue;
        }

        // Try next driver
        if (!assignment.order.merchant?.latitude || !assignment.order.merchant?.longitude) {
            await handleNoDriverFound(assignment.orderId, assignment.order.userId, assignment.order.orderNumber);
            processed++;
            continue;
        }

        const itemCategories = assignment.order.items.map((item) => ({
            packageCategory: item.packageCategoryName || item.product?.packageCategory?.name || null,
            quantity: item.quantity,
        }));
        const orderCategory = await calculateOrderCategory(itemCategories);

        const nextDriver = await findNextEligibleDriver(
            assignment.order.merchant.latitude,
            assignment.order.merchant.longitude,
            orderCategory.allowedVehicles,
            excludeDriverIds
        );

        if (!nextDriver) {
            await handleNoDriverFound(assignment.orderId, assignment.order.userId, assignment.order.orderNumber);
            console.log(
                `[AssignmentEngine] Order ${assignment.order.orderNumber}: no more eligible drivers. Marked UNASSIGNABLE.`
            );
            processed++;
            continue;
        }

        const newExpiresAt = new Date(Date.now() + timeoutSeconds * 1000);

        // Update PendingAssignment for next attempt
        await prisma.pendingAssignment.update({
            where: { id: assignment.id },
            data: {
                currentDriverId: nextDriver.id,
                attemptNumber: { increment: 1 },
                expiresAt: newExpiresAt,
            },
        });

        // Sync legacy Order fields
        await prisma.order.update({
            where: { id: assignment.orderId },
            data: {
                pendingDriverId: nextDriver.id,
                assignmentExpiresAt: newExpiresAt,
                lastAssignmentAt: new Date(),
                assignmentAttempts: { increment: 1 },
                attemptedDriverIds: excludeDriverIds,
            },
        });

        // Notify next driver
        const estimatedEarnings = await calculateEstimatedEarnings(
            orderCategory.category,
            nextDriver.distance + (assignment.order.address?.latitude && assignment.order.address?.longitude
                ? calculateDistance(
                      assignment.order.merchant.latitude,
                      assignment.order.merchant.longitude,
                      assignment.order.address.latitude,
                      assignment.order.address.longitude
                  )
                : 0)
        );

        sendNewOfferNotification(
            nextDriver.userId,
            assignment.order.merchant.name || "Comercio",
            estimatedEarnings,
            assignment.orderId
        ).catch((err) => console.error("[AssignmentEngine] Push cascade error:", err));

        emitSocket("new_delivery_offer", `driver:${nextDriver.id}`, {
            orderId: assignment.orderId,
            orderNumber: assignment.order.orderNumber,
            merchantName: assignment.order.merchant.name || "Comercio",
            packageCategory: orderCategory.category,
            distanceToMerchant: Math.round(nextDriver.distance * 10) / 10,
            estimatedEarnings,
            expiresAt: newExpiresAt.toISOString(),
        }).catch((err) => console.error("[AssignmentEngine] Socket cascade error:", err));

        console.log(
            `[AssignmentEngine] Timeout cascade for order ${assignment.order.orderNumber}: offered to driver ${nextDriver.id} (attempt ${assignment.attemptNumber + 1})`
        );

        processed++;
    }

    return processed;
}

/**
 * Driver accepts a pending order.
 * Uses Serializable isolation to prevent race conditions.
 */
export async function driverAcceptOrder(
    driverId: string,
    orderId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const result = await prisma.$transaction(
            async (tx) => {
                const order = await tx.order.findUnique({
                    where: { id: orderId },
                    select: {
                        id: true,
                        driverId: true,
                        orderNumber: true,
                        merchantId: true,
                        userId: true,
                        status: true,
                        total: true,
                    },
                });

                if (!order) throw new Error("Pedido no encontrado");
                if (order.driverId) throw new Error("conflict");

                const pending = await tx.pendingAssignment.findUnique({
                    where: { orderId },
                });

                if (!pending || pending.currentDriverId !== driverId) {
                    throw new Error("Este pedido no está asignado a ti");
                }

                if (pending.status !== "WAITING") {
                    throw new Error("La oferta ya no está vigente");
                }

                // 10-second grace window on expiry
                const graceDeadline = new Date(pending.expiresAt.getTime() + 10_000);
                if (new Date() > graceDeadline) {
                    throw new Error("La oferta ha expirado");
                }

                // Accept: update order
                await tx.order.update({
                    where: { id: orderId },
                    data: {
                        driverId,
                        status: "DRIVER_ASSIGNED",
                        deliveryStatus: "DRIVER_ASSIGNED",
                        pendingDriverId: null,
                        assignmentExpiresAt: null,
                    },
                });

                // Mark PendingAssignment as completed
                await tx.pendingAssignment.update({
                    where: { orderId },
                    data: { status: "COMPLETED" },
                });

                // Create AssignmentLog
                await tx.assignmentLog.create({
                    data: {
                        orderId,
                        driverId,
                        attemptNumber: pending.attemptNumber,
                        notifiedAt: pending.updatedAt,
                        respondedAt: new Date(),
                        outcome: "ACCEPTED",
                    },
                });

                // Mark driver as busy
                await tx.driver.update({
                    where: { id: driverId },
                    data: { availabilityStatus: "OCUPADO" },
                });

                return order;
            },
            { isolationLevel: "Serializable" }
        );

        // Fire-and-forget notifications outside transaction
        const socketData = {
            orderId: result.id,
            orderNumber: result.orderNumber,
            status: "DRIVER_ASSIGNED",
            driverId,
        };

        const emitPromises: Promise<void>[] = [];

        if (result.merchantId) {
            emitPromises.push(
                emitSocket("order_status_changed", `merchant:${result.merchantId}`, socketData)
            );
        }
        emitPromises.push(
            emitSocket("order_status_changed", `order:${result.id}`, {
                ...socketData,
                message: "¡Un repartidor va en camino a buscar tu pedido!",
            })
        );
        emitPromises.push(
            emitSocket("order_status_changed", "admin:orders", socketData)
        );

        Promise.allSettled(emitPromises).catch((e) =>
            console.error("[AssignmentEngine] Socket emit error on accept:", e)
        );

        if (result.userId) {
            notifyBuyer(result.userId, "CONFIRMED", result.orderNumber, {
                total: result.total,
                orderId: result.id,
            }).catch((err) =>
                console.error("[AssignmentEngine] Push buyer error:", err)
            );
        }

        console.log(`[AssignmentEngine] Driver ${driverId} accepted order ${result.orderNumber}`);
        return { success: true };
    } catch (error: any) {
        if (error.message === "conflict") {
            return { success: false, error: "conflict" };
        }
        console.error("[AssignmentEngine] Error accepting order:", error);
        return { success: false, error: error.message || "Error al aceptar el pedido" };
    }
}

/**
 * Driver rejects a pending order — immediately try next driver.
 */
export async function driverRejectOrder(
    driverId: string,
    orderId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const pending = await prisma.pendingAssignment.findUnique({
            where: { orderId },
            include: {
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        userId: true,
                        merchant: { select: { latitude: true, longitude: true, name: true } },
                        items: {
                            select: {
                                quantity: true,
                                name: true,
                                packageCategoryName: true,
                                product: { select: { packageCategory: { select: { name: true } } } },
                            },
                        },
                        address: { select: { latitude: true, longitude: true } },
                    },
                },
            },
        });

        if (!pending) return { success: false, error: "No hay oferta pendiente para este pedido" };
        if (pending.currentDriverId !== driverId) {
            return { success: false, error: "Este pedido no está asignado a ti" };
        }

        // Log rejection
        await prisma.assignmentLog.create({
            data: {
                orderId,
                driverId,
                attemptNumber: pending.attemptNumber,
                notifiedAt: pending.updatedAt,
                respondedAt: new Date(),
                outcome: "REJECTED",
            },
        });

        // Collect all attempted driver IDs
        const previousLogs = await prisma.assignmentLog.findMany({
            where: { orderId },
            select: { driverId: true },
        });
        const excludeDriverIds = [...new Set(previousLogs.map((l) => l.driverId))];

        const maxAttemptsStr = await getConfig("max_assignment_attempts").catch(() => "5");
        const maxAttempts = parseInt(maxAttemptsStr, 10) || 5;
        const timeoutStr = await getConfig("driver_response_timeout_seconds").catch(() => "20");
        const timeoutSeconds = parseInt(timeoutStr, 10) || 20;

        if (!pending.order.merchant?.latitude || !pending.order.merchant?.longitude || pending.attemptNumber >= maxAttempts) {
            await handleNoDriverFound(orderId, pending.order.userId, pending.order.orderNumber);
            return { success: true };
        }

        const itemCategories = pending.order.items.map((item) => ({
            packageCategory: item.packageCategoryName || item.product?.packageCategory?.name || null,
            quantity: item.quantity,
        }));
        const orderCategory = await calculateOrderCategory(itemCategories);

        const nextDriver = await findNextEligibleDriver(
            pending.order.merchant.latitude,
            pending.order.merchant.longitude,
            orderCategory.allowedVehicles,
            excludeDriverIds
        );

        if (!nextDriver) {
            await handleNoDriverFound(orderId, pending.order.userId, pending.order.orderNumber);
            return { success: true };
        }

        const newExpiresAt = new Date(Date.now() + timeoutSeconds * 1000);

        // Update PendingAssignment
        await prisma.pendingAssignment.update({
            where: { orderId },
            data: {
                currentDriverId: nextDriver.id,
                attemptNumber: { increment: 1 },
                expiresAt: newExpiresAt,
            },
        });

        // Sync legacy Order fields
        await prisma.order.update({
            where: { id: orderId },
            data: {
                pendingDriverId: nextDriver.id,
                assignmentExpiresAt: newExpiresAt,
                lastAssignmentAt: new Date(),
                attemptedDriverIds: excludeDriverIds,
            },
        });

        // Notify next driver
        const estimatedEarnings = await calculateEstimatedEarnings(orderCategory.category, nextDriver.distance);
        sendNewOfferNotification(
            nextDriver.userId,
            pending.order.merchant.name || "Comercio",
            estimatedEarnings,
            orderId
        ).catch((err) => console.error("[AssignmentEngine] Push reject-cascade error:", err));

        emitSocket("new_delivery_offer", `driver:${nextDriver.id}`, {
            orderId,
            orderNumber: pending.order.orderNumber,
            merchantName: pending.order.merchant.name || "Comercio",
            packageCategory: orderCategory.category,
            distanceToMerchant: Math.round(nextDriver.distance * 10) / 10,
            estimatedEarnings,
            expiresAt: newExpiresAt.toISOString(),
        }).catch((err) => console.error("[AssignmentEngine] Socket reject-cascade error:", err));

        console.log(
            `[AssignmentEngine] Driver ${driverId} rejected order ${pending.order.orderNumber}. Next: driver ${nextDriver.id}`
        );

        return { success: true };
    } catch (error) {
        console.error("[AssignmentEngine] Error rejecting order:", error);
        return { success: false, error: "Error al rechazar el pedido" };
    }
}

// ─── Internal Helpers ───────────────────────────────────────────────────────────

/** Mark order as UNASSIGNABLE and notify ops + customer */
async function handleNoDriverFound(orderId: string, userId: string, orderNumber: string): Promise<void> {
    await prisma.pendingAssignment.update({
        where: { orderId },
        data: { status: "FAILED" },
    }).catch(() => {}); // Ignore if no pending assignment

    await prisma.order.update({
        where: { id: orderId },
        data: {
            status: "UNASSIGNABLE",
            pendingDriverId: null,
            assignmentExpiresAt: null,
        },
    });

    // Notify ops
    notifyOps(
        "⚠️ Pedido sin repartidor",
        `El pedido ${orderNumber} no tiene repartidores disponibles. Requiere asignación manual.`,
        orderId
    ).catch((err) => console.error("[AssignmentEngine] Ops notification error:", err));

    emitSocket("order_unassignable", "admin:orders", { orderId, orderNumber }).catch((err) =>
        console.error("[AssignmentEngine] Socket unassignable error:", err)
    );

    // Also notify the merchant
    const orderForMerchant = await prisma.order.findUnique({
        where: { id: orderId },
        select: { merchantId: true },
    });
    if (orderForMerchant?.merchantId) {
        emitSocket("order_unassignable", `merchant_${orderForMerchant.merchantId}`, { orderId, orderNumber }).catch((err) =>
            console.error("[AssignmentEngine] Socket merchant unassignable error:", err)
        );
    }

    // Notify customer
    notifyBuyer(userId, "CANCELLED", orderNumber, { orderId }).catch((err) =>
        console.error("[AssignmentEngine] Buyer notification error:", err)
    );
}

/** Calculate estimated driver earnings from DeliveryRate */
async function calculateEstimatedEarnings(categoryName: string, totalDistanceKm: number): Promise<number> {
    const category = await prisma.packageCategory.findUnique({
        where: { name: categoryName },
        include: { deliveryRate: true },
    });

    if (category?.deliveryRate) {
        return Math.round(category.deliveryRate.basePriceArs + category.deliveryRate.pricePerKmArs * totalDistanceKm);
    }

    // Fallback if no rate configured
    return Math.round(500 + totalDistanceKm * 300);
}
