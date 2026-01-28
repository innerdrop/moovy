"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, DirectionsRenderer, Marker, InfoWindow } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Navigation, Phone, MapPin, Clock, CheckCircle, Loader2, Package, Star, Rocket } from "lucide-react";

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

    // Directions logic
    useEffect(() => {
        if (!isLoaded || !order || !order.merchant?.latitude || !order.address.latitude) return;

        const directionsService = new google.maps.DirectionsService();

        const origin = driverPosition
            ? { lat: driverPosition.lat, lng: driverPosition.lng }
            : { lat: order.merchant.latitude, lng: order.merchant.longitude || 0 };

        const destination = { lat: order.address.latitude, lng: order.address.longitude || 0 };

        const waypoints = (driverPosition && order.status === "DRIVER_ASSIGNED")
            ? [{ location: { lat: order.merchant.latitude, lng: order.merchant.longitude || 0 }, stopover: true }]
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

        return () => {
            socket.disconnect();
        };
    }, [orderId, order]);

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
            {/* Header */}
            <header className="bg-gray-800/80 backdrop-blur-md p-4 pt-10 flex items-center gap-4 z-20 sticky top-0 border-b border-gray-700/50">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-700 rounded-lg translate-y-[2px]">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="font-bold text-lg leading-tight uppercase tracking-tight">Mi Pedido</h1>
                    <p className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">#{order.orderNumber}</p>
                </div>
                <div className={`ml-auto px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors ${connected ? "text-green-500 bg-green-500/10 border border-green-500/20" : "text-red-500 bg-red-500/10 border border-red-500/20"}`}>
                    {connected ? "En Vivo" : "Sincronizando"}
                </div>
            </header>

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

            {/* Map Area */}
            <div className="flex-1 relative">
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
                        zoom={16}
                        onLoad={map => { mapRef.current = map; }}
                        options={{
                            disableDefaultUI: true,
                            styles: [
                                { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
                                { featureType: "transit", stylers: [{ visibility: "off" }] },
                                { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
                            ]
                        }}
                    >
                        {directions && (
                            <DirectionsRenderer
                                options={{
                                    directions: directions,
                                    suppressMarkers: true,
                                    preserveViewport: true,
                                    polylineOptions: { strokeColor: "#f97316", strokeWeight: 5, strokeOpacity: 0.8 }
                                }}
                            />
                        )}

                        {/* Merchant - BLUE */}
                        {order.merchant?.latitude && (
                            <Marker
                                position={{ lat: order.merchant.latitude, lng: order.merchant.longitude || 0 }}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillOpacity: 1,
                                    fillColor: "#3b82f6",
                                    strokeColor: "white",
                                    strokeWeight: 2,
                                    scale: 7
                                }}
                            />
                        )}

                        {/* Driver - GREEN */}
                        {driverPosition && (
                            <Marker
                                position={{ lat: driverPosition.lat, lng: driverPosition.lng }}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillOpacity: 1,
                                    fillColor: "#22c55e",
                                    strokeColor: "white",
                                    strokeWeight: 2,
                                    scale: 8
                                }}
                            />
                        )}

                        {/* Destination - RED */}
                        {order.address.latitude && (
                            <Marker
                                position={{ lat: order.address.latitude, lng: order.address.longitude || 0 }}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillOpacity: 1,
                                    fillColor: "#ef4444",
                                    strokeColor: "white",
                                    strokeWeight: 2,
                                    scale: 8
                                }}
                            />
                        )}
                    </GoogleMap>
                )}
            </div>

            {/* Rider Info Card */}
            <div className="bg-gray-800 p-6 rounded-t-[40px] shadow-2xl z-20 border-t border-gray-700/50 pb-10">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 bg-gray-700 rounded-2xl flex items-center justify-center border-2 border-orange-500 overflow-hidden">
                            <Rocket className="w-8 h-8 text-orange-500" />
                        </div>
                        {connected && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-gray-800" />
                        )}
                    </div>

                    <div className="flex-1">
                        <h3 className="font-black text-xl italic tracking-tighter uppercase leading-none">
                            {order.driver?.user.name || "ASIGNANDO RIDER..."}
                        </h3>
                        <p className="text-[10px] font-black tracking-widest text-gray-500 uppercase mt-1">
                            {order.status === "DRIVER_ASSIGNED" && "Hacia el comercio"}
                            {order.status === "PICKED_UP" && "En el local"}
                            {["IN_DELIVERY", "ON_THE_WAY"].includes(order.status) && "Hacia tu dirección"}
                            {order.status === "DELIVERED" && "Entregado"}
                        </p>
                    </div>

                    {order.driver?.user.phone && (
                        <a href={`tel:${order.driver.user.phone}`} className="w-14 h-14 bg-orange-600 text-white rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition">
                            <Phone className="w-6 h-6" />
                        </a>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700 flex items-center gap-4">
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-1">Dirección de Entrega</p>
                        <p className="text-sm font-bold text-gray-200 truncate">{order.address.street} {order.address.number}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
