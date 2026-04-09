// Assignment Engine — Driver assignment with PostGIS, rating priority, and race condition prevention
// Replaces the legacy logistics.ts assignment logic
//
// P0 improvements (2026-03-20):
// - ShipmentType filtering: HOT orders can't go on BIKE without thermal bag
// - Vehicle type normalization: "bicicleta" → "BIKE" for consistent matching
// - Order priority queue: HOT orders are assigned before STANDARD
// - Compatible vehicles = intersection of PackageCategory + ShipmentType

import { prisma } from "./prisma";
import { calculateDistance, estimateTravelTime } from "./geo";
import { sendNewOfferNotification, sendPushToUser } from "./push";
import { notifyBuyer } from "./notifications";
import { normalizeVehicleType } from "./vehicle-type-mapping";
import { getCompatibleVehicles, getShipmentType, autoDetectShipmentType, type ShipmentTypeCode } from "./shipment-types";
import { prioritizeOrders, type OrderForPriority } from "./order-priority";
import { deliveryLogger } from "./logger";

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
    /** Tipo de envío detectado (HOT, FRESH, etc.) */
    shipmentTypeCode: ShipmentTypeCode;
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

/** Read a MoovyConfig value by key (returns defaultValue if not found) */
async function getConfig(key: string, defaultValue?: string): Promise<string> {
    const config = await prisma.moovyConfig.findUnique({ where: { key } });
    if (!config) {
        if (defaultValue !== undefined) {
            deliveryLogger.warn({ key, defaultValue }, "MoovyConfig key not found, using default");
            return defaultValue;
        }
        throw new Error(`MoovyConfig key "${key}" not found`);
    }
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
            (err) => deliveryLogger.error({ error: err }, "Ops notification error")
        );
    }
}

/**
 * Calculate estimated driver earnings for an order.
 * Uses DeliveryRate from DB (base + per-km) × 80% riderCommission (Biblia v3).
 * Falls back to sensible defaults if DB rates unavailable.
 */
async function calculateEstimatedEarnings(
    packageCategory: string,
    totalDistanceKm: number
): Promise<number> {
    // Default rates per Biblia v3 (base + per-km, driver gets 80%)
    const FALLBACK_RATES: Record<string, { base: number; perKm: number }> = {
        MICRO: { base: 800, perKm: 73 },
        SMALL: { base: 1200, perKm: 73 },
        MEDIUM: { base: 2500, perKm: 193 },
        LARGE: { base: 3500, perKm: 222 },
        XL: { base: 5000, perKm: 269 },
        FREIGHT: { base: 8000, perKm: 329 },
    };

    try {
        const deliveryRate = await prisma.deliveryRate.findFirst({
            where: {
                category: { name: packageCategory.toUpperCase() },
                isActive: true,
            },
        });

        const base = deliveryRate?.basePriceArs ?? (FALLBACK_RATES[packageCategory.toUpperCase()]?.base ?? 1500);
        const perKm = deliveryRate?.pricePerKmArs ?? (FALLBACK_RATES[packageCategory.toUpperCase()]?.perKm ?? 73);

        // Trip cost × factor 2.2 (ida + vuelta + espera) × 80% para el driver
        const tripCost = Math.max(base, perKm * totalDistanceKm * 2.2);
        const driverEarnings = Math.round(tripCost * 0.80);

        return driverEarnings;
    } catch (err) {
        deliveryLogger.warn({ packageCategory, totalDistanceKm, error: err }, "Error calculating earnings, using fallback");
        const fallback = FALLBACK_RATES[packageCategory.toUpperCase()] ?? FALLBACK_RATES.MEDIUM;
        const tripCost = Math.max(fallback.base, fallback.perKm * totalDistanceKm * 2.2);
        return Math.round(tripCost * 0.80);
    }
}

// ─── Core Functions ─────────────────────────────────────────────────────────────

/**
 * Calculate the aggregate package category for an order based on its items.
 * Each item's packageCategory is looked up in the PackageCategory table for its volumeScore.
 * Items without a packageCategory default to MICRO.
 *
 * P0: Now also considers ShipmentType to restrict vehicles further.
 * For example, a HOT order can't go on TRUCK, and FRAGILE can't go on BIKE.
 *
 * P0: Also considers the max individual item's category to prevent sending
 * a BIKE for a LARGE item even if the total score is SMALL.
 */
export async function calculateOrderCategory(
    items: Array<{ packageCategory?: string | null; quantity: number; name?: string }>,
    options?: {
        /** Código de ShipmentType (HOT, FRESH, etc.). Si no se pasa, usa STANDARD. */
        shipmentTypeCode?: ShipmentTypeCode | string;
        /** Categoría del merchant (para auto-detección de ShipmentType) */
        merchantCategoryName?: string | null;
    }
): Promise<OrderCategory> {
    const categories = await prisma.packageCategory.findMany({ where: { isActive: true } });
    const scoreMap = new Map(categories.map((c) => [c.name, c.volumeScore]));
    const vehicleMap = new Map(categories.map((c) => [c.name, c.allowedVehicles as string[]]));

    let totalScore = 0;
    let maxItemScore = 0;

    for (const item of items) {
        const catName = item.packageCategory || "MICRO";
        const score = scoreMap.get(catName) ?? 1; // default to MICRO score
        totalScore += score * item.quantity;
        // P0: Track max individual item score for vehicle restriction
        maxItemScore = Math.max(maxItemScore, score);
    }

    // Derive final category from totalScore
    const derived = SCORE_THRESHOLDS.find((t) => totalScore <= t.max)!;

    // P0: Also derive category from max individual item
    const maxItemDerived = SCORE_THRESHOLDS.find((t) => maxItemScore <= t.max)!;

    // Use the most restrictive vehicle set between total score and max item score
    const totalVehicles = vehicleMap.get(derived.category) ?? ["BIKE", "MOTO", "CAR", "TRUCK"];
    const maxItemVehicles = vehicleMap.get(maxItemDerived.category) ?? ["BIKE", "MOTO", "CAR", "TRUCK"];

    // Intersection: only vehicles that can handle both the total AND the biggest item
    const packageVehicles = totalVehicles.filter((v) => maxItemVehicles.includes(v));

    // P0: Auto-detect ShipmentType if not provided
    const shipmentTypeCode = (options?.shipmentTypeCode as ShipmentTypeCode) ||
        autoDetectShipmentType({
            merchantCategoryName: options?.merchantCategoryName,
            productNames: items.map((i) => i.name || "").filter(Boolean),
        });

    // P0: Restrict vehicles further by ShipmentType
    const allowedVehicles = getCompatibleVehicles(
        packageVehicles.length > 0 ? packageVehicles : totalVehicles,
        shipmentTypeCode
    );

    // Fallback: if no vehicles are compatible (shouldn't happen), use package category vehicles
    const finalVehicles = allowedVehicles.length > 0 ? allowedVehicles : totalVehicles;

    return {
        category: derived.category,
        totalScore,
        allowedVehicles: finalVehicles,
        shipmentTypeCode: shipmentTypeCode as ShipmentTypeCode,
    };
}

/**
 * Find the next eligible driver sorted by distance, with rating priority within a radius.
 * Uses PostGIS with Haversine fallback.
 *
 * P0: Vehicle type normalization — the PostGIS query now matches against both
 * enum values (BIKE, MOTO, CAR, TRUCK) and spanish values (bicicleta, moto, auto, camioneta)
 * to handle the naming inconsistency between driver registration and assignment engine.
 */
export async function findNextEligibleDriver(
    merchantLat: number,
    merchantLng: number,
    requiredVehicles: string[],
    excludeDriverIds: string[]
): Promise<DriverWithDistance | null> {
    const ratingRadiusStr = await getConfig("assignment_rating_radius_meters", "300");
    const ratingRadius = parseInt(ratingRadiusStr, 10) || 300;

    const searchRadiusStr = await getConfig("driver_search_radius_meters").catch(() => "50000");
    const searchRadius = parseInt(searchRadiusStr, 10) || 50000;

    // Ensure excludeDriverIds is never empty for SQL ANY() — use a dummy value
    const excludeIds = excludeDriverIds.length > 0 ? excludeDriverIds : ["none"];

    // P0 FIX: Expand requiredVehicles to include Spanish equivalents
    // Drivers registered with "bicicleta" need to match against "BIKE" requirement
    const ENUM_TO_SPANISH: Record<string, string> = {
        BIKE: "bicicleta", MOTO: "moto", CAR: "auto", TRUCK: "camioneta",
    };
    const expandedVehicles = [
        ...requiredVehicles,
        ...requiredVehicles
            .map((v) => ENUM_TO_SPANISH[v])
            .filter(Boolean),
        // Also include uppercase spanish variants (BICICLETA, etc.)
        ...requiredVehicles
            .map((v) => ENUM_TO_SPANISH[v]?.toUpperCase())
            .filter(Boolean),
    ];
    // Dedupe
    const allVehicleVariants = [...new Set(expandedVehicles)];

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
                AND d."vehicleType" = ANY(${allVehicleVariants})
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
            // P0 FIX: Normalize vehicleType to enum for consistent downstream usage
            vehicleType: normalizeVehicleType(d.vehicleType) ?? d.vehicleType,
            rating: d.rating != null ? Number(d.rating) : null,
            distance: Number(d.distance),
        };
    } catch (error) {
        deliveryLogger.error({ error }, "PostGIS query failed, falling back to Haversine");

        // Haversine fallback
        // P0 FIX: Use expanded vehicle variants for Haversine fallback too
        const drivers = await prisma.driver.findMany({
            where: {
                isOnline: true,
                isActive: true,
                latitude: { not: null },
                longitude: { not: null },
                vehicleType: { in: allVehicleVariants },
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
                // P0 FIX: Normalize vehicleType to enum
                vehicleType: normalizeVehicleType(driver.vehicleType) ?? driver.vehicleType,
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
                merchant: {
                    select: {
                        latitude: true,
                        longitude: true,
                        name: true,
                        // P0: category is a scalar String field
                        category: true,
                    },
                },
                items: {
                    select: {
                        quantity: true,
                        name: true,
                        packageCategoryName: true,
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
        // P0: Include item names for ShipmentType auto-detection
        const itemCategories = order.items.map((item) => ({
            packageCategory: item.packageCategoryName || null,
            quantity: item.quantity,
            name: item.name || undefined,
        }));
        const orderCategory = await calculateOrderCategory(itemCategories, {
            merchantCategoryName: order.merchant?.category ?? undefined,
        });

        // Read timeout from config
        const timeoutStr = await getConfig("driver_response_timeout_seconds", "20");
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
        ).catch((err) => deliveryLogger.error({ error: err }, "Push error"));

        // P0: Get shipment type info for the offer
        const shipmentType = getShipmentType(orderCategory.shipmentTypeCode);

        // Socket event to driver
        emitSocket("orden_pendiente", `driver:${driver.id}`, {
            orderId,
            orderNumber: order.orderNumber,
            merchantName: order.merchant.name || "Comercio",
            packageCategory: orderCategory.category,
            // P0: Include shipment type info in the offer
            shipmentTypeCode: orderCategory.shipmentTypeCode,
            shipmentTypeName: shipmentType.name,
            shipmentTypeIcon: shipmentType.icon,
            requiresThermalBag: shipmentType.requiresThermalBag,
            maxDeliveryMinutes: shipmentType.maxDeliveryMinutes,
            distanceToMerchant: Math.round(distanceToMerchant * 10) / 10,
            distanceToCustomer: distanceToCustomer != null ? Math.round(distanceToCustomer * 10) / 10 : null,
            estimatedEarnings,
            estimatedTime,
            expiresAt: expiresAt.toISOString(),
            productDescription,
        }).catch((err) => deliveryLogger.error({ error: err }, "Socket error emitting new order offer"));

        // Notify admin
        emitSocket("assignment_started", "admin:orders", {
            orderId,
            orderNumber: order.orderNumber,
            driverId: driver.id,
            attemptNumber: 1,
        }).catch((err) => deliveryLogger.error({ error: err }, "Socket error notifying admin"));

        deliveryLogger.info(
            { orderId, orderNumber: order.orderNumber, driverId: driver.id, distanceKm: driver.distance.toFixed(2), expiresAt: expiresAt.toISOString() },
            "Order offered to driver"
        );

        return { success: true, driverId: driver.id };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        const errStack = error instanceof Error ? error.stack : undefined;
        deliveryLogger.error({ error: errMsg, stack: errStack }, "Error starting assignment cycle");
        return { success: false, error: "Error interno al asignar repartidor" };
    }
}

/**
 * Start the assignment cycle for a single SubOrder (multi-vendor delivery).
 * Uses SubOrder's own assignment fields instead of PendingAssignment.
 * Includes smart batching: if another SubOrder from the same parent order
 * has a merchant within batchRadiusKm AND combined volume fits the vehicle,
 * the same driver is offered both.
 */
export async function startSubOrderAssignmentCycle(
    subOrderId: string
): Promise<{ success: boolean; driverId?: string; batchedSubOrderIds?: string[]; error?: string }> {
    try {
        const subOrder = await prisma.subOrder.findUnique({
            where: { id: subOrderId },
            include: {
                merchant: {
                    select: { latitude: true, longitude: true, name: true, category: true },
                },
                seller: {
                    select: { id: true, displayName: true },
                },
                items: {
                    select: { quantity: true, name: true, packageCategoryName: true },
                },
                order: {
                    select: {
                        id: true,
                        orderNumber: true,
                        userId: true,
                        addressId: true,
                        address: { select: { latitude: true, longitude: true, street: true, number: true } },
                        isMultiVendor: true,
                    },
                },
            },
        });

        if (!subOrder) return { success: false, error: "SubOrder no encontrado" };
        if (subOrder.driverId) return { success: false, error: "La sub-orden ya tiene repartidor asignado" };

        // Determine origin coordinates (merchant or seller's merchant)
        const merchantLat = subOrder.merchant?.latitude;
        const merchantLng = subOrder.merchant?.longitude;

        if (!merchantLat || !merchantLng) {
            return { success: false, error: "El comercio de la sub-orden no tiene coordenadas configuradas" };
        }

        // Calculate package category from SubOrder items
        const itemCategories = subOrder.items.map((item) => ({
            packageCategory: item.packageCategoryName || null,
            quantity: item.quantity,
            name: item.name || undefined,
        }));
        const subOrderCategory = await calculateOrderCategory(itemCategories, {
            merchantCategoryName: subOrder.merchant?.category ?? undefined,
        });

        // --- Smart Batching: check sibling SubOrders ---
        const batchRadiusKm = 3; // configurable in the future
        let batchedSubOrderIds: string[] = [];
        let combinedVehicles = subOrderCategory.allowedVehicles;

        if (subOrder.order.isMultiVendor) {
            const siblingSubOrders = await prisma.subOrder.findMany({
                where: {
                    orderId: subOrder.order.id,
                    id: { not: subOrderId },
                    driverId: null, // Not yet assigned
                    status: { in: ["PENDING", "PREPARING"] },
                },
                include: {
                    merchant: {
                        select: { latitude: true, longitude: true, name: true, category: true },
                    },
                    items: {
                        select: { quantity: true, name: true, packageCategoryName: true },
                    },
                },
            });

            for (const sibling of siblingSubOrders) {
                if (!sibling.merchant?.latitude || !sibling.merchant?.longitude) continue;

                // Check distance between merchants
                const dist = calculateDistance(
                    merchantLat, merchantLng,
                    sibling.merchant.latitude, sibling.merchant.longitude
                );

                if (dist <= batchRadiusKm) {
                    // Calculate combined volume
                    const siblingItems = sibling.items.map((item) => ({
                        packageCategory: item.packageCategoryName || null,
                        quantity: item.quantity,
                        name: item.name || undefined,
                    }));
                    const combinedItems = [...itemCategories, ...siblingItems];
                    const combinedCategory = await calculateOrderCategory(combinedItems, {
                        merchantCategoryName: subOrder.merchant?.category ?? undefined,
                    });

                    // If combined volume still fits in at least one vehicle type, batch them
                    if (combinedCategory.allowedVehicles.length > 0) {
                        batchedSubOrderIds.push(sibling.id);
                        combinedVehicles = combinedCategory.allowedVehicles;
                        deliveryLogger.info(
                            {
                                subOrderId,
                                siblingId: sibling.id,
                                distance: dist.toFixed(2),
                                combinedCategory: combinedCategory.category,
                                combinedVehicles,
                            },
                            "Smart batch: sibling SubOrder qualifies for same driver"
                        );
                    } else {
                        deliveryLogger.info(
                            { subOrderId, siblingId: sibling.id, distance: dist.toFixed(2) },
                            "Smart batch: sibling too heavy for single vehicle, assigning separately"
                        );
                    }
                }
            }
        }

        // Read timeout from config
        const timeoutStr = await getConfig("driver_response_timeout_seconds", "20");
        const timeoutSeconds = parseInt(timeoutStr, 10) || 20;
        const expiresAt = new Date(Date.now() + timeoutSeconds * 1000);

        // Find next eligible driver (using combined vehicles if batching)
        const vehiclesToUse = batchedSubOrderIds.length > 0 ? combinedVehicles : subOrderCategory.allowedVehicles;
        const attemptedIds = (subOrder.attemptedDriverIds as string[]) || [];

        const driver = await findNextEligibleDriver(
            merchantLat,
            merchantLng,
            vehiclesToUse,
            attemptedIds
        );

        if (!driver) {
            // Update SubOrder as unassignable
            await prisma.subOrder.update({
                where: { id: subOrderId },
                data: {
                    pendingDriverId: null,
                    assignmentExpiresAt: null,
                },
            });

            notifyOps(
                "⚠️ Sub-orden sin repartidor",
                `La sub-orden del pedido ${subOrder.order.orderNumber} (${subOrder.merchant?.name || "Vendedor"}) no tiene repartidores disponibles.`,
                subOrder.order.id
            ).catch((err) => deliveryLogger.error({ error: err }, "Ops notification error"));

            return { success: false, error: "No hay repartidores disponibles en la zona" };
        }

        // Update SubOrder with pending driver
        await prisma.subOrder.update({
            where: { id: subOrderId },
            data: {
                pendingDriverId: driver.id,
                assignmentExpiresAt: expiresAt,
                assignmentAttempts: { increment: 1 },
                attemptedDriverIds: [...attemptedIds, driver.id],
            },
        });

        // If batching, also mark sibling SubOrders with the same pending driver
        if (batchedSubOrderIds.length > 0) {
            await prisma.subOrder.updateMany({
                where: { id: { in: batchedSubOrderIds } },
                data: {
                    pendingDriverId: driver.id,
                    assignmentExpiresAt: expiresAt,
                    assignmentAttempts: { increment: 1 },
                },
            });
        }

        // Calculate delivery details for the offer
        const distanceToMerchant = driver.distance;
        const distanceToCustomer =
            subOrder.order.address?.latitude && subOrder.order.address?.longitude
                ? calculateDistance(
                      merchantLat,
                      merchantLng,
                      subOrder.order.address.latitude,
                      subOrder.order.address.longitude
                  )
                : null;

        const estimatedEarnings = await calculateEstimatedEarnings(
            subOrderCategory.category,
            distanceToMerchant + (distanceToCustomer ?? 0)
        );
        const estimatedTime = estimateTravelTime(
            distanceToMerchant + (distanceToCustomer ?? 0),
            driver.vehicleType || "MOTO"
        );
        const productDescription = subOrder.items.map((i) => `${i.quantity}x ${i.name}`).join(", ");

        // Push notification to driver
        const merchantName = subOrder.merchant?.name || subOrder.seller?.displayName || "Comercio";
        sendNewOfferNotification(
            driver.userId,
            merchantName,
            estimatedEarnings,
            subOrder.order.id
        ).catch((err) => deliveryLogger.error({ error: err }, "Push error (SubOrder)"));

        // Shipment type info
        const shipmentType = getShipmentType(subOrderCategory.shipmentTypeCode);

        // Socket event to driver
        emitSocket("orden_pendiente", `driver:${driver.id}`, {
            orderId: subOrder.order.id,
            subOrderId,
            orderNumber: subOrder.order.orderNumber,
            merchantName,
            packageCategory: subOrderCategory.category,
            shipmentTypeCode: subOrderCategory.shipmentTypeCode,
            shipmentTypeName: shipmentType.name,
            shipmentTypeIcon: shipmentType.icon,
            requiresThermalBag: shipmentType.requiresThermalBag,
            maxDeliveryMinutes: shipmentType.maxDeliveryMinutes,
            distanceToMerchant: Math.round(distanceToMerchant * 10) / 10,
            distanceToCustomer: distanceToCustomer != null ? Math.round(distanceToCustomer * 10) / 10 : null,
            estimatedEarnings,
            estimatedTime,
            expiresAt: expiresAt.toISOString(),
            productDescription,
            isMultiVendor: true,
            batchedCount: batchedSubOrderIds.length + 1,
        }).catch((err) => deliveryLogger.error({ error: err }, "Socket error (SubOrder)"));

        // Notify admin
        emitSocket("assignment_started", "admin:orders", {
            orderId: subOrder.order.id,
            subOrderId,
            orderNumber: subOrder.order.orderNumber,
            merchantName,
            driverId: driver.id,
            attemptNumber: subOrder.assignmentAttempts + 1,
            isSubOrder: true,
            batchedCount: batchedSubOrderIds.length + 1,
        }).catch((err) => deliveryLogger.error({ error: err }, "Socket admin error (SubOrder)"));

        deliveryLogger.info(
            {
                subOrderId,
                orderId: subOrder.order.id,
                orderNumber: subOrder.order.orderNumber,
                merchantName,
                driverId: driver.id,
                distanceKm: driver.distance.toFixed(2),
                batchedSubOrders: batchedSubOrderIds,
            },
            "SubOrder offered to driver"
        );

        return {
            success: true,
            driverId: driver.id,
            batchedSubOrderIds: batchedSubOrderIds.length > 0 ? batchedSubOrderIds : undefined,
        };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        const errStack = error instanceof Error ? error.stack : undefined;
        deliveryLogger.error({ error: errMsg, stack: errStack, subOrderId }, "Error starting SubOrder assignment cycle");
        return { success: false, error: "Error interno al asignar repartidor para sub-orden" };
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
                    createdAt: true,
                    assignmentAttempts: true,
                    deliveryType: true,
                    scheduledSlotStart: true,
                    merchant: {
                        select: {
                            latitude: true,
                            longitude: true,
                            name: true,
                            // P0: category is a scalar String field
                            category: true,
                        },
                    },
                    items: {
                        select: {
                            quantity: true,
                            name: true,
                            packageCategoryName: true,
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

    // P0: Prioritize orders by urgency (HOT first, then by wait time)
    const ordersForPriority: OrderForPriority[] = expired.map((a) => ({
        id: a.orderId,
        createdAt: a.order.createdAt,
        assignmentAttempts: a.order.assignmentAttempts || 0,
        deliveryType: a.order.deliveryType,
        scheduledSlotStart: a.order.scheduledSlotStart,
        // ShipmentType will be auto-detected during processing
    }));
    const prioritized = prioritizeOrders(ordersForPriority);
    const priorityMap = new Map(prioritized.map((p) => [p.orderId, p.priority]));

    // Sort expired assignments by priority (highest first)
    const sortedExpired = [...expired].sort((a, b) => {
        const priorityA = priorityMap.get(a.orderId) ?? 0;
        const priorityB = priorityMap.get(b.orderId) ?? 0;
        return priorityB - priorityA;
    });

    for (const assignment of sortedExpired) {
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
            deliveryLogger.info(
                { orderId: assignment.orderId, orderNumber: assignment.order.orderNumber, maxAttempts },
                "Order reached max attempts. Marked UNASSIGNABLE."
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

        // P0: Include item names and merchant category for ShipmentType auto-detection
        const itemCategories = assignment.order.items.map((item) => ({
            packageCategory: item.packageCategoryName || null,
            quantity: item.quantity,
            name: item.name || undefined,
        }));
        const orderCategory = await calculateOrderCategory(itemCategories, {
            merchantCategoryName: assignment.order.merchant?.category ?? undefined,
        });

        const nextDriver = await findNextEligibleDriver(
            assignment.order.merchant.latitude,
            assignment.order.merchant.longitude,
            orderCategory.allowedVehicles,
            excludeDriverIds
        );

        if (!nextDriver) {
            await handleNoDriverFound(assignment.orderId, assignment.order.userId, assignment.order.orderNumber);
            deliveryLogger.info(
                { orderId: assignment.orderId, orderNumber: assignment.order.orderNumber },
                "No more eligible drivers. Marked UNASSIGNABLE."
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

        // P0: Include shipment type info in cascade offers
        const cascadeShipmentType = getShipmentType(orderCategory.shipmentTypeCode);

        sendNewOfferNotification(
            nextDriver.userId,
            assignment.order.merchant.name || "Comercio",
            estimatedEarnings,
            assignment.orderId
        ).catch((err) => deliveryLogger.error({ error: err }, "Push cascade error"));

        emitSocket("orden_pendiente", `driver:${nextDriver.id}`, {
            orderId: assignment.orderId,
            orderNumber: assignment.order.orderNumber,
            merchantName: assignment.order.merchant.name || "Comercio",
            packageCategory: orderCategory.category,
            shipmentTypeCode: orderCategory.shipmentTypeCode,
            shipmentTypeName: cascadeShipmentType.name,
            shipmentTypeIcon: cascadeShipmentType.icon,
            requiresThermalBag: cascadeShipmentType.requiresThermalBag,
            maxDeliveryMinutes: cascadeShipmentType.maxDeliveryMinutes,
            distanceToMerchant: Math.round(nextDriver.distance * 10) / 10,
            estimatedEarnings,
            expiresAt: newExpiresAt.toISOString(),
        }).catch((err) => deliveryLogger.error({ error: err }, "Socket cascade error"));

        deliveryLogger.info(
            { orderId: assignment.orderId, orderNumber: assignment.order.orderNumber, driverId: nextDriver.id, attempt: assignment.attemptNumber + 1 },
            "Timeout cascade: offered to next driver"
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
            deliveryLogger.error({ error: e }, "Socket emit error on accept")
        );

        if (result.userId) {
            notifyBuyer(result.userId, "CONFIRMED", result.orderNumber, {
                total: result.total,
                orderId: result.id,
            }).catch((err) =>
                deliveryLogger.error({ error: err }, "Push buyer error")
            );
        }

        deliveryLogger.info({ driverId, orderId: result.id, orderNumber: result.orderNumber }, "Driver accepted order");
        return { success: true };
    } catch (error: any) {
        if (error.message === "conflict") {
            return { success: false, error: "conflict" };
        }
        deliveryLogger.error({ driverId, error }, "Error accepting order");
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
                        merchant: {
                            select: {
                                latitude: true,
                                longitude: true,
                                name: true,
                                // P0: category is a scalar String field
                                category: true,
                            },
                        },
                        items: {
                            select: {
                                quantity: true,
                                name: true,
                                packageCategoryName: true,
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

        // P0: Include item names for ShipmentType auto-detection
        const itemCategories = pending.order.items.map((item) => ({
            packageCategory: item.packageCategoryName || null,
            quantity: item.quantity,
            name: item.name || undefined,
        }));
        const orderCategory = await calculateOrderCategory(itemCategories, {
            merchantCategoryName: pending.order.merchant?.category ?? undefined,
        });

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

        // Sync legacy Order fields (including assignmentAttempts to match PendingAssignment)
        await prisma.order.update({
            where: { id: orderId },
            data: {
                pendingDriverId: nextDriver.id,
                assignmentExpiresAt: newExpiresAt,
                lastAssignmentAt: new Date(),
                assignmentAttempts: { increment: 1 },
                attemptedDriverIds: excludeDriverIds,
            },
        });

        // Notify next driver
        const estimatedEarnings = await calculateEstimatedEarnings(orderCategory.category, nextDriver.distance);
        // P0: Include shipment type info in reject-cascade offers
        const rejectShipmentType = getShipmentType(orderCategory.shipmentTypeCode);

        sendNewOfferNotification(
            nextDriver.userId,
            pending.order.merchant.name || "Comercio",
            estimatedEarnings,
            orderId
        ).catch((err) => deliveryLogger.error({ error: err }, "Push reject-cascade error"));

        emitSocket("orden_pendiente", `driver:${nextDriver.id}`, {
            orderId,
            orderNumber: pending.order.orderNumber,
            merchantName: pending.order.merchant.name || "Comercio",
            packageCategory: orderCategory.category,
            shipmentTypeCode: orderCategory.shipmentTypeCode,
            shipmentTypeName: rejectShipmentType.name,
            shipmentTypeIcon: rejectShipmentType.icon,
            requiresThermalBag: rejectShipmentType.requiresThermalBag,
            maxDeliveryMinutes: rejectShipmentType.maxDeliveryMinutes,
            distanceToMerchant: Math.round(nextDriver.distance * 10) / 10,
            estimatedEarnings,
            expiresAt: newExpiresAt.toISOString(),
        }).catch((err) => deliveryLogger.error({ error: err }, "Socket reject-cascade error"));

        deliveryLogger.info(
            { driverId, orderId: pending.orderId, orderNumber: pending.order.orderNumber, nextDriverId: nextDriver.id },
            "Driver rejected order. Offering to next driver."
        );

        return { success: true };
    } catch (error) {
        deliveryLogger.error({ driverId, error }, "Error rejecting order");
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
    ).catch((err) => deliveryLogger.error({ error: err }, "Ops notification error"));

    emitSocket("order_unassignable", "admin:orders", { orderId, orderNumber }).catch((err) =>
        deliveryLogger.error({ error: err }, "Socket emit unassignable error")
    );

    // Notify buyer
    notifyBuyer(userId, "UNASSIGNABLE", orderNumber, { orderId }).catch((err) =>
        deliveryLogger.error({ error: err }, "Buyer notification error (unassignable)")
    );

    deliveryLogger.warn({ orderId, orderNumber }, "Order marked as UNASSIGNABLE — no drivers available");
}