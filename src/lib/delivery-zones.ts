// Delivery Zones — Point-in-polygon resolver con cache
// Rama: feat/zonas-delivery-multiplicador
//
// PROPÓSITO
// ─────────
// Helper canónico que toma una coordenada (lat, lng) y devuelve la zona de
// delivery que aplica (multiplicador del fee + bonus al driver). Si la
// dirección no cae en ningún polígono, devuelve null y el caller usa el
// default (multiplier 1.0, sin bonus).
//
// USO
// ───
//   const zone = await getZoneForLocation(-54.806, -68.310);
//   if (zone) {
//     deliveryFee *= zone.multiplier;
//     driverPayout += zone.driverBonus;
//   }
//
// CACHE
// ─────
// Las zonas cambian poco (mensualmente a lo sumo). Cargamos todos los polígonos
// activos en memory al primer llamado y servimos point-in-polygon desde ahí.
// El cache se invalida cuando el endpoint admin crea/edita/borra una zona.
//
// El point-in-polygon LOCAL usa una implementación clásica de ray-casting
// (O(N) en vértices del polígono). Para Moovy con ~3-10 zonas y polígonos de
// ~10-30 vértices, esto es <0.1ms por consulta. Si el catálogo de zonas
// crece a 100+, conviene migrar a SQL ST_Contains con el índice GiST que
// scripts/setup-postgis-zones.sql ya creó.
//
// OVERLAPS
// ────────
// Si una location cae en varios polígonos, gana el de mayor `displayOrder`.
// Regla determinística + editable desde OPS (drag-and-drop de orden).

import { prisma } from "@/lib/prisma";
import logger from "@/lib/logger";

const zonesLogger = logger.child({ module: "delivery-zones" });

// ─── Tipos ──────────────────────────────────────────────────────────────────

export interface DeliveryZoneViewModel {
    id: string;
    name: string;
    color: string;
    multiplier: number;
    driverBonus: number;
    displayOrder: number;
    /** GeoJSON-like ring de [lng, lat] pares — convención GeoJSON RFC 7946 */
    polygon: [number, number][];
}

// ─── Cache in-memory ────────────────────────────────────────────────────────

let zonesCache: DeliveryZoneViewModel[] | null = null;
let cacheLoadedAt: number = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hora — defensa contra cache rancio

/**
 * Carga todas las zonas activas desde DB y las guarda en cache.
 * Usa $queryRaw porque el campo polygon es Unsupported() en Prisma —
 * no se puede leer con el client normal.
 *
 * Devuelve los polígonos como ST_AsGeoJSON parseado a array de coords.
 */
async function loadZonesCache(): Promise<DeliveryZoneViewModel[]> {
    type RawRow = {
        id: string;
        name: string;
        color: string;
        multiplier: number;
        driverBonus: number;
        displayOrder: number;
        polygonGeoJson: string | null;
    };

    const rows = await prisma.$queryRaw<RawRow[]>`
        SELECT
            id,
            name,
            color,
            multiplier,
            "driverBonus",
            "displayOrder",
            ST_AsGeoJSON(polygon) AS "polygonGeoJson"
        FROM "DeliveryZone"
        WHERE "isActive" = true AND polygon IS NOT NULL
        ORDER BY "displayOrder" DESC
    `;

    const parsed: DeliveryZoneViewModel[] = [];
    for (const row of rows) {
        if (!row.polygonGeoJson) continue;
        try {
            const geom = JSON.parse(row.polygonGeoJson);
            // GeoJSON Polygon: { type: "Polygon", coordinates: [[[lng,lat], ...]] }
            // El primer ring es el outer ring (los siguientes son holes — ignoramos).
            const ring = geom?.coordinates?.[0];
            if (!Array.isArray(ring) || ring.length < 4) {
                zonesLogger.warn({ zoneId: row.id, name: row.name }, "Polygon ring inválido en zona");
                continue;
            }
            parsed.push({
                id: row.id,
                name: row.name,
                color: row.color,
                multiplier: row.multiplier,
                driverBonus: row.driverBonus,
                displayOrder: row.displayOrder,
                polygon: ring as [number, number][],
            });
        } catch (err) {
            zonesLogger.error({ err, zoneId: row.id }, "Error parseando GeoJSON de zona");
        }
    }

    zonesCache = parsed;
    cacheLoadedAt = Date.now();
    zonesLogger.info({ zoneCount: parsed.length }, "Delivery zones cache loaded");
    return parsed;
}

/**
 * Invalida el cache. Llamar desde el endpoint admin después de crear/editar/borrar
 * una zona. La próxima consulta a getZoneForLocation va a recargar desde DB.
 */
export function invalidateZonesCache(): void {
    zonesCache = null;
    cacheLoadedAt = 0;
    zonesLogger.info("Delivery zones cache invalidated");
}

async function getCachedZones(): Promise<DeliveryZoneViewModel[]> {
    const isExpired = Date.now() - cacheLoadedAt > CACHE_TTL_MS;
    if (zonesCache === null || isExpired) {
        return await loadZonesCache();
    }
    return zonesCache;
}

// ─── Point-in-polygon (ray casting) ─────────────────────────────────────────

/**
 * Algoritmo clásico de ray casting. Retorna true si el punto (lng, lat) cae
 * dentro del polígono. El polígono es array de [lng, lat] (convención GeoJSON).
 *
 * Detalles:
 * - Cuenta intersecciones de un rayo horizontal hacia +∞ desde el punto contra
 *   los lados del polígono. Impar = adentro, par = afuera.
 * - Maneja el caso de puntos en el borde como "afuera" para determinismo
 *   (los puntos exactos en líneas de borde son raros en flotantes).
 */
function pointInPolygon(lng: number, lat: number, polygon: [number, number][]): boolean {
    let inside = false;
    const n = polygon.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];
        const intersect =
            yi > lat !== yj > lat &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }
    return inside;
}

// ─── API pública ────────────────────────────────────────────────────────────

/**
 * Devuelve la zona aplicable a una coordenada, o null si la dirección no cae
 * en ninguna zona configurada (en ese caso el caller usa default 1.0 / 0).
 *
 * Si la location cae en MÚLTIPLES zonas (overlap), devuelve la de mayor
 * displayOrder (porque las zonas en cache ya vienen ordenadas DESC y es la
 * primera que matchee).
 */
export async function getZoneForLocation(
    lat: number,
    lng: number
): Promise<DeliveryZoneViewModel | null> {
    if (!isFinite(lat) || !isFinite(lng)) return null;

    const zones = await getCachedZones();
    if (zones.length === 0) return null;

    for (const zone of zones) {
        if (pointInPolygon(lng, lat, zone.polygon)) {
            return zone;
        }
    }
    return null;
}

/**
 * Devuelve los datos resumidos para snapshot en SubOrder. Si no hay zona,
 * devuelve los defaults (multiplicador 1.0, bonus 0, code null).
 *
 * Esta es la función que consume buildSubOrderFinancialSnapshot.
 */
export async function getZoneSnapshotForLocation(
    lat: number,
    lng: number
): Promise<{ zoneCode: string | null; zoneMultiplier: number; zoneDriverBonus: number }> {
    const zone = await getZoneForLocation(lat, lng);
    if (!zone) {
        return { zoneCode: null, zoneMultiplier: 1.0, zoneDriverBonus: 0 };
    }
    return {
        zoneCode: zone.name,
        zoneMultiplier: zone.multiplier,
        zoneDriverBonus: zone.driverBonus,
    };
}

/**
 * Devuelve TODAS las zonas activas (para renderizar el mapa en el panel OPS).
 * Usa el mismo cache que getZoneForLocation.
 */
export async function getAllActiveZones(): Promise<DeliveryZoneViewModel[]> {
    return await getCachedZones();
}
