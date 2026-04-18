// ──────────────────────────────────────────────────────────────────────────
// Routes API (Google) client wrapper
//
// Reemplaza al DirectionsService del Maps JS API, deprecado el 25-feb-2026.
// La Routes API es un endpoint REST (routes.googleapis.com/directions/v2:
// computeRoutes) y devuelve polylines codificadas + navigationInstruction
// en un formato distinto al legacy.
//
// Uso:
//   const result = await computeRoute(origin, destination);
//   // result.legs[0].steps[] tiene la misma forma que DirectionsService
//   // (path, distance.value/text, duration.value/text, maneuver, end_location)
//   // para que RiderMiniMap pueda consumirlo sin cambios estructurales.
//
// Requisitos:
//   1. `Routes API` habilitada en Google Cloud (mismo proyecto que Maps JS)
//   2. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en el .env con restricción de referrer
//      apuntando a somosmoovy.com (producción) + localhost (dev)
//   3. Feature flag NEXT_PUBLIC_USE_ROUTES_API === "true" para activar
// ──────────────────────────────────────────────────────────────────────────

export type LatLng = { lat: number; lng: number };

// Shape compatible con DirectionsStep del Maps JS API para que el componente
// consumidor no tenga que ramificar según el origen de los datos.
export interface RoutesStep {
    instructions: string;
    distance: { value: number; text: string };
    duration: { value: number; text: string };
    maneuver?: string;
    path: LatLng[];
    end_location: LatLng;
}

export interface RoutesLeg {
    distance: { value: number; text: string };
    duration: { value: number; text: string };
    steps: RoutesStep[];
}

export interface RoutesResult {
    legs: RoutesLeg[];
    overview_path: LatLng[];
}

// Formatea distancias en el idioma y estilo argentino (Directions legacy usaba
// "km" y "m" consistente). Routes API devuelve solo valores numéricos.
function formatDistance(meters: number): { value: number; text: string } {
    if (meters >= 1000) return { value: meters, text: `${(meters / 1000).toFixed(1)} km` };
    return { value: meters, text: `${Math.round(meters)} m` };
}

function parseDurationToSeconds(dur: string | undefined): number {
    // Routes API devuelve duración como string tipo "123s". Robustez: si
    // llega algo raro, devolvemos 0 para no romper cálculos downstream.
    if (!dur) return 0;
    const m = /^(\d+(?:\.\d+)?)s$/.exec(dur);
    return m ? Math.round(parseFloat(m[1])) : 0;
}

function formatDuration(seconds: number): { value: number; text: string } {
    const mins = Math.max(1, Math.round(seconds / 60));
    if (mins < 60) return { value: seconds, text: `${mins} min` };
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return { value: seconds, text: m === 0 ? `${h} h` : `${h} h ${m} min` };
}

// Decodificación del polyline usando google.maps.geometry.encoding.decodePath.
// No lo re-implementamos: la librería 'geometry' ya está cargada por
// useGoogleMaps.ts (libraries: ["places", "geometry"]).
function decodePolyline(encoded: string): LatLng[] {
    if (typeof google === "undefined" || !google.maps?.geometry?.encoding) {
        console.warn("[routes-api] google.maps.geometry no cargado; no se puede decodificar polyline");
        return [];
    }
    return google.maps.geometry.encoding.decodePath(encoded).map(p => ({ lat: p.lat(), lng: p.lng() }));
}

// Mapeo de los maneuver strings de Routes API a los que usa nuestro
// BottomSheet (getManeuverIcon). Routes API usa SCREAMING_SNAKE_CASE
// ("TURN_LEFT"), legacy usaba "turn-left". Normalizamos a lowercase-dash
// para que el código existente siga funcionando sin cambios.
function normalizeManeuver(m: string | undefined): string | undefined {
    if (!m) return undefined;
    return m.toLowerCase().replace(/_/g, "-");
}

interface RawPolyline { encodedPolyline?: string }
interface RawNavInstr { instructions?: string; maneuver?: string }
interface RawLocation { latLng?: { latitude?: number; longitude?: number } }
interface RawStep {
    distanceMeters?: number;
    staticDuration?: string;
    polyline?: RawPolyline;
    navigationInstruction?: RawNavInstr;
    endLocation?: RawLocation;
}
interface RawLeg {
    distanceMeters?: number;
    duration?: string;
    polyline?: RawPolyline;
    steps?: RawStep[];
}
interface RawRoute {
    distanceMeters?: number;
    duration?: string;
    polyline?: RawPolyline;
    legs?: RawLeg[];
}
interface RawResponse {
    routes?: RawRoute[];
    error?: { code?: number; message?: string };
}

// Endpoint único del Routes API. computeRoutes acepta POST con JSON y usa
// field mask para controlar qué devolver — CRÍTICO para facturación (la API
// cobra diferente según los campos solicitados).
const ROUTES_ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELD_MASK = [
    "routes.distanceMeters",
    "routes.duration",
    "routes.polyline.encodedPolyline",
    "routes.legs.distanceMeters",
    "routes.legs.duration",
    "routes.legs.steps.distanceMeters",
    "routes.legs.steps.staticDuration",
    "routes.legs.steps.polyline.encodedPolyline",
    "routes.legs.steps.navigationInstruction.instructions",
    "routes.legs.steps.navigationInstruction.maneuver",
    "routes.legs.steps.endLocation",
].join(",");

export async function computeRoute(origin: LatLng, destination: LatLng): Promise<RoutesResult | null> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        console.error("[routes-api] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no definido");
        return null;
    }

    const body = {
        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
        travelMode: "DRIVE",
        routingPreference: "TRAFFIC_AWARE",
        polylineEncoding: "ENCODED_POLYLINE",
        computeAlternativeRoutes: false,
        languageCode: "es-AR",
        units: "METRIC",
    };

    let resp: Response;
    try {
        resp = await fetch(ROUTES_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": apiKey,
                "X-Goog-FieldMask": FIELD_MASK,
            },
            body: JSON.stringify(body),
        });
    } catch (e) {
        console.error("[routes-api] fetch error:", e);
        return null;
    }

    if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        console.error("[routes-api] HTTP", resp.status, text.slice(0, 200));
        return null;
    }

    let data: RawResponse;
    try {
        data = await resp.json() as RawResponse;
    } catch (e) {
        console.error("[routes-api] JSON parse error:", e);
        return null;
    }

    if (!data.routes?.length) {
        console.warn("[routes-api] sin rutas en respuesta", data.error);
        return null;
    }

    const r = data.routes[0];
    const overviewPath = decodePolyline(r.polyline?.encodedPolyline || "");

    const legs: RoutesLeg[] = (r.legs || []).map(leg => {
        const steps: RoutesStep[] = (leg.steps || []).map(step => {
            const stepPath = decodePolyline(step.polyline?.encodedPolyline || "");
            const endLoc: LatLng = {
                lat: step.endLocation?.latLng?.latitude ?? (stepPath.at(-1)?.lat ?? 0),
                lng: step.endLocation?.latLng?.longitude ?? (stepPath.at(-1)?.lng ?? 0),
            };
            return {
                instructions: step.navigationInstruction?.instructions || "Continúe",
                distance: formatDistance(step.distanceMeters ?? 0),
                duration: formatDuration(parseDurationToSeconds(step.staticDuration)),
                maneuver: normalizeManeuver(step.navigationInstruction?.maneuver),
                path: stepPath,
                end_location: endLoc,
            };
        });

        return {
            distance: formatDistance(leg.distanceMeters ?? 0),
            duration: formatDuration(parseDurationToSeconds(leg.duration)),
            steps,
        };
    });

    return { legs, overview_path: overviewPath };
}

// Feature flag helper — para que el componente consumidor chequee una sola
// vez y evite magic strings en dos lugares.
export function isRoutesApiEnabled(): boolean {
    return process.env.NEXT_PUBLIC_USE_ROUTES_API === "true";
}
