"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import "./gps-error.css";
import {
    Bike,
    MapPin,
    Package,
    Clock,
    ChevronRight,
    Power,
    Loader2,
    User,
    X,
    Navigation,
    Phone,
    ArrowRight,
    Wallet,
    CheckCircle,
    Home
} from "lucide-react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { MapSkeleton } from "@/components/rider/MapWrapper";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSocketAuth } from "@/hooks/useSocketAuth";
import { useDriverSocket } from "@/hooks/useDriverSocket";
import type { NavUpdateData } from "@/components/rider/RiderMiniMap";
import { toast } from "@/store/toast";

// Views
import HistoryView from "@/components/rider/views/HistoryView";
import EarningsView from "@/components/rider/views/EarningsView";
import SupportView from "@/components/rider/views/SupportView";
import ProfileView from "@/components/rider/views/ProfileView";

// Dynamic imports for heavy components
const RiderMiniMap = dynamic(() => import("@/components/rider/RiderMiniMap"), {
    ssr: false,
    loading: () => <MapSkeleton />
});

const BottomSheet = dynamic(() => import("@/components/rider/BottomSheet"), {
    ssr: false,
    loading: () => <div className="fixed bottom-0 left-0 right-0 h-[160px] bg-white rounded-t-3xl animate-pulse" />
});

const RiderBottomNav = dynamic(() => import("@/components/rider/RiderBottomNav"), { ssr: false });

const ShiftSummaryModal = dynamic(
    () => import("@/components/rider/ShiftSummaryModal").then(mod => mod.ShiftSummaryModal),
    { ssr: false }
);

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
        driverId?: string;
        stats: DashboardStats;
        pedidosActivos: Order[];
        pedidosPendientes: PendingOrderOffer[];
        unreadSupportMessages?: number;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);
    const [isToggling, setIsToggling] = useState(false);
    const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
    const [pushError, setPushError] = useState<string | null>(null);
    const [isMapExpanded, setIsMapExpanded] = useState(false);
    const [advancingStatus, setAdvancingStatus] = useState(false);
    const [showShiftSummary, setShowShiftSummary] = useState(false);

    // SPA Navigation State
    const [activeView, setActiveView] = useState<string>("dashboard");

    // Push notifications
    const { isSupported: pushSupported, permission: pushPermission, requestPermission, isSubscribed, error: hookPushError } = usePushNotifications();

    // Socket.IO for real-time updates (replaces 5s polling)
    const { token: socketToken } = useSocketAuth(true);

    const [recenterToggle, setRecenterToggle] = useState(false);
    const [dismissedOfferIds, setDismissedOfferIds] = useState<Set<string>>(new Set());

    // Navigation data from RiderMiniMap → BottomSheet
    const [navData, setNavData] = useState<NavUpdateData | null>(null);
    const handleNavUpdate = useCallback((data: NavUpdateData) => {
        setNavData(data);
    }, []);

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

    // Socket-driven refresh callback (always silent)
    const handleSocketRefresh = useCallback(() => {
        fetchDashboard(true);
    }, [fetchDashboard]);

    // Handle new order offers from socket (haptic + toast)
    const handleNewOrder = useCallback((order: any) => {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate([200, 100, 200]);
        }
        toast.info(`Nuevo pedido: ${order?.orderNumber || "pedido disponible"}`);
    }, []);

    // Handle order cancellation from socket
    const handleOrderCancelled = useCallback((data: any) => {
        toast.warning(`Pedido #${data?.orderNumber || ""} cancelado`);
    }, []);

    // Connect to real-time socket for driver events
    useDriverSocket({
        driverId: dashboardData?.driverId || null,
        socketToken,
        enabled: isOnline,
        onRefresh: handleSocketRefresh,
        onNewOrder: handleNewOrder,
        onOrderCancelled: handleOrderCancelled,
    });

    // Initial load + fallback polling every 30s (socket handles real-time)
    useEffect(() => {
        fetchDashboard();
        const interval = setInterval(() => fetchDashboard(true), 30000);
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
        if (hookPushError) {
            setPushError(hookPushError);
        }
    }, [isOnline, pushSupported, pushPermission, isSubscribed, hookPushError]);

    const handleEnableNotifications = async () => {
        console.log('[Dashboard] Requesting push permission...');
        console.log('[Dashboard] VAPID key present:', !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
        const success = await requestPermission();
        console.log('[Dashboard] Permission result:', success);
        if (success) {
            setShowNotificationPrompt(false);
        } else {
            console.log('[Dashboard] Notification activation failed or denied.');
        }
    };

    // Perform the actual disconnect API call
    const performDisconnect = async () => {
        try {
            setIsToggling(true);
            const res = await fetch("/api/driver/toggle-status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isOnline: false })
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

    // Toggle online/offline — shows shift summary when going offline
    const toggleOnline = async () => {
        // Going offline → show shift summary first
        if (isOnline) {
            setShowShiftSummary(true);
            return;
        }

        // Going online → check GPS and connect
        if (!location) {
            toast.warning("No podemos activarte sin acceso a tu ubicación GPS.");
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
                body: JSON.stringify({ isOnline: true })
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
        return (
            <div className="gps-error-screen">
                {/* Background blobs */}
                <div className="gps-blob gps-blob-1"></div>
                <div className="gps-blob gps-blob-2"></div>

                <div className="gps-card">
                    {/* Icon */}
                    <div className="gps-icon-wrap">
                        <div className="gps-pin-ring">
                            <svg className="gps-pin-icon" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 3C13.925 3 9 7.925 9 14c0 8.25 11 23 11 23s11-14.75 11-23c0-6.075-4.925-11-11-11z" fill="#E8192C" />
                                <circle cx="20" cy="14" r="4" fill="white" />
                                <path d="M26.5 7a10.5 10.5 0 0 1 0 14" stroke="#E8192C" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
                                <path d="M28.8 4.5a14 14 0 0 1 0 19" stroke="#E8192C" strokeWidth="1.5" strokeLinecap="round" opacity="0.18" />
                            </svg>
                        </div>
                    </div>

                    {/* Badge */}
                    <div style={{ textAlign: 'center' }}>
                        <span className="gps-badge">
                            <span className="gps-badge-dot"></span>
                            Sin señal
                        </span>
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center' }}>
                        <h1 className="gps-title">GPS <span>no</span><br />disponible</h1>
                        <p className="gps-subtitle">Necesitamos tu ubicación para<br />mostrarte las mejores ofertas cerca de ti.</p>
                    </div>

                    <div className="gps-divider"></div>

                    {/* CTA Buttons */}
                    <button
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition(
                                    () => window.location.reload(),
                                    (err) => toast.error("Error: " + err.message)
                                );
                            }
                        }}
                        className="gps-btn-primary"
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <circle cx="9" cy="9" r="7.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
                            <circle cx="9" cy="9" r="3" fill="white" />
                            <line x1="9" y1="1" x2="9" y2="3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="9" y1="14.5" x2="9" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="1" y1="9" x2="3.5" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            <line x1="14.5" y1="9" x2="17" y2="9" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                        Compartir ubicación
                    </button>

                    <button
                        onClick={() => window.location.reload()}
                        className="gps-btn-secondary"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M8 1v3.5L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Refrescar
                    </button>

                    {/* Tips */}
                    <div className="gps-tips">
                        <p className="gps-tips-label">Si el botón no funciona:</p>
                        <ul className="gps-tips-list">
                            <li>
                                <span className="gps-tip-num">1</span>
                                <span>Ve a <b>Ajustes → Privacidad → Localización</b></span>
                            </li>
                            <li>
                                <span className="gps-tip-num">2</span>
                                <span>Asegúrate que el Navegador esté en <b>&quot;Al usar la app&quot;</b></span>
                            </li>
                        </ul>
                    </div>

                    {/* Brand */}
                    <div className="gps-brand">
                        <img src="/logo-moovy.png" alt="Moovy" style={{ height: '28px', objectFit: 'contain' }} />
                    </div>
                </div>
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
        <div className={`h-dvh w-screen relative bg-gray-100 ${!isMapExpanded ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}>

            {activeView === "dashboard" && (
                <>
                    {/* ═══════════════════════════════════════════════
                MAP — Card mode (home) or Fullscreen mode
            ═══════════════════════════════════════════════ */}
                    <div
                        className={`transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] overflow-hidden ${isMapExpanded
                            ? 'absolute inset-0 z-[1] rounded-none'
                            : 'relative z-[1] mx-4 mt-4 rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-gray-200'
                            }`}
                        style={isMapExpanded ? undefined : { height: '220px' }}
                        onClick={() => { if (!isMapExpanded) setIsMapExpanded(true); }}
                    >
                        {/* Map skeleton behind */}
                        <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#f8f8f8] to-[#eee]">
                            <div className="absolute inset-0 overflow-hidden">
                                <div className="absolute inset-0 bg-[linear-gradient(110deg,transparent_25%,rgba(230,0,18,0.04)_37%,transparent_63%)] bg-[length:200%_100%] animate-[shimmer_2s_ease-in-out_infinite]" />
                            </div>
                            <div className="absolute inset-0 opacity-[0.06]" style={{
                                backgroundImage: `
                            linear-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(0,0,0,0.15) 1px, transparent 1px)
                        `,
                                backgroundSize: '60px 60px'
                            }} />
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center animate-pulse">
                                    <MapPin className="w-8 h-8 text-[#e60012]" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-[#e60012]" />
                                    <span className="text-[13px] font-semibold text-[#999] uppercase tracking-[1.5px]">Cargando mapa</span>
                                </div>
                            </div>
                        </div>

                        {/* Actual map */}
                        <div className="absolute inset-0 z-[1]">
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
                                onNavUpdate={handleNavUpdate}
                            />
                        </div>

                        {/* "Tap to expand" label on card mode */}
                        {!isMapExpanded && (
                            <div className="absolute bottom-3 left-0 right-0 z-10 flex justify-center pointer-events-none">
                                <span className="px-4 py-1.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold uppercase tracking-widest rounded-full">
                                    Toca para abrir mapa
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ═══════════════════════════════════════════════
                LEVEL 10 — FLOATING TOP BAR (glassmorphism)
                Only visible in fullscreen map mode
            ═══════════════════════════════════════════════ */}
                    {isMapExpanded && (
                        <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                            <div className="flex justify-between items-start px-4 pt-2">
                                {/* Home button — returns to card view */}
                                <button
                                    onClick={() => setIsMapExpanded(false)}
                                    className="w-12 h-12 bg-white/95 backdrop-blur-xl rounded-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center pointer-events-auto active:scale-95 transition-all duration-300 border border-gray-200 hover:border-[#e60012] hover:shadow-[0_8px_20px_rgba(230,0,18,0.15)]"
                                >
                                    <Home className="w-5 h-5 text-[#e60012]" />
                                </button>

                                {/* Right side controls */}
                                <div className="flex flex-col items-end gap-2 pointer-events-auto">
                                    {/* Online status pill */}
                                    <div className={`px-5 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur-xl flex items-center gap-2 border transition-all duration-300 ${isOnline ? 'bg-green-500/90 text-white border-green-400/50' : 'bg-white/95 text-[#9ca3af] border-gray-200'}`}>
                                        <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                                        <span className="text-[12px] font-semibold uppercase tracking-[0.8px]">{isOnline ? 'Conectado' : 'Offline'}</span>
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
                    )}

                    {/* ═══════════════════════════════════════════════
                HOME VIEW TOP BAR — Status only (card mode)
            ═══════════════════════════════════════════════ */}
                    {!isMapExpanded && (
                        <div className="fixed top-0 left-0 right-0 z-[20] pointer-events-none" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
                            <div className="flex justify-end items-center px-4 pt-1">
                                {/* Online status pill in card mode */}
                                <div className={`px-4 py-2 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.08)] backdrop-blur-xl flex items-center gap-2 border transition-all duration-300 pointer-events-auto ${isOnline ? 'bg-green-500/90 text-white border-green-400/50' : 'bg-white/95 text-[#9ca3af] border-gray-200'}`}>
                                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                                    <span className="text-[11px] font-semibold uppercase tracking-[0.8px]">{isOnline ? 'Conectado' : 'Offline'}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                HOME CONTENT — Stats & Actions (below map in card mode)
            ═══════════════════════════════════════════════ */}
                    {!isMapExpanded && !pedidoActivo && (
                        <div className="px-4 pt-6 pb-24 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Status + Power Row */}
                            <div className="flex items-center justify-between bg-white p-5 rounded-[24px] shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100">
                                <div>
                                    <h2 className={`text-[18px] font-extrabold tracking-tight uppercase leading-tight mb-0.5 ${isOnline ? 'text-emerald-500' : 'text-[#e60012]'}`}>
                                        {isOnline ? "Conectado" : "Estas desconectado"}
                                    </h2>
                                    <p className="text-[12px] text-[#6b6b6b] font-medium">
                                        {isOnline ? "Buscando pedidos..." : "Conectate para recibir ordenes"}
                                    </p>
                                </div>
                                <button
                                    onClick={toggleOnline}
                                    disabled={isToggling}
                                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 active:scale-90 ${isOnline
                                        ? 'bg-emerald-50 border border-emerald-200 shadow-[0_4px_12px_rgba(16,185,129,0.2)]'
                                        : 'bg-gray-50 border border-gray-200 shadow-[0_4px_12px_rgba(0,0,0,0.05)]'
                                        }`}
                                >
                                    {isToggling
                                        ? <Loader2 className="w-6 h-6 animate-spin text-[#e60012]" />
                                        : <Power className={`w-6 h-6 ${isOnline ? 'text-emerald-500' : 'text-gray-400'}`} />
                                    }
                                </button>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-gray-100 rounded-[22px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-2">
                                        <Wallet className="w-5 h-5 text-[#e60012]" />
                                    </div>
                                    <p className="text-xl font-extrabold text-gray-900 leading-none">
                                        ${stats.gananciasHoy.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Ganancias Hoy</p>
                                </div>

                                <div className="bg-white border border-gray-100 rounded-[22px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                    <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-2">
                                        <CheckCircle className="w-5 h-5 text-[#e60012]" />
                                    </div>
                                    <p className="text-xl font-extrabold text-gray-900 leading-none">{stats.completados}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Completados</p>
                                </div>
                            </div>

                            {/* Waiting animation when online */}
                            {isOnline && (
                                <div className="py-8 text-center space-y-3">
                                    <div className="w-20 h-20 bg-gray-50 rounded-full mx-auto flex items-center justify-center relative">
                                        <div className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-full animate-spin-slow" />
                                        <Navigation className="w-8 h-8 text-gray-200 absolute" />
                                    </div>
                                    <p className="text-xs font-extrabold text-gray-300 uppercase tracking-[3px]">Esperando ofertas</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Active order info (short version for card mode) */}
                    {!isMapExpanded && pedidoActivo && (
                        <div className="px-4 pt-6 pb-24 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-white p-5 rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-gray-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <Package className="w-5 h-5 text-orange-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pedido en curso</p>
                                        <h3 className="font-extrabold text-gray-900 truncate">{pedidoActivo.comercio}</h3>
                                    </div>
                                    <button
                                        onClick={() => setIsMapExpanded(true)}
                                        className="bg-[#e60012] text-white px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all"
                                    >
                                        Abrir
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 py-3 border-t border-gray-50">
                                    <MapPin className="w-4 h-4 text-[#e60012]" />
                                    <p className="text-xs text-gray-500 font-medium truncate">{pedidoActivo.direccionCliente || "Entrega en camino"}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                LEVEL 30 — FLOATING ORDER OFFER POPUP
            ═══════════════════════════════════════════════ */}
                    {
                        (() => {
                            const visibleOffers = (pedidosPendientes || []).filter(p => !dismissedOfferIds.has(p.id));
                            return visibleOffers.length > 0 ? (
                                <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                                    {/* Dark backdrop */}
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]" />

                                    {/* Popup card — slides up from bottom */}
                                    <div className="relative z-10 w-full max-w-md mx-4 mb-6 animate-[slideUp_0.4s_cubic-bezier(0.32,0.72,0,1)]">
                                        {visibleOffers.map((pedido) => (
                                            <div key={pedido.id} className="bg-white rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
                                                {/* Pulsing top accent */}
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 animate-pulse" />

                                                {/* Header */}
                                                <div className="flex justify-between items-center mb-5 pt-2">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                            <Package className="w-4 h-4 text-orange-600" />
                                                        </div>
                                                        <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-[2px]">Nueva oferta</span>
                                                    </div>
                                                    <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">#{pedido.orderNumber}</span>
                                                </div>

                                                {/* Ganancia highlight */}
                                                <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-2xl px-5 py-3 mb-5 flex items-center justify-between">
                                                    <span className="text-[13px] font-bold uppercase tracking-wider">Ganancia estimada</span>
                                                    <span className="text-2xl font-extrabold">${pedido.gananciaEstimada}</span>
                                                </div>

                                                {/* Route info */}
                                                <div className="space-y-1 mb-5">
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
                                                            <div className="mb-5">
                                                                <p className="text-sm font-bold text-gray-900 leading-tight">{pedido.comercio}</p>
                                                                <p className="text-[11px] text-gray-400 font-medium truncate">{pedido.direccion}</p>
                                                                <div className="mt-1 flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase">
                                                                    <Navigation className="w-3 h-3" />
                                                                    A {pedido.tiempoAlComercio} min de ti
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-900 leading-tight">{pedido.direccionCliente || "Entrega al cliente"}</p>
                                                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-tighter">Total: {pedido.distanciaTotal}</p>
                                                                <div className="mt-1 flex items-center gap-1.5 text-gray-500 font-bold text-[11px] uppercase">
                                                                    <Clock className="w-3 h-3" />
                                                                    Llevas el pedido en {pedido.tiempoAlCliente} min
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action buttons */}
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setDismissedOfferIds(prev => new Set([...prev, pedido.id]))}
                                                        className="flex-1 py-4 bg-gray-50 text-gray-500 font-bold rounded-2xl text-[11px] uppercase tracking-widest border border-gray-100 active:scale-95 transition-all"
                                                    >
                                                        Rechazar
                                                    </button>
                                                    <button
                                                        onClick={async () => {
                                                            try {
                                                                if (navigator.vibrate) navigator.vibrate(50);
                                                                const res = await fetch(`/api/driver/orders/${pedido.id}/accept`, { method: "POST" });
                                                                if (res.ok) {
                                                                    toast.success("Pedido aceptado");
                                                                    if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
                                                                    await fetchDashboard(true);
                                                                } else {
                                                                    const data = await res.json();
                                                                    toast.error(data.error || "No se pudo aceptar");
                                                                }
                                                            } catch (e) {
                                                                console.error(e);
                                                                toast.error("Error de conexion");
                                                            }
                                                        }}
                                                        className="flex-[2] py-4 bg-orange-500 text-white font-extrabold rounded-2xl shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2 text-[13px] uppercase tracking-widest active:scale-95 transition-all"
                                                    >
                                                        Aceptar
                                                        <ArrowRight className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null;
                        })()
                    }

                    {/* ═══════════════════════════════════════════════
                LEVEL 20 — BOTTOM SHEET (only in fullscreen map mode)
            ═══════════════════════════════════════════════ */}
                    {
                        isMapExpanded && (
                            <BottomSheet
                                initialState="minimized"
                                onStateChange={() => { /* no longer adjusting map height */ }}
                                navCurrentStep={navData?.currentStep}
                                navNextStep={navData?.nextStep}
                                navTotalDistance={navData?.totalDistance}
                                navTotalDuration={navData?.totalDuration}
                                navStepsRemaining={navData?.stepsRemaining}
                                navDestinationName={navData?.destinationName}
                                navIsPickedUp={navData?.isPickedUp}
                                navIsNavigating={navData?.isNavigating}
                            >
                                <div className="pb-10">
                                    {pedidoActivo ? (
                                        <div className="space-y-6">
                                            {/* Order header */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full w-fit mb-2">
                                                        <Package className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">#{pedidoActivo.orderId}</span>
                                                    </div>
                                                    <h2 className="text-[22px] font-extrabold tracking-tight text-[#1a1a1a] uppercase leading-none">
                                                        {pedidoActivo.estado === "picked_up" ? "Entrega en curso"
                                                            : pedidoActivo.estado === "driver_arrived" ? "Esperando pedido"
                                                            : "Ir al comercio"}
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
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                                            pedidoActivo.estado === "driver_assigned" ? "bg-blue-500"
                                                            : pedidoActivo.estado === "driver_arrived" ? "bg-amber-500"
                                                            : "bg-gray-300"
                                                        }`} />
                                                        <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-200" />
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                                            pedidoActivo.estado === "driver_arrived" ? "bg-blue-500"
                                                            : pedidoActivo.estado === "picked_up" ? "bg-blue-500"
                                                            : "bg-gray-300"
                                                        }`} />
                                                        <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-200" />
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${
                                                            pedidoActivo.estado === "picked_up" ? "bg-green-500" : "bg-gray-300"
                                                        }`} />
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

                                            {/* Action button — 3 states: arrive → pickup → deliver */}
                                            <button
                                                onClick={async () => {
                                                    if (advancingStatus) return;
                                                    const nextStatus =
                                                        pedidoActivo.estado === "driver_assigned" ? "DRIVER_ARRIVED"
                                                        : pedidoActivo.estado === "driver_arrived" ? "PICKED_UP"
                                                        : "DELIVERED";

                                                    const successMsg =
                                                        nextStatus === "DRIVER_ARRIVED" ? "Llegaste al comercio"
                                                        : nextStatus === "PICKED_UP" ? "Pedido recogido"
                                                        : "Entrega completada";

                                                    setAdvancingStatus(true);
                                                    try {
                                                        if (navigator.vibrate) navigator.vibrate(50);

                                                        const res = await fetch(`/api/driver/orders/${pedidoActivo.id}/status`, {
                                                            method: "PATCH",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ deliveryStatus: nextStatus })
                                                        });

                                                        if (res.ok) {
                                                            toast.success(successMsg);
                                                            if (navigator.vibrate) navigator.vibrate([50, 50, 100]);
                                                            await fetchDashboard(true);
                                                        } else {
                                                            const data = await res.json();
                                                            toast.error(data.error || "Error al actualizar");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                        toast.error("Error de conexion");
                                                    } finally {
                                                        setAdvancingStatus(false);
                                                    }
                                                }}
                                                disabled={advancingStatus}
                                                className={`w-full py-5 text-white font-black text-lg rounded-[22px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest ${
                                                    pedidoActivo.estado === "driver_assigned"
                                                        ? "bg-amber-500 hover:bg-amber-600 shadow-amber-500/30"
                                                        : pedidoActivo.estado === "driver_arrived"
                                                        ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/30"
                                                        : "bg-green-600 hover:bg-green-700 shadow-green-500/30"
                                                } disabled:opacity-50`}
                                            >
                                                {advancingStatus
                                                    ? <Loader2 className="w-6 h-6 animate-spin" />
                                                    : <>
                                                        {pedidoActivo.estado === "driver_assigned"
                                                            ? "Llegué al comercio"
                                                            : pedidoActivo.estado === "driver_arrived"
                                                            ? "Ya recogí el pedido"
                                                            : "Entrega completada"}
                                                        <ChevronRight className="w-6 h-6" />
                                                    </>
                                                }
                                            </button>
                                        </div>
                                    ) : (
                                        /* ── No active order — New premium design ── */
                                        <div className="space-y-8">
                                            {/* Status + Power — Row layout so button is visible in minimized sheet */}
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h2 className={`text-[22px] font-extrabold tracking-tight uppercase leading-tight mb-1 ${isOnline ? 'text-emerald-500' : 'text-[#e60012]'}`}>
                                                        {isOnline ? "Conectado" : "Estás desconectado"}
                                                    </h2>
                                                    <p className="text-[14px] text-[#6b6b6b] font-medium">
                                                        {isOnline ? "Espera a que te llegue una oferta" : "Conéctate para empezar a ganar"}
                                                    </p>
                                                </div>

                                                {/* Round Power Button with spin effect */}
                                                <button
                                                    key={`power-${isOnline}`}
                                                    onClick={toggleOnline}
                                                    disabled={isToggling}
                                                    className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 active:scale-90 animate-[spin-once_0.5s_ease-out] ${isOnline
                                                        ? 'bg-emerald-50 border-2 border-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.4)]'
                                                        : 'bg-white border-2 border-gray-200 shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#e60012] hover:shadow-[0_6px_20px_rgba(230,0,18,0.2)]'
                                                        }`}
                                                >
                                                    {isToggling
                                                        ? <Loader2 className="w-7 h-7 animate-spin text-[#e60012]" />
                                                        : <Power className={`w-7 h-7 transition-colors duration-300 ${isOnline ? 'text-emerald-500' : 'text-gray-400'}`} />
                                                    }
                                                </button>
                                            </div>

                                            {/* Waiting / Stats depending on status */}
                                            {isOnline ? (
                                                <div className="py-12 text-center space-y-4">
                                                    <div className="w-24 h-24 bg-gray-50 rounded-full mx-auto flex items-center justify-center relative">
                                                        <div className="w-20 h-20 border-2 border-dashed border-gray-200 rounded-full animate-spin-slow" />
                                                        <Navigation className="w-8 h-8 text-gray-200 absolute" />
                                                    </div>
                                                    <p className="text-xs font-extrabold text-gray-300 uppercase tracking-[3px]">Esperando ofertas</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-3 pb-2">
                                                    <div className="bg-white border border-gray-100 rounded-[20px] p-4">
                                                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-2">
                                                            <Wallet className="w-5 h-5 text-[#e60012]" />
                                                        </div>
                                                        <p className="text-2xl font-extrabold text-gray-900 leading-none">${stats.gananciasHoy.toLocaleString()}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Hoy</p>
                                                    </div>
                                                    <div className="bg-white border border-gray-100 rounded-[20px] p-4">
                                                        <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-2">
                                                            <CheckCircle className="w-5 h-5 text-[#e60012]" />
                                                        </div>
                                                        <p className="text-2xl font-extrabold text-gray-900 leading-none">{stats.completados}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Completados</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </BottomSheet>
                        )}

                    {/* ═══════════════════════════════════════════════
                LEVEL 30 — NOTIFICATION BANNER
            ═══════════════════════════════════════════════ */}
                    {
                        showNotificationPrompt && (
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
                                    {pushError && (
                                        <p className="mt-2 text-[10px] text-red-100 border-t border-white/10 pt-2 animate-in fade-in duration-300">
                                            ⚠️ {pushError}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )
                    }

                </>
            )}

            {/* ═══════════════════════════════════════════════
               LEVEL 60 — SPA OVERLAYS
            ═══════════════════════════════════════════════ */}
            {activeView === "history" && <HistoryView onBack={() => setActiveView("dashboard")} />}
            {activeView === "earnings" && <EarningsView onBack={() => setActiveView("dashboard")} />}
            {activeView === "support" && <SupportView onBack={() => setActiveView("dashboard")} onChatRead={() => fetchDashboard(true)} />}
            {activeView === "profile" && <ProfileView onBack={() => setActiveView("dashboard")} />}

            {/* ═══════════════════════════════════════════════
               LEVEL 65 — SHIFT SUMMARY MODAL
            ═══════════════════════════════════════════════ */}
            <ShiftSummaryModal
                isOpen={showShiftSummary}
                onClose={() => setShowShiftSummary(false)}
                onConfirmDisconnect={async () => {
                    setShowShiftSummary(false);
                    await performDisconnect();
                }}
            />

            {/* ═══════════════════════════════════════════════
               LEVEL 70 — BOTTOM NAVIGATION BAR (hidden when map expanded)
            ═══════════════════════════════════════════════ */}
            {
                !isMapExpanded && (
                    <RiderBottomNav
                        activeTab={activeView === "dashboard" ? "dashboard" : activeView as any}
                        onTabChange={(tab) => {
                            setActiveView(tab as any);
                            if (isMapExpanded) setIsMapExpanded(false);
                        }}
                        unreadSupport={dashboardData?.unreadSupportMessages || 0}
                    />
                )
            }

            <style jsx global>{`
                @keyframes shrink { from { width: 100%; } to { width: 0%; } }
                .animate-shrink { animation: shrink 15s linear forwards; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin-once { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(100px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div >
    );
}
