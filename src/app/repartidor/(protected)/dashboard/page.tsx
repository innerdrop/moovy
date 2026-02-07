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
    Power,
    Loader2,
    MapPin,
    Timer,
    ExternalLink,
    Map,
    LogOut
} from "lucide-react";
import { useDriverLocation } from "@/hooks/useDriverLocation";
import dynamic from "next/dynamic";

// Dynamic import for mini-map (SSR incompatible)
const RiderMiniMap = dynamic(
    () => import("@/components/rider/RiderMiniMap"),
    { ssr: false, loading: () => <div className="h-[150px] bg-gray-100 rounded-lg animate-pulse" /> }
);

export default function RepartidorDashboard() {
    const { data: session } = useSession();
    const [isOnline, setIsOnline] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isToggling, setIsToggling] = useState(false);

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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className={`${isOnline ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'} text-white px-4 py-6 pb-20 transition-colors duration-500`}>
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`${isOnline ? 'text-green-100' : 'text-gray-300'} text-sm`}>Bienvenido</p>
                                    <h1 className="text-2xl font-bold">
                                        {session?.user?.name || "Repartidor"}
                                    </h1>
                                </div>
                                <button
                                    onClick={() => signOut({ callbackUrl: "/repartidor/login" })}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-2 text-xs border border-white/10 mr-4"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Cerrar Sesión</span>
                                </button>
                            </div>
                        </div>

                        {/* Online Toggle Button */}
                        <button
                            onClick={toggleOnline}
                            disabled={isLoading || isToggling}
                            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isOnline
                                ? 'bg-white shadow-lg shadow-green-500/30'
                                : 'bg-white/20 hover:bg-white/30'
                                } ${(isLoading || isToggling) ? 'opacity-70' : ''}`}
                        >
                            {isToggling ? (
                                <Loader2 className={`w-8 h-8 animate-spin ${isOnline ? 'text-green-500' : 'text-white'}`} />
                            ) : (
                                <Power className={`w-8 h-8 ${isOnline ? 'text-green-500' : 'text-white'}`} />
                            )}
                            {isOnline && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse" />
                            )}
                        </button>
                    </div>

                    {/* Status Indicator & GPS Status */}
                    <div className="flex flex-col gap-2 text-sm">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                {isLoading ? (
                                    <span className="text-gray-300 italic">Cargando estado...</span>
                                ) : isOnline ? (
                                    <>
                                        <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                                        <span className="text-green-100 font-medium">En línea y disponible</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full" />
                                        <span className="text-gray-300">Fuera de línea</span>
                                    </>
                                )}
                            </div>

                            {/* GPS Pulse Indicator */}
                            {isOnline && (
                                <div className="flex items-center gap-2 border-l border-white/20 pl-4">
                                    {locationHookError ? (
                                        <div className="flex items-center gap-1.5 text-red-200 bg-red-500/20 px-2 py-0.5 rounded-full border border-red-400/30">
                                            <MapPin className="w-3 h-3" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider">GPS Error</span>
                                        </div>
                                    ) : lat && lng ? (
                                        <div className="flex items-center gap-1.5 text-green-200 bg-green-500/20 px-2 py-0.5 rounded-full border border-green-400/30">
                                            <Navigation className="w-3 h-3 animate-pulse" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-green-300">GPS OK</span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5 text-amber-200 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span className="text-[10px] font-bold uppercase tracking-wider italic">Buscando GPS...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Location Error Warning */}
                        {isOnline && locationHookError && (
                            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 mt-2 animate-pulse">
                                <p className="text-xs text-red-100 font-medium flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    {locationHookError}. Es necesario compartir tu ubicación para recibir pedidos.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Stats Cards - Overlapping */}
            <div className="px-4 -mt-14 mb-6">
                <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                            <Package className="w-4 h-4" />
                            Hoy
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.pedidosHoy}</p>
                        <p className="text-xs text-gray-500">pedidos</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-orange-500 text-xs mb-1">
                            <Clock className="w-4 h-4" />
                            En camino
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.enCamino}</p>
                        <p className="text-xs text-gray-500">activos</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-green-500 text-xs mb-1">
                            <CheckCircle2 className="w-4 h-4" />
                            Completados
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{stats.completados}</p>
                        <p className="text-xs text-gray-500">entregas</p>
                    </div>
                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-2 text-blue-500 text-xs mb-1">
                            <DollarSign className="w-4 h-4" />
                            Ganancias
                        </div>
                        <p className="text-2xl font-bold text-gray-900">
                            ${stats.gananciasHoy.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">hoy</p>
                    </div>
                </div>
            </div>

            {/* Pedidos Pendientes (OFERTAS EXCLUSIVAS) */}
            {pedidosPendientes && pedidosPendientes.length > 0 && (
                <div className="px-4 mb-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-xl font-bold text-orange-600 border-l-4 border-orange-500 pl-2">
                                ¡Ofertas de Pedido!
                            </h2>
                            <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full animate-bounce">
                                ¡Acepta ya!
                            </span>
                        </div>

                        <div className="space-y-4">
                            {pedidosPendientes.map((pedido) => (
                                <div key={pedido.id} className="bg-white rounded-xl p-5 shadow-xl border-2 border-orange-400 relative overflow-hidden ring-4 ring-orange-500/10">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-900">{pedido.comercio}</h3>
                                            <p className="text-sm text-gray-600 mb-1 font-medium">{pedido.direccion}</p>
                                            {pedido.direccionCliente && (
                                                <p className="text-xs text-orange-600 font-bold italic">Entrega a: {pedido.direccionCliente}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-black text-2xl text-orange-600">
                                                ${pedido.gananciaEstimada}
                                            </span>
                                            <span className="text-xs text-gray-400 font-bold uppercase">Tu Ganancia</span>
                                        </div>
                                    </div>

                                    {/* Countdown Timer */}
                                    {pedido.expiresAt && (
                                        <div className="my-3 py-2 bg-orange-50 rounded-lg border border-orange-200 flex items-center justify-center gap-2">
                                            <Clock className="w-5 h-5 text-orange-600 animate-pulse" />
                                            <span className="text-orange-700 font-black">
                                                Expira en: {Math.max(0, Math.floor((new Date(pedido.expiresAt).getTime() - Date.now()) / 1000))}s
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 flex-wrap mt-2 mb-4">
                                        <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full font-bold">
                                            <Timer className="w-3.5 h-3.5" />
                                            {pedido.tiempoAlComercio} min al comercio
                                        </div>
                                        <div className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full font-bold">
                                            <Map className="w-3.5 h-3.5" />
                                            {pedido.distanciaTotal} total
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-3">
                                        <button
                                            onClick={async () => {
                                                if (!confirm("¿Rechazar este pedido? Se ofrecerá a otro repartidor.")) return;
                                                try {
                                                    const res = await fetch(`/api/driver/orders/${pedido.id}/reject`, { method: "POST" });
                                                    if (res.ok) {
                                                        const fresh = await fetch("/api/driver/dashboard").then(r => r.json());
                                                        setDashboardData(fresh);
                                                    }
                                                } catch (e) { alert("Error"); }
                                            }}
                                            className="flex-1 bg-gray-100 text-gray-500 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition"
                                        >
                                            Rechazar
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await fetch(`/api/driver/orders/${pedido.id}/accept`, { method: "POST" });
                                                    if (res.ok) {
                                                        // Refresh data
                                                        const fresh = await fetch("/api/driver/dashboard").then(r => r.json());
                                                        setDashboardData(fresh);
                                                        alert("¡Pedido aceptado! Ve al comercio.");
                                                    } else {
                                                        const err = await res.json();
                                                        alert(err.error || "Error");
                                                    }
                                                } catch (e) { alert("Error"); }
                                            }}
                                            className="flex-[2] bg-orange-500 text-white font-black py-4 px-6 rounded-xl shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition flex items-center justify-center gap-2 text-lg"
                                        >
                                            <Bike className="w-6 h-6" />
                                            ¡ACEPTAR!
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Pedidos Disponibles (New!) */}
            {pedidosDisponibles && pedidosDisponibles.length > 0 && (
                <div className="px-4 mb-6">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-lg font-semibold text-gray-900 border-l-4 border-green-500 pl-2">
                                Disponibles para tomar
                            </h2>
                            <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                ¡Nuevo!
                            </span>
                        </div>

                        <div className="space-y-3">
                            {pedidosDisponibles.map((pedido) => (
                                <div key={pedido.id} className="bg-white rounded-xl p-4 shadow-md border-l-4 border-l-green-500 relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{pedido.comercio}</h3>
                                            <p className="text-sm text-gray-500 mb-1">{pedido.direccion}</p>
                                            {pedido.direccionCliente && (
                                                <p className="text-xs text-gray-400">→ {pedido.direccionCliente}</p>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-lg text-green-600">
                                                ${pedido.gananciaEstimada || 3000}
                                            </span>
                                            <span className="text-xs text-gray-400">Ganancia est.</span>
                                        </div>
                                    </div>

                                    {/* Time estimates */}
                                    <div className="flex gap-2 flex-wrap mt-2 mb-3">
                                        {pedido.tiempoAlComercio > 0 && (
                                            <div className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                                                <Timer className="w-3 h-3" />
                                                {pedido.tiempoAlComercio} min al comercio
                                            </div>
                                        )}
                                        {pedido.tiempoAlCliente > 0 && (
                                            <div className="flex items-center gap-1 text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                                                <MapPin className="w-3 h-3" />
                                                {pedido.tiempoAlCliente} min al cliente
                                            </div>
                                        )}
                                        {pedido.distanciaTotal && (
                                            <div className="flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                                {pedido.distanciaTotal} total
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between mt-3 gap-2">
                                        <div className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                            <Clock className="w-3 h-3" />
                                            Hace {Math.floor((Date.now() - new Date(pedido.createdAt).getTime()) / 60000)} min
                                        </div>

                                        {/* Open in Maps button */}
                                        {pedido.merchantLat && pedido.merchantLng && (
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${pedido.merchantLat},${pedido.merchantLng}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                                Maps
                                            </a>
                                        )}

                                        <button
                                            onClick={async () => {
                                                if (!confirm("¿Aceptar este pedido?")) return;
                                                try {
                                                    const res = await fetch(`/api/orders/${pedido.id}/accept`, { method: "POST" });
                                                    if (res.ok) {
                                                        alert("¡Pedido asignado! Ve al comercio.");
                                                        // Refresh logic handled by polling
                                                    } else {
                                                        const err = await res.json();
                                                        alert(err.error || "Error");
                                                    }
                                                } catch (e) { alert("Error de conexión"); }
                                            }}
                                            className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-green-700 active:scale-95 transition flex items-center justify-center gap-2"
                                        >
                                            <Bike className="w-4 h-4" />
                                            Aceptar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Pedidos Activos */}
            <div className="px-4 mb-6">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">Pedidos Activos</h2>
                        <Link
                            href="/repartidor/pedidos"
                            className="text-sm text-green-600 hover:underline flex items-center gap-1"
                        >
                            Ver todos <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {!isOnline ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                            <Power className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium">Estás fuera de línea</p>
                            <p className="text-sm text-gray-400 mb-4">Conéctate para recibir pedidos</p>
                            <button
                                onClick={toggleOnline}
                                disabled={isToggling}
                                className="bg-green-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50"
                            >
                                {isToggling ? "Conectando..." : "Conectarme"}
                            </button>
                        </div>
                    ) : pedidosActivos && pedidosActivos.length > 0 ? (
                        <div className="space-y-3">
                            {pedidosActivos.map((pedido) => (
                                <div
                                    key={pedido.id}
                                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold text-gray-900">{pedido.comercio}</p>
                                            <p className="text-sm text-gray-500">{pedido.orderId || pedido.id}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${pedido.estado === "driver_assigned" ? "bg-blue-100 text-blue-700" :
                                            pedido.estado === "picked_up" ? "bg-orange-100 text-orange-700" :
                                                "bg-gray-100 text-gray-700"
                                            }`}>
                                            {
                                                pedido.estado === "driver_assigned" ? "Recolectar" :
                                                    pedido.estado === "picked_up" ? "En Camino" :
                                                        pedido.estado
                                            }
                                        </span>
                                    </div>
                                    <div className="flex flex-col gap-1 mt-2 mb-3">
                                        <span className="text-xs text-gray-500 font-medium">{pedido.labelDireccion || "Dirección"}:</span>
                                        <div className="flex items-center gap-2 text-sm text-gray-800">
                                            <Navigation className="w-4 h-4 text-green-600" />
                                            <span className="font-medium">{pedido.direccion}</span>
                                        </div>
                                    </div>

                                    {/* Mini-map showing route - Navigation Mode when active */}
                                    {(pedido.merchantLat || pedido.navLat) && (
                                        <div className="mb-3">
                                            <RiderMiniMap
                                                driverLat={lat ?? undefined}
                                                driverLng={lng ?? undefined}
                                                driverHeading={driverHeading ?? 0}
                                                merchantLat={pedido.merchantLat}
                                                merchantLng={pedido.merchantLng}
                                                merchantName={pedido.comercio}
                                                customerLat={pedido.customerLat}
                                                customerLng={pedido.customerLng}
                                                customerAddress={pedido.direccionCliente || "Cliente"}
                                                customerName={pedido.nombreCliente || pedido.clienteNombre || "Cliente"}
                                                height="250px"
                                                navigationMode={true}
                                            />
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 mt-3">
                                        <button
                                            onClick={async () => {
                                                const newStatus =
                                                    (pedido.estado === "driver_assigned" || pedido.estado === "driver_arrived") ? "PICKED_UP" :
                                                        (pedido.estado === "picked_up" || pedido.estado === "on_the_way" || pedido.estado === "in_delivery") ? "DELIVERED" :
                                                            null;

                                                if (!newStatus) return;

                                                const actionName = newStatus === "PICKED_UP" ? "iniciar el viaje" : "finalizar la entrega";
                                                if (!confirm(`¿Confirmas que vas a ${actionName}?`)) return;

                                                try {
                                                    const res = await fetch(`/api/orders/${pedido.id}`, {
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
                                            className="flex-1 bg-green-500 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                                        >
                                            {
                                                (pedido.estado === "driver_assigned" || pedido.estado === "driver_arrived") ? "Iniciar Viaje (Ya tengo el pedido)" :
                                                    (pedido.estado === "picked_up" || pedido.estado === "on_the_way" || pedido.estado === "in_delivery") ? "Finalizar Entrega" :
                                                        "Estado Desconocido"
                                            }
                                        </button>
                                        {pedido.navLat && pedido.navLng ? (
                                            <a
                                                href={`https://www.google.com/maps/dir/?api=1&destination=${pedido.navLat},${pedido.navLng}&travelmode=motorcycle`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center gap-1"
                                            >
                                                <Navigation className="w-4 h-4" />
                                                Maps
                                            </a>
                                        ) : (
                                            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                                                Ver
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
                            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">No hay pedidos activos</p>
                            <p className="text-sm text-gray-400">Los nuevos pedidos aparecerán aquí</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-4 mb-6">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Acciones Rápidas</h2>
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            href="/repartidor/historial"
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition-colors"
                        >
                            <Calendar className="w-6 h-6 text-green-500 mb-2" />
                            <p className="font-medium text-gray-900">Historial</p>
                            <p className="text-xs text-gray-500">Ver entregas pasadas</p>
                        </Link>
                        <Link
                            href="/repartidor/ganancias"
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition-colors"
                        >
                            <TrendingUp className="w-6 h-6 text-blue-500 mb-2" />
                            <p className="font-medium text-gray-900">Ganancias</p>
                            <p className="text-xs text-gray-500">Resumen de ingresos</p>
                        </Link>
                        <Link
                            href="/repartidor/soporte"
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition-colors"
                        >
                            <MessageCircle className="w-6 h-6 text-purple-500 mb-2" />
                            <p className="font-medium text-gray-900">Soporte</p>
                            <p className="text-xs text-gray-500">Ayuda y consultas</p>
                        </Link>
                        <Link
                            href="/repartidor/perfil"
                            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:border-green-200 transition-colors"
                        >
                            <Bike className="w-6 h-6 text-orange-500 mb-2" />
                            <p className="font-medium text-gray-900">Mi Perfil</p>
                            <p className="text-xs text-gray-500">Configuración</p>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer spacing */}
            <div className="h-8" />
        </div>
    );
}
