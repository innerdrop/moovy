"use client";

import { useState, useCallback, useEffect } from "react";
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Marker } from "@react-google-maps/api";
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

// Default center (Ushuaia)
const defaultCenter = {
    lat: -54.8019,
    lng: -68.3030,
};

export default function RiderMiniMap({
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
    const [response, setResponse] = useState<google.maps.DirectionsResult | null>(null);
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    useEffect(() => {
        if (!isLoaded || !driverLat || !driverLng || !merchantLat || !merchantLng) return;

        const directionsService = new google.maps.DirectionsService();

        const origin = { lat: driverLat, lng: driverLng };
        const destination = customerLat && customerLng
            ? { lat: customerLat, lng: customerLng }
            : { lat: merchantLat, lng: merchantLng };

        const waypoints = customerLat && customerLng
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
                    setResponse(result);
                } else {
                    console.error(`Directions request failed: ${status}`);
                }
            }
        );
    }, [isLoaded, driverLat, driverLng, merchantLat, merchantLng, customerLat, customerLng]);

    // Calculate center
    const center = merchantLat && merchantLng
        ? { lat: merchantLat, lng: merchantLng }
        : (driverLat && driverLng ? { lat: driverLat, lng: driverLng } : defaultCenter);

    return (
        <div style={{ height, width: "100%" }} className="rounded-xl overflow-hidden border border-gray-100 shadow-sm relative">
            {isLoaded ? (
                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={center}
                    zoom={14}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                        styles: [
                            {
                                featureType: "poi",
                                elementType: "labels",
                                stylers: [{ visibility: "off" }],
                            },
                        ],
                    }}
                >
                    {/* Directions Renderer */}
                    {response !== null && (
                        <DirectionsRenderer
                            options={{
                                directions: response,
                                suppressMarkers: true,
                                polylineOptions: {
                                    strokeColor: "#3b82f6",
                                    strokeWeight: 5,
                                    strokeOpacity: 0.8,
                                },
                            }}
                        />
                    )}

                    {/* Custom Markers */}
                    {/* Driver */}
                    {driverLat && driverLng && (
                        <Marker
                            position={{ lat: driverLat, lng: driverLng }}
                            icon={{
                                url: "/markers/driver-marker.png", // Fallback to custom SVG if images don't exist
                                scaledSize: new google.maps.Size(40, 40),
                            }}
                            title="Tu ubicación"
                        />
                    )}

                    {/* Merchant */}
                    {merchantLat && merchantLng && (
                        <Marker
                            position={{ lat: merchantLat, lng: merchantLng }}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                fillOpacity: 1,
                                fillColor: "#f97316", // Orange
                                strokeColor: "white",
                                strokeWeight: 2,
                                scale: 8,
                            }}
                            title={merchantName}
                        />
                    )}

                    {/* Customer */}
                    {customerLat && customerLng && (
                        <Marker
                            position={{ lat: customerLat, lng: customerLng }}
                            icon={{
                                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                                fillOpacity: 1,
                                fillColor: "#22c55e", // Green
                                strokeColor: "white",
                                strokeWeight: 2,
                                scale: 6,
                            }}
                            title={customerAddress}
                        />
                    )}
                </GoogleMap>
            ) : (
                <div className="w-full h-full bg-gray-50 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                    <p className="text-sm text-gray-500 font-medium">Cargando mapa interactivo...</p>
                </div>
            )}
        </div>
    );
}
