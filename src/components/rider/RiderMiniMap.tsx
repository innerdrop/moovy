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
    navigationMode = false
}: RiderMiniMapProps) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
    const [remainingPath, setRemainingPath] = useState<google.maps.LatLngLiteral[]>([]);
    const [userInteracted, setUserInteracted] = useState(false);
    const recenterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

        const destination = customerLat && customerLng
            ? { lat: customerLat, lng: customerLng }
            : merchantLat && merchantLng
                ? { lat: merchantLat, lng: merchantLng }
                : null;

        if (!destination) return;

        const directionsService = new google.maps.DirectionsService();
        const origin = { lat: driverLat, lng: driverLng };

        const waypoints = (customerLat && customerLng && merchantLat && merchantLng)
            ? [{ location: { lat: merchantLat, lng: merchantLng }, stopover: true }]
            : [];

        if (navigationMode) {
            console.log("[RiderMap] Updating route...", {
                driver: { lat: driverLat, lng: driverLng },
                dest: destination,
                hasWaypoints: waypoints.length > 0
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
                    setRoutePath(path);
                    setRemainingPath(path);
                } else {
                    console.error("[RiderMap] Route failed:", status);
                }
            }
        );
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng]);

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

    // Auto-center on driver in navigation mode (respects user interaction)
    useEffect(() => {
        if (!navigationMode || !mapRef.current || !driverLat || !driverLng) return;

        // Only auto-center if user hasn't interacted recently
        if (!userInteracted) {
            mapRef.current.panTo({ lat: driverLat, lng: driverLng });
        }
    }, [navigationMode, driverLat, driverLng, userInteracted]);

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

    // Re-center button handler
    const handleRecenter = useCallback(() => {
        if (mapRef.current && driverLat && driverLng) {
            mapRef.current.panTo({ lat: driverLat, lng: driverLng });
            mapRef.current.setZoom(17);
            setUserInteracted(false);
            if (recenterTimeoutRef.current) {
                clearTimeout(recenterTimeoutRef.current);
            }
        }
    }, [driverLat, driverLng]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (recenterTimeoutRef.current) {
                clearTimeout(recenterTimeoutRef.current);
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

            {/* Re-center button when user has interacted */}
            {navigationMode && userInteracted && (
                <button
                    onClick={handleRecenter}
                    className="absolute bottom-4 right-4 z-10 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg flex items-center gap-2 transition-all"
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
                {remainingPath.length > 0 && (
                    <Polyline
                        path={remainingPath}
                        options={{
                            strokeColor: "#4285F4",
                            strokeWeight: 6,
                            strokeOpacity: 0.9,
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

// Memoize to prevent flickering during dashboard polling
export default React.memo(RiderMiniMapComponent);
