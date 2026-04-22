// Sistema de zonas excluidas (sin cobertura de delivery)
// Persiste en StoreSettings.excludedZonesJson como array JSON.
// Una zona = círculo geográfico (centro lat/lng + radio km) con nombre, razón y flag active.
// Si el destino del pedido cae dentro de cualquier zona `active: true`, el delivery se bloquea.

import { calculateDistance } from "./geo";

export interface ExcludedZone {
    /** UUID estable — generado al crear la zona, nunca se reutiliza */
    id: string;
    /** Nombre corto visible al admin y al buyer (ej: "Costa Susana") */
    name: string;
    /** Centro del círculo */
    lat: number;
    lng: number;
    /** Radio de la zona en km (ej: 0.3 = 300m) */
    radiusKm: number;
    /** Razón visible al buyer cuando cae en la zona (ej: "Sin señal celular para repartidor") */
    reason: string;
    /** Si está false, la zona existe pero NO bloquea — permite pausar sin borrar historial */
    active: boolean;
    /** ISO timestamp */
    createdAt: string;
    /** ISO timestamp */
    updatedAt: string;
}

/**
 * Parsea el JSON de zonas excluidas. Si es inválido o falta, retorna array vacío.
 * Descarta entries malformadas silenciosamente (defensa: si alguien corrompe el JSON
 * desde la DB, el sistema sigue funcionando sin zonas en vez de crashear).
 */
export function parseExcludedZones(raw: string | null | undefined): ExcludedZone[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.filter(isValidZone);
    } catch {
        return [];
    }
}

function isValidZone(z: unknown): z is ExcludedZone {
    if (!z || typeof z !== "object") return false;
    const zone = z as Record<string, unknown>;
    return (
        typeof zone.id === "string" &&
        typeof zone.name === "string" &&
        typeof zone.lat === "number" &&
        typeof zone.lng === "number" &&
        typeof zone.radiusKm === "number" &&
        typeof zone.reason === "string" &&
        typeof zone.active === "boolean" &&
        typeof zone.createdAt === "string" &&
        typeof zone.updatedAt === "string"
    );
}

/**
 * Devuelve la primera zona excluida ACTIVA cuyo círculo contenga el punto (lat, lng),
 * o null si el punto no cae en ninguna zona activa.
 *
 * Complejidad O(n) con n = cantidad de zonas. Ushuaia tiene <20 zonas razonablemente —
 * si crece mucho, se puede pre-filtrar por bounding box antes del Haversine.
 */
export function getExcludedZone(
    lat: number,
    lng: number,
    zones: ExcludedZone[]
): ExcludedZone | null {
    for (const zone of zones) {
        if (!zone.active) continue;
        const distanceKm = calculateDistance(lat, lng, zone.lat, zone.lng);
        if (distanceKm <= zone.radiusKm) return zone;
    }
    return null;
}

/**
 * Valida el payload de entrada (crear/editar zona) y retorna un objeto limpio.
 * No persiste — el caller decide.
 */
export interface ZoneInput {
    name: string;
    lat: number;
    lng: number;
    radiusKm: number;
    reason: string;
    active?: boolean;
}

export function validateZoneInput(input: unknown): { ok: true; data: ZoneInput } | { ok: false; error: string } {
    if (!input || typeof input !== "object") {
        return { ok: false, error: "Payload inválido" };
    }
    const i = input as Record<string, unknown>;

    if (typeof i.name !== "string" || i.name.trim().length < 1 || i.name.length > 50) {
        return { ok: false, error: "El nombre debe tener entre 1 y 50 caracteres" };
    }
    if (typeof i.lat !== "number" || i.lat < -90 || i.lat > 90) {
        return { ok: false, error: "Latitud fuera de rango (-90 a 90)" };
    }
    if (typeof i.lng !== "number" || i.lng < -180 || i.lng > 180) {
        return { ok: false, error: "Longitud fuera de rango (-180 a 180)" };
    }
    if (typeof i.radiusKm !== "number" || i.radiusKm < 0.1 || i.radiusKm > 3) {
        return { ok: false, error: "El radio debe estar entre 0.1 y 3 km" };
    }
    if (typeof i.reason !== "string" || i.reason.trim().length < 1 || i.reason.length > 200) {
        return { ok: false, error: "La razón debe tener entre 1 y 200 caracteres" };
    }
    const active = typeof i.active === "boolean" ? i.active : true;

    return {
        ok: true,
        data: {
            name: i.name.trim(),
            lat: i.lat,
            lng: i.lng,
            radiusKm: i.radiusKm,
            reason: i.reason.trim(),
            active,
        },
    };
}
