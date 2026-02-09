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
    const [animatedPath, setAnimatedPath] = useState<google.maps.LatLngLiteral[]>([]); // For drawing animation
    const [isAnimating, setIsAnimating] = useState(false);
    const [userInteracted, setUserInteracted] = useState(false);
    const recenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const prevOrderStatusRef = useRef<string | undefined>(undefined);
    const [showCustomerInfo, setShowCustomerInfo] = useState(false);

    // --- HARD CLEANUP FUNCTION ---
    const hardResetMap = useCallback(() => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        setRoutePath([]);
        setRemainingPath([]);
        setAnimatedPath([]);
        setIsAnimating(false);
        setShowCustomerInfo(false);
        setUserInteracted(false);
        prevOrderStatusRef.current = undefined;
    }, []);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
        language: 'es',
        region: 'AR'
    });

    // Unified Route Management & Cleanup
    useEffect(() => {
        if (!isLoaded || !driverLat || !driverLng) return;

        const normalizedStatus = orderStatus?.toUpperCase() || "";
        const isPickedUp = ["PICKED_UP", "IN_DELIVERY", "ON_THE_WAY", "DELIVERED"].includes(normalizedStatus);
        const destination = isPickedUp
            ? (customerLat && customerLng ? { lat: customerLat, lng: customerLng } : null)
            : (merchantLat && merchantLng ? { lat: merchantLat, lng: merchantLng } : null);

        // If no active navigation or no order, kill everything and return
        if (!navigationMode || !orderStatus || !destination) {
            console.log(`[RiderMap-V10] Clean trigger: nav=${navigationMode}, status=${orderStatus}`);
            hardResetMap();
            return;
        }

        // --- INSTANT CLEANUP BEFORE NEW ROUTE ---
        // If we got here, we have a new destination. 
        // We MUST clear the old paths immediately to prevent "ghost" traces
        setRoutePath([]);
        setRemainingPath([]);
        setAnimatedPath([]);
        setIsAnimating(false);

        // --- ROUTE CALCULATION ---
        const directionsService = new google.maps.DirectionsService();
        const origin = { lat: driverLat, lng: driverLng };

        // Logic to detect if we switched targets (e.g. from merchant to customer)
        const isTargetSwitch = prevOrderStatusRef.current !== orderStatus && !!prevOrderStatusRef.current;

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

                    // Update primary path states
                    setRoutePath(path);
                    setRemainingPath(path);

                    // If switching stages (e.g. just confirmed pickup), trigger animated unroll
                    if (isTargetSwitch && path.length > 0) {
                        // CRITICAL: Reset animated path immediately to clear the OLD route 
                        // before the first frame of the new animation starts
                        setAnimatedPath([]);
                        setIsAnimating(true);

                        let currentStep = 0;
                        const totalSteps = path.length;
                        const animate = () => {
                            currentStep += Math.max(1, Math.floor(totalSteps / 40));
                            if (currentStep >= totalSteps) {
                                setAnimatedPath(path);
                                setIsAnimating(false);
                                animationFrameRef.current = null;
                            } else {
                                setAnimatedPath(path.slice(0, currentStep));
                                animationFrameRef.current = requestAnimationFrame(animate);
                            }
                        };
                        animationFrameRef.current = requestAnimationFrame(animate);
                    } else if (!isAnimating) {
                        // Static update if not in a switch transition
                        setAnimatedPath(path);
                    }
                } else {
                    console.error("[RiderMap] Route failed:", status);
                    hardResetMap();
                }
            }
        );

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng, orderStatus, navigationMode, hardResetMap]);

    // --- AGGRESSIVE CLEANUP ON STATUS CHANGE ---
    useEffect(() => {
        const normalizedPrev = prevOrderStatusRef.current;
        const normalizedCurr = orderStatus;

        console.log(`[RiderMap] Effect Sync: Prev=${normalizedPrev}, Curr=${normalizedCurr}, Nav=${navigationMode}`);

        // Ensure cleanup if navigation mode is disabled or order ended
        if (!navigationMode || !normalizedCurr) {
            console.log("[RiderMap] CLEANUP TRIGGERED: Navigation disabled or no status.");
            hardResetMap();
            hasInitialCentered.current = false;

            if (mapRef.current && driverLat && driverLng) {
                mapRef.current.panTo({ lat: driverLat, lng: driverLng });
                mapRef.current.setZoom(14);
            }
            prevOrderStatusRef.current = undefined;
            return;
        }

        // Case B: Status changed (e.g., Merchant -> Customer)
        if (normalizedCurr && normalizedPrev && normalizedPrev !== normalizedCurr) {
            console.log("[RiderMap] STATUS SWITCH: ", normalizedPrev, "->", normalizedCurr);
            setRoutePath([]);
            setRemainingPath([]);
            setAnimatedPath([]);
            setIsAnimating(false);
            setShowCustomerInfo(false);

            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }
        }

        // Always sync the ref at the end of the effect
        prevOrderStatusRef.current = normalizedCurr;
    }, [orderStatus, navigationMode, driverLat, driverLng, hardResetMap]);

    // Secondary Cleanup: Handle movements and path erasing
    useEffect(() => {
        if (!navigationMode || !driverLat || !driverLng || routePath.length === 0 || isAnimating) return;

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
    }, [navigationMode, driverLat, driverLng, routePath, isAnimating]);

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
            if (normalizedStatus && ['PICKED_UP', 'IN_DELIVERY', 'ON_THE_WAY'].includes(normalizedStatus)) {
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
        console.log("[RiderMap-V10] Component MOUNTED");
        return () => {
            console.log("[RiderMap-V10] Component UNMOUNTING");
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
                fillColor: "#22c55e",
                strokeColor: "#166534",
                strokeWeight: 2,
                scale: 8,
                rotation: driverHeading,
            };
        }

        return {
            path: google.maps.SymbolPath.CIRCLE,
            fillOpacity: 1,
            fillColor: "#22c55e",
            strokeColor: "white",
            strokeWeight: 2,
            scale: 9,
        };
    }, [isLoaded, navigationMode, driverHeading]);

    console.log(`[RiderMap-V10] RENDER - Nav: ${navigationMode}, Status: ${orderStatus}`);

    if (!isLoaded) {
        return (
            <div style={{ height }} className="w-full bg-gray-50 flex flex-col items-center justify-center gap-3 rounded-xl border">
                <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Cargando mapa...</p>
            </div>
        );
    }

    const onUnmountMap = (map: google.maps.Map) => {
        console.log("[RiderMap] Global Map Instance Unmounting");
    };

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
                key={orderStatus ? `map-nav-${orderStatus}` : 'map-idle'}
                mapContainerStyle={containerStyle}
                onLoad={onMapLoad}
                onUnmount={onUnmountMap}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    scrollwheel: true,
                    gestureHandling: "greedy",
                    styles: normalMapStyles,
                }}
            >
                {/* ALL NAVIGATION OVERLAYS - Wrapped for atomic unmount */}
                {navigationMode && orderStatus && (
                    <>
                        {/* Route path */}
                        {(isAnimating ? animatedPath : remainingPath).length > 1 && (
                            <Polyline
                                key={`route-poly-${orderStatus}-${isAnimating ? 'anim' : 'static'}-${merchantLat || 0}-${customerLat || 0}`}
                                path={isAnimating ? animatedPath : remainingPath}
                                visible={navigationMode && orderStatus !== undefined}
                                options={{
                                    strokeColor: isAnimating ? "#22c55e" : "#4285F4",
                                    strokeWeight: isAnimating ? 8 : 6,
                                    strokeOpacity: isAnimating ? 0.9 : 0.4,
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
                                    let count = 0;
                                    const interval = setInterval(() => {
                                        count = (count + 1) % 200;
                                        const icons = polyline.get('icons');
                                        if (icons && icons[0]) {
                                            icons[0].offset = (count / 2) + '%';
                                            polyline.set('icons', icons);
                                        }
                                    }, 100);
                                    (polyline as any)._animationInterval = interval;
                                }}
                                onUnmount={(polyline) => {
                                    console.log("[RiderMap] Polyline unmounting - Cleanup forced");
                                    const poly = polyline as any;
                                    if (poly._animationInterval) clearInterval(poly._animationInterval);
                                    try { polyline.setMap(null); } catch (e) { }
                                }}
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
                                    scale: 10,
                                }}
                                title={merchantName}
                                label={{ text: "🏪", fontSize: "16px" }}
                                onUnmount={(marker) => { try { marker.setMap(null); } catch (e) { } }}
                            />
                        )}

                        {/* Customer marker - Red */}
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
                                        scale: 12,
                                    }}
                                    title={customerName?.split(' ')[0] || customerAddress}
                                    onClick={() => setShowCustomerInfo(true)}
                                    onUnmount={(marker) => { try { marker.setMap(null); } catch (e) { } }}
                                />
                                {(navigationMode || showCustomerInfo) && (
                                    <InfoWindow
                                        position={{ lat: customerLat, lng: customerLng }}
                                        onCloseClick={() => setShowCustomerInfo(false)}
                                        options={{
                                            pixelOffset: new google.maps.Size(0, -20),
                                            disableAutoPan: true,
                                            maxWidth: 120,
                                        }}
                                    >
                                        <div className="bg-gray-900 -m-1.5 px-3 py-1.5 rounded-full shadow-2xl border border-white/10 flex items-center gap-1.5">
                                            <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                                            <p className="text-[8px] font-black italic uppercase tracking-[1.5px] text-white leading-none">
                                                {customerName?.split(' ')[0] || "Cliente"}
                                            </p>
                                        </div>
                                    </InfoWindow>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* Always visible driver marker */}
                {driverLat && driverLng && (
                    <Marker
                        position={{ lat: driverLat, lng: driverLng }}
                        icon={driverIcon}
                        title="Tu ubicación"
                        zIndex={1000}
                        onUnmount={(marker) => { try { marker.setMap(null); } catch (e) { } }}
                    />
                )}
            </GoogleMap>
        </div>
    );
}

// Export WITHOUT memo to ensure state resets correctly on prop changes
export default RiderMiniMapComponent;
