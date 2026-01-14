// Delivery Cost Calculator
// Calculates shipping cost based on fuel price, distance, and maintenance factor

export interface DeliverySettings {
    fuelPricePerLiter: number;  // Current fuel price in ARS
    fuelConsumptionPerKm: number;  // Liters per km (e.g., 0.06 for moto)
    baseDeliveryFee: number;  // Minimum fee per trip
    maintenanceFactor: number;  // Multiplier for maintenance/profit (e.g., 1.35 = 35%)
    freeDeliveryMinimum: number | null;  // Order amount for free delivery
    maxDeliveryDistance: number;  // Max km for delivery
    originLat: number;  // Store latitude
    originLng: number;  // Store longitude
}

export interface DeliveryCostResult {
    distanceKm: number;
    baseCost: number;
    fuelCost: number;
    subtotal: number;
    maintenanceMarkup: number;
    totalCost: number;
    isFreeDelivery: boolean;
    isWithinRange: boolean;
}

/**
 * Calculate distance between two points using Haversine formula
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

/**
 * Calculate delivery cost based on distance and settings
 * Formula: (base + (distance * 2 * consumption * fuelPrice)) * maintenanceFactor
 */
export function calculateDeliveryCost(
    distanceKm: number,
    settings: DeliverySettings,
    orderTotal: number
): DeliveryCostResult {
    // Check if within delivery range
    const isWithinRange = distanceKm <= settings.maxDeliveryDistance;

    // Check if order qualifies for free delivery
    const isFreeDelivery = settings.freeDeliveryMinimum !== null &&
        orderTotal >= settings.freeDeliveryMinimum;

    if (isFreeDelivery) {
        return {
            distanceKm,
            baseCost: 0,
            fuelCost: 0,
            subtotal: 0,
            maintenanceMarkup: 0,
            totalCost: 0,
            isFreeDelivery: true,
            isWithinRange,
        };
    }

    // Calculate round trip distance
    const roundTripKm = distanceKm * 2;

    // Calculate fuel cost
    const fuelCost = roundTripKm * settings.fuelConsumptionPerKm * settings.fuelPricePerLiter;

    // Subtotal before maintenance factor
    const subtotal = settings.baseDeliveryFee + fuelCost;

    // Apply maintenance factor
    const maintenanceMarkup = subtotal * (settings.maintenanceFactor - 1);
    const totalCost = subtotal * settings.maintenanceFactor;

    return {
        distanceKm,
        baseCost: settings.baseDeliveryFee,
        fuelCost,
        subtotal,
        maintenanceMarkup,
        totalCost: Math.ceil(totalCost), // Round up to nearest peso
        isFreeDelivery: false,
        isWithinRange,
    };
}

/**
 * Format price in Argentine Pesos
 */
export function formatPrice(price: number): string {
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price);
}

