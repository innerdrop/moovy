// Utility functions for distance and time calculations

/**
 * Calculate distance between two points using Haversine formula
 * @returns distance in kilometers
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
 * Estimate travel time based on distance and vehicle type
 * @param distanceKm distance in kilometers
 * @param vehicleType type of vehicle (MOTO, AUTO, BICI)
 * @returns estimated time in minutes
 */
export function estimateTravelTime(
    distanceKm: number,
    vehicleType: string = "MOTO"
): number {
    // Average speeds in km/h for urban areas
    const speeds: Record<string, number> = {
        MOTO: 25,   // Motos en ciudad con tráfico
        AUTO: 20,   // Autos más lentos por tráfico
        BICI: 12,   // Bicicletas
    };

    const speed = speeds[vehicleType] || speeds.MOTO;
    const timeHours = distanceKm / speed;
    const timeMinutes = Math.ceil(timeHours * 60);

    // Minimum 2 minutes, maximum 60 for sanity
    return Math.max(2, Math.min(timeMinutes, 60));
}

/**
 * Format distance for display
 */
export function formatDistance(km: number): string {
    if (km < 1) {
        return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
}

/**
 * Generate Google Maps navigation URL
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/**
 * Generate Waze navigation URL
 */
export function getWazeUrl(lat: number, lng: number): string {
    return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
}
