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
    onRouteTransition
}: RiderMiniMapProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
    const [remainingPath, setRemainingPath] = useState<google.maps.LatLngLiteral[]>([]);
    const [animatedPath, setAnimatedPath] = useState<google.maps.LatLngLiteral[]>([]); // For drawing animation
    const [isAnimating, setIsAnimating] = useState(false);
    const [userInteracted, setUserInteracted] = useState(false);
    const recenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const prevOrderStatusRef = useRef<string | undefined>(undefined);
    const [showCustomerInfo, setShowCustomerInfo] = useState(false);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
        language: 'es',
        region: 'AR'
    });

    // Calculate route path
    useEffect(() => {
        if (!isLoaded || !driverLat || !driverLng) return;

        // Cancel any existing animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }

        // Stage-based destination logic: 
        // If not picked up yet, destination is Merchant. 
        // Once picked up, destination is Customer.
        const isPickedUp = ["PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"].includes(orderStatus || "");

        const destination = isPickedUp
            ? (customerLat && customerLng ? { lat: customerLat, lng: customerLng } : null)
            : (merchantLat && merchantLng ? { lat: merchantLat, lng: merchantLng } : null);

        if (!destination) {
            setRoutePath([]);
            setRemainingPath([]);
            setAnimatedPath([]);
            setIsAnimating(false);
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        const origin = { lat: driverLat, lng: driverLng };

        // We use staged navigation, so no waypoints needed. 
        // This prevents the route from going "through" the merchant to the customer prematurely.
        const waypoints: google.maps.DirectionsWaypoint[] = [];

        if (navigationMode) {
            console.log("[RiderMap] Updating route...", {
                driver: { lat: driverLat, lng: driverLng },
                dest: destination,
                stage: isPickedUp ? "CUSTOMER" : "MERCHANT",
                status: orderStatus
            });
        }

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    // Extract path from all route legs
                    const path: google.maps.LatLngLiteral[] = [];
                    result.routes[0].legs.forEach(leg => {
                        leg.steps.forEach(step => {
                            step.path.forEach(point => {
                                path.push({ lat: point.lat(), lng: point.lng() });
                            });
                        });
                    });

                    // Check if this is a route transition (status changed)
                    const isTransition = prevOrderStatusRef.current !== undefined &&
                        prevOrderStatusRef.current !== orderStatus &&
                        (orderStatus === "PICKED_UP" || orderStatus === "IN_DELIVERY" || orderStatus === "ON_THE_WAY");

                    // Immediate update of primary state
                    setRoutePath(path);

                    if (isTransition) {
                        // Trigger animated route drawing
                        setIsAnimating(true);
                        setAnimatedPath([]);
                        onRouteTransition?.();

                        // Animate the route drawing progressively
                        let currentIndex = 0;
                        const animateStep = () => {
                            if (currentIndex < path.length) {
                                setAnimatedPath(path.slice(0, currentIndex + 1));
                                currentIndex += Math.max(1, Math.floor(path.length / 60)); // 50% slower for smoother animation
                                animationFrameRef.current = requestAnimationFrame(animateStep);
                            } else {
                                setAnimatedPath(path);
                                setRemainingPath(path);
                                setIsAnimating(false);
                                animationFrameRef.current = null;

                                // Fit map to new route after animation
                                if (mapRef.current && customerLat && customerLng && driverLat && driverLng) {
                                    const bounds = new google.maps.LatLngBounds();
                                    bounds.extend({ lat: driverLat, lng: driverLng });
                                    bounds.extend({ lat: customerLat, lng: customerLng });
                                    mapRef.current.fitBounds(bounds, { top: 50, right: 50, bottom: 150, left: 50 });
                                }
                            }
                        };
                        animationFrameRef.current = requestAnimationFrame(animateStep);
                    } else {
                        setRemainingPath(path);
                        setAnimatedPath(path);
                        setIsAnimating(false);
                    }

                    prevOrderStatusRef.current = orderStatus;
                } else {
                    console.error("[RiderMap] Route failed:", status);
                    // Clear if failed
                    setRoutePath([]);
                    setRemainingPath([]);
                }
            }
        );

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng, orderStatus, onRouteTransition, navigationMode]);

    // Immediately clear route when orderStatus changes OR becomes null (finished)
    const prevMerchantLatRef = useRef<number | undefined>(merchantLat);
    useEffect(() => {
        const orderFinished = prevOrderStatusRef.current && !orderStatus;
        const statusChanged = orderStatus && prevOrderStatusRef.current && orderStatus !== prevOrderStatusRef.current;
        const merchantCleared = prevMerchantLatRef.current !== undefined && merchantLat === undefined;

        if (orderFinished || statusChanged || merchantCleared) {
            // Status changed or merchant cleared (picked up) - immediately clear old route
            setRoutePath([]);
            setRemainingPath([]);
            setAnimatedPath([]);
            setIsAnimating(false);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
                animationFrameRef.current = null;
            }

            // If it was finished, reset the ref so it can detect new orders
            if (orderFinished) {
                prevOrderStatusRef.current = undefined;
            }
        }

        prevMerchantLatRef.current = merchantLat;
    }, [orderStatus, merchantLat]);

    // Clear route when delivery is completed (navigationMode becomes false)
    useEffect(() => {
        if (!navigationMode) {
            setRoutePath([]);
            setRemainingPath([]);
            setAnimatedPath([]);
            setIsAnimating(false);
            prevOrderStatusRef.current = undefined;
        }
    }, [navigationMode]);

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

            // Include destination in bounds
            if (orderStatus && ['PICKED_UP', 'IN_DELIVERY', 'ON_THE_WAY'].includes(orderStatus)) {
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

    // Fit bounds to show both driver/merchant and destination
    useEffect(() => {
        if (!mapRef.current || !isLoaded || navigationMode) return;

        const bounds = new google.maps.LatLngBounds();
        let pointsCovered = 0;

        if (driverLat && driverLng) {
            bounds.extend({ lat: driverLat, lng: driverLng });
            pointsCovered++;
        } else if (merchantLat && merchantLng) {
            bounds.extend({ lat: merchantLat, lng: merchantLng });
            pointsCovered++;
        }

        if (customerLat && customerLng) {
            bounds.extend({ lat: customerLat, lng: customerLng });
            pointsCovered++;
        } else if (merchantLat && merchantLng && driverLat) {
            // If going to merchant
            bounds.extend({ lat: merchantLat, lng: merchantLng });
            pointsCovered++;
        }

        if (pointsCovered >= 2) {
            mapRef.current.fitBounds(bounds, 50);
        }
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng, navigationMode]);

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

            {/* Re-center button - always visible in navigation mode */}
            {navigationMode && (
                <button
                    onClick={handleRecenter}
                    className="absolute top-2 right-24 z-10 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                    </svg>
                    Centrar
                </button>
            )}

            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={navigationMode ? 17 : 14}
                onLoad={onMapLoad}
                onDragStart={handleUserInteraction}
                onZoomChanged={handleUserInteraction}
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
                            strokeOpacity: isAnimating ? 0.9 : 0, // Hide main path when flow is shown
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
                            }, 50);
                            (polyline as any)._animationInterval = interval;
                        }}
                        onUnmount={(polyline) => {
                            if ((polyline as any)._animationInterval) {
                                clearInterval((polyline as any)._animationInterval);
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
