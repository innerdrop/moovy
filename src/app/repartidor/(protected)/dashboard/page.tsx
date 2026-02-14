"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
    Bike,
    MapPin,
    Package,
    Clock,
    ChevronRight,
    Power,
    Loader2,
    Settings,
    LogOut,
    History,
    DollarSign,
    User,
    HelpCircle,
    Menu,
    X,
    Navigation,
    Phone,
    ArrowRight,
    Wallet,
    CheckCircle
} from "lucide-react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { MapSkeleton } from "@/components/rider/MapWrapper";
import { usePushNotifications } from "@/hooks/usePushNotifications";

// Dynamic imports for heavy components
const RiderMiniMap = dynamic(() => import("@/components/rider/RiderMiniMap"), {
    ssr: false,
    loading: () => <MapSkeleton />
});

const BottomSheet = dynamic(() => import("@/components/rider/BottomSheet"), {
    ssr: false,
    loading: () => <div className="fixed bottom-0 left-0 right-0 h-[160px] bg-white rounded-t-3xl animate-pulse" />
});

interface DashboardStats {
    pedidosHoy: number;
    enCamino: number;
    completados: number;
    gananciasHoy: number;
}

interface Order {
    id: string;
    orderId: string;
    comercio: string;
    direccion: string;
    direccionCliente: string | null;
    labelDireccion: string;
    estado: string;
    hora: string;
    navLat: number;
    navLng: number;
    merchantLat?: number;
    merchantLng?: number;
    customerLat?: number;
    customerLng?: number;
    items?: any[];
    telefonoCliente?: string;
    nombreCliente?: string;
}

interface PendingOrderOffer {
    id: string;
    orderNumber: string;
    comercio: string;
    direccion: string;
    direccionCliente: string | null;
    createdAt: string;
    expiresAt: string | null;
    merchantLat: number;
    merchantLng: number;
    customerLat: number;
    customerLng: number;
    tiempoAlComercio: number;
    tiempoAlCliente: number;
    distanciaTotal: string;
    gananciaEstimada: number;
}

export default function RiderDashboard() {
    const { data: session } = useSession();
    const { location, heading, error: locationHookError } = useGeolocation();
    const [dashboardData, setDashboardData] = useState<{
        stats: DashboardStats;
        pedidosActivos: Order[];
        pedidosPendientes: PendingOrderOffer[];
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);

    // Push notifications
    const { isSupported: pushSupported, permission: pushPermission, requestPermission, isSubscribed, error: pushError } = usePushNotifications();

    const [recenterToggle, setRecenterToggle] = useState(false);

    // Fetch dashboard data
    const fetchDashboard = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoading(true);
            const lat = location?.latitude || 0;
            const lng = location?.longitude || 0;
            const res = await fetch(`/api/driver/dashboard?lat=${lat}&lng=${lng}`);
            if (res.ok) {
                const data = await res.json();
                setDashboardData(data);
                setIsOnline(data.isOnline);
            }
        } catch (e) {
            console.error("Dashboard fetch error:", e);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [location]);

    // Initial load and periodic refresh (orders arrive via polling)
    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(() => fetchDashboard(true), 5000);
        return () => clearInterval(interval);
    }, [fetchDashboard]);

    // Notification prompt
    useEffect(() => {
        if (pushSupported && pushPermission === 'default' && !isSubscribed) {
            const timer = setTimeout(() => setShowNotificationPrompt(true), 2000);
            return () => clearTimeout(timer);
        }
        if (pushPermission === 'granted' && isSubscribed) {
            setShowNotificationPrompt(false);
        }
    }, [isOnline, pushSupported, pushPermission, isSubscribed]);

    const handleEnableNotifications = async () => {
        console.log('[Dashboard] Requesting push permission...');
        console.log('[Dashboard] VAPID key present:', !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
        const success = await requestPermission();
        console.log('[Dashboard] Permission result:', success);
        if (success) {
            setShowNotificationPrompt(false);
        } else {
            // Get the latest error from the hook state
            // Note: We need to use a slightly different approach to get the current state error
            // but for now, we'll try to rely on the alert showing the state that was just updated.
            setTimeout(() => {
                alert(pushError || 'No se pudieron activar las notificaciones. Asegurate de que no las hayas bloqueado en el navegador.');
            }, 100);
        }
    };

    // Toggle online/offline
    const toggleOnline = async () => {
        if (!isOnline && !location) {
            alert("No podemos activarte sin acceso a tu ubicación GPS.");
            if (typeof window !== "undefined" && navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(() => { }, () => { });
            }
            return;
        }

        try {
            setIsToggling(true);
            const res = await fetch("/api/driver/toggle-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOnline: !isOnline })
            });

            if (res.ok) {
                const data = await res.json();
                setIsOnline(data.isOnline);
                await fetchDashboard(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsToggling(false);
        }
    };

    // ── Loading state ──
    if (isLoading && !dashboardData) {
        return (
            <div className="h-dvh flex flex-col items-center justify-center bg-white">
                <div className="relative">
                    <Bike className="w-12 h-12 text-[#e60012] animate-bounce" />
                    <Loader2 className="w-20 h-20 text-gray-100 animate-spin absolute -top-4 -left-4 -z-10" />
                </div>
                <p className="mt-4 font-bold text-gray-500 uppercase tracking-widest text-xs">Cargando moovy...</p>
            </div>
        );
    }

    // ── GPS permission required ──
    if ((!location || locationHookError) && !isLoading) {
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

        return (
            <div className="h-dvh flex flex-col items-center justify-center bg-white p-8 text-center animate-in fade-in duration-500 overflow-y-auto">
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mb-6 flex-shrink-0">
                    <MapPin className="w-12 h-12 text-[#e60012] animate-pulse" />
                </div>

                <h1 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase leading-none mb-2">GPS No Disponible</h1>

                <p className="text-gray-500 text-sm mb-6 leading-tight max-w-xs">
                    {locationHookError?.includes("denied")
                        ? "Has denegado el acceso al GPS. Los repartidores necesitan seguimiento activo para trabajar."
                        : "Necesitamos tu ubicación para mostrarte las mejores ofertas cerca de ti."}
                </p>

                <div className="space-y-4 w-full max-w-xs mb-8">
                    <button
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    () => window.location.reload(),
                                    (err) => alert("Error: " + err.message)
                                );
                            }
                        }}
                        className="w-full py-5 bg-[#e60012] text-white font-black rounded-2xl italic uppercase tracking-widest transition active:scale-95 shadow-xl shadow-red-100 flex items-center justify-center gap-3"
                    >
                        <Navigation className="w-5 h-5" />
                        Compartir Ubicación
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 bg-gray-100 text-gray-600 font-black rounded-2xl italic uppercase tracking-widest transition active:scale-95"
                    >
                        Refrescar
                    </button>
                </div>

                {isIOS && (
                    <div className="bg-gray-50 rounded-2xl p-4 text-left w-full border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Si el botón no funciona:</p>
                        <ul className="text-[11px] space-y-2 text-gray-600 font-medium">
                            <li className="flex gap-2">
                                <span className="bg-white w-4 h-4 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 text-[8px] font-bold">1</span>
                                <span>Ve a <b>Ajustes</b> &gt; <b>Privacidad</b> &gt; <b>Localización</b>.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-white w-4 h-4 rounded-full flex items-center justify-center shadow-sm flex-shrink-0 text-[8px] font-bold">2</span>
                                <span>Asegúrate de que tu <b>Navegador</b> esté en <b>&quot;Al usar la app&quot;</b>.</span>
                            </li>
                        </ul>
                    </div>
                )}
            </div>
        );
    }

    const { stats, pedidosActivos, pedidosPendientes } = dashboardData || {
        stats: { pedidosHoy: 0, enCamino: 0, completados: 0, gananciasHoy: 0 },
        pedidosActivos: [],
        pedidosPendientes: []
    };

    const pedidoActivo = pedidosActivos[0];

    return (
        <div className="h-dvh w-screen overflow-hidden relative bg-gray-100">

            {/* ═══════════════════════════════════════════════
                LEVEL 0 — FULLSCREEN MAP (always 100%)
            ═══════════════════════════════════════════════ */}
            <div className="absolute inset-0 z-0">
                <RiderMiniMap
                    key={pedidoActivo?.id || "idle-map"}
                    driverLat={location?.latitude}
                    driverLng={location?.longitude}
                    driverHeading={heading || 0}
                    merchantLat={["picked_up", "on_the_way", "in_delivery"].includes(pedidoActivo?.estado?.toLowerCase() || "") ? undefined : pedidoActivo?.merchantLat}
                    merchantLng={["picked_up", "on_the_way", "in_delivery"].includes(pedidoActivo?.estado?.toLowerCase() || "") ? undefined : pedidoActivo?.merchantLng}
                    merchantName={pedidoActivo?.comercio}
                    customerLat={pedidoActivo?.customerLat}
                    customerLng={pedidoActivo?.customerLng}
                    customerAddress={pedidoActivo?.direccionCliente || undefined}
                    customerName={pedidoActivo?.nombreCliente || undefined}
                    height="100%"
                    navigationMode={!!pedidoActivo}
                    orderStatus={pedidoActivo?.estado?.toUpperCase()}
                    recenterTrigger={recenterToggle}
                    onRecenterRequested={() => setRecenterToggle(false)}
                />
            </div>

            {/* ═══════════════════════════════════════════════
                LEVEL 10 — FLOATING TOP BAR (glassmorphism)
            ═══════════════════════════════════════════════ */}
            <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                <div className="flex justify-between items-start px-4 pt-2">
                    {/* Menu button — 48px touch target */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl flex items-center justify-center pointer-events-auto active:scale-95 transition-all border border-white/50"
                    >
                        <Menu className="w-6 h-6 text-gray-800" />
                    </button>

                    {/* Right side controls */}
                    <div className="flex flex-col items-end gap-2 pointer-events-auto">
                        {/* Online status pill */}
                        <div className={`px-4 py-2.5 rounded-full shadow-xl backdrop-blur-md flex items-center gap-2 border border-white/50 ${isOnline ? 'bg-green-500/90 text-white' : 'bg-white/90 text-gray-600'}`}>
                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                            <span className="text-xs font-black uppercase tracking-widest">{isOnline ? 'Conectado' : 'Offline'}</span>
                        </div>

                        {/* Navigation shortcuts (only with active order) */}
                        {pedidoActivo && (
                            <div className="flex flex-col gap-2">
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${pedidoActivo.navLat},${pedidoActivo.navLng}&travelmode=driving`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-12 bg-[#4285F4] hover:bg-blue-600 text-white px-5 rounded-2xl shadow-xl flex items-center gap-3 active:scale-95 transition-all font-bold uppercase tracking-wider text-xs border-2 border-white/30"
                                >
                                    <Navigation className="w-5 h-5" />
                                    MAPS
                                </a>
                                <button
                                    onClick={() => setRecenterToggle(true)}
                                    className="h-12 bg-white/90 backdrop-blur-md text-gray-900 px-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all font-bold uppercase tracking-wider text-[10px] border border-white/50"
                                >
                                    <MapPin className="w-4 h-4 text-green-600" />
                                    Centrar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
                LEVEL 20 — BOTTOM SHEET (overlay on map)
            ═══════════════════════════════════════════════ */}
            <BottomSheet
                initialState="minimized"
                onStateChange={() => { /* no longer adjusting map height */ }}
            >
                <div className="px-6 pb-10">
                    {pedidoActivo ? (
                        <div className="space-y-6">
                            {/* Order header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full w-fit mb-2">
                                        <Package className="w-3.5 h-3.5 text-gray-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">#{pedidoActivo.orderId}</span>
                                    </div>
                                    <h2 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase leading-none">
                                        {pedidoActivo.estado === "picked_up" ? "ENTREGA EN CURSO" : "RECOGER PEDIDO"}
                                    </h2>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Hora inicio</p>
                                    <p className="text-lg font-black text-gray-900 leading-none italic">{pedidoActivo.hora}</p>
                                </div>
                            </div>

                            {/* Origin → Destination route card */}
                            <div className="bg-gray-50 rounded-[24px] p-4 border border-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="flex flex-col items-center gap-1 mt-1">
                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${pedidoActivo.estado === "picked_up" ? "bg-gray-300" : "bg-blue-500"}`} />
                                        <div className="w-0.5 h-10 border-l-2 border-dashed border-gray-200" />
                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${pedidoActivo.estado === "picked_up" ? "bg-green-500" : "bg-gray-300"}`} />
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Comercio</p>
                                            <p className="font-bold text-gray-900 leading-tight">{pedidoActivo.comercio}</p>
                                            {pedidoActivo.estado !== "picked_up" && (
                                                <p className="text-sm text-gray-500 font-medium">{pedidoActivo.direccion}</p>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Destino</p>
                                            <p className="font-bold text-gray-900 leading-tight">{pedidoActivo.direccionCliente || "Ubicación del cliente"}</p>
                                            {pedidoActivo.estado === "picked_up" && (
                                                <div className="flex items-center gap-2 mt-1 py-1 px-3 bg-green-50 text-green-700 rounded-full w-fit">
                                                    <User className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold uppercase">{pedidoActivo.nombreCliente || "Cliente"}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {pedidoActivo.telefonoCliente && (
                                        <a href={`tel:${pedidoActivo.telefonoCliente}`} className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md active:scale-95 border border-gray-100">
                                            <Phone className="w-5 h-5 text-green-600" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Action button — 48px+ height */}
                            <button
                                onClick={async () => {
                                    const nextStatus = (pedidoActivo.estado === "driver_assigned" || pedidoActivo.estado === "driver_arrived") ? "PICKED_UP" : "DELIVERED";
                                    if (!confirm(`¿Confirmas que has completado esta etapa?`)) return;

                                    try {
                                        const res = await fetch(`/api/orders/${pedidoActivo.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: nextStatus })
                                        });

                                        if (res.ok) await fetchDashboard(true);
                                    } catch (e) { console.error(e); }
                                }}
                                className="w-full py-5 bg-gray-900 hover:bg-black text-white font-black text-lg rounded-[22px] shadow-xl shadow-gray-400/20 transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest italic"
                            >
                                {(pedidoActivo.estado === "driver_assigned" || pedidoActivo.estado === "driver_arrived")
                                    ? "Ya recogí el pedido"
                                    : "Finalizar entrega"}
                                <ChevronRight className="w-6 h-6" />
                            </button>
                        </div>
                    ) : (
                        /* ── No active order ── */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase">
                                        {isOnline ? "Buscando pedidos" : "Estás desconectado"}
                                    </h2>
                                    <p className="text-sm text-gray-400 font-medium">
                                        {isOnline ? "Espera a que te llegue una oferta" : "Conéctate para empezar a ganar"}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleOnline}
                                    disabled={isToggling}
                                    className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-300 shadow-xl flex-shrink-0 ${isOnline
                                        ? 'bg-green-500 shadow-green-200'
                                        : 'bg-gray-100 text-gray-400'
                                        }`}
                                >
                                    {isToggling ? <Loader2 className="w-8 h-8 animate-spin text-white" /> : <Power className={`w-8 h-8 ${isOnline ? 'text-white' : 'text-gray-300'}`} />}
                                </button>
                            </div>

                            {/* Pending order offers */}
                            {pedidosPendientes && pedidosPendientes.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-[3px]">Oferta disponible</h3>
                                        <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
                                    </div>

                                    {pedidosPendientes.map((pedido) => (
                                        <div key={pedido.id} className="bg-orange-50/50 border-2 border-orange-200 rounded-[28px] p-5 relative overflow-hidden">
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="bg-orange-500 text-white px-4 py-1.5 rounded-full font-black italic uppercase text-xs shadow-lg shadow-orange-500/20">
                                                    Ganancia: ${pedido.gananciaEstimada}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{pedido.orderNumber}</p>
                                                </div>
                                            </div>

                                            <div className="space-y-5 mb-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center mt-1">
                                                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                                        </div>
                                                        <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-200 my-1" />
                                                        <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                                            <div className="w-2 h-2 bg-red-500 rounded-full" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="mb-6">
                                                            <p className="text-xs font-bold text-gray-900 leading-tight">{pedido.comercio}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium truncate">{pedido.direccion}</p>
                                                            <div className="mt-1 flex items-center gap-1.5 text-blue-600 font-bold text-[10px] uppercase">
                                                                <Navigation className="w-2.5 h-2.5" />
                                                                A {pedido.tiempoAlComercio} min de ti
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900 leading-tight">{pedido.direccionCliente || "Entrega al cliente"}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">Total: {pedido.distanciaTotal}</p>
                                                            <div className="mt-1 flex items-center gap-1.5 text-gray-500 font-bold text-[10px] uppercase">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                Llevas el pedido en {pedido.tiempoAlCliente} min
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3 text-center">
                                                <button className="flex-1 py-4 bg-white border border-gray-100 text-gray-400 font-bold rounded-2xl text-[10px] uppercase tracking-widest">Rechazar</button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch(`/api/driver/orders/${pedido.id}/accept`, { method: "POST" });
                                                            if (res.ok) await fetchDashboard(true);
                                                        } catch (e) { console.error(e); }
                                                    }}
                                                    className="flex-[2.5] py-4 bg-orange-500 text-white font-black rounded-[22px] shadow-xl shadow-orange-500/30 flex items-center justify-center gap-2 text-xs uppercase tracking-widest italic"
                                                >
                                                    ¡ACEPTAR!
                                                    <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : isOnline ? (
                                <div className="py-20 text-center space-y-4">
                                    <div className="w-32 h-32 bg-gray-50 rounded-full mx-auto flex items-center justify-center relative">
                                        <div className="w-24 h-24 border-2 border-dashed border-gray-200 rounded-full animate-spin-slow" />
                                        <Navigation className="w-10 h-10 text-gray-200 absolute" />
                                    </div>
                                    <p className="text-xs font-black text-gray-300 uppercase tracking-[4px]">Esperando ofertas</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white border-2 border-gray-100 rounded-[24px] p-5">
                                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                                            <Wallet className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <p className="text-2xl font-black text-gray-900 italic leading-none">${stats.gananciasHoy}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Hoy</p>
                                    </div>
                                    <div className="bg-white border-2 border-gray-100 rounded-[24px] p-5">
                                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        </div>
                                        <p className="text-2xl font-black text-gray-900 italic leading-none">{stats.completados}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Completados</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4 border-t border-gray-50">
                                <Link href="/repartidor/historial" className="flex-1 flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-[20px]">
                                    <History className="w-6 h-6 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Historial</span>
                                </Link>
                                <Link href="/repartidor/ganancias" className="flex-1 flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-[20px]">
                                    <DollarSign className="w-6 h-6 text-gray-400" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Resumen</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </BottomSheet>

            {/* ═══════════════════════════════════════════════
                LEVEL 30 — NOTIFICATION BANNER
            ═══════════════════════════════════════════════ */}
            {showNotificationPrompt && (
                <div className="absolute top-20 left-4 right-4 z-30 animate-in slide-in-from-top duration-300" style={{ top: 'max(5rem, calc(env(safe-area-inset-top) + 4.5rem))' }}>
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">🔔</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-sm">¡Activa las notificaciones!</h4>
                                <p className="text-blue-100 text-xs mt-0.5">Recibe alertas instantáneas cuando haya nuevas ofertas de entrega.</p>
                            </div>
                            <button
                                onClick={() => setShowNotificationPrompt(false)}
                                className="text-white/60 hover:text-white p-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={handleEnableNotifications}
                                className="flex-1 bg-white text-blue-700 font-bold text-xs py-2.5 rounded-xl active:scale-98 transition"
                            >
                                Activar ahora
                            </button>
                            <button
                                onClick={() => setShowNotificationPrompt(false)}
                                className="px-4 text-white/80 font-medium text-xs"
                            >
                                Ahora no
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════
                LEVEL 50 — MENU SIDEBAR
            ═══════════════════════════════════════════════ */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 flex">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)} />
                    <div className="relative w-[80%] max-w-sm bg-white h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
                        <div className="p-8 pb-10 bg-gray-900 text-white rounded-br-[40px]">
                            <button onClick={() => setIsMenuOpen(false)} className="mb-6"><X className="w-8 h-8" /></button>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-500 rounded-[20px] flex items-center justify-center flex-shrink-0 border-2 border-white/20">
                                    <User className="w-8 h-8 text-white" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Repartidor</p>
                                    <h3 className="text-xl font-black italic tracking-tighter uppercase truncate leading-none">{session?.user?.name || "Moover"}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-2 mt-4">
                            {[
                                { icon: <Bike />, label: "Dashboard", href: "/repartidor/dashboard" },
                                { icon: <History />, label: "Historial", href: "/repartidor/historial" },
                                { icon: <DollarSign />, label: "Mis ganancias", href: "/repartidor/ganancias" },
                                { icon: <HelpCircle />, label: "Soporte", href: "/repartidor/soporte" },
                                { icon: <User />, label: "Mi Perfil", href: "/repartidor/perfil" },
                                { icon: <Settings />, label: "Configuración", href: "/repartidor/configuracion" }
                            ].map((item, i) => (
                                <Link key={i} href={item.href} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition group">
                                    <div className="text-gray-400 group-hover:text-gray-900 transition">{item.icon}</div>
                                    <span className="text-sm font-black italic uppercase tracking-widest text-gray-900">{item.label}</span>
                                </Link>
                            ))}
                        </div>

                        <div className="p-6 border-t">
                            <button onClick={() => signOut()} className="w-full flex items-center justify-center gap-3 p-5 bg-red-50 text-red-600 rounded-[22px] font-black uppercase tracking-widest text-xs italic active:scale-95 transition">
                                <LogOut className="w-5 h-5" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes shrink { from { width: 100%; } to { width: 0%; } }
                .animate-shrink { animation: shrink 15s linear forwards; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
            `}</style>
        </div>
    );
}
