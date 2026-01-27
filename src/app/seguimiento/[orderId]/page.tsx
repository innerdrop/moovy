"use client";

// Real-time order tracking page with Leaflet map
// Shows driver location in real-time using Socket.io

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Navigation, Phone, MapPin, Clock, CheckCircle } from "lucide-react";

// Dynamic import for Leaflet (SSR incompatible)
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

interface OrderData {
    id: string;
    orderNumber: string;
    status: string;
    address: {
        street: string;
        number: string;
        latitude?: number;
        longitude?: number;
    };
    driver?: {
        id: string;
        user: {
            name: string;
            phone?: string;
        };
    };
    merchant?: {
        name: string;
        latitude?: number;
        longitude?: number;
    };
}

interface DriverPosition {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
    timestamp: number;
}

export default function TrackingPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<OrderData | null>(null);
    const [driverPosition, setDriverPosition] = useState<DriverPosition | null>(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [delivered, setDelivered] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const mapRef = useRef<any>(null);

    // Fetch order details
    useEffect(() => {
        async function fetchOrder() {
            try {
                const res = await fetch(`/api/orders/${orderId}`);
                if (!res.ok) throw new Error("Pedido no encontrado");
                const data = await res.json();
                setOrder(data);

                if (data.status === "DELIVERED") {
                    setDelivered(true);
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        if (orderId) fetchOrder();
    }, [orderId]);

    // Connect to Socket.io for real-time tracking
    useEffect(() => {
        if (!orderId || !order) return;

        // Only track if order is in delivery
        const trackableStatuses = ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"];
        if (!trackableStatuses.includes(order.status)) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
            timeout: 10000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[Tracking] Connected to socket server");
            setConnected(true);
            socket.emit("track_order", orderId);
        });

        socket.on("disconnect", () => {
            console.log("[Tracking] Disconnected from socket server");
            setConnected(false);
        });

        socket.on("connect_error", (err) => {
            console.error("[Tracking] Socket connection error:", err.message);
            setConnected(false);
        });

        // Real-time driver position updates
        socket.on("posicion_repartidor", (data: DriverPosition) => {
            console.log("[Tracking] Driver position update:", data);

            setDriverPosition(prev => {
                // If we already have a position, we can animate/interpolate later
                // For now, just setting it will trigger a re-render
                return data;
            });

            // Smooth pan map to driver position if it's far from center
            if (mapRef.current) {
                const map = mapRef.current;
                const center = map.getCenter();
                const distToCenter = calculateDistanceInMeters(center.lat, center.lng, data.lat, data.lng);

                // Only pan if driver is move than 100m from current center to avoid constant jumping
                if (distToCenter > 100) {
                    map.panTo([data.lat, data.lng], { animate: true, duration: 1.5 });
                }
            }
        });

        // Order delivered notification
        socket.on("pedido_entregado", () => {
            setDelivered(true);
        });

        return () => {
            socket.disconnect();
        };
    }, [orderId, order]);

    // Polling fallback: fetch driver position every 10 seconds
    useEffect(() => {
        if (!orderId || !order?.driver?.id) return;

        const trackableStatuses = ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"];
        if (!trackableStatuses.includes(order.status)) return;

        const pollDriverPosition = async () => {
            try {
                const res = await fetch(`/api/driver/${order.driver!.id}/location`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.latitude && data.longitude) {
                        setDriverPosition({
                            lat: data.latitude,
                            lng: data.longitude,
                            timestamp: Date.now()
                        });
                    }
                }
            } catch (e) {
                // Ignore polling errors, WebSocket is primary
            }
        };

        // Initial fetch
        pollDriverPosition();

        // Poll every 10 seconds as fallback
        const interval = setInterval(pollDriverPosition, 10000);

        return () => clearInterval(interval);
    }, [orderId, order?.driver?.id, order?.status]);

    // Helper for frontend distance calculation
    function calculateDistanceInMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
        const R = 6371000; // Radius of the earth in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Calculate remaining distance and ETA
    const getTravelStats = () => {
        if (!driverPosition || !order?.address.latitude || !order?.address.longitude) return null;

        const distMeters = calculateDistanceInMeters(
            driverPosition.lat,
            driverPosition.lng,
            order.address.latitude,
            order.address.longitude
        );

        const distKm = distMeters / 1000;

        // Assume average speed in Ushuaia (approx 25 km/h for moto delivery)
        const avgSpeedKph = 25;
        const timeHours = distKm / avgSpeedKph;
        const timeMinutes = Math.max(1, Math.round(timeHours * 60 + 2)); // +2 mins for traffic/arrival

        return {
            distance: distKm.toFixed(1),
            eta: timeMinutes
        };
    };

    const stats = getTravelStats();

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
                <p className="text-red-400 mb-4">{error}</p>
                <button
                    onClick={() => router.back()}
                    className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700"
                >
                    Volver
                </button>
            </div>
        );
    }

    if (!order) return null;

    // Center map on delivery address or merchant
    const centerLat = order.address.latitude || order.merchant?.latitude || -54.8019;
    const centerLng = order.address.longitude || order.merchant?.longitude || -68.3030;

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 p-4 flex items-center gap-4">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-700 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="font-bold">Seguimiento</h1>
                    <p className="text-sm text-gray-400">Pedido {order.orderNumber}</p>
                </div>
                <div className={`ml-auto px-2 py-1 rounded text-xs ${connected ? "bg-green-600" : "bg-red-600"}`}>
                    {connected ? "En vivo" : "Desconectado"}
                </div>
            </header>

            {/* Delivered overlay */}
            {delivered && (
                <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center z-50">
                    <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">¡Pedido Entregado!</h2>
                    <p className="text-gray-400 mb-6">Tu pedido ha sido entregado exitosamente</p>
                    <button
                        onClick={() => router.push("/mis-pedidos")}
                        className="px-6 py-3 bg-orange-500 rounded-lg font-semibold hover:bg-orange-600"
                    >
                        Ver mis pedidos
                    </button>
                </div>
            )}

            {/* Map */}
            <div className="flex-1 relative">
                {typeof window !== "undefined" && (
                    <MapContainer
                        center={[centerLat, centerLng]}
                        zoom={15}
                        style={{ height: "100%", width: "100%" }}
                        ref={mapRef}
                    >
                        {/* OpenStreetMap tiles - FREE, no API key needed */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Driver marker */}
                        {driverPosition && (
                            <Marker position={[driverPosition.lat, driverPosition.lng]}>
                                <Popup>
                                    <div className="text-center">
                                        <p className="font-bold">{order.driver?.user.name || "Repartidor"}</p>
                                        <p className="text-sm text-gray-600">En camino</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Destination marker */}
                        {order.address.latitude && order.address.longitude && (
                            <Marker position={[order.address.latitude, order.address.longitude]}>
                                <Popup>
                                    <div className="text-center">
                                        <p className="font-bold">Destino</p>
                                        <p className="text-sm">{order.address.street} {order.address.number}</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}

                        {/* Merchant/pickup marker */}
                        {order.merchant?.latitude && order.merchant?.longitude && (
                            <Marker position={[order.merchant.latitude, order.merchant.longitude]}>
                                <Popup>
                                    <div className="text-center">
                                        <p className="font-bold">{order.merchant.name}</p>
                                        <p className="text-sm text-gray-600">Punto de retiro</p>
                                    </div>
                                </Popup>
                            </Marker>
                        )}
                    </MapContainer>
                )}
            </div>

            {/* Bottom info card */}
            <div className="bg-gray-800 p-4 rounded-t-2xl shadow-lg">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                        <Navigation className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold">{order.driver?.user.name || "Buscando repartidor..."}</h3>
                        <div className="flex flex-col">
                            <p className="text-sm text-gray-400">
                                {order.status === "DRIVER_ASSIGNED" && "Repartidor asignado"}
                                {order.status === "PICKED_UP" && "Pedido recogido"}
                                {["IN_DELIVERY", "ON_THE_WAY"].includes(order.status) && "En camino a tu ubicación"}
                            </p>
                            {stats && (
                                <p className="text-xs font-semibold text-orange-500 mt-0.5">
                                    A {stats.distance} km • Llega en {stats.eta} min aprox.
                                </p>
                            )}
                        </div>
                    </div>
                    {order.driver?.user.phone && (
                        <a
                            href={`tel:${order.driver.user.phone}`}
                            className="p-3 bg-green-600 rounded-full hover:bg-green-700"
                        >
                            <Phone className="w-5 h-5" />
                        </a>
                    )}
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-400">
                    <MapPin className="w-4 h-4" />
                    <span>{order.address.street} {order.address.number}</span>
                </div>

                {driverPosition && (
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-2">
                        <Clock className="w-4 h-4" />
                        <span>Última actualización: {new Date(driverPosition.timestamp).toLocaleTimeString()}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
