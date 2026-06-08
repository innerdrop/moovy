// Geocoding server-side — Google Geocoding API + Distance Matrix
//
// Rama: fix/delivery-geocoding-cobertura
//
// PROPÓSITO
// ─────────
// Helpers canónicos server-side para (1) geocodificar texto de dirección a
// coordenadas REALES + ciudad/provincia, y (2) calcular la distancia por
// camino entre origen y destino. Antes esta lógica vivía inline en
// /api/delivery/calculate y NO se reusaba en el cobro (/api/orders), que
// confiaba en la distancia que mandaba el navegador (manipulable). Esto la
// centraliza para que preview Y cobro usen la MISMA fuente de verdad.
//
// IMPORTANTE: geocodeAddress NO fuerza "Ushuaia". Devuelve la ciudad/provincia
// REAL que resuelve Google. Así un pedido a Río Grande resuelve a Río Grande
// (y luego el gate de cobertura lo rechaza), en vez de caer dentro de Ushuaia.

import { calculateDistance } from "./geo";
import { deliveryLogger } from "./logger";

export interface GeocodeResult {
    lat: number;
    lng: number;
    /** Ciudad real (locality) que devolvió Google. null si no se pudo extraer. */
    city: string | null;
    /** Provincia real (administrative_area_level_1). null si no se pudo extraer. */
    province: string | null;
    /** Dirección formateada completa de Google (para audit/logging). */
    formattedAddress: string | null;
}

interface GoogleAddressComponent {
    long_name: string;
    short_name: string;
    types: string[];
}

/**
 * Geocodifica un texto de dirección a coordenadas + ciudad/provincia REALES.
 *
 * NO fuerza "Ushuaia" ni ninguna ciudad: usa lo que devuelve Google. El caller
 * (gate de cobertura) decide si la coordenada está cubierta o no.
 *
 * @param query Texto de dirección. Recomendado pasar ", Argentina" al final si
 *   no viene país, pero NO una ciudad fija (eso sesga el resultado).
 * @returns GeocodeResult o null si no se pudo resolver / no hay API key.
 */
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        deliveryLogger.warn("geocodeAddress: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no configurada");
        return null;
    }
    if (!query || query.trim().length === 0) return null;

    try {
        const geocodeUrl =
            `https://maps.googleapis.com/maps/api/geocode/json` +
            `?address=${encodeURIComponent(query)}&region=ar&language=es&key=${apiKey}`;
        const res = await fetch(geocodeUrl);
        const data = await res.json();

        if (data.status !== "OK" || !Array.isArray(data.results) || data.results.length === 0) {
            deliveryLogger.info({ query, status: data.status }, "geocodeAddress: sin resultados");
            return null;
        }

        const result = data.results[0];
        const lat = result.geometry?.location?.lat;
        const lng = result.geometry?.location?.lng;
        if (typeof lat !== "number" || typeof lng !== "number") return null;

        const components: GoogleAddressComponent[] = result.address_components || [];
        const findComponent = (type: string): string | null =>
            components.find((c) => c.types.includes(type))?.long_name ?? null;

        // Ciudad: locality es lo correcto; fallback a admin_area_level_2 (partido/depto)
        // para casos donde Google no devuelve locality (zonas rurales).
        const city =
            findComponent("locality") ??
            findComponent("administrative_area_level_2") ??
            null;
        const province = findComponent("administrative_area_level_1");

        return {
            lat,
            lng,
            city,
            province,
            formattedAddress: result.formatted_address ?? null,
        };
    } catch (err) {
        deliveryLogger.error(
            { query, error: err instanceof Error ? err.message : String(err) },
            "geocodeAddress: error llamando a Google Geocoding API"
        );
        return null;
    }
}

/**
 * Construye el texto de dirección a geocodificar a partir de campos sueltos.
 * Incluye ", Argentina" para acotar el país SIN forzar una ciudad concreta.
 * Si el caller ya tiene ciudad/provincia (capturadas del autocomplete), las
 * suma para desambiguar — pero NUNCA inventa "Ushuaia" si no vino.
 */
export function buildAddressQuery(parts: {
    street: string;
    number?: string | null;
    city?: string | null;
    province?: string | null;
}): string {
    const segments: string[] = [];
    const streetLine = parts.number ? `${parts.street} ${parts.number}` : parts.street;
    segments.push(streetLine);
    if (parts.city && parts.city.trim().length > 0) segments.push(parts.city.trim());
    if (parts.province && parts.province.trim().length > 0) segments.push(parts.province.trim());
    segments.push("Argentina");
    return segments.join(", ");
}

export interface RoadDistanceResult {
    distanceKm: number;
    /** true = distancia real por camino (Distance Matrix). false = Haversine fallback. */
    isRealRoadDistance: boolean;
}

/**
 * Distancia por camino entre origen y destino usando Google Distance Matrix.
 * Fallback a Haversine (línea recta) si la API falla o no hay key. Esta es la
 * MISMA lógica que usaba el preview; ahora compartida para que el cobro
 * (/api/orders) la use server-side y NO confíe en el distanceKm del navegador.
 */
export async function getRoadDistanceKm(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
): Promise<RoadDistanceResult> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    const haversine = (): RoadDistanceResult => ({
        distanceKm: calculateDistance(originLat, originLng, destLat, destLng),
        isRealRoadDistance: false,
    });

    if (!apiKey) return haversine();

    try {
        const distUrl =
            `https://maps.googleapis.com/maps/api/distancematrix/json` +
            `?origins=${originLat},${originLng}&destinations=${destLat},${destLng}` +
            `&mode=driving&units=metric&key=${apiKey}`;
        const res = await fetch(distUrl);
        const data = await res.json();

        if (data.status === "OK" && data.rows?.[0]?.elements?.[0]?.status === "OK") {
            const distanceMeters = data.rows[0].elements[0].distance.value;
            return { distanceKm: distanceMeters / 1000, isRealRoadDistance: true };
        }
        deliveryLogger.warn({ status: data.status }, "getRoadDistanceKm: Distance Matrix falló, usando Haversine");
        return haversine();
    } catch (err) {
        deliveryLogger.error(
            { error: err instanceof Error ? err.message : String(err) },
            "getRoadDistanceKm: error en Distance Matrix, usando Haversine"
        );
        return haversine();
    }
}
