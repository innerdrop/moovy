/**
 * Delivery chat utilities for buyer-driver coordination
 * Handles proximity detection, ETA calculation, and delivery context formatting
 */

export interface DeliveryContext {
    latitude?: number;
    longitude?: number;
    distanceKm?: number;
    estimatedMinutes?: number;
    status?: "approaching" | "arrived" | "in_pickup" | "in_delivery";
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export function calculateDistance(
    driverLat: number,
    driverLng: number,
    destLat: number,
    destLng: number
): number {
    const R = 6371; // Earth's radius in km
    const lat1Rad = (driverLat * Math.PI) / 180;
    const lat2Rad = (destLat * Math.PI) / 180;
    const deltaLat = ((destLat - driverLat) * Math.PI) / 180;
    const deltaLng = ((destLng - driverLng) * Math.PI) / 180;

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Estimate delivery time based on distance
 * Assumes average delivery speed of 25 km/h in urban areas
 */
export function estimateDeliveryMinutes(distanceKm: number): number {
    const avgSpeedKmH = 25; // Conservative urban speed
    const minutes = Math.ceil((distanceKm / avgSpeedKmH) * 60);
    return Math.max(1, minutes); // Minimum 1 minute
}

/**
 * Determine driver proximity status based on distance
 */
export function getProximityStatus(
    distanceKm: number
): "arrived" | "approaching" | "in_delivery" {
    if (distanceKm < 0.05) return "arrived"; // Less than 50 meters = arrived
    if (distanceKm < 0.5) return "approaching"; // Less than 500 meters = approaching
    return "in_delivery"; // More than 500 meters = in delivery
}

/**
 * Build delivery context for chat header
 * Used in OrderChatPanel when BUYER_DRIVER chat is active
 */
export function buildDeliveryContext(
    driverLat?: number,
    driverLng?: number,
    destLat?: number,
    destLng?: number,
    orderStatus?: string
): DeliveryContext {
    if (!driverLat || !driverLng || !destLat || !destLng) {
        return {};
    }

    const distanceKm = calculateDistance(driverLat, driverLng, destLat, destLng);
    const estimatedMinutes = estimateDeliveryMinutes(distanceKm);
    const status = getProximityStatus(distanceKm);

    return {
        latitude: driverLat,
        longitude: driverLng,
        distanceKm,
        estimatedMinutes,
        status,
    };
}

/**
 * Check if driver is close enough to trigger auto-message
 * Default threshold: 200 meters (0.2 km)
 */
export function isDriverNearby(distanceKm?: number, thresholdKm: number = 0.2): boolean {
    return distanceKm !== undefined && distanceKm < thresholdKm;
}

/**
 * Generate auto-message when driver is nearby
 */
export function generateNearbyAutoMessage(driverName?: string): string {
    const messages = [
        `${driverName || "Tu repartidor"} está muy cerca. Te llamamos para completar la entrega.`,
        `${driverName || "El repartidor"} está próximo a tu domicilio.`,
        `¡${driverName || "Tu repartidor"} está llegando! Prepárate para recibir tu pedido.`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Format delivery time for display
 * E.g., "5 min", "Llegó"
 */
export function formatDeliveryTime(estimatedMinutes?: number, status?: string): string {
    if (status === "arrived") return "📍 Llegó";
    if (status === "approaching") return "⏱️ Casi aquí";
    if (estimatedMinutes) return `⏱️ ~${estimatedMinutes} min`;
    return "";
}
