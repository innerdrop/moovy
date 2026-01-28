"use client";

import React, { useState, useEffect, useMemo } from "react";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { Loader2 } from "lucide-react";

interface RiderMiniMapProps {
    driverLat?: number;
    driverLng?: number;
    merchantLat?: number;
    merchantLng?: number;
    merchantName?: string;
    customerLat?: number;
    customerLng?: number;
    customerAddress?: string;
    height?: string;
}

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

const containerStyle = {
    width: "100%",
    height: "100%",
};

const defaultCenter = {
    lat: -54.8019,
    lng: -68.3030,
};

function RiderMiniMapComponent({
    driverLat,
    driverLng,
    merchantLat,
    merchantLng,
    merchantName = "Comercio",
    customerLat,
    customerLng,
    customerAddress = "Cliente",
    height = "250px"
}: RiderMiniMapProps) {
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    // Request directions
    useEffect(() => {
        if (!isLoaded || !driverLat || !driverLng || !merchantLat || !merchantLng) return;

        const directionsService = new google.maps.DirectionsService();

        const origin = { lat: driverLat, lng: driverLng };
        const destination = customerLat && customerLng
            ? { lat: customerLat, lng: customerLng }
            : { lat: merchantLat, lng: merchantLng };

        const waypoints = (customerLat && customerLng)
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
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng]);

    const center = useMemo(() => {
        if (driverLat && driverLng) return { lat: driverLat, lng: driverLng };
        if (merchantLat && merchantLng) return { lat: merchantLat, lng: merchantLng };
        return defaultCenter;
    }, [driverLat, driverLng, merchantLat, merchantLng]);

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
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={center}
                zoom={14}
                options={{
                    disableDefaultUI: true,
                    zoomControl: false,
                    scrollwheel: false,
                    gestureHandling: "none",
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
                            preserveViewport: true, // IMPORTANT: Prevents map from jumping/shaking on update
                            polylineOptions: {
                                strokeColor: "#3b82f6",
                                strokeWeight: 4,
                                strokeOpacity: 0.8,
                            },
                        }}
                    />
                )}

                {/* Driver - GREEN */}
                {driverLat && driverLng && (
                    <Marker
                        position={{ lat: driverLat, lng: driverLng }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillOpacity: 1,
                            fillColor: "#22c55e", // Green
                            strokeColor: "white",
                            strokeWeight: 2,
                            scale: 8,
                        }}
                        title="Tu ubicación"
                    />
                )}

                {/* Merchant - BLUE */}
                {merchantLat && merchantLng && (
                    <Marker
                        position={{ lat: merchantLat, lng: merchantLng }}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            fillOpacity: 1,
                            fillColor: "#3b82f6", // Blue
                            strokeColor: "white",
                            strokeWeight: 2,
                            scale: 7,
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
                            fillColor: "#ef4444", // Red
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

// Memoize to prevent flickering during dashboard polling
export default React.memo(RiderMiniMapComponent);
