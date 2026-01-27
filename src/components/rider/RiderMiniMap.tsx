"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

// Dynamic imports for Leaflet (SSR incompatible)
const MapContainer = dynamic(
    () => import("react-leaflet").then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import("react-leaflet").then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import("react-leaflet").then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import("react-leaflet").then((mod) => mod.Popup),
    { ssr: false }
);
const Polyline = dynamic(
    () => import("react-leaflet").then((mod) => mod.Polyline),
    { ssr: false }
);

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

/**
 * Mini-map component for rider dashboard showing:
 * - Driver position (blue)
 * - Merchant/pickup location (orange)
 * - Customer/delivery location (green)
 * - Route line between points
 */
export default function RiderMiniMap({
    driverLat,
    driverLng,
    merchantLat,
    merchantLng,
    merchantName = "Comercio",
    customerLat,
    customerLng,
    customerAddress = "Cliente",
    height = "200px"
}: RiderMiniMapProps) {
    const mapRef = useRef<any>(null);

    // Calculate center point (prefer merchant, then customer, then driver)
    const centerLat = merchantLat || customerLat || driverLat || -54.8019;
    const centerLng = merchantLng || customerLng || driverLng || -68.3030;

    // Build route points for polyline
    const routePoints: [number, number][] = [];
    if (driverLat && driverLng) routePoints.push([driverLat, driverLng]);
    if (merchantLat && merchantLng) routePoints.push([merchantLat, merchantLng]);
    if (customerLat && customerLng) routePoints.push([customerLat, customerLng]);

    // Fit bounds to show all markers
    useEffect(() => {
        if (mapRef.current && routePoints.length > 1) {
            try {
                const map = mapRef.current;
                // Create bounds from all points
                const L = require("leaflet");
                const bounds = L.latLngBounds(routePoints);
                map.fitBounds(bounds, { padding: [30, 30] });
            } catch (e) {
                // Ignore if leaflet not loaded yet
            }
        }
    }, [routePoints]);

    if (typeof window === "undefined") return null;

    return (
        <div style={{ height, width: "100%" }} className="rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
                center={[centerLat, centerLng]}
                zoom={14}
                style={{ height: "100%", width: "100%" }}
                ref={mapRef}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Route polyline */}
                {routePoints.length > 1 && (
                    <Polyline
                        positions={routePoints}
                        color="#3b82f6"
                        weight={3}
                        opacity={0.7}
                        dashArray="10, 10"
                    />
                )}

                {/* Driver marker (blue) */}
                {driverLat && driverLng && (
                    <Marker position={[driverLat, driverLng]}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-blue-600">📍 Tu ubicación</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Merchant marker (orange) */}
                {merchantLat && merchantLng && (
                    <Marker position={[merchantLat, merchantLng]}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-orange-600">🏪 {merchantName}</p>
                                <p className="text-xs text-gray-500">Punto de retiro</p>
                            </div>
                        </Popup>
                    </Marker>
                )}

                {/* Customer marker (green) */}
                {customerLat && customerLng && (
                    <Marker position={[customerLat, customerLng]}>
                        <Popup>
                            <div className="text-center">
                                <p className="font-bold text-green-600">🏠 {customerAddress}</p>
                                <p className="text-xs text-gray-500">Destino</p>
                            </div>
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
}
