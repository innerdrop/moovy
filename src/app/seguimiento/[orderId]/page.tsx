"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Phone, MapPin, Clock, CheckCircle, Loader2, Package, Star, Rocket, Navigation, Store, User } from "lucide-react";

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
    driverRating?: number | null;
    ratingComment?: string | null;
    merchant?: {
        name: string;
        latitude?: number;
        longitude?: number;
        address?: string;
    };
}

interface DriverPosition {
    lat: number;
    lng: number;
    heading?: number;
    timestamp: number;
}

interface RouteInfo {
    distance: string;
    duration: string;
    distanceValue: number;
    durationValue: number;
}

const containerStyle = {
    width: "100%",
    height: "100%",
};

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

// Dark map styles for better visual appeal
const darkMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { featureType: "administrative.country", elementType: "geometry.stroke", stylers: [{ color: "#4b6878" }] },
    { featureType: "land", stylers: [{ color: "#2c3e50" }] },
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "poi", elementType: "geometry", stylers: [{ color: "#283d6a" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#98a5be" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
    { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f4a5e" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
];

export default function TrackingPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<OrderData | null>(null);
    const [driverPosition, setDriverPosition] = useState<DriverPosition | null>(null);
    const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
    const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [delivered, setDelivered] = useState(false);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRated, setHasRated] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

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

    // Directions logic with distance and time calculation
    useEffect(() => {
        if (!isLoaded || !order || !order.merchant?.latitude || !order.address.latitude) return;

        const directionsService = new google.maps.DirectionsService();

        // Determine origin based on driver position and order status
        let origin: google.maps.LatLngLiteral;
        let destination: google.maps.LatLngLiteral = { lat: order.address.latitude, lng: order.address.longitude || 0 };
        let waypoints: google.maps.DirectionsWaypoint[] = [];

        if (driverPosition) {
            origin = { lat: driverPosition.lat, lng: driverPosition.lng };

            // If driver hasn't picked up yet, route through merchant
            if (order.status === "DRIVER_ASSIGNED") {
                waypoints = [{
                    location: { lat: order.merchant.latitude, lng: order.merchant.longitude || 0 },
                    stopover: true
                }];
            }
        } else {
            origin = { lat: order.merchant.latitude, lng: order.merchant.longitude || 0 };
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
                    setDirections(result);

                    // Extract distance and duration from route
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
                            duration: totalDuration >= 3600
                                ? `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}min`
                                : `${Math.ceil(totalDuration / 60)} min`,
                            distanceValue: totalDistance,
                            durationValue: totalDuration
                        });
                    }
                }
            }
        );
    }, [isLoaded, order, driverPosition]);

    // Connect to Socket.io
    useEffect(() => {
        if (!orderId || !order) return;

        const trackableStatuses = ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"];
        if (!trackableStatuses.includes(order.status)) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://somosmoovy.com";
        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            socket.emit("track_order", orderId);
        });

        socket.on("disconnect", () => setConnected(false));

        socket.on("posicion_repartidor", (data: DriverPosition) => {
            setDriverPosition(data);
        });

        socket.on("pedido_entregado", () => setDelivered(true));

        // Listen for status updates (e.g., picked up)
        socket.on("order_status_update", (data: { orderId: string; status: string }) => {
            if (data.orderId === orderId) {
                setOrder(prev => prev ? { ...prev, status: data.status } : prev);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [orderId, order]);

    // Fit map bounds to show all markers
    useEffect(() => {
        if (!mapRef.current || !directions) return;

        const bounds = new google.maps.LatLngBounds();

        if (driverPosition) {
            bounds.extend({ lat: driverPosition.lat, lng: driverPosition.lng });
        }
        if (order?.merchant?.latitude) {
            bounds.extend({ lat: order.merchant.latitude, lng: order.merchant.longitude || 0 });
        }
        if (order?.address.latitude) {
            bounds.extend({ lat: order.address.latitude, lng: order.address.longitude || 0 });
        }

        mapRef.current.fitBounds(bounds, 60);
    }, [directions, driverPosition, order]);

    const handleRate = async () => {
        if (rating === 0) {
            alert("Por favor selecciona una calificación");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/rate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment })
            });

            if (res.ok) {
                setHasRated(true);
            } else {
                const data = await res.json();
                alert(data.error || "Error al calificar");
            }
        } catch (e) {
            alert("Error al enviar calificación");
        } finally {
            setIsSubmitting(false);
        }
    };

    const center = useMemo(() => {
        if (driverPosition) return { lat: driverPosition.lat, lng: driverPosition.lng };
        if (order?.address.latitude) return { lat: order.address.latitude, lng: order.address.longitude || 0 };
        return { lat: -54.8019, lng: -68.3030 };
    }, [driverPosition, order]);

    // Get status step (0-3)
    const getStatusStep = () => {
        switch (order?.status) {
            case "PENDING":
            case "CONFIRMED":
            case "PREPARING":
            case "READY":
                return 0;
            case "DRIVER_ASSIGNED":
                return 1;
            case "PICKED_UP":
            case "IN_DELIVERY":
            case "ON_THE_WAY":
                return 2;
            case "DELIVERED":
                return 3;
            default:
                return 0;
        }
    };

    const statusStep = getStatusStep();

    if (loading || !isLoaded) {
        return (
            <div className="h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 text-white">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="animate-pulse font-bold tracking-widest text-xs uppercase">Estableciendo conexión...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="h-screen bg-gray-900 flex flex-col items-center justify-center text-white p-4">
                <p className="text-red-400 mb-4">{error || "No se pudo cargar el pedido"}</p>
                <button onClick={() => router.back()} className="px-6 py-2 bg-gray-800 rounded-lg">Volver</button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
            {/* Delivered overlay & Rating */}
            {delivered && (
                <div className="absolute inset-0 bg-gray-900/98 flex flex-col items-center justify-center z-[100] p-6 text-center animate-in fade-in duration-500 backdrop-blur-sm">
                    {!hasRated && !order.driverRating ? (
                        <div className="w-full max-w-sm space-y-6">
                            <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 ring-4 ring-green-500/10">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-4xl font-black italic tracking-tighter">¡LLEGÓ TU PEDIDO!</h2>
                                <p className="text-gray-400 text-sm font-medium">¿Cómo fue tu experiencia con {order.driver?.user.name.split(' ')[0] || "nuestro repartidor"}?</p>
                            </div>

                            <div className="flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)} className="p-1 transition-all active:scale-75">
                                        <Star className={`w-12 h-12 transition-colors ${star <= rating ? "fill-orange-500 text-orange-500 scale-110" : "text-gray-700"}`} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Escribe un comentario..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px] resize-none"
                            />

                            <button
                                onClick={handleRate}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-orange-600 rounded-2xl font-black text-xl hover:bg-orange-700 transition shadow-2xl shadow-orange-600/30 disabled:opacity-50"
                            >
                                {isSubmitting ? "ENVIANDO..." : "VALORAR SERVICIO"}
                            </button>

                            <button onClick={() => router.push("/mis-pedidos")} className="text-gray-500 text-xs font-bold hover:text-gray-300 transition tracking-widest uppercase">
                                VER MIS PEDIDOS
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in zoom-in duration-300">
                            <div className="w-28 h-28 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto ring-8 ring-orange-500/5">
                                <Star className="w-14 h-14 text-orange-500 fill-orange-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black italic tracking-tighter">¡GRACIAS!</h2>
                                <p className="text-gray-400 text-sm font-medium">Tu valoración nos ayuda a ser mejores.</p>
                            </div>
                            <button
                                onClick={() => router.push("/mis-pedidos")}
                                className="w-full max-w-xs py-5 bg-gray-800 rounded-2xl font-black text-xl hover:bg-gray-700 transition tracking-tighter"
                            >
                                VOLVER A MIS PEDIDOS
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* MAP SECTION - Takes 60% of screen */}
            <div className="relative h-[60vh] flex-shrink-0">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 z-20 w-12 h-12 bg-gray-900/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-gray-800 transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                {/* Order Number Badge */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-gray-900/90 backdrop-blur rounded-full px-4 py-2 shadow-lg">
                    <span className="text-xs font-black text-orange-500 tracking-widest">#{order.orderNumber}</span>
                </div>

                {/* Live Indicator */}
                <div className={`absolute top-4 right-4 z-20 px-3 py-2 rounded-full shadow-lg flex items-center gap-2 ${connected ? "bg-green-500/20 border border-green-500/30" : "bg-gray-900/90"}`}>
                    <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{connected ? "En Vivo" : "Conectando"}</span>
                </div>

                {/* Map or Waiting State */}
                {!["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY", "DELIVERED"].includes(order.status) ? (
                    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-center p-8 z-10">
                        <div className="w-24 h-24 bg-orange-500/5 rounded-full flex items-center justify-center mb-6 animate-pulse border border-orange-500/20">
                            <Package className="w-12 h-12 text-orange-500" />
                        </div>
                        <h3 className="text-2xl font-black italic mb-2 tracking-tighter">PREPARANDO TU PEDIDO</h3>
                        <p className="text-gray-500 text-sm max-w-[240px] font-medium leading-tight">
                            El mapa se activará cuando el repartidor comience el viaje.
                        </p>
                    </div>
                ) : (
                    <GoogleMap
                        mapContainerStyle={containerStyle}
                        center={center}
                        zoom={15}
                        onLoad={map => { mapRef.current = map; }}
                        options={{
                            disableDefaultUI: true,
                            zoomControl: false,
                            scrollwheel: true,
                            gestureHandling: "greedy",
                            styles: darkMapStyles
                        }}
                    >
                        {directions && (
                            <DirectionsRenderer
                                options={{
                                    directions: directions,
                                    suppressMarkers: true,
                                    preserveViewport: false,
                                    polylineOptions: { strokeColor: "#f97316", strokeWeight: 5, strokeOpacity: 0.9 }
                                }}
                            />
                        )}

                        {/* Merchant Marker - Blue Store */}
                        {order.merchant?.latitude && (
                            <Marker
                                position={{ lat: order.merchant.latitude, lng: order.merchant.longitude || 0 }}
                                icon={{
                                    url: "data:image/svg+xml," + encodeURIComponent(`
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                                            <circle cx="20" cy="20" r="18" fill="#3b82f6" stroke="white" stroke-width="3"/>
                                            <path d="M12 18h16v10H12z M14 14h12l2 4H12l2-4z" fill="white"/>
                                        </svg>
                                    `),
                                    scaledSize: new google.maps.Size(40, 40),
                                    anchor: new google.maps.Point(20, 20)
                                }}
                            />
                        )}

                        {/* Driver Marker - Green Motorcycle */}
                        {driverPosition && (
                            <Marker
                                position={{ lat: driverPosition.lat, lng: driverPosition.lng }}
                                icon={{
                                    url: "data:image/svg+xml," + encodeURIComponent(`
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
                                            <circle cx="24" cy="24" r="22" fill="#22c55e" stroke="white" stroke-width="3"/>
                                            <circle cx="14" cy="28" r="5" fill="white"/>
                                            <circle cx="34" cy="28" r="5" fill="white"/>
                                            <path d="M10 24 L20 18 L28 18 L38 24" stroke="white" stroke-width="3" fill="none"/>
                                            <circle cx="24" cy="16" r="4" fill="white"/>
                                        </svg>
                                    `),
                                    scaledSize: new google.maps.Size(48, 48),
                                    anchor: new google.maps.Point(24, 24)
                                }}
                            />
                        )}

                        {/* Destination Marker - Red Pin */}
                        {order.address.latitude && (
                            <Marker
                                position={{ lat: order.address.latitude, lng: order.address.longitude || 0 }}
                                icon={{
                                    url: "data:image/svg+xml," + encodeURIComponent(`
                                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
                                            <path d="M20 0 C8.954 0 0 8.954 0 20 C0 35 20 50 20 50 C20 50 40 35 40 20 C40 8.954 31.046 0 20 0z" fill="#ef4444" stroke="white" stroke-width="2"/>
                                            <circle cx="20" cy="18" r="8" fill="white"/>
                                        </svg>
                                    `),
                                    scaledSize: new google.maps.Size(40, 50),
                                    anchor: new google.maps.Point(20, 50)
                                }}
                            />
                        )}
                    </GoogleMap>
                )}
            </div>

            {/* BOTTOM INFO PANEL */}
            <div className="flex-1 bg-gray-800 rounded-t-[32px] -mt-6 relative z-10 shadow-2xl overflow-y-auto">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-600 rounded-full" />
                </div>

                <div className="px-5 pb-8 space-y-5">
                    {/* Status Progress Bar */}
                    <div className="bg-gray-700/50 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            {["Confirmado", "Recogiendo", "En camino", "Entregado"].map((step, index) => (
                                <div key={step} className="flex flex-col items-center flex-1">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-all ${index <= statusStep
                                            ? "bg-orange-500 text-white"
                                            : "bg-gray-600 text-gray-400"
                                        }`}>
                                        {index === 0 && <CheckCircle className="w-4 h-4" />}
                                        {index === 1 && <Store className="w-4 h-4" />}
                                        {index === 2 && <Navigation className="w-4 h-4" />}
                                        {index === 3 && <MapPin className="w-4 h-4" />}
                                    </div>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${index <= statusStep ? "text-orange-500" : "text-gray-500"
                                        }`}>{step}</span>
                                </div>
                            ))}
                        </div>
                        {/* Progress line */}
                        <div className="h-1 bg-gray-600 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                                style={{ width: `${(statusStep / 3) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Distance & Time Cards */}
                    {routeInfo && ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"].includes(order.status) && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 rounded-2xl p-4 text-center">
                                <Navigation className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                                <p className="text-2xl font-black text-white">{routeInfo.distance}</p>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Distancia</p>
                            </div>
                            <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/30 rounded-2xl p-4 text-center">
                                <Clock className="w-6 h-6 text-green-400 mx-auto mb-1" />
                                <p className="text-2xl font-black text-white">{routeInfo.duration}</p>
                                <p className="text-[10px] font-bold text-green-400 uppercase tracking-widest">Tiempo Est.</p>
                            </div>
                        </div>
                    )}

                    {/* Driver Info Card */}
                    <div className="bg-gray-700/50 rounded-2xl p-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center">
                                    <Rocket className="w-7 h-7 text-white" />
                                </div>
                                {connected && (
                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-800" />
                                )}
                            </div>

                            <div className="flex-1">
                                <h3 className="font-black text-lg leading-tight">
                                    {order.driver?.user.name || "Asignando repartidor..."}
                                </h3>
                                <p className="text-xs text-gray-400 font-medium">
                                    {order.status === "DRIVER_ASSIGNED" && "🏪 Yendo al comercio"}
                                    {order.status === "PICKED_UP" && "📦 Recogió tu pedido"}
                                    {["IN_DELIVERY", "ON_THE_WAY"].includes(order.status) && "🚀 En camino a tu dirección"}
                                    {order.status === "DELIVERED" && "✅ Pedido entregado"}
                                </p>
                            </div>

                            {order.driver?.user.phone && (
                                <a
                                    href={`tel:${order.driver.user.phone}`}
                                    className="w-12 h-12 bg-orange-500 hover:bg-orange-600 text-white rounded-xl flex items-center justify-center shadow-lg transition active:scale-95"
                                >
                                    <Phone className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-gray-700/50 rounded-2xl p-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">📍 Dirección de Entrega</p>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-red-400" />
                            </div>
                            <p className="text-sm font-bold text-gray-200">{order.address.street} {order.address.number}</p>
                        </div>
                    </div>

                    {/* Merchant Info */}
                    {order.merchant && (
                        <div className="bg-gray-700/50 rounded-2xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">🏪 Comercio</p>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Store className="w-5 h-5 text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-200">{order.merchant.name}</p>
                                    {order.merchant.address && (
                                        <p className="text-xs text-gray-400">{order.merchant.address}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
