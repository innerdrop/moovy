"use client";

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Package,
    Clock,
    CheckCircle2,
    TrendingUp,
    MessageCircle,
    Navigation,
    Bike,
    DollarSign,
    Calendar,
    ChevronRight,
    ChevronUp,
    Power,
    Loader2,
    MapPin,
    Timer,
    ExternalLink,
    Map,
    LogOut,
    Menu,
    Phone,
    User
} from "lucide-react";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import dynamic from "next/dynamic";

// Dynamic import for mini-map (SSR incompatible)
const RiderMiniMap = dynamic(
    () => import("@/components/rider/RiderMiniMap"),
    { ssr: false, loading: () => <div className="h-full w-full bg-gray-200 animate-pulse" /> }
);

export default function RepartidorDashboard() {
    const { data: session } = useSession();
    const [isOnline, setIsOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    // Fetch initial status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await fetch("/api/driver/status");
                if (res.ok) {
                    const data = await res.json();
                    setIsOnline(data.isOnline);
                }
            } catch (error) {
                console.error("Error fetching status:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const [dashboardData, setDashboardData] = useState({
        stats: {
            pedidosHoy: 0,
            enCamino: 0,
            completados: 0,
            gananciasHoy: 0
        },
        pedidosActivos: [] as any[],
        pedidosDisponibles: [] as any[],
        pedidosPendientes: [] as any[]
    });

    // Use our new robust driver location hook
    const {
        latitude: lat,
        longitude: lng,
        heading: driverHeading,
        connected: socketConnected,
        isTracking,
        error: locationHookError
    } = useDriverLocation({
        driverId: session?.user?.id || "",
        enabled: isOnline,
        currentOrderId: dashboardData.pedidosActivos?.[0]?.id // Track first active order
    });

    const driverLocation = lat && lng ? { lat, lng } : null;

    // Toggle online status using the new standard API
    const toggleOnline = useCallback(async () => {
        setIsToggling(true);
        try {
            const newStatus = isOnline ? "FUERA_DE_SERVICIO" : "DISPONIBLE";
            const res = await fetch("/api/driver/status", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });
            if (res.ok) {
                const data = await res.json();
                setIsOnline(data.isOnline);
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        } finally {
            setIsToggling(false);
        }
    }, [isOnline]);

    // Fetch dashboard data with driver location
    useEffect(() => {
        const fetchData = async () => {
            try {
                let url = "/api/driver/dashboard";
                if (driverLocation) {
                    url += `?lat=${driverLocation.lat}&lng=${driverLocation.lng}`;
                }
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setDashboardData(data);
                }
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 15000); // Poll more frequently for offers
        return () => clearInterval(interval);
    }, [driverLocation]);

    const { stats, pedidosActivos, pedidosDisponibles, pedidosPendientes } = dashboardData;

    // Get the current active order (if any)
    const pedidoActivo = pedidosActivos?.[0];

    // Determine current status text
    const getStatusText = () => {
        if (!isOnline) return "Desconectado";
        if (pedidoActivo) {
            if (pedidoActivo.estado === "driver_assigned" || pedidoActivo.estado === "driver_arrived") {
                return "Recogiendo";
            }
            if (pedidoActivo.estado === "picked_up" || pedidoActivo.estado === "on_the_way" || pedidoActivo.estado === "in_delivery") {
                return "Repartiendo";
            }
        }
        return "Listo";
    };

    return (
        <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
            {/* STICKY MAP SECTION - Takes 60% of screen */}
            <div className="relative h-[60vh] flex-shrink-0">
                {/* Map */}
                <div className="absolute inset-0">
                    <RiderMiniMap
                        driverLat={lat ?? undefined}
                        driverLng={lng ?? undefined}
                        driverHeading={driverHeading ?? 0}
                        merchantLat={pedidoActivo?.merchantLat}
                        merchantLng={pedidoActivo?.merchantLng}
                        merchantName={pedidoActivo?.comercio}
                        customerLat={pedidoActivo?.customerLat}
                        customerLng={pedidoActivo?.customerLng}
                        customerAddress={pedidoActivo?.direccionCliente || "Cliente"}
                        customerName={pedidoActivo?.nombreCliente || pedidoActivo?.clienteNombre || "Cliente"}
                        height="100%"
                        navigationMode={!!pedidoActivo}
                    />
                </div>

                {/* Floating Menu Button */}
                <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="absolute top-4 left-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
                >
                    <Menu className="w-6 h-6 text-gray-700" />
                </button>

                {/* Status Indicator (top center) */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Estado</span>
                    <div className={`w-2 h-2 rounded-full ${isOnline ? (pedidoActivo ? 'bg-orange-500' : 'bg-green-500') : 'bg-gray-400'}`} />
                    <span className="text-sm font-bold text-gray-900">{getStatusText()}</span>
                </div>

                {/* Support Button (top right) */}
                <Link
                    href="/repartidor/soporte"
                    className="absolute top-4 right-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
                >
                    <MessageCircle className="w-5 h-5 text-gray-700" />
                </Link>

                {/* Google Maps Navigate Button (left side) */}
                {pedidoActivo && pedidoActivo.navLat && pedidoActivo.navLng && (
                    <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${pedidoActivo.navLat},${pedidoActivo.navLng}&travelmode=driving`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-green-500 hover:bg-green-600 text-white rounded-full px-4 py-3 shadow-xl flex items-center gap-2 font-bold transition-all active:scale-95"
                    >
                        <Navigation className="w-5 h-5" />
                        Navegar
                    </a>
                )}

                {/* Re-center GPS button */}
                <button
                    onClick={() => {
                        // This is handled by the RiderMiniMap component internally
                    }}
                    className="absolute bottom-4 right-4 z-20 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
                    </svg>
                </button>

                {/* Floating Menu Dropdown */}
                {showMenu && (
                    <div className="absolute top-20 left-4 z-30 bg-white rounded-2xl shadow-2xl w-64 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <p className="font-bold text-lg">{session?.user?.name || "Repartidor"}</p>
                            <p className="text-green-100 text-xs">Moovy Rider</p>
                        </div>
                        <nav className="py-2">
                            <Link href="/repartidor/historial" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                                <Calendar className="w-5 h-5 text-green-600" />
                                <span className="font-medium text-gray-700">Historial</span>
                            </Link>
                            <Link href="/repartidor/ganancias" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <span className="font-medium text-gray-700">Ganancias</span>
                            </Link>
                            <Link href="/repartidor/perfil" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                                <User className="w-5 h-5 text-purple-600" />
                                <span className="font-medium text-gray-700">Mi Perfil</span>
                            </Link>
                            <Link href="/repartidor/soporte" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                                <MessageCircle className="w-5 h-5 text-orange-600" />
                                <span className="font-medium text-gray-700">Soporte</span>
                            </Link>
                            <div className="border-t mt-2 pt-2">
                                <button
                                    onClick={() => signOut({ callbackUrl: "/repartidor/login" })}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition w-full text-left"
                                >
                                    <LogOut className="w-5 h-5 text-red-500" />
                                    <span className="font-medium text-red-600">Cerrar Sesión</span>
                                </button>
                            </div>
                        </nav>
                    </div>
                )}

                {/* Click outside to close menu */}
                {showMenu && (
                    <div
                        className="absolute inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                    />
                )}
            </div>

            {/* SCROLLABLE BOTTOM PANEL */}
            <div className="flex-1 bg-white rounded-t-[24px] -mt-6 relative z-10 shadow-2xl overflow-y-auto">
                {/* Handle/indicator for dragging feel */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-300 rounded-full" />
                </div>

                {/* Content */}
                <div className="px-4 pb-8">
                    {/* If there's an active order */}
                    {pedidoActivo ? (
                        <div className="space-y-4">
                            {/* Customer/Order Info Card */}
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <h2 className="font-bold text-xl text-gray-900">
                                        {pedidoActivo.nombreCliente || pedidoActivo.clienteNombre || "Cliente"}
                                    </h2>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        {pedidoActivo.estado === "driver_assigned" || pedidoActivo.estado === "driver_arrived"
                                            ? "Ir al comercio"
                                            : "Ir a la dirección del cliente"}
                                        <span className="mx-1">•</span>
                                        <span className="text-green-600 font-medium">
                                            Llegada en {pedidoActivo.tiempoAlCliente || pedidoActivo.tiempoAlComercio || "?"} min
                                        </span>
                                    </p>
                                </div>
                                {pedidoActivo.telefonoCliente && (
                                    <a
                                        href={`tel:${pedidoActivo.telefonoCliente}`}
                                        className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition"
                                    >
                                        <Phone className="w-5 h-5 text-gray-600" />
                                    </a>
                                )}
                            </div>

                            {/* Direction Section */}
                            <div className="border-t pt-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Dirección</p>
                                <div className="flex items-start gap-3">
                                    <MapPin className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-gray-800 font-medium">
                                        {pedidoActivo.direccion || pedidoActivo.direccionCliente || "Dirección no disponible"}
                                    </p>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={async () => {
                                    const newStatus =
                                        (pedidoActivo.estado === "driver_assigned" || pedidoActivo.estado === "driver_arrived") ? "PICKED_UP" :
                                            (pedidoActivo.estado === "picked_up" || pedidoActivo.estado === "on_the_way" || pedidoActivo.estado === "in_delivery") ? "DELIVERED" :
                                                null;

                                    if (!newStatus) return;

                                    const actionName = newStatus === "PICKED_UP" ? "iniciar el viaje" : "finalizar la entrega";
                                    if (!confirm(`¿Confirmas que vas a ${actionName}?`)) return;

                                    try {
                                        const res = await fetch(`/api/orders/${pedidoActivo.id}`, {
                                            method: "PATCH",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ status: newStatus })
                                        });

                                        if (res.ok) {
                                            alert("¡Estado actualizado!");
                                            // Trigger refresh
                                            const fresh = await fetch("/api/driver/dashboard").then(r => r.json());
                                            setDashboardData(fresh);
                                        } else {
                                            const err = await res.json();
                                            alert(err.error || "Error al actualizar");
                                        }
                                    } catch (e) {
                                        console.error(e);
                                        alert("Error de conexión");
                                    }
                                }}
                                className="w-full py-4 bg-[#e60012] hover:bg-[#c5000f] text-white font-bold text-lg rounded-2xl shadow-lg shadow-red-500/20 transition-all active:scale-98 flex items-center justify-center gap-2"
                            >
                                {(pedidoActivo.estado === "driver_assigned" || pedidoActivo.estado === "driver_arrived")
                                    ? "Tengo el pedido"
                                    : "Continuar con la entrega"}
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        /* No active order - show offers or waiting state */
                        <div className="space-y-4">
                            {/* Online/Offline Toggle */}
                            <div className="flex items-center justify-between py-3">
                                <div>
                                    <h2 className="font-bold text-xl text-gray-900">
                                        {isOnline ? "Buscando pedidos..." : "Estás desconectado"}
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        {isOnline
                                            ? "Te avisaremos cuando haya un pedido cercano"
                                            : "Conéctate para empezar a recibir pedidos"
                                        }
                                    </p>
                                </div>
                                <button
                                    onClick={toggleOnline}
                                    disabled={isLoading || isToggling}
                                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isOnline
                                        ? 'bg-green-500 shadow-lg shadow-green-500/30'
                                        : 'bg-gray-300 hover:bg-gray-400'
                                        } ${(isLoading || isToggling) ? 'opacity-70' : ''}`}
                                >
                                    {isToggling ? (
                                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                                    ) : (
                                        <Power className="w-8 h-8 text-white" />
                                    )}
                                    {isOnline && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                                    )}
                                </button>
                            </div>

                            {/* GPS/Location status */}
                            {isOnline && (
                                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${locationHookError
                                        ? 'bg-red-50 text-red-700'
                                        : lat && lng
                                            ? 'bg-green-50 text-green-700'
                                            : 'bg-amber-50 text-amber-700'
                                    }`}>
                                    {locationHookError ? (
                                        <>
                                            <MapPin className="w-4 h-4" />
                                            <span className="font-medium">{locationHookError}. Necesitas compartir tu ubicación.</span>
                                        </>
                                    ) : lat && lng ? (
                                        <>
                                            <Navigation className="w-4 h-4 animate-pulse" />
                                            <span className="font-medium">GPS activo - Ubicación compartida</span>
                                        </>
                                    ) : (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="font-medium">Buscando ubicación GPS...</span>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Pending Order Offers */}
                            {pedidosPendientes && pedidosPendientes.length > 0 && (
                                <div className="space-y-3 mt-4">
                                    <h3 className="font-bold text-lg text-orange-600 flex items-center gap-2">
                                        <Package className="w-5 h-5 animate-bounce" />
                                        ¡Nueva oferta de pedido!
                                    </h3>
                                    {pedidosPendientes.map((pedido) => (
                                        <div key={pedido.id} className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <p className="font-bold text-gray-900">{pedido.comercio}</p>
                                                    <p className="text-sm text-gray-600">{pedido.direccion}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-2xl text-orange-600">${pedido.gananciaEstimada}</p>
                                                    <p className="text-xs text-gray-500">Tu ganancia</p>
                                                </div>
                                            </div>

                                            {pedido.expiresAt && (
                                                <div className="bg-orange-100 rounded-lg py-2 px-3 mb-3 flex items-center justify-center gap-2">
                                                    <Clock className="w-4 h-4 text-orange-600" />
                                                    <span className="font-bold text-orange-700">
                                                        Expira en: {Math.max(0, Math.floor((new Date(pedido.expiresAt).getTime() - Date.now()) / 1000))}s
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm("¿Rechazar este pedido?")) return;
                                                        try {
                                                            const res = await fetch(`/api/driver/orders/${pedido.id}/reject`, { method: "POST" });
                                                            if (res.ok) {
                                                                const fresh = await fetch("/api/driver/dashboard").then(r => r.json());
                                                                setDashboardData(fresh);
                                                            }
                                                        } catch (e) { alert("Error"); }
                                                    }}
                                                    className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition"
                                                >
                                                    Rechazar
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch(`/api/driver/orders/${pedido.id}/accept`, { method: "POST" });
                                                            if (res.ok) {
                                                                const fresh = await fetch("/api/driver/dashboard").then(r => r.json());
                                                                setDashboardData(fresh);
                                                                alert("¡Pedido aceptado!");
                                                            } else {
                                                                const err = await res.json();
                                                                alert(err.error || "Error");
                                                            }
                                                        } catch (e) { alert("Error"); }
                                                    }}
                                                    className="flex-[2] bg-orange-500 text-white font-black py-3 rounded-xl hover:bg-orange-600 transition shadow-lg shadow-orange-500/30 flex items-center justify-center gap-2"
                                                >
                                                    <Bike className="w-5 h-5" />
                                                    ¡ACEPTAR!
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Stats cards when online and no pending offers */}
                            {isOnline && (!pedidosPendientes || pedidosPendientes.length === 0) && (
                                <div className="grid grid-cols-3 gap-3 mt-4">
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-gray-900">{stats.pedidosHoy}</p>
                                        <p className="text-xs text-gray-500">Hoy</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-green-600">{stats.completados}</p>
                                        <p className="text-xs text-gray-500">Completados</p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold text-blue-600">${stats.gananciasHoy.toLocaleString()}</p>
                                        <p className="text-xs text-gray-500">Ganado</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
