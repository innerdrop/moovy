"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { GoogleMap, Polyline, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "@/hooks/useGoogleMaps";
import { Loader2, MapPin as MapPinIcon } from "lucide-react";
import { computeRoute, isRoutesApiEnabled } from "@/lib/routes-api";

export interface NavUpdateData {
    currentStep: { instruction: string; distance: string; duration: string; maneuver?: string } | null;
    nextStep: { instruction: string; distance: string; duration: string; maneuver?: string } | null;
    totalDistance: string;
    totalDuration: string;
    stepsRemaining: number;
    destinationName: string;
    isPickedUp: boolean;
    isNavigating: boolean;
}

interface RiderMiniMapProps {
    driverLat?: number;
    driverLng?: number;
    driverHeading?: number;
    merchantLat?: number;
    merchantLng?: number;
    merchantName?: string;
    customerLat?: number;
    customerLng?: number;
    customerAddress?: string;
    customerName?: string;
    height?: string;
    navigationMode?: boolean;
    orderStatus?: string;
    onRouteTransition?: () => void;
    mapRef?: React.MutableRefObject<google.maps.Map | null>;
    recenterTrigger?: boolean;
    onRecenterRequested?: () => void;
    onNavUpdate?: (data: NavUpdateData) => void;
}

export interface RiderMiniMapRef {
    recenter: () => void;
}

// Libraries se cargan centralizadamente en useGoogleMaps

// ── Custom hook for AdvancedMarkerElement (replaces deprecated Marker) ──
function useAdvancedMarker({
    map,
    position,
    title,
    zIndex,
    buildContent,
    onClick,
}: {
    map: google.maps.Map | null;
    position: { lat: number; lng: number } | null;
    title?: string;
    zIndex?: number;
    buildContent?: () => HTMLElement | null;
    onClick?: () => void;
}) {
    const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
    const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);

    useEffect(() => {
        if (!map || !position) {
            // Clean up if position becomes null
            if (markerRef.current) {
                markerRef.current.map = null;
                markerRef.current = null;
            }
            return;
        }

        // Defensive: if marker library hasn't finished loading, skip this render.
        // The effect re-runs when position/map/etc change, so it'll try again.
        if (typeof google === "undefined" || !google.maps?.marker?.AdvancedMarkerElement) {
            console.warn("[RiderMap] google.maps.marker.AdvancedMarkerElement no disponible todavía");
            return;
        }

        const content = buildContent ? buildContent() : undefined;

        if (!markerRef.current) {
            // Create new marker
            markerRef.current = new google.maps.marker.AdvancedMarkerElement({
                map,
                position,
                title: title || "",
                zIndex: zIndex || 0,
                content: content || undefined,
            });
        } else {
            // Update existing marker
            markerRef.current.position = position;
            if (title !== undefined) markerRef.current.title = title;
            if (zIndex !== undefined) markerRef.current.zIndex = zIndex;
            if (content) markerRef.current.content = content;
        }

        // Manage click listener
        if (clickListenerRef.current) {
            clickListenerRef.current.remove();
            clickListenerRef.current = null;
        }
        if (onClick && markerRef.current) {
            clickListenerRef.current = markerRef.current.addListener("gmp-click", onClick);
        }

        return () => {
            // Only clean up listener on effect re-run, NOT the marker itself
        };
    }, [map, position?.lat, position?.lng, title, zIndex, buildContent, onClick]);

    // Full cleanup on unmount
    useEffect(() => {
        return () => {
            if (clickListenerRef.current) {
                clickListenerRef.current.remove();
            }
            if (markerRef.current) {
                markerRef.current.map = null;
                markerRef.current = null;
            }
        };
    }, []);

    return markerRef;
}

const containerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: -54.8019,
    lng: -68.3030,
};

const normalMapStyles = [
    { featureType: "all", elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#444444" }] },
    { featureType: "landscape", elementType: "all", stylers: [{ color: "#f5f5f5" }] },
    { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f8c967" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#e9bc62" }] },
    { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
    { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] }
];

// Navigation step info extracted from Directions API
interface NavStepInfo {
    instruction: string;
    distance: string;          // original API text (fallback)
    distanceMeters: number;    // original API meters (fallback for duration interp)
    duration: string;          // original API text
    durationSeconds: number;   // original API seconds (for live ETA interp)
    maneuver?: string;
    endLat: number;
    endLng: number;
    pathStartIdx: number;      // first index into routePath inclusive
    pathEndIdx: number;        // last index into routePath inclusive
}

// ── Geo helpers (module scope — pure functions, no re-creation per render) ──
const EARTH_RADIUS_M = 6371000;
const DEG2RAD = Math.PI / 180;

type LL = { lat: number; lng: number };

function haversineMeters(a: LL, b: LL): number {
    const dLat = (b.lat - a.lat) * DEG2RAD;
    const dLng = (b.lng - a.lng) * DEG2RAD;
    const lat1 = a.lat * DEG2RAD;
    const lat2 = b.lat * DEG2RAD;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

// Project `p` onto the segment from `a` to `b`, in local equirectangular meters.
// Returns parametric t clamped to [0, 1] and the projected point.
// For distances <200m the equirectangular approximation is within ~0.1% of haversine,
// which is fine for turn-by-turn navigation on city streets.
function projectOntoSegment(p: LL, a: LL, b: LL): { t: number; point: LL; distM: number } {
    const midLat = (a.lat + b.lat) / 2;
    const kLng = Math.cos(midLat * DEG2RAD);
    const ax = 0, ay = 0;
    const bx = (b.lng - a.lng) * kLng * EARTH_RADIUS_M * DEG2RAD;
    const by = (b.lat - a.lat) * EARTH_RADIUS_M * DEG2RAD;
    const px = (p.lng - a.lng) * kLng * EARTH_RADIUS_M * DEG2RAD;
    const py = (p.lat - a.lat) * EARTH_RADIUS_M * DEG2RAD;
    const segLenSq = (bx - ax) ** 2 + (by - ay) ** 2;
    let t = segLenSq === 0 ? 0 : ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / segLenSq;
    t = Math.max(0, Math.min(1, t));
    const sx = ax + t * (bx - ax);
    const sy = ay + t * (by - ay);
    const distM = Math.sqrt((px - sx) ** 2 + (py - sy) ** 2);
    const point: LL = {
        lat: a.lat + (t * (by - ay)) / (EARTH_RADIUS_M * DEG2RAD),
        lng: a.lng + (t * (bx - ax)) / (kLng * EARTH_RADIUS_M * DEG2RAD),
    };
    return { t, point, distM };
}

// Compute cumulative path lengths (meters) at each index so we can O(1)
// lookup remaining distance within a step by subtracting two cumulative values.
function computeCumulativeLengths(path: LL[]): number[] {
    const out = new Array<number>(path.length);
    out[0] = 0;
    for (let i = 1; i < path.length; i++) {
        out[i] = out[i - 1] + haversineMeters(path[i - 1], path[i]);
    }
    return out;
}

function formatLiveDistance(meters: number): string {
    if (!isFinite(meters) || meters < 0) return "";
    if (meters < 50) return `${Math.round(meters / 5) * 5} m`;   // 5m granularity under 50m
    if (meters < 1000) return `${Math.round(meters / 10) * 10} m`; // 10m granularity
    return `${(meters / 1000).toFixed(1)} km`;
}

function formatLiveDuration(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return "";
    const mins = Math.max(1, Math.round(seconds / 60));
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function RiderMiniMapComponent({
    driverLat,
    driverLng,
    driverHeading = 0,
    merchantLat,
    merchantLng,
    merchantName = "Comercio",
    customerLat,
    customerLng,
    customerAddress = "Cliente",
    customerName,
    height = "250px",
    navigationMode = false,
    orderStatus,
    onRouteTransition,
    recenterTrigger,
    onRecenterRequested,
    onNavUpdate
}: RiderMiniMapProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [mapInstance, setMapInstance] = useState<google.maps.Map | null>(null);
    const hasInitialCentered = useRef(false);
    const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
    const [remainingPath, setRemainingPath] = useState<google.maps.LatLngLiteral[]>([]);
    const [animatedPath, setAnimatedPath] = useState<google.maps.LatLngLiteral[]>([]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [userInteracted, setUserInteracted] = useState(false);
    const recenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const polylineIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const prevOrderStatusRef = useRef<string | undefined>(undefined);
    const [showCustomerInfo, setShowCustomerInfo] = useState(false);

    // ── Stage tracking (from previous fix) ──
    const currentStageRef = useRef<string | null>(null);
    const hasDriverPositionRef = useRef(false);

    // ── TURN-BY-TURN NAVIGATION STATE ──
    // Head-Up fijo (rumbo del driver arriba). Se removió el toggle a
    // North-Up porque Waze/Uber/Cabify no lo exponen en el portal de
    // conducción: un toggle extra en la ruta confunde más de lo que ayuda
    // y ocupaba un slot de control flotante que chocaba con HOME/CONECTADO.
    // Las ramas legacy `else (North-Up)` quedan como código inalcanzable.
    const isHeadUp = true;
    const [navSteps, setNavSteps] = useState<NavStepInfo[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [totalDistance, setTotalDistance] = useState("");
    const [totalDuration, setTotalDuration] = useState("");
    const prevHeadingRef = useRef<number>(0); // Smooth heading transitions

    // Real-time nav state (R2.1/R2.2). `snappedSegmentIndex` is the index `i`
    // such that the driver is on the segment routePath[i] → routePath[i+1].
    // `liveStepDistanceText` is the distance from the snapped point to the
    // end of the current step, recomputed on every GPS update.
    const cumulativeLenRef = useRef<number[]>([]);  // cumulative meters per routePath index
    const [snappedSegmentIndex, setSnappedSegmentIndex] = useState<number>(0);
    const [distanceFromRouteM, setDistanceFromRouteM] = useState<number>(0);
    const [liveStepDistanceText, setLiveStepDistanceText] = useState<string>("");
    const [liveStepDurationText, setLiveStepDurationText] = useState<string>("");
    const [liveTotalDistanceText, setLiveTotalDistanceText] = useState<string>("");
    const [liveTotalDurationText, setLiveTotalDurationText] = useState<string>("");

    // Deviation detection (R2.3). Counts consecutive GPS updates where the
    // driver is > OFF_ROUTE_METERS from the snapped route. If it crosses
    // OFF_ROUTE_STREAK the route re-fetches. The `suppressUntilRef` guard
    // avoids re-fetch storms if the new route keeps deviating.
    const offRouteStreakRef = useRef<number>(0);
    const suppressUntilRef = useRef<number>(0);
    const [refetchNonce, setRefetchNonce] = useState<number>(0);
    const OFF_ROUTE_METERS = 60;
    const OFF_ROUTE_STREAK = 3;        // ~30s at 10s polling
    const OFF_ROUTE_COOLDOWN_MS = 20000;
    const lastFetchedNonceRef = useRef<number>(0);

    const { isLoaded } = useGoogleMaps();

    // ── Helper: clear all route state ──
    const clearRouteState = useCallback(() => {
        setRoutePath([]);
        setRemainingPath([]);
        setAnimatedPath([]);
        setIsAnimating(false);
        setNavSteps([]);
        setCurrentStepIndex(0);
        setTotalDistance("");
        setTotalDuration("");
        setSnappedSegmentIndex(0);
        setDistanceFromRouteM(0);
        setLiveStepDistanceText("");
        setLiveStepDurationText("");
        setLiveTotalDistanceText("");
        setLiveTotalDurationText("");
        cumulativeLenRef.current = [];
        offRouteStreakRef.current = 0;
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (polylineIntervalRef.current) {
            clearInterval(polylineIntervalRef.current);
            polylineIntervalRef.current = null;
        }
    }, []);

    // ── Calculate route ONLY on stage transitions ──
    useEffect(() => {
        if (!isLoaded || !driverLat || !driverLng) return;

        const normalizedStatus = orderStatus?.toUpperCase() || "";
        const isPickedUp = ["PICKED_UP", "IN_DELIVERY"].includes(normalizedStatus);
        const newStage = !orderStatus ? null : (isPickedUp ? "CUSTOMER" : "MERCHANT");

        const hadDriverPosition = hasDriverPositionRef.current;
        hasDriverPositionRef.current = true;

        // Deviation-triggered re-fetch (R2.3) bumps `refetchNonce`; honor it
        // even if the stage hasn't changed. Otherwise skip redundant fetches
        // on every GPS tick.
        const forcedByNonce = refetchNonce !== lastFetchedNonceRef.current;
        if (newStage === currentStageRef.current && hadDriverPosition && !forcedByNonce) {
            return;
        }
        lastFetchedNonceRef.current = refetchNonce;

        clearRouteState();
        currentStageRef.current = newStage;

        if (!newStage) {
            prevOrderStatusRef.current = orderStatus;
            return;
        }

        const destination = isPickedUp
            ? (customerLat && customerLng ? { lat: customerLat, lng: customerLng } : null)
            : (merchantLat && merchantLng ? { lat: merchantLat, lng: merchantLng } : null);

        if (!destination) {
            prevOrderStatusRef.current = orderStatus;
            return;
        }

        const origin = { lat: driverLat, lng: driverLng };

        if (navigationMode) {
            console.log("[RiderMap] Fetching route (stage change):", {
                stage: newStage, origin, dest: destination, status: orderStatus,
                backend: isRoutesApiEnabled() ? "routes-api" : "directions-legacy",
            });
        }

        // applyNormalizedLegs consume un shape común (steps con path como
        // LatLng plano, distance/duration con value+text) que generan AMBOS
        // backends. Mantiene la lógica de state updates en un solo lugar para
        // que Routes API y DirectionsService produzcan el mismo resultado.
        const applyNormalizedLegs = (legs: Array<{
            distance: { value: number; text: string };
            duration: { value: number; text: string };
            steps: Array<{
                instructions: string;
                distance: { value: number; text: string };
                duration: { value: number; text: string };
                maneuver?: string;
                path: Array<{ lat: number; lng: number }>;
                end_location: { lat: number; lng: number };
            }>;
        }>) => {
            const path: google.maps.LatLngLiteral[] = [];
            const steps: NavStepInfo[] = [];
            let totalDistValue = 0;
            let totalDurValue = 0;

            legs.forEach(leg => {
                totalDistValue += leg.distance.value || 0;
                totalDurValue += leg.duration.value || 0;

                leg.steps.forEach(step => {
                    const pathStartIdx = path.length;
                    step.path.forEach(p => path.push({ lat: p.lat, lng: p.lng }));
                    const pathEndIdx = Math.max(pathStartIdx, path.length - 1);

                    steps.push({
                        instruction: step.instructions || "Continúe",
                        distance: step.distance.text || "",
                        distanceMeters: step.distance.value ?? 0,
                        duration: step.duration.text || "",
                        durationSeconds: step.duration.value ?? 0,
                        maneuver: step.maneuver || undefined,
                        endLat: step.end_location.lat,
                        endLng: step.end_location.lng,
                        pathStartIdx,
                        pathEndIdx,
                    });
                });
            });

            setRoutePath(path);
            setRemainingPath(path);
            setAnimatedPath(path);
            setIsAnimating(false);
            setNavSteps(steps);
            setCurrentStepIndex(0);
            setSnappedSegmentIndex(0);
            offRouteStreakRef.current = 0;
            cumulativeLenRef.current = computeCumulativeLengths(path);
            setTotalDistance(
                totalDistValue >= 1000
                    ? `${(totalDistValue / 1000).toFixed(1)} km`
                    : `${totalDistValue} m`
            );
            setTotalDuration(`${Math.ceil(totalDurValue / 60)} min`);
            setLiveTotalDistanceText(formatLiveDistance(totalDistValue));
            setLiveTotalDurationText(formatLiveDuration(totalDurValue));
            prevOrderStatusRef.current = orderStatus;
        };

        let cancelled = false;

        if (isRoutesApiEnabled()) {
            // ── Nueva Routes API (Google, no deprecada) ──
            // computeRoute ya devuelve un shape compatible con applyNormalizedLegs.
            // Si la API falla (sin routes, HTTP error, sin API key, etc.) caemos
            // a estado vacío — NO fallback a DirectionsService para no duplicar
            // billing ni enmascarar configuraciones rotas en producción.
            (async () => {
                const result = await computeRoute(origin, destination);
                if (cancelled) return;
                if (!result || result.legs.length === 0) {
                    console.error("[RiderMap] Routes API: sin ruta disponible");
                    setRoutePath([]);
                    setRemainingPath([]);
                    return;
                }
                applyNormalizedLegs(result.legs);
            })();
        } else {
            // ── Legacy DirectionsService (fallback mientras Routes API no esté activa) ──
            // Este path desaparecerá cuando NEXT_PUBLIC_USE_ROUTES_API=true
            // sea el default en producción. Warning de deprecación conocido
            // (25-feb-2026), seguirá funcionando hasta que Google lo remueva.
            const directionsService = new google.maps.DirectionsService();
            directionsService.route(
                {
                    origin,
                    destination,
                    travelMode: google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (cancelled) return;
                    if (status === google.maps.DirectionsStatus.OK && result) {
                        // Convertir el shape de DirectionsService (LatLng con
                        // métodos .lat()/.lng(), distance?.value/text opcionales)
                        // al shape plano que consume applyNormalizedLegs.
                        const normalizedLegs = result.routes[0].legs.map(leg => ({
                            distance: { value: leg.distance?.value ?? 0, text: leg.distance?.text ?? "" },
                            duration: { value: leg.duration?.value ?? 0, text: leg.duration?.text ?? "" },
                            steps: leg.steps.map(step => ({
                                instructions: step.instructions || "",
                                distance: { value: step.distance?.value ?? 0, text: step.distance?.text ?? "" },
                                duration: { value: step.duration?.value ?? 0, text: step.duration?.text ?? "" },
                                maneuver: (step as unknown as { maneuver?: string }).maneuver,
                                path: step.path.map(p => ({ lat: p.lat(), lng: p.lng() })),
                                end_location: { lat: step.end_location.lat(), lng: step.end_location.lng() },
                            })),
                        }));
                        applyNormalizedLegs(normalizedLegs);
                    } else {
                        console.error("[RiderMap] DirectionsService failed:", status);
                        setRoutePath([]);
                        setRemainingPath([]);
                    }
                }
            );
        }

        return () => {
            cancelled = true;
        };
    // `refetchNonce` participates so R2.3 can force a re-fetch without needing
    // the stage to flip. Everything else is identical to before.
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng, orderStatus, navigationMode, clearRouteState, refetchNonce]);

    // ── Clean up on delivery completion ──
    useEffect(() => {
        if (!navigationMode) {
            clearRouteState();
            currentStageRef.current = null;
            hasDriverPositionRef.current = false;
            prevOrderStatusRef.current = undefined;
        }
    }, [navigationMode, clearRouteState]);

    // ── Polyline matching + real-time step tracking (R2.1 + R2.2 + R2.3) ──
    //
    // Una sola pasada por cada update de GPS. Calcula:
    //   1. Segmento más cercano del routePath (snapping perpendicular,
    //      haversine). Evita que el jitter del GPS descoloque el seguimiento.
    //   2. Distancia perpendicular del driver a la ruta — si supera
    //      OFF_ROUTE_METERS durante OFF_ROUTE_STREAK muestras, re-fetchea.
    //   3. El paso actual: primer step cuyo pathEndIdx >= segmentIndex.
    //   4. La distancia real restante dentro del paso actual, usando la
    //      tabla de longitudes acumuladas (diferencia de dos sumas, O(1)).
    //   5. Distancia/tiempo restante total de toda la ruta.
    useEffect(() => {
        if (!navigationMode || !driverLat || !driverLng || routePath.length < 2 || navSteps.length === 0) return;
        const cum = cumulativeLenRef.current;
        if (cum.length !== routePath.length) return;

        const driverPos: LL = { lat: driverLat, lng: driverLng };

        // --- 1. Ventana de búsqueda ---
        // Para performance en rutas largas (~500 pts), buscamos en una ventana
        // alrededor del último segmento snapeado, no toda la ruta. En el frame
        // inicial (o si nos quedamos atrás por un refetch) recorremos todo.
        const WINDOW = 30;
        const winStart = Math.max(0, snappedSegmentIndex - WINDOW);
        const winEnd = Math.min(routePath.length - 2, snappedSegmentIndex + WINDOW);

        let bestIdx = snappedSegmentIndex;
        let bestDist = Infinity;
        let bestT = 0;

        const tryRange = (from: number, to: number) => {
            for (let i = from; i <= to; i++) {
                const proj = projectOntoSegment(driverPos, routePath[i], routePath[i + 1]);
                if (proj.distM < bestDist) {
                    bestDist = proj.distM;
                    bestIdx = i;
                    bestT = proj.t;
                }
            }
        };
        tryRange(winStart, winEnd);
        // Si el ventaneo no encuentra nada razonable (>200m), rehacemos todo.
        if (bestDist > 200) {
            bestIdx = snappedSegmentIndex;
            bestDist = Infinity;
            bestT = 0;
            tryRange(0, routePath.length - 2);
        }

        // No retroceder: el driver nunca "desavanza" por jitter GPS.
        if (bestIdx < snappedSegmentIndex) {
            bestIdx = snappedSegmentIndex;
            // recomputar bestT sobre el segmento actual
            const proj = projectOntoSegment(driverPos, routePath[bestIdx], routePath[bestIdx + 1]);
            bestT = proj.t;
            bestDist = proj.distM;
        }

        if (bestIdx !== snappedSegmentIndex) setSnappedSegmentIndex(bestIdx);
        setDistanceFromRouteM(bestDist);

        // --- 2. Paso actual ---
        // El step actual es el primero cuyo pathEndIdx >= bestIdx (es decir,
        // el segmento snapeado cae dentro del rango del paso). Por construcción
        // los ranges son monotónicos, así que basta con linear scan desde el
        // último currentStepIndex hacia adelante.
        let newStepIndex = currentStepIndex;
        while (
            newStepIndex < navSteps.length - 1 &&
            bestIdx > navSteps[newStepIndex].pathEndIdx
        ) {
            newStepIndex++;
        }
        if (newStepIndex !== currentStepIndex) setCurrentStepIndex(newStepIndex);

        // --- 3. Distancia/tiempo vivos del paso actual y del total ---
        const curStep = navSteps[newStepIndex];
        // Distancia desde el snapped point hasta el final del paso actual.
        // cum[pathEndIdx+1] no existe para el último step; usamos el último
        // punto de la ruta.
        const stepEndCumIdx = Math.min(curStep.pathEndIdx + 1, cum.length - 1);
        // Posición lineal del snapped point: cum[bestIdx] + t * segLen
        const segLen = cum[bestIdx + 1] - cum[bestIdx];
        const snappedCum = cum[bestIdx] + bestT * segLen;
        const stepRemainingM = Math.max(0, cum[stepEndCumIdx] - snappedCum);
        setLiveStepDistanceText(formatLiveDistance(stepRemainingM));
        // Tiempo proporcional al ratio de distancia restante vs distancia
        // original del paso. Si el paso es 0m (gira en el lugar) usamos 0s.
        const stepRatio = curStep.distanceMeters > 0
            ? stepRemainingM / curStep.distanceMeters
            : 0;
        setLiveStepDurationText(formatLiveDuration(curStep.durationSeconds * stepRatio));

        // Total: distancia/tiempo desde snapped point hasta el final de la ruta.
        const totalRemainingM = Math.max(0, cum[cum.length - 1] - snappedCum);
        setLiveTotalDistanceText(formatLiveDistance(totalRemainingM));
        // Tiempo total = suma del tiempo vivo del paso actual + duraciones
        // completas de los pasos restantes. Aproximación que no depende del
        // factor de velocidad real.
        let remainingSeconds = curStep.durationSeconds * stepRatio;
        for (let i = newStepIndex + 1; i < navSteps.length; i++) {
            remainingSeconds += navSteps[i].durationSeconds;
        }
        setLiveTotalDurationText(formatLiveDuration(remainingSeconds));

        // --- 4. Polyline mostrada: de snapped en adelante ---
        // Mantenemos la UX existente (pinta el remainingPath) pero ahora
        // corta exactamente en el segmento snapeado.
        setRemainingPath(routePath.slice(bestIdx));

        // --- 5. Deviation detection (R2.3) ---
        if (bestDist > OFF_ROUTE_METERS) {
            offRouteStreakRef.current += 1;
        } else {
            offRouteStreakRef.current = 0;
        }
        const now = Date.now();
        if (
            offRouteStreakRef.current >= OFF_ROUTE_STREAK &&
            now >= suppressUntilRef.current
        ) {
            // Reset y fuerza re-fetch en el siguiente tick.
            offRouteStreakRef.current = 0;
            suppressUntilRef.current = now + OFF_ROUTE_COOLDOWN_MS;
            console.log("[RiderMap] Off-route deviation detected — refetching route");
            setRefetchNonce(n => n + 1);
        }
    }, [navigationMode, driverLat, driverLng, routePath, navSteps, snappedSegmentIndex, currentStepIndex]);

    // ── HEAD-UP CAMERA: Follow driver with heading rotation (2D) ──
    useEffect(() => {
        if (!mapRef.current || !navigationMode || !isHeadUp || userInteracted) return;
        if (!driverLat || !driverLng) return;

        // Smooth heading transition (avoid jumps)
        let targetHeading = driverHeading;
        const prevHeading = prevHeadingRef.current;

        // Handle 360° wraparound for smooth rotation
        let diff = targetHeading - prevHeading;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;

        // Lerp heading (70% toward target for smooth feel)
        const smoothHeading = prevHeading + diff * 0.7;
        prevHeadingRef.current = smoothHeading;

        mapRef.current.moveCamera({
            center: { lat: driverLat, lng: driverLng },
            zoom: 17,
            heading: smoothHeading,
            tilt: 0,
        });
    }, [navigationMode, isHeadUp, userInteracted, driverLat, driverLng, driverHeading]);

    // ── NORTH-UP CAMERA: Follow driver without rotation ──
    useEffect(() => {
        if (!mapRef.current || !navigationMode || isHeadUp || userInteracted) return;
        if (!driverLat || !driverLng) return;

        mapRef.current.panTo({ lat: driverLat, lng: driverLng });
    }, [navigationMode, isHeadUp, userInteracted, driverLat, driverLng]);

    // ── Handle user interaction (Free Look) ──
    const handleUserInteraction = useCallback(() => {
        if (!navigationMode) return; // Only track interactions during navigation
        setUserInteracted(true);
        // No auto-timeout — user must tap Recenter to resume tracking
    }, [navigationMode]);

    // ── Re-center handler ──
    const handleRecenter = useCallback(() => {
        if (mapRef.current && driverLat && driverLng) {
            if (isHeadUp && navigationMode) {
                // Head-Up: snap back to driver with heading
                mapRef.current.moveCamera({
                    center: { lat: driverLat, lng: driverLng },
                    zoom: 17,
                    heading: driverHeading,
                    tilt: 0,
                });
            } else if (navigationMode) {
                // North-Up during navigation: fit driver + destination
                const bounds = new google.maps.LatLngBounds();
                bounds.extend({ lat: driverLat, lng: driverLng });

                const ns = orderStatus?.toUpperCase() || "";
                if (['PICKED_UP', 'IN_DELIVERY'].includes(ns)) {
                    if (customerLat && customerLng) bounds.extend({ lat: customerLat, lng: customerLng });
                } else {
                    if (merchantLat && merchantLng) bounds.extend({ lat: merchantLat, lng: merchantLng });
                }

                mapRef.current.moveCamera({ heading: 0, tilt: 0 });
                mapRef.current.fitBounds(bounds, 60);
            } else {
                // No delivery: center on driver
                mapRef.current.panTo({ lat: driverLat, lng: driverLng });
                mapRef.current.setZoom(14);
            }
            setUserInteracted(false);
        }
    }, [driverLat, driverLng, driverHeading, customerLat, customerLng, merchantLat, merchantLng, orderStatus, isHeadUp, navigationMode]);

    // ── Recenter via prop trigger ──
    useEffect(() => {
        if (recenterTrigger) {
            handleRecenter();
            onRecenterRequested?.();
        }
    }, [recenterTrigger, handleRecenter, onRecenterRequested]);

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            if (recenterTimeoutRef.current) clearTimeout(recenterTimeoutRef.current);
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (polylineIntervalRef.current) clearInterval(polylineIntervalRef.current);
        };
    }, []);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
        setMapInstance(map);
    }, []);

    const center = useMemo(() => {
        if (driverLat && driverLng) return { lat: driverLat, lng: driverLng };
        if (merchantLat && merchantLng) return { lat: merchantLat, lng: merchantLng };
        return defaultCenter;
    }, [driverLat, driverLng, merchantLat, merchantLng]);

    // ── Initial center ──
    useEffect(() => {
        if (!hasInitialCentered.current && mapRef.current && (driverLat || merchantLat)) {
            const target = driverLat ? { lat: driverLat, lng: driverLng! } : { lat: merchantLat!, lng: merchantLng! };

            if (navigationMode && isHeadUp) {
                mapRef.current.moveCamera({
                    center: target,
                    zoom: 17,
                    heading: driverHeading,
                    tilt: 0,
                });
            } else {
                mapRef.current.panTo(target);
                mapRef.current.setZoom(navigationMode ? 16 : 14);
                mapRef.current.moveCamera({ heading: 0, tilt: 0 });
            }
            hasInitialCentered.current = true;
        }
    }, [driverLat, driverLng, merchantLat, merchantLng, navigationMode, isHeadUp, driverHeading]);

    // ── Driver icon ──
    // ── Build SVG content for markers ──
    const buildDriverContent = useCallback(() => {
        if (!isLoaded) return null;
        const div = document.createElement("div");
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";

        if (navigationMode) {
            const rotation = isHeadUp ? 0 : driverHeading;
            div.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" style="transform: rotate(${rotation}deg)">
                <path d="M12 2 L20 20 L12 16 L4 20 Z" fill="#22c55e" stroke="#166534" stroke-width="1.5"/>
            </svg>`;
        } else {
            div.innerHTML = `<svg width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="#22c55e" stroke="white" stroke-width="2"/>
            </svg>`;
        }
        return div;
    }, [isLoaded, navigationMode, driverHeading, isHeadUp]);

    const buildMerchantContent = useCallback(() => {
        if (!isLoaded) return null;
        const div = document.createElement("div");
        const size = navigationMode ? 24 : 18;
        div.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="${navigationMode ? 9 : 7}" fill="#3b82f6" stroke="white" stroke-width="2"/>
        </svg>`;
        if (navigationMode) {
            div.innerHTML += `<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:12px">🏪</span>`;
            div.style.position = "relative";
        }
        return div;
    }, [isLoaded, navigationMode]);

    const buildCustomerContent = useCallback(() => {
        if (!isLoaded) return null;
        const div = document.createElement("div");
        const size = navigationMode ? 28 : 18;
        div.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="${navigationMode ? 9 : 7}" fill="#ef4444" stroke="white" stroke-width="2.5"/>
        </svg>`;
        return div;
    }, [isLoaded, navigationMode]);

    // ── AdvancedMarker hook calls ──
    const driverPosition = useMemo(
        () => (driverLat && driverLng ? { lat: driverLat, lng: driverLng } : null),
        [driverLat, driverLng]
    );
    const merchantPosition = useMemo(
        () => (merchantLat && merchantLng ? { lat: merchantLat, lng: merchantLng } : null),
        [merchantLat, merchantLng]
    );
    const customerPosition = useMemo(
        () => (customerLat && customerLng ? { lat: customerLat, lng: customerLng } : null),
        [customerLat, customerLng]
    );

    const handleCustomerClick = useCallback(() => setShowCustomerInfo(true), []);

    useAdvancedMarker({
        map: mapInstance,
        position: driverPosition,
        title: "Tu ubicación",
        zIndex: 1000,
        buildContent: buildDriverContent,
    });

    useAdvancedMarker({
        map: mapInstance,
        position: merchantPosition,
        title: merchantName,
        buildContent: buildMerchantContent,
    });

    useAdvancedMarker({
        map: mapInstance,
        position: customerPosition,
        title: customerName || customerAddress,
        buildContent: buildCustomerContent,
        onClick: handleCustomerClick,
    });

    // ── Compute destination name for HUD ──
    const normalizedStatus = orderStatus?.toUpperCase() || "";
    const isPickedUp = ["PICKED_UP", "IN_DELIVERY"].includes(normalizedStatus);
    const destinationName = isPickedUp
        ? (customerName || customerAddress)
        : merchantName;

    // ── Emit nav data to parent (for unified BottomSheet) ──
    const onNavUpdateRef = useRef(onNavUpdate);
    onNavUpdateRef.current = onNavUpdate;

    useEffect(() => {
        const isNavigating = navigationMode && navSteps.length > 0 && currentStepIndex < navSteps.length;

        // Sobreescribimos `distance`/`duration` del paso actual y del total con
        // los valores vivos calculados por polyline matching. El texto original
        // de la Directions API (navStep.distance) es estático — era la causa
        // del reporte "las indicaciones no se actualizan en tiempo real".
        const baseCurrent = isNavigating ? navSteps[currentStepIndex] : null;
        const liveCurrent = baseCurrent ? {
            instruction: baseCurrent.instruction,
            distance: liveStepDistanceText || baseCurrent.distance,
            duration: liveStepDurationText || baseCurrent.duration,
            maneuver: baseCurrent.maneuver,
        } : null;

        const baseNext = isNavigating && currentStepIndex + 1 < navSteps.length
            ? navSteps[currentStepIndex + 1]
            : null;
        const liveNext = baseNext ? {
            instruction: baseNext.instruction,
            distance: baseNext.distance,           // siguiente giro: distancia estática de la API
            duration: baseNext.duration,
            maneuver: baseNext.maneuver,
        } : null;

        onNavUpdateRef.current?.({
            currentStep: liveCurrent,
            nextStep: liveNext,
            totalDistance: liveTotalDistanceText || totalDistance,
            totalDuration: liveTotalDurationText || totalDuration,
            stepsRemaining: navSteps.length - currentStepIndex,
            destinationName,
            isPickedUp,
            isNavigating: !!isNavigating,
        });
    }, [
        navigationMode, navSteps, currentStepIndex,
        totalDistance, totalDuration,
        liveStepDistanceText, liveStepDurationText,
        liveTotalDistanceText, liveTotalDurationText,
        destinationName, isPickedUp,
    ]);

    // ── Map options ──
    const mapOptions = useMemo(() => {
        const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;

        const options: google.maps.MapOptions = {
            disableDefaultUI: true,
            zoomControl: !navigationMode,
            scrollwheel: true,
            gestureHandling: "greedy" as const,
        };

        if (mapId) {
            options.mapId = mapId;
            // IMPORTANT: Do NOT set options.styles at all here
        } else {
            options.styles = normalMapStyles;
        }

        return options;
    }, [navigationMode]);

    if (!isLoaded) {
        return (
            <div className="h-full w-full bg-gray-100 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Cargando mapa...</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative">
            {/* Sin controles flotantes: HOME/CONECTADO/MAPS/Centrar viven en la
                top-bar del dashboard. El mapa queda limpio, mostrando solo el
                polyline y los markers. Rumbo siempre head-up (igual que Waze/Uber). */}

            <GoogleMap
                mapContainerStyle={containerStyle}
                onLoad={onMapLoad}
                onDragStart={handleUserInteraction}
                options={mapOptions}
            >
                {/* Route polyline */}
                {navigationMode && (isAnimating ? animatedPath : remainingPath).length > 0 && (
                    <Polyline
                        key={`route-${orderStatus || 'idle'}-${isAnimating ? 'anim' : 'static'}-${merchantLat || 0}-${customerLat || 0}`}
                        path={isAnimating ? animatedPath : remainingPath}
                        options={{
                            strokeColor: isAnimating ? "#22c55e" : "#4285F4",
                            strokeWeight: 6,
                            strokeOpacity: isAnimating ? 0.9 : 0.8,
                            icons: isAnimating ? [] : [{
                                icon: {
                                    path: 'M 0,-1.5 L 0,1.5',
                                    strokeOpacity: 1,
                                    strokeWeight: 4,
                                    scale: 3,
                                    strokeColor: "#4285F4",
                                },
                                offset: '0',
                                repeat: '20px'
                            }, {
                                icon: {
                                    path: 'M -2,0 L 0,2 L 2,0',
                                    strokeOpacity: 1,
                                    strokeWeight: 2,
                                    scale: 2,
                                    strokeColor: "#2196F3",
                                },
                                offset: '50%',
                                repeat: '40px'
                            }]
                        }}
                        onLoad={(polyline) => {
                            if (isAnimating) return;

                            if (polylineIntervalRef.current) {
                                clearInterval(polylineIntervalRef.current);
                            }

                            let count = 0;
                            polylineIntervalRef.current = setInterval(() => {
                                count = (count + 1) % 200;
                                const icons = polyline.get('icons');
                                if (icons && icons[0]) {
                                    icons[0].offset = (count / 2) + '%';
                                    polyline.set('icons', icons);
                                }
                            }, 100);
                        }}
                        onUnmount={() => {
                            if (polylineIntervalRef.current) {
                                clearInterval(polylineIntervalRef.current);
                                polylineIntervalRef.current = null;
                            }
                        }}
                    />
                )}

                {/* Markers are rendered via useAdvancedMarker hooks outside JSX */}

                {/* Customer InfoWindow (still uses react-google-maps InfoWindow) */}
                {customerLat && customerLng && (navigationMode || showCustomerInfo) && (
                    <InfoWindow
                        position={{ lat: customerLat, lng: customerLng }}
                        onCloseClick={() => setShowCustomerInfo(false)}
                        options={{
                            pixelOffset: new google.maps.Size(0, -15),
                            disableAutoPan: true,
                        }}
                    >
                        <div className="px-2 py-1 text-center">
                            <p className="font-bold text-gray-900 text-sm">
                                {customerName || "Cliente"}
                            </p>
                            {customerAddress && (
                                <p className="text-xs text-gray-500 max-w-[150px] truncate">
                                    {customerAddress}
                                </p>
                            )}
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>

            {/* NavigationHUD removed — now rendered inside unified BottomSheet */}
        </div>
    );
}

export default React.memo(RiderMiniMapComponent);
