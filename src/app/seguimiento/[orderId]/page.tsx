"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import { io, Socket } from "socket.io-client";
import { useSocketAuth } from "@/hooks/useSocketAuth";
import {
    ArrowLeft,
    Phone,
    MapPin,
    Clock,
    CheckCircle2,
    Loader2,
    Star,
    Store,
    ChefHat,
    Bike,
    PackageCheck,
    PartyPopper,
    XCircle,
    Navigation2,
    CircleDot,
} from "lucide-react";
import Link from "next/link";

interface OrderData {
    id: string;
    orderNumber: string;
    status: string;
    estimatedTime?: number | null;
    createdAt?: string;
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

// ─── Status config ───
const STATUS_STEPS = [
    { key: "PENDING", label: "Confirmando", icon: CircleDot, color: "text-amber-500" },
    { key: "CONFIRMED", label: "Confirmado", icon: CheckCircle2, color: "text-emerald-500" },
    { key: "PREPARING", label: "Preparando", icon: ChefHat, color: "text-orange-500" },
    { key: "READY", label: "Listo", icon: PackageCheck, color: "text-blue-500" },
    { key: "PICKED_UP", label: "En camino", icon: Bike, color: "text-violet-500" },
    { key: "DELIVERED", label: "Entregado", icon: PartyPopper, color: "text-emerald-600" },
];

function getStepIndex(status: string): number {
    const s = status?.toUpperCase() || "PENDING";
    // Map compound statuses
    if (s === "DRIVER_ASSIGNED" || s === "DRIVER_ARRIVED") return 3; // same as READY
    if (s === "IN_DELIVERY") return 4; // same as PICKED_UP
    const idx = STATUS_STEPS.findIndex((st) => st.key === s);
    return idx >= 0 ? idx : 0;
}

function getStatusMessage(status: string): { title: string; subtitle: string } {
    const s = status?.toUpperCase() || "PENDING";
    switch (s) {
        case "PENDING":
        case "AWAITING_PAYMENT":
            return { title: "Esperando confirmación", subtitle: "El comercio está revisando tu pedido" };
        case "CONFIRMED":
            return { title: "¡Pedido confirmado!", subtitle: "El comercio comenzará a prepararlo" };
        case "PREPARING":
            return { title: "Preparando tu pedido", subtitle: "El comercio está trabajando en él" };
        case "READY":
            return { title: "¡Tu pedido está listo!", subtitle: "Esperando al repartidor" };
        case "DRIVER_ASSIGNED":
            return { title: "Repartidor en camino al comercio", subtitle: "Tu pedido será recogido pronto" };
        case "DRIVER_ARRIVED":
            return { title: "El repartidor llegó al comercio", subtitle: "Está retirando tu pedido" };
        case "PICKED_UP":
        case "IN_DELIVERY":
            return { title: "¡Tu pedido viene en camino!", subtitle: "El repartidor se dirige hacia vos" };
        case "DELIVERED":
            return { title: "¡Pedido entregado!", subtitle: "Esperamos que lo disfrutes" };
        case "CANCELLED":
            return { title: "Pedido cancelado", subtitle: "Este pedido fue cancelado" };
        default:
            return { title: "Procesando", subtitle: "Un momento..." };
    }
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: false,
    gestureHandling: "greedy",
    styles: [
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
    ],
};

export default function TrackingPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<OrderData | null>(null);
    const [driverPos, setDriverPos] = useState<DriverPosition | null>(null);
    const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [delivered, setDelivered] = useState(false);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [hasRated, setHasRated] = useState(false);
    const [eta, setEta] = useState<string | null>(null);

    const socketRef = useRef<Socket | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
        language: "es",
        region: "AR",
    });

    // ─── Fetch order ───
    const fetchOrder = useCallback(async () => {
        try {
            const res = await fetch(`/api/orders/${orderId}/tracking`);
            if (!res.ok) throw new Error("Pedido no encontrado");
            const data: OrderData = await res.json();
            setOrder(data);
            if (data.status === "DELIVERED") setDelivered(true);
            if (data.driver?.latitude && data.driver?.longitude) {
                setDriverPos({ lat: data.driver.latitude, lng: data.driver.longitude, timestamp: Date.now() });
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (orderId) fetchOrder();
        const poll = setInterval(() => { if (orderId) fetchOrder(); }, 5000);
        return () => clearInterval(poll);
    }, [orderId, fetchOrder]);

    // ─── Socket.IO ───
    const socketToken = useSocketAuth();
    useEffect(() => {
        if (!orderId || !socketToken || delivered) return;
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || (typeof window !== "undefined" && window.location.hostname === "localhost" ? "http://localhost:3001" : "https://somosmoovy.com");
        const socket = io(`${socketUrl}/logistica`, { auth: { token: socketToken }, transports: ["websocket", "polling"], reconnection: true });
        socketRef.current = socket;
        socket.on("connect", () => { setConnected(true); socket.emit("track_order", { orderId }); });
        socket.on("disconnect", () => setConnected(false));
        socket.on("posicion_repartidor", (pos: DriverPosition) => setDriverPos(pos));
        socket.on("pedido_entregado", () => { setDelivered(true); fetchOrder(); });
        socket.on("order_status_changed", (data: { orderId: string; status: string }) => {
            if (data.orderId === orderId) {
                setOrder((prev) => prev ? { ...prev, status: data.status } : prev);
                if (data.status === "DELIVERED") setDelivered(true);
            }
        });
        socket.on("order_status_update", (data: { orderId: string; status: string }) => {
            if (data.orderId === orderId) {
                setOrder((prev) => prev ? { ...prev, status: data.status } : prev);
                if (data.status === "DELIVERED") setDelivered(true);
            }
        });
        return () => { socket.disconnect(); };
    }, [orderId, socketToken, delivered, fetchOrder]);

    // ─── Directions ───
    useEffect(() => {
        if (!isLoaded || !order) return;
        const s = order.status?.toUpperCase() || "";
        if (s === "DELIVERED" || s === "CANCELLED") { setRoutePath([]); setEta(null); return; }

        const origin = driverPos
            ? { lat: driverPos.lat, lng: driverPos.lng }
            : order.merchant?.latitude && order.merchant?.longitude
            ? { lat: order.merchant.latitude, lng: order.merchant.longitude }
            : null;

        const dest = order.address?.latitude && order.address?.longitude
            ? { lat: order.address.latitude, lng: order.address.longitude }
            : null;

        if (!origin || !dest) return;

        const ds = new google.maps.DirectionsService();
        ds.route({ origin, destination: dest, travelMode: google.maps.TravelMode.DRIVING }, (result, status) => {
            if (status === "OK" && result) {
                const leg = result.routes[0]?.legs[0];
                if (leg) {
                    setEta(leg.duration?.text || null);
                    setRoutePath(result.routes[0].overview_path.map((p) => ({ lat: p.lat(), lng: p.lng() })));
                    if (mapRef.current && result.routes[0].bounds) {
                        mapRef.current.fitBounds(result.routes[0].bounds, { top: 60, bottom: 200, left: 40, right: 40 });
                    }
                }
            }
        });
    }, [isLoaded, order, driverPos]);

    // ─── Rating ───
    const handleRate = async () => {
        if (!rating || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/orders/${orderId}/rate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment: comment.trim() || undefined }),
            });
            if (res.ok) setHasRated(true);
        } catch { /* ignore */ } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Derived state ───
    const status = order?.status?.toUpperCase() || "PENDING";
    const stepIdx = getStepIndex(status);
    const statusMsg = getStatusMessage(status);
    const isInTransit = ["PICKED_UP", "IN_DELIVERY", "DRIVER_ASSIGNED", "DRIVER_ARRIVED"].includes(status);
    const showMap = isInTransit && isLoaded;
    const driverName = order?.driver?.user?.name?.split(" ")[0] || "Repartidor";

    // ─── Loading ───
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center gap-4">
                <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-[#e60012] animate-spin" />
                    </div>
                </div>
                <p className="text-gray-500 text-sm font-medium">Cargando pedido...</p>
            </div>
        );
    }

    // ─── Error ───
    if (error || !order) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center gap-4 px-6">
                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-400" />
                </div>
                <p className="text-gray-900 font-semibold text-lg">Pedido no encontrado</p>
                <p className="text-gray-500 text-sm text-center">{error}</p>
                <button onClick={() => router.back()} className="mt-4 px-6 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors">
                    Volver
                </button>
            </div>
        );
    }

    // ─── DELIVERED + RATING ───
    if (delivered && !hasRated && !order.driverRating) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white flex flex-col items-center justify-center px-6">
                <div className="w-full max-w-sm flex flex-col items-center gap-6">
                    {/* Animated check */}
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-[bounceIn_0.6s_ease-out]">
                            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center animate-[bounceIn_0.8s_ease-out]">
                            <PartyPopper className="w-4 h-4 text-amber-500" />
                        </div>
                    </div>

                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900">¡Pedido entregado!</h1>
                        <p className="text-gray-500 mt-1">¿Cómo fue la entrega de {driverName}?</p>
                    </div>

                    {/* Stars */}
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <button
                                key={s}
                                onMouseEnter={() => setHoverRating(s)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(s)}
                                className="transition-transform hover:scale-125 active:scale-95"
                            >
                                <Star
                                    className={`w-10 h-10 transition-colors duration-150 ${
                                        s <= (hoverRating || rating)
                                            ? "fill-amber-400 text-amber-400"
                                            : "text-gray-200"
                                    }`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Comment */}
                    {rating > 0 && (
                        <div className="w-full animate-[fadeIn_0.3s_ease-out]">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Contanos tu experiencia (opcional)"
                                className="w-full p-4 border border-gray-200 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012] bg-gray-50"
                                rows={3}
                            />
                        </div>
                    )}

                    {/* Actions */}
                    <div className="w-full flex flex-col gap-3">
                        {rating > 0 && (
                            <button
                                onClick={handleRate}
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-[#e60012] text-white rounded-2xl font-semibold text-sm hover:bg-[#cc0010] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                Enviar calificación
                            </button>
                        )}
                        <Link
                            href="/mis-pedidos"
                            className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-2xl font-medium text-sm text-center hover:bg-gray-200 transition-colors"
                        >
                            Ir a mis pedidos
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // ─── RATED THANK YOU ───
    if (hasRated) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white flex flex-col items-center justify-center px-6 gap-6">
                <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center">
                    <Star className="w-10 h-10 fill-amber-400 text-amber-400" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">¡Gracias!</h1>
                    <p className="text-gray-500 mt-1">Tu opinión nos ayuda a mejorar</p>
                </div>
                <Link
                    href="/mis-pedidos"
                    className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                    Continuar
                </Link>
            </div>
        );
    }

    // ─── CANCELLED ───
    if (status === "CANCELLED") {
        return (
            <div className="min-h-screen bg-gradient-to-b from-red-50 via-white to-white flex flex-col items-center justify-center px-6 gap-6">
                <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle className="w-10 h-10 text-red-400" />
                </div>
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Pedido cancelado</h1>
                    <p className="text-gray-500 mt-1">Este pedido fue cancelado</p>
                </div>
                <Link
                    href="/"
                    className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-semibold text-sm hover:bg-gray-800 transition-colors"
                >
                    Volver al inicio
                </Link>
            </div>
        );
    }

    // ═════════════════════════════════════════════
    // ─── MAIN TRACKING VIEW ───
    // ═════════════════════════════════════════════
    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* ─── HEADER ─── */}
            <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100">
                <div className="flex items-center justify-between px-4 py-3">
                    <button onClick={() => router.back()} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <div className="text-center">
                        <p className="text-xs text-gray-400 font-medium">Pedido</p>
                        <p className="text-sm font-bold text-gray-900">#{order.orderNumber}</p>
                    </div>
                    <div className="w-10" /> {/* spacer for centering */}
                </div>
            </div>

            {/* ─── STATUS HERO ─── */}
            <div className="px-5 pt-6 pb-4">
                {/* Animated status icon */}
                <div className="flex items-start gap-4 mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                        isInTransit ? "bg-violet-100" : stepIdx >= 5 ? "bg-emerald-100" : "bg-orange-100"
                    }`}>
                        {isInTransit ? (
                            <Bike className="w-7 h-7 text-violet-500 animate-[pulse_2s_ease-in-out_infinite]" />
                        ) : status === "PREPARING" ? (
                            <ChefHat className="w-7 h-7 text-orange-500 animate-[pulse_2s_ease-in-out_infinite]" />
                        ) : status === "READY" ? (
                            <PackageCheck className="w-7 h-7 text-blue-500" />
                        ) : (
                            <CircleDot className="w-7 h-7 text-amber-500 animate-[pulse_2s_ease-in-out_infinite]" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 leading-tight">{statusMsg.title}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">{statusMsg.subtitle}</p>
                        {eta && isInTransit && (
                            <div className="flex items-center gap-1.5 mt-2">
                                <Clock className="w-4 h-4 text-[#e60012]" />
                                <span className="text-sm font-semibold text-[#e60012]">Llega en ~{eta}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── PROGRESS TIMELINE ─── */}
                <div className="flex items-center gap-0 mb-2">
                    {STATUS_STEPS.map((step, i) => {
                        const isActive = i <= stepIdx;
                        const isCurrent = i === stepIdx;
                        return (
                            <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                {/* Connector line */}
                                {i > 0 && (
                                    <div className={`absolute top-3 right-1/2 w-full h-0.5 -translate-y-1/2 transition-colors duration-500 ${
                                        isActive ? "bg-[#e60012]" : "bg-gray-200"
                                    }`} />
                                )}
                                {/* Dot */}
                                <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${
                                    isCurrent
                                        ? "bg-[#e60012] ring-4 ring-red-100 scale-110"
                                        : isActive
                                        ? "bg-[#e60012]"
                                        : "bg-gray-200"
                                }`}>
                                    {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                {/* Label */}
                                <span className={`text-[10px] mt-1.5 font-medium text-center leading-tight ${
                                    isCurrent ? "text-[#e60012] font-semibold" : isActive ? "text-gray-700" : "text-gray-400"
                                }`}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ─── MAP (in transit) ─── */}
            {showMap && (
                <div className="mx-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm" style={{ height: "240px" }}>
                    <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        center={driverPos || { lat: -54.8019, lng: -68.303 }}
                        zoom={15}
                        options={mapOptions as google.maps.MapOptions}
                        onLoad={(map) => { mapRef.current = map; }}
                    >
                        {/* Route */}
                        {routePath.length > 0 && (
                            <>
                                <Polyline
                                    path={routePath}
                                    options={{ strokeColor: "#e60012", strokeWeight: 4, strokeOpacity: 0.3 }}
                                />
                                <Polyline
                                    path={routePath}
                                    options={{ strokeColor: "#e60012", strokeWeight: 3, strokeOpacity: 0.8, icons: [{ icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 2.5, strokeColor: "#e60012", fillColor: "#e60012", fillOpacity: 1 }, offset: "0", repeat: "80px" }] }}
                                />
                            </>
                        )}

                        {/* Driver marker */}
                        {driverPos && (
                            <Marker
                                position={driverPos}
                                icon={{
                                    url: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="20" fill="#e60012" stroke="white" stroke-width="3"/><text x="22" y="28" text-anchor="middle" fill="white" font-size="20">🛵</text></svg>`),
                                    scaledSize: new google.maps.Size(44, 44),
                                    anchor: new google.maps.Point(22, 22),
                                }}
                            />
                        )}

                        {/* Merchant marker */}
                        {order.merchant?.latitude && order.merchant?.longitude && (
                            <Marker
                                position={{ lat: order.merchant.latitude, lng: order.merchant.longitude }}
                                icon={{
                                    url: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><circle cx="18" cy="18" r="16" fill="#3B82F6" stroke="white" stroke-width="3"/><text x="18" y="24" text-anchor="middle" fill="white" font-size="16">🏪</text></svg>`),
                                    scaledSize: new google.maps.Size(36, 36),
                                    anchor: new google.maps.Point(18, 18),
                                }}
                            />
                        )}

                        {/* Destination marker */}
                        {order.address?.latitude && order.address?.longitude && (
                            <Marker
                                position={{ lat: order.address.latitude, lng: order.address.longitude }}
                                icon={{
                                    url: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44"><path d="M18 0C8 0 0 8 0 18c0 14 18 26 18 26s18-12 18-26C36 8 28 0 18 0z" fill="#e60012" stroke="white" stroke-width="2"/><circle cx="18" cy="16" r="6" fill="white"/></svg>`),
                                    scaledSize: new google.maps.Size(36, 44),
                                    anchor: new google.maps.Point(18, 44),
                                }}
                            />
                        )}
                    </GoogleMap>
                </div>
            )}

            {/* ─── INFO CARDS ─── */}
            <div className="flex-1 px-4 pt-4 pb-8 flex flex-col gap-3">
                {/* Driver card */}
                {order.driver && (
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#e60012] flex items-center justify-center flex-shrink-0">
                            <Bike className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{order.driver.user.name}</p>
                            <p className="text-xs text-gray-500">Tu repartidor</p>
                        </div>
                        {order.driver.user.phone && (
                            <a
                                href={`tel:${order.driver.user.phone}`}
                                className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center hover:bg-emerald-600 transition-colors"
                            >
                                <Phone className="w-5 h-5 text-white" />
                            </a>
                        )}
                    </div>
                )}

                {/* Merchant card */}
                {order.merchant && (
                    <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                            <Store className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{order.merchant.name}</p>
                            {order.merchant.address && (
                                <p className="text-xs text-gray-500 truncate">{order.merchant.address}</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Delivery address */}
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 text-gray-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                            {order.address.street} {order.address.number}
                        </p>
                        <p className="text-xs text-gray-500">Tu dirección de entrega</p>
                    </div>
                    {isInTransit && driverPos && (
                        <div className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 rounded-full flex-shrink-0">
                            <Navigation2 className="w-3.5 h-3.5 text-violet-600" />
                            <span className="text-xs font-semibold text-violet-600">{eta || "..."}</span>
                        </div>
                    )}
                </div>

                {/* Order summary link */}
                <Link
                    href="/mis-pedidos"
                    className="mt-auto text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
                >
                    Ver mis pedidos
                </Link>
            </div>
        </div>
    );
}
