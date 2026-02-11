"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

interface RiderMiniMapProps {
    driverLat?: number;
    driverLng?: number;
    driverHeading?: number; // Heading in degrees for arrow rotation
    merchantLat?: number;
    merchantLng?: number;
    merchantName?: string;
    customerLat?: number;
    customerLng?: number;
    customerAddress?: string;
    customerName?: string; // Customer name to display on map
    height?: string;
    navigationMode?: boolean; // Enable navigation mode with auto-centering
    orderStatus?: string; // Track order status for route transitions
    onRouteTransition?: () => void; // Callback when route changes
    mapRef?: React.MutableRefObject<google.maps.Map | null>;
    recenterTrigger?: boolean;
    onRecenterRequested?: () => void;
}

export interface RiderMiniMapRef {
    recenter: () => void;
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const containerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: -54.8019,
    lng: -68.3030,
};

const normalMapStyles = [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
];

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
    onRecenterRequested
}: RiderMiniMapProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
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

    // ── FIX 1: Stage tracking to prevent redundant Directions API calls ──
    // Only call Directions API when the delivery STAGE changes, not on every GPS update.
    // Stages: null → "MERCHANT" → "CUSTOMER" → null
    const currentStageRef = useRef<string | null>(null);
    const hasDriverPositionRef = useRef(false);

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
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (polylineIntervalRef.current) {
            clearInterval(polylineIntervalRef.current);
            polylineIntervalRef.current = null;
        }
    }, []);

    // ── FIX 1: Calculate route ONLY on stage transitions ──
    // Directions API is called exactly ONCE per stage, not on every GPS update.
    useEffect(() => {
        if (!isLoaded || !driverLat || !driverLng) return;

        const normalizedStatus = orderStatus?.toUpperCase() || "";
        const isPickedUp = ["PICKED_UP", "IN_DELIVERY"].includes(normalizedStatus);
        const newStage = !orderStatus ? null : (isPickedUp ? "CUSTOMER" : "MERCHANT");

        // Track if we have a driver position (for first-time route calculation)
        const hadDriverPosition = hasDriverPositionRef.current;
        hasDriverPositionRef.current = true;

        // GUARD: Only call Directions API if the stage actually changed
        // OR if it's the first time we have a driver position for this stage
        if (newStage === currentStageRef.current && hadDriverPosition) {
            return; // Same stage, don't re-call Directions API
        }

        // Stage is changing — clear old route first
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
                stage: newStage,
                origin,
                dest: destination,
                status: orderStatus
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
                    result.routes[0].legs.forEach(leg => {
                        leg.steps.forEach(step => {
                            step.path.forEach(point => {
                                path.push({ lat: point.lat(), lng: point.lng() });
                            });
                        });
                    });

                    setRoutePath(path);
                    setRemainingPath(path);
                    setAnimatedPath(path);
                    setIsAnimating(false);
                    prevOrderStatusRef.current = orderStatus;
                } else {
                    console.error("[RiderMap] Route failed:", status);
                    setRoutePath([]);
                    setRemainingPath([]);
                }
            }
        );
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng, orderStatus, navigationMode, clearRouteState]);

    // ── FIX 2: Clean up on delivery completion ──
    useEffect(() => {
        if (!navigationMode) {
            clearRouteState();
            currentStageRef.current = null;
            hasDriverPositionRef.current = false;
            prevOrderStatusRef.current = undefined;
        }
    }, [navigationMode, clearRouteState]);

    // Update remaining path as driver moves (erase path behind driver)
    useEffect(() => {
        if (!navigationMode || !driverLat || !driverLng || routePath.length === 0) return;

        const driverPos = { lat: driverLat, lng: driverLng };

        // Find the closest point on the path to the driver
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

        // Only show path from current position forward
        setRemainingPath(routePath.slice(closestIndex));
    }, [navigationMode, driverLat, driverLng, routePath]);

    // Auto-centering is DISABLED to allow free pan/zoom
    // User can manually recenter using the Centrar button
    // Old behavior was: if (!userInteracted) panTo driver position
    // Now: no automatic panning, user has full control

    // Handle user interaction - pause auto-centering for 10 seconds
    const handleUserInteraction = useCallback(() => {
        setUserInteracted(true);

        // Clear existing timeout
        if (recenterTimeoutRef.current) {
            clearTimeout(recenterTimeoutRef.current);
        }

        // Resume auto-centering after 10 seconds of no interaction
        recenterTimeoutRef.current = setTimeout(() => {
            setUserInteracted(false);
        }, 10000);
    }, []);

    // Re-center button handler - fits driver + destination in view
    const handleRecenter = useCallback(() => {
        if (mapRef.current && driverLat && driverLng) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend({ lat: driverLat, lng: driverLng });

            const normalizedStatus = orderStatus?.toUpperCase() || "";
            // Include destination in bounds
            if (normalizedStatus && ['PICKED_UP', 'IN_DELIVERY'].includes(normalizedStatus)) {
                // Going to customer
                if (customerLat && customerLng) {
                    bounds.extend({ lat: customerLat, lng: customerLng });
                }
            } else {
                // Going to merchant
                if (merchantLat && merchantLng) {
                    bounds.extend({ lat: merchantLat, lng: merchantLng });
                }
            }

            mapRef.current.fitBounds(bounds, 60); // 60px padding
            setUserInteracted(false);
            if (recenterTimeoutRef.current) {
                clearTimeout(recenterTimeoutRef.current);
            }
        }
    }, [driverLat, driverLng, customerLat, customerLng, merchantLat, merchantLng, orderStatus]);

    // Expose recenter functionality via prop effect
    useEffect(() => {
        if (recenterTrigger) {
            handleRecenter();
            onRecenterRequested?.();
        }
    }, [recenterTrigger, handleRecenter, onRecenterRequested]);

    // Cleanup timeout and animation on unmount
    useEffect(() => {
        return () => {
            if (recenterTimeoutRef.current) {
                clearTimeout(recenterTimeoutRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    const onMapLoad = useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const center = useMemo(() => {
        if (driverLat && driverLng) return { lat: driverLat, lng: driverLng };
        if (merchantLat && merchantLng) return { lat: merchantLat, lng: merchantLng };
        return defaultCenter;
    }, [driverLat, driverLng, merchantLat, merchantLng]);

    // Initial center effect: Only once when we first get coordinates
    useEffect(() => {
        if (!hasInitialCentered.current && mapRef.current && (driverLat || merchantLat)) {
            const target = driverLat ? { lat: driverLat, lng: driverLng! } : { lat: merchantLat!, lng: merchantLng! };
            mapRef.current.panTo(target);
            mapRef.current.setZoom(navigationMode ? 17 : 14);
            hasInitialCentered.current = true;
        }
    }, [driverLat, driverLng, merchantLat, merchantLng, navigationMode]);

    // Automatic fitBounds is REMOVED to allow manual control as requested.
    // Use the manual "Centrar" button in the dashboard to trigger handleRecenter.

    // Create arrow icon for driver in navigation mode
    const driverIcon = useMemo(() => {
        if (!isLoaded) return undefined;

        if (navigationMode) {
            return {
                path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                fillOpacity: 1,
                fillColor: "#22c55e", // Green
                strokeColor: "#166534",
                strokeWeight: 2,
                scale: 7,
                rotation: driverHeading,
            };
        }

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillOpacity: 1,
            fillColor: "#22c55e",
            strokeColor: "white",
            strokeWeight: 2,
            scale: 8,
        };
    }, [isLoaded, navigationMode, driverHeading]);

    if (!isLoaded) {
        return (
            <div style={{ height }} className="w-full bg-gray-50 flex flex-col items-center justify-center gap-3 rounded-xl border">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Cargando mapa...</p>
            </div>
        );
    }

    return (
        <div style={{ height, width: "100%" }} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm relative">
            {/* Navigation Mode Badge */}
            {navigationMode && (
                <div className="absolute top-2 left-2 z-10 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    NAVEGANDO
                </div>
            )}

            {/* Re-center button - REMOVED from here, handled in dashboard UI */}

            <GoogleMap
                mapContainerStyle={containerStyle}
                onLoad={onMapLoad}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    scrollwheel: true,
                    gestureHandling: "greedy",
                    styles: normalMapStyles,
                }}
            >
                {/* Route path - shows remaining route in navigation mode */}
                {/* Uses animatedPath during animation for drawing effect */}
                {/* Key forces remount when stage or destination changes to ensure clean state */}
                {navigationMode && (isAnimating ? animatedPath : remainingPath).length > 0 && (
                    <Polyline
                        key={`route-${orderStatus || 'idle'}-${isAnimating ? 'anim' : 'static'}-${merchantLat || 0}-${customerLat || 0}`}
                        path={isAnimating ? animatedPath : remainingPath}
                        options={{
                            strokeColor: isAnimating ? "#22c55e" : "#4285F4", // Green during animation
                            strokeWeight: isAnimating ? 8 : 6,
                            strokeOpacity: isAnimating ? 0.9 : 0.4, // Visible base path
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

                            // Clear any previous interval (safe cleanup)
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

                {/* Driver marker - arrow in navigation mode */}
                {driverLat && driverLng && (
                    <Marker
                        position={{ lat: driverLat, lng: driverLng }}
                        icon={driverIcon}
                        title="Tu ubicación"
                        zIndex={1000}
                    />
                )}

                {/* Merchant marker - Blue */}
                {merchantLat && merchantLng && (
                    <Marker
                        position={{ lat: merchantLat, lng: merchantLng }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillOpacity: 1,
                            fillColor: "#3b82f6",
                            strokeColor: "white",
                            strokeWeight: 2,
                            scale: navigationMode ? 10 : 7,
                        }}
                        title={merchantName}
                        label={navigationMode ? {
                            text: "🏪",
                            fontSize: "16px",
                        } : undefined}
                    />
                )}

                {/* Customer marker - Red with name label */}
                {customerLat && customerLng && (
                    <>
                        <Marker
                            position={{ lat: customerLat, lng: customerLng }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                fillOpacity: 1,
                                fillColor: "#ef4444",
                                strokeColor: "white",
                                strokeWeight: 3,
                                scale: navigationMode ? 12 : 7,
                            }}
                            title={customerName || customerAddress}
                            onClick={() => setShowCustomerInfo(true)}
                        />

                        {/* Customer name InfoWindow - always shown in navigation mode */}
                        {(navigationMode || showCustomerInfo) && (
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
                    </>
                )}
            </GoogleMap>
        </div>
    );
}

// Export WITHOUT memo to ensure state resets correctly on prop changes
export default RiderMiniMapComponent;
