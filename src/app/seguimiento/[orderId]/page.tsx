"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import { ArrowLeft, Navigation, Phone, MapPin, Clock, CheckCircle, Loader2, Package } from "lucide-react";

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
    };
}

import { Star } from "lucide-react";

interface DriverPosition {
    lat: number;
    lng: number;
    heading?: number;
    speed?: number;
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
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [delivered, setDelivered] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
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

    // Connect to Socket.io
    useEffect(() => {
        if (!orderId || !order) return;

        // Only track when PICKED_UP or later (as requested)
        const trackableStatuses = ["PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"];
        if (!trackableStatuses.includes(order.status)) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
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
            if (mapRef.current) {
                // Smoothly pan to driver if center is not set or following
                // mapRef.current.panTo({ lat: data.lat, lng: data.lng });
            }
        });

        socket.on("pedido_entregado", () => setDelivered(true));

        return () => {
            socket.disconnect();
        };
    }, [orderId, order]);

    const stats = (() => {
        if (!driverPosition || !order?.address.latitude || !order?.address.longitude || !isLoaded) return null;

        const p1 = new google.maps.LatLng(driverPosition.lat, driverPosition.lng);
        const p2 = new google.maps.LatLng(order.address.latitude, order.address.longitude);
        const distMeters = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
        const distKm = distMeters / 1000;

        const avgSpeedKph = 25;
        const timeHours = distKm / avgSpeedKph;
        const timeMinutes = Math.max(1, Math.round(timeHours * 60 + 2));

        return {
            distance: distKm.toFixed(1),
            eta: timeMinutes
        };
    })();

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

    if (loading || !isLoaded) {
        return (
            <div className="h-screen bg-gray-900 flex flex-col items-center justify-center gap-4 text-white">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
                <p className="animate-pulse">Iniciando seguimiento seguro...</p>
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

    const center = driverPosition
        ? { lat: driverPosition.lat, lng: driverPosition.lng }
        : { lat: order.address.latitude || -54.8019, lng: order.address.longitude || -68.3030 };

    return (
        <div className="h-screen bg-gray-900 text-white flex flex-col overflow-hidden">
            {/* Header */}
            <header className="bg-gray-800 p-4 pt-10 flex items-center gap-4 z-10 shadow-lg">
                <button onClick={() => router.back()} className="p-2 hover:bg-gray-700 rounded-lg">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="font-bold text-lg">Seguimiento en Vivo</h1>
                    <p className="text-xs text-gray-400">Pedido #{order.orderNumber}</p>
                </div>
                <div className={`ml-auto px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${connected ? "bg-green-500/20 text-green-500 border border-green-500/50" : "bg-red-500/20 text-red-500 border border-red-500/50"}`}>
                    {connected ? "• En Vivo" : "• Desconectado"}
                </div>
            </header>

            {/* Delivered overlay & Rating */}
            {delivered && (
                <div className="absolute inset-0 bg-gray-900/98 flex flex-col items-center justify-center z-[100] p-6 text-center animate-in fade-in duration-500">
                    {!hasRated && !order.driverRating ? (
                        <div className="w-full max-w-sm space-y-6">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <CheckCircle className="w-12 h-12 text-green-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-1">¡Entregado!</h2>
                                <p className="text-gray-400">¿Cómo fue tu experiencia con {order.driver?.user.name.split(' ')[0] || "el repartidor"}?</p>
                            </div>

                            <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        key={star}
                                        onClick={() => setRating(star)}
                                        className="p-1 transition-transform active:scale-90"
                                    >
                                        <Star
                                            className={`w-10 h-10 transition-colors ${star <= rating ? "fill-orange-500 text-orange-500" : "text-gray-600"
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Escribe un comentario sobre el servicio..."
                                className="w-full bg-gray-800 border border-gray-700 rounded-xl p-4 text-sm focus:ring-2 focus:ring-orange-500 outline-none min-h-[100px] resize-none"
                            />

                            <button
                                onClick={handleRate}
                                disabled={isSubmitting}
                                className="w-full py-4 bg-orange-500 rounded-xl font-bold text-lg hover:bg-orange-600 transition shadow-xl shadow-orange-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Enviando...
                                    </>
                                ) : "Enviar Valoración"}
                            </button>

                            <button
                                onClick={() => router.push("/")}
                                className="text-gray-500 text-sm hover:text-gray-300 transition"
                            >
                                Saltar por ahora
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in zoom-in duration-300">
                            <div className="w-24 h-24 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto">
                                <Star className="w-12 h-12 text-orange-500 fill-orange-500" />
                            </div>
                            <div>
                                <h2 className="text-3xl font-bold mb-2">¡Gracias por calificar!</h2>
                                <p className="text-gray-400">Tu opinión ayuda a mejorar la comunidad de Moovy.</p>
                            </div>
                            <button
                                onClick={() => router.push("/mis-pedidos")}
                                className="w-full max-w-xs py-4 bg-gray-800 rounded-xl font-bold text-lg hover:bg-gray-700 transition"
                            >
                                Volver a mis pedidos
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Map Area */}
            <div className="flex-1 relative">
                {/* Hide map if not picked up yet */}
                {!["PICKED_UP", "IN_DELIVERY", "ON_THE_WAY", "DELIVERED"].includes(order.status) ? (
                    <div className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Package className="w-12 h-12 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">Preparando tu pedido</h3>
                        <p className="text-gray-400 max-w-xs">
                            El mapa se activará automáticamente cuando el repartidor retire tu pedido del local.
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
                        {/* Driver Marker */}
                        {driverPosition && (
                            <Marker
                                position={{ lat: driverPosition.lat, lng: driverPosition.lng }}
                                icon={{
                                    url: "/markers/driver-marker.png",
                                    scaledSize: new google.maps.Size(40, 40),
                                    anchor: new google.maps.Point(20, 20)
                                }}
                                onClick={() => setSelectedMarker("driver")}
                            />
                        )}

                        {/* Destination Marker */}
                        {order.address.latitude && order.address.longitude && (
                            <Marker
                                position={{ lat: order.address.latitude, lng: order.address.longitude }}
                                icon={{
                                    path: google.maps.SymbolPath.CIRCLE,
                                    fillOpacity: 1,
                                    fillColor: "#ef4444",
                                    strokeColor: "white",
                                    strokeWeight: 2,
                                    scale: 8
                                }}
                                onClick={() => setSelectedMarker("destination")}
                            />
                        )}

                        {/* Info Windows */}
                        {selectedMarker === "driver" && driverPosition && (
                            <InfoWindow
                                position={{ lat: driverPosition.lat, lng: driverPosition.lng }}
                                onCloseClick={() => setSelectedMarker(null)}
                            >
                                <div className="text-gray-900 p-1">
                                    <p className="font-bold text-sm">{order.driver?.user.name || "Repartidor"}</p>
                                    <p className="text-xs">Actualizado hace unos segundos</p>
                                </div>
                            </InfoWindow>
                        )}
                    </GoogleMap>
                )}

                {/* Floating GPS Status */}
                <div className="absolute top-4 right-4 bg-gray-800/80 backdrop-blur-md p-2 rounded-lg border border-gray-700 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`} />
                    <span className="text-[10px] font-medium text-gray-200">GPS ACTIVO</span>
                </div>
            </div>

            {/* Bottom info card */}
            <div className="bg-gray-800 p-6 rounded-t-[32px] shadow-2xl z-10 border-t border-gray-700">
                <div className="flex items-center gap-5">
                    <div className="relative">
                        <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center overflow-hidden border-2 border-orange-500">
                            <Navigation className="w-8 h-8 text-orange-500" />
                        </div>
                        {connected && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-gray-800" />
                        )}
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xl">{order.driver?.user.name || "Asignando..."}</h3>
                            {stats && (
                                <span className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-lg text-xs font-bold">
                                    {stats.distance} KM
                                </span>
                            )}
                        </div>

                        <div className="mt-1">
                            <p className="text-sm text-gray-400 font-medium leading-tight">
                                {order.status === "DRIVER_ASSIGNED" && "Esperando retiro..."}
                                {order.status === "PICKED_UP" && "Pedido en local"}
                                {["IN_DELIVERY", "ON_THE_WAY"].includes(order.status) && "¡En camino a tu casa!"}
                            </p>
                            {stats && (
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    Llega en aproximadamente {stats.eta} minutos
                                </p>
                            )}
                        </div>
                    </div>

                    {order.driver?.user.phone && (
                        <a
                            href={`tel:${order.driver.user.phone}`}
                            className="w-12 h-12 bg-white text-gray-900 rounded-2xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition"
                        >
                            <Phone className="w-5 h-5" />
                        </a>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-700/50 flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Entrega en</p>
                        <p className="text-gray-200 font-medium">{order.address.street} {order.address.number}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
