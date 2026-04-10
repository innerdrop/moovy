// Delivery Cost Calculator — Biblia Financiera v3
// Formula: fee = max(MINIMO, costo_km × distancia × 2.2) × zona × clima + (subtotal × 5%)
// Factor 2.2 = 1.0 ida + 1.0 vuelta + 0.2 espera/maniobras

export interface DeliverySettings {
    fuelPricePerLiter: number;  // Current fuel price in ARS (Biblia: $1,591 nafta super Ushuaia)
    fuelConsumptionPerKm: number;  // Liters per km (e.g., 0.06 for moto)
    baseDeliveryFee: number;  // Minimum fee per trip
    maintenanceFactor: number;  // Multiplier for maintenance/profit (e.g., 1.35 = 35%)
    freeDeliveryMinimum: number | null;  // Order amount for free delivery
    maxDeliveryDistance: number;  // Max km for delivery
    originLat: number;  // Store latitude
    originLng: number;  // Store longitude
    // Biblia v3 additions
    zoneMultiplier?: number;  // Zona A: 1.0, B: 1.15, C: 1.35
    climateMultiplier?: number;  // Normal: 1.0, lluvia leve: 1.15, temporal: 1.30
    operationalCostPercent?: number;  // 5% del subtotal del pedido (cubre MP 3.81% + margen)
    orderSubtotal?: number;  // Subtotal del pedido para calcular costo operativo
}

export interface DeliveryCostResult {
    distanceKm: number;
    baseCost: number;
    fuelCost: number;
    subtotal: number;
    maintenanceMarkup: number;
    /** Costo del viaje (sin costo operativo) */
    tripCost: number;
    /** Costo operativo (5% del subtotal del pedido) */
    operationalCost: number;
    totalCost: number;
    isFreeDelivery: boolean;
    isWithinRange: boolean;
    /** Ganancia del repartidor: 80% del costo del viaje (NO incluye operativo) */
    riderEarnings: number;
    /** Ganancia Moovy del delivery: 20% viaje + operativo */
    moovyDeliveryEarnings: number;
}

// Re-export calculateDistance from geo.ts (single source of truth)
export { calculateDistance } from "./geo";

/**
 * Calculate delivery cost based on distance and settings (Biblia Financiera v3)
 *
 * Fórmula: fee = max(MINIMO, costo_km × distancia × 2.2) × zona × clima + (subtotal_pedido × 5%)
 *
 * Factor 2.2 = 1.0 ida + 1.0 vuelta + 0.2 espera/maniobras
 * El 5% operativo cubre: MP 3.81% + margen 1.19%
 * Repartidor cobra 80% del costo del VIAJE (sin operativo)
 * Moovy cobra 20% del viaje + 100% del operativo
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
            tripCost: 0,
            operationalCost: 0,
            totalCost: 0,
            isFreeDelivery: true,
            isWithinRange,
            riderEarnings: 0,
            moovyDeliveryEarnings: 0,
        };
    }

    // Biblia v3: Factor 2.2 (ida + vuelta + espera/maniobras)
    const distanceFactor = 2.2;
    const tripDistanceKm = distanceKm * distanceFactor;

    // Calculate fuel cost for the full trip
    const fuelCost = tripDistanceKm * settings.fuelConsumptionPerKm * settings.fuelPricePerLiter;

    // Subtotal before maintenance factor
    const subtotal = settings.baseDeliveryFee + fuelCost;

    // Apply maintenance factor
    const maintenanceMarkup = subtotal * (settings.maintenanceFactor - 1);
    let tripCost = subtotal * settings.maintenanceFactor;

    // Apply zone multiplier (Biblia v3: A=1.0, B=1.15, C=1.35)
    const zoneMult = settings.zoneMultiplier ?? 1.0;
    tripCost = tripCost * zoneMult;

    // Apply climate multiplier (Biblia v3: normal=1.0, lluvia=1.15, temporal=1.30)
    const climateMult = settings.climateMultiplier ?? 1.0;
    tripCost = tripCost * climateMult;

    // Ensure minimum (baseDeliveryFee acts as minimum)
    tripCost = Math.max(tripCost, settings.baseDeliveryFee);

    // Operational cost: 5% of order subtotal (covers MP 3.81% + margin 1.19%)
    const opPercent = settings.operationalCostPercent ?? 5;
    const opSubtotal = settings.orderSubtotal ?? orderTotal;
    const operationalCost = Math.round(opSubtotal * (opPercent / 100));

    // Total = trip cost + operational cost
    const totalCost = Math.ceil(tripCost) + operationalCost;

    // Rider earnings: 80% of trip cost ONLY (not operational)
    const riderEarnings = Math.round(tripCost * 0.80);
    // Moovy: 20% of trip + 100% of operational
    const moovyDeliveryEarnings = Math.round(tripCost * 0.20) + operationalCost;

    return {
        distanceKm,
        baseCost: settings.baseDeliveryFee,
        fuelCost,
        subtotal,
        maintenanceMarkup,
        tripCost: Math.ceil(tripCost),
        operationalCost,
        totalCost,
        isFreeDelivery: false,
        isWithinRange,
        riderEarnings,
        moovyDeliveryEarnings,
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

