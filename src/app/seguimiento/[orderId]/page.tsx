"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, Polyline } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import {
    ArrowLeft,
    Phone,
    MapPin,
    Clock,
    CheckCircle,
    Loader2,
    Package,
    Star,
    Rocket,
    Navigation,
    Store,
    User,
    ChevronRight,
    MessageCircle,
    Bell,
    XCircle,
    X
} from "lucide-react";
import Link from "next/link";

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
        latitude?: number;
        longitude?: number;
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
        language: 'es',
        region: 'AR'
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

                if (data.driver?.latitude && data.driver?.longitude) {
                    setDriverPosition({
                        lat: data.driver.latitude,
                        lng: data.driver.longitude,
                        timestamp: Date.now()
                    });
                }
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        if (orderId) fetchOrder();
    }, [orderId]);

    // Directions logic
    useEffect(() => {
        const addr = order?.address;
        const driver = order?.driver;
        const merchant = order?.merchant;
        const status = order?.status?.toUpperCase() || "";

        if (!isLoaded || !order) return;

        const solveDirections = async () => {
            let destLat = addr?.latitude;
            let destLng = addr?.longitude;

            // FALLBACK: If DB has no coordinates, try geocoding the address string
            if (!destLat && addr?.street) {
                console.log("[Tracking] Address has no coordinates, geocoding...", addr.street);
                const geocoder = new google.maps.Geocoder();
                try {
                    const result = await geocoder.geocode({
                        address: `${addr.street} ${addr.number}, ${addr.city || "Ushuaia"}, Argentina`
                    });
                    if (result.results[0]) {
                        destLat = result.results[0].geometry.location.lat();
                        destLng = result.results[0].geometry.location.lng();
                        console.log("[Tracking] Geocoding success:", { destLat, destLng });
                    }
                } catch (e) {
                    console.error("[Tracking] Geocoding failed:", e);
                }
            }

            if (!destLat) {
                console.log("[Tracking] Directions skipped: still no destination coordinates");
                return;
            }

            const directionsService = new google.maps.DirectionsService();

            const destination: google.maps.LatLngLiteral = {
                lat: typeof destLat === 'string' ? parseFloat(destLat) : destLat,
                lng: typeof destLng === 'string' ? parseFloat(destLng) : (destLng || 0)
            };

            let origin: google.maps.LatLngLiteral;
            let waypoints: google.maps.DirectionsWaypoint[] = [];

            const currentDriverPos = driverPosition
                || (driver?.latitude && driver?.longitude
                    ? { lat: parseFloat(driver.latitude as any), lng: parseFloat(driver.longitude as any) } : null);

            if (currentDriverPos) {
                origin = { lat: currentDriverPos.lat, lng: currentDriverPos.lng };
                if (status === "DRIVER_ASSIGNED" && merchant?.latitude) {
                    waypoints = [{
                        location: { lat: parseFloat(merchant.latitude as any), lng: parseFloat(merchant.longitude as any || "0") },
                        stopover: true
                    }];
                }
            } else if (merchant?.latitude) {
                origin = { lat: parseFloat(merchant.latitude as any), lng: parseFloat(merchant.longitude as any || "0") };
            } else {
                console.log("[Tracking] No valid origin found for route");
                return;
            }

            console.log("[Tracking] Requesting route:", { origin, destination, waypoints: waypoints.length });

            directionsService.route(
                {
                    origin,
                    destination,
                    waypoints,
                    travelMode: google.maps.TravelMode.DRIVING,
                    optimizeWaypoints: true
                },
                (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK && result) {
                        console.log("[Tracking] Route found:", result.routes[0].summary);
                        setDirections(result);
                        const route = result.routes[0];
                        if (route && route.legs) {
                            let d = 0, t = 0;
                            route.legs.forEach(leg => {
                                d += leg.distance?.value || 0;
                                t += leg.duration?.value || 0;
                            });
                            setRouteInfo({
                                distance: d >= 1000 ? `${(d / 1000).toFixed(1)} km` : `${d} m`,
                                duration: `${Math.ceil(t / 60)} min`,
                                distanceValue: d,
                                durationValue: t
                            });
                        }
                    } else {
                        console.error("[Tracking] Directions request failed due to " + status);
                    }
                }
            );
        };

        solveDirections();
    }, [isLoaded, order, driverPosition]);

    // Socket.io connection
    useEffect(() => {
        if (!orderId || !order) return;

        const trackableStatuses = ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"];
        const currentStatus = order.status.toUpperCase();
        if (!trackableStatuses.includes(currentStatus)) {
            console.log("[Tracking] Status not trackable:", currentStatus);
            return;
        }

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        console.log("[Tracking] Connecting to socket:", socketUrl);

        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[Tracking] Connected to socket!");
            setConnected(true);
            socket.emit("track_order", orderId);
        });

        socket.on("connect_error", (err) => {
            console.error("[Tracking] Socket connection error:", err.message);
        });

        socket.on("disconnect", (reason) => {
            console.log("[Tracking] Disconnected:", reason);
            setConnected(false);
        });

        socket.on("posicion_repartidor", (data: DriverPosition) => {
            console.log("[Tracking] New position received:", data);
            setDriverPosition(data);
        });

        socket.on("pedido_entregado", () => {
            setDelivered(true);
        });

        socket.on("order_status_update", (data: { orderId: string; status: string }) => {
            console.log("[Tracking] Status update:", data);
            if (data.orderId === orderId) {
                setOrder(prev => prev ? { ...prev, status: data.status } : prev);
            }
        });

        return () => {
            console.log("[Tracking] Cleaning up socket");
            socket.disconnect();
        };
    }, [orderId, order?.id, order?.status]);

    // Fit map bounds to show all relevant points
    useEffect(() => {
        if (!mapRef.current || !isLoaded) return;

        const bounds = new google.maps.LatLngBounds();
        let hasPoints = false;

        const currentDriverPos = driverPosition
            || (order?.driver?.latitude && order?.driver?.longitude ? { lat: order.driver.latitude, lng: order.driver.longitude } : null);

        if (currentDriverPos) {
            bounds.extend(currentDriverPos);
            hasPoints = true;
        }

        if (order?.merchant?.latitude) {
            bounds.extend({ lat: order.merchant.latitude, lng: order.merchant.longitude || 0 });
            hasPoints = true;
        }

        // Use directions bounds if available for better framing
        if (directions && directions.routes[0]?.bounds) {
            mapRef.current.fitBounds(directions.routes[0].bounds, {
                top: 100,
                right: 50,
                bottom: 100,
                left: 50
            });
            return;
        }

        if (order?.address.latitude) {
            bounds.extend({ lat: order.address.latitude, lng: order.address.longitude || 0 });
            hasPoints = true;
        } else if (directions && directions.routes[0]?.legs[0]?.end_location) {
            // Fallback to directions end_location if DB has no coords
            bounds.extend(directions.routes[0].legs[0].end_location);
            hasPoints = true;
        }

        if (hasPoints) {
            // Apply bounds with reasonable padding
            mapRef.current.fitBounds(bounds, {
                top: 100,
                right: 50,
                bottom: 100,
                left: 50
            });
        }
    }, [isLoaded, directions, driverPosition, order?.id, order?.merchant, order?.address]);

    const handleRate = async () => {
        if (rating === 0) return alert("Selecciona una calificación");
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/rate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment })
            });
            if (res.ok) setHasRated(true);
        } catch (e) { alert("Error al calificar"); } finally { setIsSubmitting(false); }
    };

    const getStatusStep = () => {
        switch (order?.status) {
            case "PENDING":
            case "CONFIRMED":
            case "PREPARING":
            case "READY": return 0;
            case "DRIVER_ASSIGNED": return 1;
            case "PICKED_UP":
            case "IN_DELIVERY":
            case "ON_THE_WAY": return 2;
            case "DELIVERED": return 3;
            default: return 0;
        }
    };

    const statusStep = getStatusStep();

    if (loading || !isLoaded) {
        return (
            <div className="h-screen bg-white flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <Rocket className="w-10 h-10 text-[#e60012] animate-bounce" />
                    <Loader2 className="w-16 h-16 text-gray-100 animate-spin absolute -top-3 -left-3 -z-10" />
                </div>
                <p className="font-black italic tracking-tighter text-gray-900 uppercase">Localizando pedido...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-xl font-bold mb-2">¡Ups! Algo salió mal</h1>
                <p className="text-gray-500 mb-8">{error || "No se pudo cargar el pedido"}</p>
                <button onClick={() => router.back()} className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl">Volver</button>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden font-sans">
            {/* Delivered overlay & Rating */}
            {delivered && (
                <div className="fixed inset-0 bg-white/95 flex flex-col items-center justify-center z-[100] p-6 text-center transition-all duration-500 backdrop-blur-md">
                    {!hasRated && !order.driverRating ? (
                        <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in-95 duration-500">
                            <div className="w-24 h-24 bg-green-100 rounded-[32px] flex items-center justify-center mx-auto mb-4 rotate-12">
                                <CheckCircle className="w-12 h-12 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">¡PEDIDO RECIBIDO!</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Cuéntanos cómo te atendió {order.driver?.user.name.split(' ')[0]}</p>
                            </div>

                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button key={star} onClick={() => setRating(star)} className="p-1 transition-all active:scale-75 hover:scale-110">
                                        <Star className={`w-10 h-10 transition-colors ${star <= rating ? "fill-orange-500 text-orange-500" : "text-gray-200"}`} />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Escribe un comentario..."
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-3xl p-5 text-sm focus:border-orange-500 outline-none min-h-[120px] resize-none font-medium text-gray-700"
                            />

                            <button
                                onClick={handleRate}
                                disabled={isSubmitting}
                                className="w-full py-5 bg-gray-900 text-white rounded-[24px] font-black text-lg hover:bg-black transition-all shadow-xl shadow-gray-200 active:scale-95 italic uppercase tracking-widest"
                            >
                                {isSubmitting ? "ENVIANDO..." : "CALIFICAR"}
                            </button>

                            <button onClick={() => router.push("/mis-pedidos")} className="text-gray-400 text-[10px] font-black uppercase tracking-[3px]">IR A MIS PEDIDOS</button>
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in zoom-in duration-500">
                            <div className="w-32 h-32 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                                <Star className="w-16 h-16 text-orange-500 fill-orange-500" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-4xl font-black italic tracking-tighter text-gray-900 uppercase">¡GRACIAS!</h2>
                                <p className="text-gray-400 font-bold uppercase tracking-[4px] text-xs">Valoración enviada</p>
                            </div>
                            <button
                                onClick={() => router.push("/mis-pedidos")}
                                className="w-full max-w-xs py-5 bg-gray-900 text-white rounded-[24px] font-black text-lg tracking-widest uppercase italic"
                            >
                                CONTINUAR
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* MAP SECTION (60%) */}
            <div className="relative h-[55vh] flex-shrink-0 z-10 shadow-lg">
                <button
                    onClick={() => router.back()}
                    className="absolute top-4 left-4 z-20 w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-xl border border-white active:scale-95 transition"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-900" />
                </button>

                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-gray-900 text-white rounded-full px-5 py-2 shadow-2xl border-2 border-white/20">
                    <span className="text-[10px] font-black uppercase tracking-widest">#{order.orderNumber}</span>
                </div>

                <div className={`absolute top-4 right-4 z-20 px-4 py-2 rounded-full shadow-xl flex items-center gap-2 border border-white ${connected ? "bg-white/90 backdrop-blur-md" : "bg-red-50"}`}>
                    <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-900">{connected ? "En Vivo" : "Desconectado"}</span>
                </div>

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={{ lat: order.address.latitude || -54.8019, lng: order.address.longitude || -68.3030 }}
                    zoom={15}
                    onLoad={map => { mapRef.current = map; }}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: false,
                        scrollwheel: true,
                        gestureHandling: "greedy",
                    }}
                >
                    {/* Animated Route Line */}
                    {directions && directions.routes[0].overview_path && (
                        <Polyline
                            path={directions.routes[0].overview_path}
                            options={{
                                strokeColor: "#4285F4",
                                strokeOpacity: 0,
                                strokeWeight: 6,
                                icons: [{
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

                    {/* Background Route Line (Static) */}
                    {directions && ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"].includes(order.status.toUpperCase()) && directions.routes[0].overview_path && (
                        <Polyline
                            path={directions.routes[0].overview_path}
                            options={{
                                strokeColor: "#4285F4",
                                strokeOpacity: 0.2,
                                strokeWeight: 8,
                            }}
                        />
                    )}

                    {/* Directions calculation logic (hidden renderer) */}
                    {directions && (
                        <DirectionsRenderer
                            options={{
                                directions: directions,
                                suppressMarkers: true,
                                suppressPolylines: true, // We draw our own animated one
                                preserveViewport: true,
                            }}
                        />
                    )}

                    {/* Merchant Marker */}
                    {order.merchant?.latitude && (
                        <Marker
                            position={{ lat: order.merchant.latitude, lng: order.merchant.longitude || 0 }}
                            icon={{
                                url: "data:image/svg+xml," + encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="16" fill="#3b82f6" stroke="white" stroke-width="3"/>
                                        <path d="M11 17h14v8H11z M13 13h10l2 4H11l2-4z" fill="white"/>
                                    </svg>
                                `),
                                scaledSize: new google.maps.Size(36, 36),
                                anchor: new google.maps.Point(18, 18)
                            }}
                        />
                    )}

                    {/* Driver Marker */}
                    {driverPosition && (
                        <Marker
                            position={{ lat: driverPosition.lat, lng: driverPosition.lng }}
                            icon={{
                                url: "data:image/svg+xml," + encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
                                        <circle cx="22" cy="22" r="20" fill="#22c55e" stroke="white" stroke-width="3"/>
                                        <path d="M15 26 L23 20 L29 20 L37 26" stroke="white" stroke-width="3" fill="none"/>
                                        <circle cx="15" cy="28" r="4" fill="white"/>
                                        <circle cx="29" cy="28" r="4" fill="white"/>
                                    </svg>
                                `),
                                scaledSize: new google.maps.Size(44, 44),
                                anchor: new google.maps.Point(22, 22)
                            }}
                        />
                    )}

                    {/* Destination Marker */}
                    {(order.address.latitude || (directions && directions.routes[0]?.legs[0]?.end_location)) && (
                        <Marker
                            position={order.address.latitude
                                ? { lat: order.address.latitude, lng: order.address.longitude || 0 }
                                : directions!.routes[0].legs[0].end_location
                            }
                            icon={{
                                url: "data:image/svg+xml," + encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="46" viewBox="0 0 36 46">
                                        <path d="M18 0 C8 0 0 8 0 18 C0 32 18 46 18 46 C18 46 36 32 36 18 C36 8 28 0 18 0z" fill="#ef4444" stroke="white" stroke-width="3"/>
                                        <circle cx="18" cy="18" r="7" fill="white"/>
                                    </svg>
                                `),
                                scaledSize: new google.maps.Size(36, 46),
                                anchor: new google.maps.Point(18, 46)
                            }}
                        />
                    )}
                </GoogleMap>
            </div>

            {/* BOTTOM PANEL */}
            <div className="flex-1 bg-white rounded-t-[36px] -mt-10 relative z-20 shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col">
                <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto my-4 flex-shrink-0" />

                <div className="flex-1 overflow-y-auto px-6 pb-10 space-y-6">
                    {/* Status Message */}
                    <div className="text-center">
                        <p className="text-[10px] font-black text-[#e60012] uppercase tracking-[4px] mb-2 px-6 py-1 bg-red-50 rounded-full w-fit mx-auto">Estado del Pedido</p>
                        <h1 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase">
                            {order.status.toUpperCase() === "DRIVER_ASSIGNED" && "REPARTIDOR EN CAMINO"}
                            {order.status.toUpperCase() === "PICKED_UP" && "PEDIDO RECOGIDO"}
                            {["IN_DELIVERY", "ON_THE_WAY"].includes(order.status.toUpperCase()) && "TU PEDIDO ESTÁ LLEGANDO"}
                            {order.status.toUpperCase() === "DELIVERED" && "¡DISFRUTA TU PEDIDO!"}
                            {["PENDING", "CONFIRMED", "PREPARING", "READY", "DRIVER_ARRIVED"].includes(order.status.toUpperCase()) && "PREPARANDO TU PEDIDO"}
                        </h1>
                    </div>

                    {/* Timeline Progress */}
                    <div className="flex items-center justify-between px-2 pt-2">
                        {[
                            { icon: <Store className="w-4 h-4" />, label: "Tienda" },
                            { icon: <Package className="w-4 h-4" />, label: "Preparado" },
                            { icon: <Rocket className="w-4 h-4" />, label: "En Viaje" },
                            { icon: <CheckCircle className="w-4 h-4" />, label: "Recibido" }
                        ].map((step, idx) => {
                            const status = order.status.toUpperCase();
                            const activeIdx = idx <= (
                                status === "DELIVERED" ? 3 :
                                    ["PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"].includes(status) ? 2 :
                                        ["CONFIRMED", "PREPARING", "READY", "DRIVER_ASSIGNED", "DRIVER_ARRIVED"].includes(status) ? 1 : 0
                            );
                            return (
                                <div key={idx} className="flex flex-col items-center gap-2 flex-1 relative">
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${activeIdx ? "bg-gray-900 text-white scale-110 shadow-lg" : "bg-gray-50 text-gray-300"}`}>
                                        {step.icon}
                                    </div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest ${activeIdx ? "text-gray-900" : "text-gray-300"}`}>{step.label}</span>
                                    {idx < 3 && (
                                        <div className={`absolute top-5 left-[calc(50%+20px)] w-[calc(100%-40px)] h-0.5 ${idx < statusStep ? "bg-gray-900" : "bg-gray-100"}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* ETA Card */}
                    {routeInfo && ["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"].includes(order.status.toUpperCase()) && (
                        <div className="bg-gray-900 rounded-[28px] p-6 text-white flex items-center justify-between shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10" />
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black text-white/50 uppercase tracking-[3px]">Llegada Estimada</p>
                                <div className="flex items-center gap-2">
                                    <p className="text-4xl font-black italic tracking-tighter">{routeInfo.duration}</p>
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-2" />
                                </div>
                            </div>
                            <div className="text-right">
                                <Navigation className="w-8 h-8 text-blue-400 mb-1 ml-auto" />
                                <p className="text-sm font-black italic">{routeInfo.distance}</p>
                            </div>
                        </div>
                    )}

                    {/* Driver Card */}
                    <div className="bg-gray-50 rounded-[32px] p-5 flex items-center gap-4 border border-gray-100">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 relative">
                            <User className="w-8 h-8 text-gray-400" />
                            {connected && <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Tu repartidor</p>
                            <h3 className="text-lg font-black italic tracking-tighter text-gray-900 uppercase leading-none">{order.driver?.user.name || "Asignando..."}</h3>
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-bold text-gray-400 bg-white w-fit px-2 py-0.5 rounded-full shadow-sm">
                                <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                                <span>4.9 (500+)</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {order.driver?.user.phone && (
                                <a href={`tel:${order.driver.user.phone}`} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md border border-gray-100 active:scale-90 transition">
                                    <Phone className="w-5 h-5 text-green-600" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Addresses */}
                    <div className="space-y-3">
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                <MapPin className="w-5 h-5 text-[#e60012]" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Tu dirección</p>
                                <p className="text-sm font-bold text-gray-900 truncate">{order.address.street} {order.address.number}</p>
                            </div>
                        </div>

                        {order.merchant && (
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                                    <Store className="w-5 h-5 text-blue-500" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Comercio</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{order.merchant.name}</p>
                                    <p className="text-[10px] text-gray-400 font-medium truncate italic">{order.merchant.address}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <Link href="/mis-pedidos" className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl group active:scale-95 transition">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <span className="text-xs font-black uppercase tracking-widest text-gray-900">Ver resumen de compra</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition" />
                    </Link>
                </div>
            </div>

            <style jsx global>{`
                @keyframes zoomIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}

