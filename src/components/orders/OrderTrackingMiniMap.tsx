"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";
import { io, Socket } from "socket.io-client";

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
    height = "180px"
}: OrderTrackingMiniMapProps) {
    const [driverPos, setDriverPos] = useState<{ lat: number, lng: number } | null>(
        initialDriverLat && initialDriverLng ? { lat: initialDriverLat, lng: initialDriverLng } : null
    );
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const socketRef = useRef<Socket | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    // Handle Socket Connection
    useEffect(() => {
        if (!orderId) return;

        // Only connect if order is in a trackable state
        const trackableStatuses = ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"];
        if (!trackableStatuses.includes(orderStatus)) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://somosmoovy.com";
        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
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
    }, [orderId, orderStatus]);

    // Request directions
    useEffect(() => {
        if (!isLoaded || !merchantLat || !merchantLng || !customerLat || !customerLng) return;

        const directionsService = new google.maps.DirectionsService();

        // Origin is Driver if available, otherwise Merchant
        const origin = driverPos
            ? { lat: driverPos.lat, lng: driverPos.lng }
            : { lat: merchantLat, lng: merchantLng };

        const destination = { lat: customerLat, lng: customerLng };

        // Waypoint at merchant if driver hasn't picked up yet
        const waypoints = (driverPos && orderStatus === "DRIVER_ASSIGNED")
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
                if (status === google.maps.DirectionsStatus.OK) {
                    setDirections(result);
                }
            }
        );
    }, [isLoaded, driverPos, merchantLat, merchantLng, customerLat, customerLng, orderStatus]);

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
        <div style={{ height }} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm relative">
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    scrollwheel: true,
                    gestureHandling: "cooperative",
                    styles: [
                        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
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
                                strokeColor: "#3b82f6",
                                strokeWeight: 4,
                                strokeOpacity: 0.8,
                            },
                        }}
                    />
                )}

                {/* Driver - GREEN */}
                {driverPos && (
                    <Marker
                        position={driverPos}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillOpacity: 1,
                            fillColor: "#22c55e",
                            strokeColor: "white",
                            strokeWeight: 2,
                            scale: 7,
                        }}
                    />
                )}

                {/* Merchant - BLUE */}
                {merchantLat && merchantLng && (
                    <Marker
                        position={{ lat: merchantLat, lng: merchantLng }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillOpacity: 1,
                            fillColor: "#3b82f6",
                            strokeColor: "white",
                            strokeWeight: 2,
                            scale: 6,
                        }}
                        title={merchantName}
                    />
                )}

                {/* Customer - RED */}
                {customerLat && customerLng && (
                    <Marker
                        position={{ lat: customerLat, lng: customerLng }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillOpacity: 1,
                            fillColor: "#ef4444",
                            strokeColor: "white",
                            strokeWeight: 2,
                            scale: 7,
                        }}
                        title={customerAddress}
                    />
                )}
            </GoogleMap>
        </div>
    );
}

export default React.memo(OrderTrackingMiniMap);
