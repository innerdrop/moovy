"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Polyline, InfoWindow } from "@react-google-maps/api";
import { Loader2, Compass, MapPin as MapPinIcon, Crosshair, Navigation2 } from "lucide-react";

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

const libraries: ("places" | "geometry" | "marker")[] = ["places", "geometry", "marker"];

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
            clickListenerRef.current = markerRef.current.addListener("click", onClick);
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
    distance: string;
    duration: string;
    maneuver?: string;
    endLat: number;
    endLng: number;
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
    const [isHeadUp, setIsHeadUp] = useState(true); // Head-Up (rumbo arriba) vs North-Up (norte arriba)
    const [navSteps, setNavSteps] = useState<NavStepInfo[]>([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [totalDistance, setTotalDistance] = useState("");
    const [totalDuration, setTotalDuration] = useState("");
    const prevHeadingRef = useRef<number>(0); // Smooth heading transitions

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
        language: 'es',
        region: 'AR'
    });

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

        if (newStage === currentStageRef.current && hadDriverPosition) {
            return;
        }

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

        const directionsService = new google.maps.DirectionsService();
        const origin = { lat: driverLat, lng: driverLng };

        if (navigationMode) {
            console.log("[RiderMap] Fetching route (stage change):", {
                stage: newStage, origin, dest: destination, status: orderStatus
            });
        }

        directionsService.route(
            {
                origin,
                destination,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    const path: google.maps.LatLngLiteral[] = [];
                    const steps: NavStepInfo[] = [];

                    let totalDistValue = 0;
                    let totalDurValue = 0;

                    result.routes[0].legs.forEach(leg => {
                        totalDistValue += leg.distance?.value || 0;
                        totalDurValue += leg.duration?.value || 0;

                        leg.steps.forEach(step => {
                            // Extract path points
                            step.path.forEach(point => {
                                path.push({ lat: point.lat(), lng: point.lng() });
                            });

                            // Extract navigation step info
                            const endLoc = step.end_location;
                            steps.push({
                                instruction: step.instructions || "Continúe",
                                distance: step.distance?.text || "",
                                duration: step.duration?.text || "",
                                maneuver: (step as any).maneuver || undefined,
                                endLat: endLoc.lat(),
                                endLng: endLoc.lng(),
                            });
                        });
                    });

                    setRoutePath(path);
                    setRemainingPath(path);
                    setAnimatedPath(path);
                    setIsAnimating(false);
                    setNavSteps(steps);
                    setCurrentStepIndex(0);
                    setTotalDistance(
                        totalDistValue >= 1000
                            ? `${(totalDistValue / 1000).toFixed(1)} km`
                            : `${totalDistValue} m`
                    );
                    setTotalDuration(`${Math.ceil(totalDurValue / 60)} min`);
                    prevOrderStatusRef.current = orderStatus;
                } else {
                    console.error("[RiderMap] Route failed:", status);
                    setRoutePath([]);
                    setRemainingPath([]);
                }
            }
        );
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng, orderStatus, navigationMode, clearRouteState]);

    // ── Clean up on delivery completion ──
    useEffect(() => {
        if (!navigationMode) {
            clearRouteState();
            currentStageRef.current = null;
            hasDriverPositionRef.current = false;
            prevOrderStatusRef.current = undefined;
            setIsHeadUp(true); // Reset to Head-Up for next delivery
        }
    }, [navigationMode, clearRouteState]);

    // ── Update remaining path as driver moves ──
    useEffect(() => {
        if (!navigationMode || !driverLat || !driverLng || routePath.length === 0) return;

        const driverPos = { lat: driverLat, lng: driverLng };
        let closestIndex = 0;
        let closestDistance = Infinity;

        routePath.forEach((point, index) => {
            const distance = Math.sqrt(
                Math.pow(point.lat - driverPos.lat, 2) +
                Math.pow(point.lng - driverPos.lng, 2)
            );
            if (distance < closestDistance) {
                closestDistance = distance;
                closestIndex = index;
            }
        });

        setRemainingPath(routePath.slice(closestIndex));
    }, [navigationMode, driverLat, driverLng, routePath]);

    // ── TURN-BY-TURN: Track current step based on proximity ──
    useEffect(() => {
        if (!navigationMode || !driverLat || !driverLng || navSteps.length === 0) return;

        // Find which step the driver is closest to completing
        // (closest to the end_location of each step)
        const STEP_ADVANCE_THRESHOLD = 0.0003; // ~30 meters in lat/lng

        for (let i = currentStepIndex; i < navSteps.length; i++) {
            const step = navSteps[i];
            const distToEnd = Math.sqrt(
                Math.pow(step.endLat - driverLat, 2) +
                Math.pow(step.endLng - driverLng, 2)
            );

            if (distToEnd < STEP_ADVANCE_THRESHOLD && i > currentStepIndex) {
                // Driver passed this step's endpoint — advance
                setCurrentStepIndex(i + 1 < navSteps.length ? i + 1 : i);
                break;
            } else if (distToEnd >= STEP_ADVANCE_THRESHOLD) {
                // This is the current step (not yet reached its end)
                if (i !== currentStepIndex) {
                    setCurrentStepIndex(i);
                }
                break;
            }
        }
    }, [navigationMode, driverLat, driverLng, navSteps, currentStepIndex]);

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
        onNavUpdateRef.current?.({
            currentStep: isNavigating ? (navSteps[currentStepIndex] || null) : null,
            nextStep: isNavigating && currentStepIndex + 1 < navSteps.length ? navSteps[currentStepIndex + 1] : null,
            totalDistance,
            totalDuration,
            stepsRemaining: navSteps.length - currentStepIndex,
            destinationName,
            isPickedUp,
            isNavigating: !!isNavigating,
        });
    }, [navigationMode, navSteps, currentStepIndex, totalDistance, totalDuration, destinationName, isPickedUp]);

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
            {/* Navigation Mode Badge + View Toggle + Recenter */}
            {navigationMode && (
                <div className="absolute top-16 left-2 z-20 flex flex-col items-start gap-2">
                    {/* Head-Up / North-Up Toggle */}
                    <button
                        onClick={() => {
                            const newHeadUp = !isHeadUp;
                            setIsHeadUp(newHeadUp);
                            setUserInteracted(false);
                            if (mapRef.current && driverLat && driverLng) {
                                if (newHeadUp) {
                                    // Switching TO Head-Up
                                    mapRef.current.moveCamera({
                                        center: { lat: driverLat, lng: driverLng },
                                        zoom: 17,
                                        heading: driverHeading,
                                        tilt: 0,
                                    });
                                } else {
                                    // Switching TO North-Up
                                    mapRef.current.moveCamera({
                                        center: { lat: driverLat, lng: driverLng },
                                        zoom: 16,
                                        heading: 0,
                                        tilt: 0,
                                    });
                                }
                            }
                        }}
                        className="bg-white/90 backdrop-blur-md text-gray-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 active:scale-95 transition-all border border-white"
                    >
                        {isHeadUp ? (
                            <>
                                <Compass className="w-3.5 h-3.5" />
                                Rumbo
                            </>
                        ) : (
                            <>
                                <Navigation2 className="w-3.5 h-3.5" />
                                Norte
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Recenter Button (visible during Free Look) */}
            {navigationMode && userInteracted && (
                <button
                    onClick={handleRecenter}
                    className="absolute top-2 right-2 z-20 w-11 h-11 bg-white/95 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center active:scale-90 transition-all border border-gray-200"
                >
                    <Crosshair className="w-5 h-5 text-blue-600" />
                </button>
            )}

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
