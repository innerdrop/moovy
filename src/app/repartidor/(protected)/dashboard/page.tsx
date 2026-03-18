"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import "./gps-error.css";
import {
    Bike,
    MapPin,
    Package,
    Clock,
    Power,
    Loader2,
    User,
    X,
    Navigation,
    Phone,
    ArrowRight,
    Wallet,
    CheckCircle,
    Home,
    BatteryLow,
    Zap,
    Settings,
    Star,
    TrendingUp
} from "lucide-react";
import dynamic from "next/dynamic";
import { useGeolocation } from "@/hooks/useGeolocation";
import { MapSkeleton } from "@/components/rider/MapWrapper";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useSocketAuth } from "@/hooks/useSocketAuth";
import { useDriverSocket } from "@/hooks/useDriverSocket";
import { useBattery } from "@/hooks/useBattery";
import type { NavUpdateData } from "@/components/rider/RiderMiniMap";
import { toast } from "@/store/toast";

// Views
import HistoryView from "@/components/rider/views/HistoryView";
import EarningsView from "@/components/rider/views/EarningsView";
import SupportView from "@/components/rider/views/SupportView";
import ProfileView from "@/components/rider/views/ProfileView";
import SettingsView from "@/components/rider/views/SettingsView";

// Dynamic imports for heavy components
const RiderMiniMap = dynamic(() => import("@/components/rider/RiderMiniMap"), {
    ssr: false,
    loading: () => <MapSkeleton />
});

const BottomSheet = dynamic(() => import("@/components/rider/BottomSheet"), {
    ssr: false,
    loading: () => <div className="fixed bottom-0 left-0 right-0 h-[160px] bg-white dark:bg-[#1a1d27] rounded-t-3xl animate-pulse" />
});

const RiderBottomNav = dynamic(() => import("@/components/rider/RiderBottomNav"), { ssr: false });

const ShiftSummaryModal = dynamic(
    () => import("@/components/rider/ShiftSummaryModal").then(mod => mod.ShiftSummaryModal),
    { ssr: false }
);

const SwipeToConfirm = dynamic(() => import("@/components/rider/SwipeToConfirm"), { ssr: false });

// Haptic feedback patterns
const haptic = {
    light: () => navigator?.vibrate?.(10),
    medium: () => navigator?.vibrate?.(50),
    success: () => navigator?.vibrate?.([50, 50, 100]),
    warning: () => navigator?.vibrate?.([100, 50, 100, 50, 100]),
    newOrder: () => navigator?.vibrate?.([200, 100, 200, 100, 300]),
};

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
        driverRating?: number;
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

    // Socket.IO for real-time updates
    const { token: socketToken } = useSocketAuth(true);

    const [recenterToggle, setRecenterToggle] = useState(false);
    const [dismissedOfferIds, setDismissedOfferIds] = useState<Set<string>>(new Set());

    // Battery monitoring
    const battery = useBattery();
    const [batteryDismissed, setBatteryDismissed] = useState(false);
    const showBatteryWarning = battery.supported && battery.level !== null && battery.level <= 0.20 && !battery.charging && !batteryDismissed;

    // Pull-to-refresh state
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const pullStartY = useRef(0);

    // Navigation data from RiderMiniMap → BottomSheet
    const [navData, setNavData] = useState<NavUpdateData | null>(null);
    const handleNavUpdate = useCallback((data: NavUpdateData) => {
        setNavData(data);
    }, []);

    // Animated earnings counter
    const [displayedEarnings, setDisplayedEarnings] = useState(0);
    const earningsRef = useRef(0);
    useEffect(() => {
        const target = dashboardData?.stats?.gananciasHoy || 0;
        if (target === earningsRef.current) return;
        const start = earningsRef.current;
        const diff = target - start;
        const duration = 1200;
        const startTime = performance.now();
        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setDisplayedEarnings(Math.round(start + diff * eased));
            if (progress < 1) requestAnimationFrame(animate);
            else earningsRef.current = target;
        };
        requestAnimationFrame(animate);
    }, [dashboardData?.stats?.gananciasHoy]);

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
        haptic.newOrder();
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

    // Initial load + fallback polling every 30s
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
        const success = await requestPermission();
        if (success) {
            setShowNotificationPrompt(false);
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

    // Toggle online/offline
    const toggleOnline = async () => {
        if (isOnline) {
            setShowShiftSummary(true);
            return;
        }

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

    // Auto-expand map when a NEW active order appears (not continuously)
    const prevActiveOrderId = useRef<string | null>(null);
    useEffect(() => {
        const pedidoActivo = dashboardData?.pedidosActivos?.[0];
        const currentId = pedidoActivo?.id || null;
        // Only auto-expand when a new order appears (different from previous)
        if (currentId && currentId !== prevActiveOrderId.current) {
            setIsMapExpanded(true);
        }
        // Auto-collapse when order disappears (delivered/cancelled)
        if (!currentId && prevActiveOrderId.current) {
            setIsMapExpanded(false);
        }
        prevActiveOrderId.current = currentId;
    }, [dashboardData?.pedidosActivos]);

    // Pull-to-refresh handlers
    const handlePullStart = useCallback((e: React.TouchEvent) => {
        const scrollTop = (e.currentTarget as HTMLElement).scrollTop;
        if (scrollTop <= 0) {
            pullStartY.current = e.touches[0].clientY;
        }
    }, []);

    const handlePullMove = useCallback((e: React.TouchEvent) => {
        if (pullStartY.current === 0 || isRefreshing) return;
        const diff = e.touches[0].clientY - pullStartY.current;
        if (diff > 0) {
            setPullDistance(Math.min(diff * 0.4, 80));
        }
    }, [isRefreshing]);

    const handlePullEnd = useCallback(async () => {
        if (pullDistance > 50 && !isRefreshing) {
            setIsRefreshing(true);
            haptic.medium();
            await fetchDashboard(true);
            setIsRefreshing(false);
        }
        setPullDistance(0);
        pullStartY.current = 0;
    }, [pullDistance, isRefreshing, fetchDashboard]);

    const firstName = session?.user?.name?.split(" ")[0] || "Repartidor";

    // ── Loading state ──
    if (isLoading && !dashboardData) {
        return (
            <div className="h-dvh flex flex-col bg-[var(--rider-bg)]">
                {/* Header skeleton */}
                <div className="px-5 pt-14 pb-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="h-6 w-36 bg-gray-100 dark:bg-[#22252f] rounded-lg animate-pulse" />
                            <div className="h-4 w-24 bg-gray-50 dark:bg-[#1a1d27] rounded-lg animate-pulse" />
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-[#22252f] animate-pulse" />
                    </div>
                </div>

                {/* Hero button skeleton */}
                <div className="px-5 py-6">
                    <div className="h-[140px] rounded-[28px] bg-gray-100 dark:bg-[#1a1d27] animate-pulse" />
                </div>

                {/* Stats skeleton */}
                <div className="px-5 grid grid-cols-2 gap-4">
                    {[0, 1].map(i => (
                        <div key={i} className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/10 rounded-[22px] p-5">
                            <div className="w-10 h-10 bg-gray-100 dark:bg-[#22252f] rounded-2xl mb-3 animate-pulse" />
                            <div className="h-7 w-20 bg-gray-100 dark:bg-[#22252f] rounded-lg mb-1 animate-pulse" />
                            <div className="h-3 w-24 bg-gray-50 dark:bg-[#22252f] rounded-lg animate-pulse" />
                        </div>
                    ))}
                </div>

                {/* Brand footer */}
                <div className="flex-1 flex items-end justify-center pb-8">
                    <div className="flex flex-col items-center gap-2">
                        <Bike className="w-8 h-8 text-gray-200 dark:text-gray-700" />
                        <p className="text-[10px] font-bold text-gray-300 dark:text-gray-600 uppercase tracking-widest">Cargando moovy...</p>
                    </div>
                </div>
            </div>
        );
    }

    // ── GPS permission required ──
    if ((!location || locationHookError) && !isLoading) {
        return (
            <div className="gps-error-screen">
                <div className="gps-blob gps-blob-1"></div>
                <div className="gps-blob gps-blob-2"></div>
                <div className="gps-card">
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
                    <div style={{ textAlign: 'center' }}>
                        <span className="gps-badge"><span className="gps-badge-dot"></span>Sin señal</span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <h1 className="gps-title">GPS <span>no</span><br />disponible</h1>
                        <p className="gps-subtitle">Necesitamos tu ubicación para<br />mostrarte las mejores ofertas cerca de ti.</p>
                    </div>
                    <div className="gps-divider"></div>
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
                    <button onClick={() => window.location.reload()} className="gps-btn-secondary">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                            <path d="M8 1v3.5L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Refrescar
                    </button>
                    <div className="gps-tips">
                        <p className="gps-tips-label">Si el botón no funciona:</p>
                        <ul className="gps-tips-list">
                            <li><span className="gps-tip-num">1</span><span>Ve a <b>Ajustes → Privacidad → Localización</b></span></li>
                            <li><span className="gps-tip-num">2</span><span>Asegúrate que el Navegador esté en <b>&quot;Al usar la app&quot;</b></span></li>
                        </ul>
                    </div>
                    <div className="gps-brand">
                        <img src="/logo-moovy.svg" alt="Moovy" style={{ height: '28px', objectFit: 'contain' }} />
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
        <div className={`h-dvh w-screen relative bg-[var(--rider-bg)] ${!isMapExpanded ? 'overflow-y-auto overflow-x-hidden' : 'overflow-hidden'}`}>

            {activeView === "dashboard" && (
                <>
                    {/* ═══════════════════════════════════════════════
                        FULLSCREEN MAP MODE — Only with active order
                    ═══════════════════════════════════════════════ */}
                    {isMapExpanded && (
                        <>
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

                            {/* Top bar — floating controls */}
                            <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                                <div className="flex justify-between items-start px-4 pt-2">
                                    <button
                                        onClick={() => setIsMapExpanded(false)}
                                        className="w-12 h-12 bg-white/95 dark:bg-[#1a1d27]/95 backdrop-blur-xl rounded-[14px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] flex items-center justify-center pointer-events-auto active:scale-95 transition-all duration-300 border border-gray-200 dark:border-white/10"
                                    >
                                        <Home className="w-5 h-5 text-[var(--rider-accent)]" />
                                    </button>
                                    <div className="flex flex-col items-end gap-2 pointer-events-auto">
                                        <div className={`px-5 py-2.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.08)] backdrop-blur-xl flex items-center gap-2 border transition-all duration-300 ${isOnline ? 'bg-[var(--rider-online)]/90 text-white border-[var(--rider-online)]/50' : 'bg-white/95 text-gray-400 border-gray-200'}`}>
                                            <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-white animate-pulse' : 'bg-gray-300'}`} />
                                            <span className="text-[12px] font-semibold uppercase tracking-[0.8px]">{isOnline ? 'Conectado' : 'Offline'}</span>
                                        </div>
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
                                                    <MapPin className="w-4 h-4 text-[var(--rider-online)]" />
                                                    Centrar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* BottomSheet with order details */}
                            <BottomSheet
                                initialState="minimized"
                                onStateChange={() => { }}
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
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#22252f] px-3 py-1 rounded-full w-fit mb-2">
                                                        <Package className="w-3.5 h-3.5 text-gray-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">#{pedidoActivo.orderId}</span>
                                                    </div>
                                                    <h2 className="text-[22px] font-extrabold tracking-tight text-[var(--rider-text)] uppercase leading-none">
                                                        {pedidoActivo.estado === "picked_up" ? "Entrega en curso"
                                                            : pedidoActivo.estado === "driver_arrived" ? "Esperando pedido"
                                                            : "Ir al comercio"}
                                                    </h2>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Hora inicio</p>
                                                    <p className="text-lg font-black text-[var(--rider-text)] leading-none italic">{pedidoActivo.hora}</p>
                                                </div>
                                            </div>

                                            {/* Route card */}
                                            <div className="bg-gray-50 dark:bg-[#22252f] rounded-[24px] p-4 border border-gray-100 dark:border-white/10">
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center gap-1 mt-1">
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${pedidoActivo.estado === "driver_assigned" ? "bg-blue-500" : pedidoActivo.estado === "driver_arrived" ? "bg-amber-500" : "bg-gray-300"}`} />
                                                        <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-200" />
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${pedidoActivo.estado === "driver_arrived" ? "bg-blue-500" : pedidoActivo.estado === "picked_up" ? "bg-blue-500" : "bg-gray-300"}`} />
                                                        <div className="w-0.5 h-6 border-l-2 border-dashed border-gray-200" />
                                                        <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${pedidoActivo.estado === "picked_up" ? "bg-[var(--rider-online)]" : "bg-gray-300"}`} />
                                                    </div>
                                                    <div className="flex-1 space-y-6">
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Comercio</p>
                                                            <p className="font-bold text-[var(--rider-text)] leading-tight">{pedidoActivo.comercio}</p>
                                                            {pedidoActivo.estado !== "picked_up" && (
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{pedidoActivo.direccion}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[2px] mb-1">Destino</p>
                                                            <p className="font-bold text-[var(--rider-text)] leading-tight">{pedidoActivo.direccionCliente || "Ubicación del cliente"}</p>
                                                            {pedidoActivo.estado === "picked_up" && (
                                                                <div className="flex items-center gap-2 mt-1 py-1 px-3 bg-green-50 text-green-700 rounded-full w-fit">
                                                                    <User className="w-3 h-3" />
                                                                    <span className="text-[10px] font-bold uppercase">{pedidoActivo.nombreCliente || "Cliente"}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {pedidoActivo.telefonoCliente && (
                                                        <a href={`tel:${pedidoActivo.telefonoCliente}`} className="w-12 h-12 bg-white dark:bg-[#22252f] rounded-2xl flex items-center justify-center shadow-md active:scale-95 border border-gray-100 dark:border-white/10">
                                                            <Phone className="w-5 h-5 text-[var(--rider-online)]" />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>

                                            {/* SwipeToConfirm */}
                                            <SwipeToConfirm
                                                label={
                                                    pedidoActivo.estado === "driver_assigned"
                                                        ? "Deslizá → Llegué"
                                                        : pedidoActivo.estado === "driver_arrived"
                                                        ? "Deslizá → Recogí"
                                                        : "Deslizá → Entregado"
                                                }
                                                bgColor={
                                                    pedidoActivo.estado === "driver_assigned"
                                                        ? "bg-amber-500"
                                                        : pedidoActivo.estado === "driver_arrived"
                                                        ? "bg-blue-600"
                                                        : "bg-[var(--rider-online)]"
                                                }
                                                shadowColor={
                                                    pedidoActivo.estado === "driver_assigned"
                                                        ? "shadow-amber-500/30"
                                                        : pedidoActivo.estado === "driver_arrived"
                                                        ? "shadow-blue-500/30"
                                                        : "shadow-green-500/30"
                                                }
                                                disabled={advancingStatus}
                                                onConfirm={async () => {
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
                                                        const res = await fetch(`/api/driver/orders/${pedidoActivo.id}/status`, {
                                                            method: "PATCH",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ deliveryStatus: nextStatus })
                                                        });
                                                        if (res.ok) {
                                                            toast.success(successMsg);
                                                            haptic.success();
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
                                            />
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center">
                                            <p className="text-gray-400 font-medium">Sin pedidos activos</p>
                                        </div>
                                    )}
                                </div>
                            </BottomSheet>
                        </>
                    )}

                    {/* ═══════════════════════════════════════════════
                        STATUS-FIRST HOME — No active order
                    ═══════════════════════════════════════════════ */}
                    {!isMapExpanded && (
                        <div
                            className="pb-24 animate-in fade-in duration-500"
                            onTouchStart={handlePullStart}
                            onTouchMove={handlePullMove}
                            onTouchEnd={handlePullEnd}
                            style={{ transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined, transition: pullDistance === 0 ? 'transform 0.3s ease' : 'none' }}
                        >
                            {/* Pull-to-refresh indicator */}
                            {(pullDistance > 0 || isRefreshing) && (
                                <div className="flex justify-center pt-2 pb-0">
                                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-[#1a1d27] ${isRefreshing ? 'animate-pulse' : ''}`}>
                                        <Loader2 className={`w-4 h-4 text-[var(--rider-accent)] ${pullDistance > 50 || isRefreshing ? 'animate-spin' : ''}`} style={{ opacity: Math.min(pullDistance / 50, 1) }} />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                            {isRefreshing ? 'Actualizando...' : pullDistance > 50 ? 'Soltar para refrescar' : 'Tira para refrescar'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* ── HEADER: Greeting + Settings ── */}
                            <div className="px-5 pt-14 pb-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-[22px] font-extrabold text-[var(--rider-text)] tracking-tight leading-tight">
                                            Hola, {firstName}
                                        </h1>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                            <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                                                {(dashboardData?.driverRating || 5.0).toFixed(1)}
                                            </span>
                                            <span className="text-gray-300 dark:text-gray-600">•</span>
                                            <span className="text-sm text-gray-400">{stats.pedidosHoy} hoy</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setActiveView("settings")}
                                        className="w-10 h-10 rounded-full bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/10 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                    >
                                        <Settings className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>
                            </div>

                            {/* ── HERO: Connect/Disconnect Button ── */}
                            <div className="px-5 py-4">
                                <button
                                    onClick={toggleOnline}
                                    disabled={isToggling}
                                    className={`w-full rounded-[28px] p-6 transition-all duration-500 active:scale-[0.98] relative overflow-hidden ${
                                        isOnline
                                            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_8px_32px_rgba(16,185,129,0.35)]'
                                            : 'bg-gradient-to-br from-gray-800 to-gray-900 dark:from-[#1a1d27] dark:to-[#0f1117] shadow-[0_8px_32px_rgba(0,0,0,0.2)] border border-gray-700 dark:border-white/10'
                                    }`}
                                >
                                    {/* Animated background rings when online */}
                                    {isOnline && (
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                            <div className="w-32 h-32 rounded-full border border-white/10 animate-ping" style={{ animationDuration: '3s' }} />
                                            <div className="absolute w-48 h-48 rounded-full border border-white/5 animate-ping" style={{ animationDuration: '4s' }} />
                                        </div>
                                    )}

                                    <div className="relative z-10 flex flex-col items-center gap-3">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-500 ${
                                            isOnline
                                                ? 'bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                                : 'bg-white/10'
                                        }`}>
                                            {isToggling
                                                ? <Loader2 className="w-8 h-8 animate-spin text-white" />
                                                : <Power className={`w-8 h-8 transition-all duration-500 ${isOnline ? 'text-white' : 'text-gray-400'}`} />
                                            }
                                        </div>
                                        <div className="text-center">
                                            <p className={`text-lg font-extrabold uppercase tracking-widest ${isOnline ? 'text-white' : 'text-gray-300'}`}>
                                                {isOnline ? "Conectado" : "Conectarse"}
                                            </p>
                                            <p className={`text-xs font-medium mt-0.5 ${isOnline ? 'text-white/70' : 'text-gray-500'}`}>
                                                {isOnline ? "Buscando pedidos cerca tuyo..." : "Toca para empezar a recibir pedidos"}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            </div>

                            {/* ── Searching animation when online ── */}
                            {isOnline && !pedidoActivo && (
                                <div className="px-5 pb-4">
                                    <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex items-center gap-4">
                                        <div className="relative w-12 h-12 flex-shrink-0">
                                            <div className="absolute inset-0 border-2 border-dashed border-emerald-300 dark:border-emerald-500/40 rounded-full animate-spin-slow" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Navigation className="w-5 h-5 text-emerald-500" />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Buscando ofertas</p>
                                            <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60">Te avisaremos cuando haya un pedido</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* ── STATS GRID ── */}
                            <div className="px-5 grid grid-cols-2 gap-4">
                                <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/10 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                    <div className="w-10 h-10 bg-[var(--rider-accent)]/10 rounded-2xl flex items-center justify-center mb-3">
                                        <Wallet className="w-5 h-5 text-[var(--rider-accent)]" />
                                    </div>
                                    <p className="text-2xl font-extrabold text-[var(--rider-text)] leading-none">
                                        ${displayedEarnings.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Ganancias Hoy</p>
                                </div>

                                <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/10 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                    <div className="w-10 h-10 bg-[var(--rider-accent)]/10 rounded-2xl flex items-center justify-center mb-3">
                                        <CheckCircle className="w-5 h-5 text-[var(--rider-accent)]" />
                                    </div>
                                    <p className="text-2xl font-extrabold text-[var(--rider-text)] leading-none">{stats.completados}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Completados</p>
                                </div>
                            </div>

                            {/* ── Active order card (if returned to home while order active) ── */}
                            {pedidoActivo && (
                                <div className="px-5 mt-4">
                                    <button
                                        onClick={() => setIsMapExpanded(true)}
                                        className="w-full bg-white dark:bg-[#1a1d27] p-5 rounded-[24px] shadow-[0_4px_16px_rgba(0,0,0,0.06)] border border-orange-200 dark:border-orange-500/20 text-left active:scale-[0.98] transition-all"
                                    >
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                <Package className="w-5 h-5 text-orange-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Pedido en curso</p>
                                                <h3 className="font-extrabold text-[var(--rider-text)] truncate">{pedidoActivo.comercio}</h3>
                                            </div>
                                            {pedidoActivo.telefonoCliente && (
                                                <a
                                                    href={`tel:${pedidoActivo.telefonoCliente}`}
                                                    className="w-10 h-10 bg-green-50 dark:bg-green-500/10 rounded-xl flex items-center justify-center border border-green-200 dark:border-green-500/20"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Phone className="w-4 h-4 text-[var(--rider-online)]" />
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 py-2 border-t border-gray-50 dark:border-white/5">
                                            <MapPin className="w-4 h-4 text-[var(--rider-accent)]" />
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate flex-1">{pedidoActivo.direccionCliente || "Entrega en camino"}</p>
                                            <span className="text-xs font-bold text-[var(--rider-accent)] uppercase">Abrir mapa →</span>
                                        </div>
                                    </button>
                                </div>
                            )}

                            {/* ── Weekly trend (motivational) ── */}
                            {!isOnline && stats.completados > 0 && (
                                <div className="px-5 mt-4">
                                    <div className="bg-white dark:bg-[#1a1d27] border border-gray-100 dark:border-white/10 rounded-[22px] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
                                        <div className="flex items-center gap-2 mb-3">
                                            <TrendingUp className="w-4 h-4 text-[var(--rider-accent)]" />
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Resumen del día</span>
                                        </div>
                                        <div className="flex items-end gap-3">
                                            <div className="flex-1">
                                                <p className="text-3xl font-extrabold text-[var(--rider-text)]">{stats.pedidosHoy}</p>
                                                <p className="text-xs text-gray-400 font-medium">pedidos totales</p>
                                            </div>
                                            <div className="flex items-end gap-1 h-12">
                                                {[0.3, 0.5, 0.8, 0.6, 0.4, 0.9, 1.0].map((h, i) => (
                                                    <div
                                                        key={i}
                                                        className="w-3 bg-[var(--rider-accent)]/20 rounded-full transition-all duration-500"
                                                        style={{
                                                            height: `${h * 100}%`,
                                                            backgroundColor: i === 6 ? 'var(--rider-accent)' : undefined,
                                                            opacity: i === 6 ? 1 : 0.3
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                        FLOATING ORDER OFFER POPUP
                    ═══════════════════════════════════════════════ */}
                    {(() => {
                        const visibleOffers = (pedidosPendientes || []).filter(p => !dismissedOfferIds.has(p.id));
                        return visibleOffers.length > 0 ? (
                            <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]" />
                                <div className="relative z-10 w-full max-w-md mx-4 mb-6 animate-[slideUp_0.4s_cubic-bezier(0.32,0.72,0,1)]">
                                    {visibleOffers.map((pedido) => (
                                        <div key={pedido.id} className="bg-white dark:bg-[#1a1d27] rounded-[28px] p-6 shadow-2xl relative overflow-hidden">
                                            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-400 animate-pulse" />
                                            <div className="flex justify-between items-center mb-5 pt-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                                        <Package className="w-4 h-4 text-orange-600" />
                                                    </div>
                                                    <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-[2px]">Nueva oferta</span>
                                                </div>
                                                <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">#{pedido.orderNumber}</span>
                                            </div>
                                            <div className="bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-2xl px-5 py-3 mb-5 flex items-center justify-between">
                                                <span className="text-[13px] font-bold uppercase tracking-wider">Ganancia estimada</span>
                                                <span className="text-2xl font-extrabold">${pedido.gananciaEstimada}</span>
                                            </div>
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
                                                            <p className="text-sm font-bold text-[var(--rider-text)] leading-tight">{pedido.comercio}</p>
                                                            <p className="text-[11px] text-gray-400 font-medium truncate">{pedido.direccion}</p>
                                                            <div className="mt-1 flex items-center gap-1.5 text-blue-600 font-bold text-[11px] uppercase">
                                                                <Navigation className="w-3 h-3" />
                                                                A {pedido.tiempoAlComercio} min de ti
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[var(--rider-text)] leading-tight">{pedido.direccionCliente || "Entrega al cliente"}</p>
                                                            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-tighter">Total: {pedido.distanciaTotal}</p>
                                                            <div className="mt-1 flex items-center gap-1.5 text-gray-500 font-bold text-[11px] uppercase">
                                                                <Clock className="w-3 h-3" />
                                                                Llevas el pedido en {pedido.tiempoAlCliente} min
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setDismissedOfferIds(prev => new Set([...prev, pedido.id]))}
                                                    className="flex-1 py-4 bg-gray-50 dark:bg-[#22252f] text-gray-500 dark:text-gray-400 font-bold rounded-2xl text-[11px] uppercase tracking-widest border border-gray-100 dark:border-white/10 active:scale-95 transition-all"
                                                >
                                                    Rechazar
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            haptic.medium();
                                                            const res = await fetch(`/api/driver/orders/${pedido.id}/accept`, { method: "POST" });
                                                            if (res.ok) {
                                                                toast.success("Pedido aceptado");
                                                                haptic.success();
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
                    })()}

                    {/* ═══════════════════════════════════════════════
                        BATTERY LOW BANNER
                    ═══════════════════════════════════════════════ */}
                    {showBatteryWarning && (
                        <div className="fixed left-4 right-4 z-30 animate-in slide-in-from-top duration-300" style={{ top: 'max(5rem, calc(env(safe-area-inset-top) + 4.5rem))' }}>
                            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl p-3.5 shadow-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <BatteryLow className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white text-sm">Bateria baja ({Math.round((battery.level || 0) * 100)}%)</h4>
                                        <p className="text-white/80 text-[11px]">Conecta el cargador para no perder pedidos.</p>
                                    </div>
                                    <button onClick={() => setBatteryDismissed(true)} className="text-white/60 hover:text-white p-1">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══════════════════════════════════════════════
                        NOTIFICATION BANNER
                    ═══════════════════════════════════════════════ */}
                    {showNotificationPrompt && (
                        <div className="fixed left-4 right-4 z-30 animate-in slide-in-from-top duration-300" style={{ top: 'max(5rem, calc(env(safe-area-inset-top) + 4.5rem))' }}>
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-4 shadow-xl">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <span className="text-2xl">🔔</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-white text-sm">Activa las notificaciones</h4>
                                        <p className="text-blue-100 text-xs mt-0.5">Recibe alertas cuando haya nuevas ofertas.</p>
                                    </div>
                                    <button onClick={() => setShowNotificationPrompt(false)} className="text-white/60 hover:text-white p-1">
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
                                        {pushError}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ═══════════════════════════════════════════════
               SPA OVERLAYS
            ═══════════════════════════════════════════════ */}
            {activeView === "history" && <HistoryView onBack={() => setActiveView("dashboard")} />}
            {activeView === "earnings" && <EarningsView onBack={() => setActiveView("dashboard")} />}
            {activeView === "support" && <SupportView onBack={() => setActiveView("dashboard")} onChatRead={() => fetchDashboard(true)} />}
            {activeView === "profile" && <ProfileView onBack={() => setActiveView("dashboard")} />}
            {activeView === "settings" && <SettingsView onBack={() => setActiveView("dashboard")} />}

            {/* ═══════════════════════════════════════════════
               SHIFT SUMMARY MODAL
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
               BOTTOM NAVIGATION BAR
            ═══════════════════════════════════════════════ */}
            {!isMapExpanded && (
                <RiderBottomNav
                    activeTab={activeView === "dashboard" || activeView === "settings" ? "dashboard" : activeView as any}
                    onTabChange={(tab) => {
                        setActiveView(tab as any);
                        if (isMapExpanded) setIsMapExpanded(false);
                    }}
                    unreadSupport={dashboardData?.unreadSupportMessages || 0}
                />
            )}

            <style jsx global>{`
                @keyframes shrink { from { width: 100%; } to { width: 0%; } }
                .animate-shrink { animation: shrink 15s linear forwards; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin-once { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(100px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
}
