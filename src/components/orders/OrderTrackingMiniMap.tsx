"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { Loader2, Clock, Navigation } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { useSocketAuth } from "@/hooks/useSocketAuth";

interface OrderTrackingMiniMapProps {
    orderId: string;
    orderStatus: string;
    merchantLat?: number;
    merchantLng?: number;
    merchantName?: string;
    customerLat?: number;
    customerLng?: number;
    customerAddress?: string;
    initialDriverLat?: number;
    initialDriverLng?: number;
    height?: string;
    showEta?: boolean;
}

interface RouteInfo {
    distance: string;
    duration: string;
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


function OrderTrackingMiniMap({
    orderId,
    orderStatus,
    merchantLat,
    merchantLng,
    merchantName = "Comercio",
    customerLat,
    customerLng,
    customerAddress = "Cliente",
    initialDriverLat,
    initialDriverLng,
    height = "180px",
    showEta = false
}: OrderTrackingMiniMapProps) {
    const [driverPos, setDriverPos] = useState<{ lat: number, lng: number } | null>(
        initialDriverLat && initialDriverLng ? { lat: initialDriverLat, lng: initialDriverLng } : null
    );
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [userInteracted, setUserInteracted] = useState(false);
    const [hasPickupCentered, setHasPickupCentered] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    // Sync driver pos with props if they update
    useEffect(() => {
        if (initialDriverLat && initialDriverLng) {
            setDriverPos({ lat: initialDriverLat, lng: initialDriverLng });
        }
    }, [initialDriverLat, initialDriverLng]);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
        language: 'es',
        region: 'AR'
    });

    // Get socket auth token
    const { token: socketToken } = useSocketAuth(
        ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY"].includes(orderStatus)
    );

    // Handle Socket Connection
    useEffect(() => {
        if (!orderId || !socketToken) return;

        const trackableStatuses = ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY"];
        if (!trackableStatuses.includes(orderStatus)) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://somosmoovy.com";
        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            auth: { token: socketToken },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            socket.emit("track_order", orderId);
        });

        socket.on("posicion_repartidor", (data: { lat: number, lng: number }) => {
            setDriverPos({ lat: data.lat, lng: data.lng });
        });

        return () => {
            socket.disconnect();
        };
    }, [orderId, orderStatus, socketToken]);

    // Request directions and calculate ETA
    useEffect(() => {
        if (!isLoaded || !customerLat || !customerLng) return;

        // Origin is driver if available, otherwise merchant
        const origin = driverPos
            ? { lat: driverPos.lat, lng: driverPos.lng }
            : (merchantLat && merchantLng) ? { lat: merchantLat, lng: merchantLng } : null;

        if (!origin) return;

        const directionsService = new google.maps.DirectionsService();
        const destination = { lat: customerLat, lng: customerLng };

        // Waypoints only if we have merchant and haven't picked up yet
        const waypoints = (driverPos && orderStatus === "DRIVER_ASSIGNED" && merchantLat && merchantLng)
            ? [{ location: { lat: merchantLat, lng: merchantLng }, stopover: true }]
            : [];

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
            },
            (result, status) => {
                if (status === google.maps.DirectionsStatus.OK && result) {
                    setDirections(result);

                    const route = result.routes[0];
                    if (route && route.legs) {
                        let totalDistance = 0;
                        let totalDuration = 0;

                        route.legs.forEach(leg => {
                            totalDistance += leg.distance?.value || 0;
                            totalDuration += leg.duration?.value || 0;
                        });

                        setRouteInfo({
                            distance: totalDistance >= 1000
                                ? `${(totalDistance / 1000).toFixed(1)} km`
                                : `${totalDistance} m`,
                            duration: `${Math.ceil(totalDuration / 60)} min`
                        });
                    }
                }
            }
        );
    }, [isLoaded, driverPos, merchantLat, merchantLng, customerLat, customerLng, orderStatus]);

    // Intelligent centering on pickup - show rider + customer once
    useEffect(() => {
        if (!mapRef.current || !isLoaded) return;

        // Only trigger once when status changes to PICKED_UP or IN_DELIVERY
        const isPickedUp = ['PICKED_UP', 'IN_DELIVERY'].includes(orderStatus);
        if (isPickedUp && !hasPickupCentered && driverPos && customerLat && customerLng) {
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(driverPos);
            bounds.extend({ lat: customerLat, lng: customerLng });
            mapRef.current.fitBounds(bounds, 60);
            setHasPickupCentered(true);
            setUserInteracted(false); // Allow this one auto-center
        }
    }, [isLoaded, orderStatus, driverPos, customerLat, customerLng, hasPickupCentered]);

    // Fit bounds to show all markers (only on initial load, respects user interaction)
    useEffect(() => {
        if (!mapRef.current || !isLoaded || userInteracted || hasPickupCentered) return;

        const bounds = new google.maps.LatLngBounds();
        let hasPoints = false;

        if (driverPos) {
            bounds.extend(driverPos);
            hasPoints = true;
        }
        if (merchantLat && merchantLng) {
            bounds.extend({ lat: merchantLat, lng: merchantLng });
            hasPoints = true;
        }
        if (customerLat && customerLng) {
            bounds.extend({ lat: customerLat, lng: customerLng });
            hasPoints = true;
        }

        if (hasPoints) {
            mapRef.current.fitBounds(bounds, 50);
        }
    }, [isLoaded, directions]);

    // Handle user interaction - prevent auto-recentering
    const handleUserInteraction = () => {
        setUserInteracted(true);
    };

    // Re-center button handler
    const handleRecenter = () => {
        if (!mapRef.current) return;

        const bounds = new google.maps.LatLngBounds();
        if (driverPos) bounds.extend(driverPos);
        if (customerLat && customerLng) bounds.extend({ lat: customerLat, lng: customerLng });

        mapRef.current.fitBounds(bounds, 60);
        setUserInteracted(false);
    };

    const center = useMemo(() => {
        if (driverPos) return driverPos;
        if (merchantLat && merchantLng) return { lat: merchantLat, lng: merchantLng };
        return defaultCenter;
    }, [driverPos, merchantLat, merchantLng]);

    if (!isLoaded) {
        return (
            <div style={{ height }} className="animate-pulse bg-gray-100 rounded-xl flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
            </div>
        );
    }

    return (
        <div style={{ height }} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm relative group">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                onLoad={map => { mapRef.current = map; }}
                onDragStart={handleUserInteraction}
                onZoomChanged={handleUserInteraction}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    scrollwheel: true,
                    gestureHandling: "greedy",
                    styles: [
                        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
                    ],
                }}
            >
                {directions && (
                    <DirectionsRenderer
                        options={{
                            directions: directions,
                            suppressMarkers: true,
                            preserveViewport: true,
                            polylineOptions: {
                                strokeColor: "#4285F4",
                                strokeWeight: 6,
                                strokeOpacity: 0.8,
                            },
                        }}
                    />
                )}

                {/* Merchant Marker */}
                {merchantLat && merchantLng && (
                    <Marker
                        position={{ lat: merchantLat, lng: merchantLng }}
                        icon={{
                            url: "data:image/svg+xml," + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                                    <circle cx="15" cy="15" r="13" fill="#3b82f6" stroke="white" stroke-width="2"/>
                                    <path d="M10 14h10v6H10z" fill="white"/>
                                </svg>
                            `),
                            scaledSize: new google.maps.Size(30, 30),
                            anchor: new google.maps.Point(15, 15)
                        }}
                    />
                )}

                {/* Driver Marker */}
                {driverPos && (
                    <Marker
                        position={driverPos}
                        icon={{
                            url: "data:image/svg+xml," + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                    <circle cx="20" cy="20" r="18" fill="#22c55e" stroke="white" stroke-width="3"/>
                                    <path d="M20 10 L28 28 L20 24 L12 28 Z" fill="white" />
                                </svg>
                            `),
                            scaledSize: new google.maps.Size(40, 40),
                            anchor: new google.maps.Point(20, 20),
                            rotation: (directions?.routes[0]?.legs[0]?.steps[0] as any)?.start_location ? 0 : 0 // Default to 0 for now as heading isn't in socket yet
                        }}
                    />
                )}

                {/* Customer Marker */}
                {customerLat && customerLng && (
                    <Marker
                        position={{ lat: customerLat, lng: customerLng }}
                        icon={{
                            url: "data:image/svg+xml," + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38">
                                    <path d="M15 0 C6.7 0 0 6.7 0 15 C0 26 15 38 15 38 C15 38 30 26 30 15 C30 6.7 23.3 0 15 0z" fill="#ef4444" stroke="white" stroke-width="2"/>
                                    <circle cx="15" cy="14" r="6" fill="white"/>
                                </svg>
                            `),
                            scaledSize: new google.maps.Size(30, 38),
                            anchor: new google.maps.Point(15, 38)
                        }}
                    />
                )}
            </GoogleMap>

            {/* Re-center button when user has panned */}
            {userInteracted && driverPos && (
                <button
                    onClick={handleRecenter}
                    className="absolute top-2 right-2 z-10 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                    </svg>
                    Centrar
                </button>
            )}

            {/* ETA Overlay */}
            {showEta && routeInfo && (
                <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl p-3 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-gray-900">Llegada en {routeInfo.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Navigation className="w-4 h-4 text-blue-500" />
                        <span className="text-xs font-medium text-gray-500">{routeInfo.distance}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

export default React.memo(OrderTrackingMiniMap);
