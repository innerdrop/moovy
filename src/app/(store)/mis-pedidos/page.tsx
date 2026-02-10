"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import {
    Package,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    Loader2,
    ShoppingBag,
    MapPin,
    Rocket,
    Gift,
    ExternalLink,
    ChevronRight,
    ArrowLeft,
    Phone,
    Wifi,
    WifiOff
} from "lucide-react";
import dynamic from "next/dynamic";

const OrderTrackingMiniMap = dynamic(
    () => import("@/components/orders/OrderTrackingMiniMap"),
    { ssr: false, loading: () => <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center text-xs text-gray-400">Cargando mapa...</div> }
);

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
    address: {
        street: string;
        number: string;
        city: string;
        latitude?: number;
        longitude?: number;
    };
    merchant?: {
        name: string;
        latitude?: number;
        longitude?: number;
    };
    driver?: {
        id: string;
        latitude?: number;
        longitude?: number;
        user: { name: string, phone?: string };
    };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pendiente", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <Clock className="w-5 h-5" /> },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <CheckCircle className="w-5 h-5" /> },
    PREPARING: { label: "Preparando", color: "text-purple-600", bgColor: "bg-purple-100", icon: <Package className="w-5 h-5" /> },
    READY: { label: "Listo", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <Package className="w-5 h-5" /> },
    DRIVER_ASSIGNED: { label: "Repartidor asignado", color: "text-white", bgColor: "bg-blue-500", icon: <Truck className="w-5 h-5" /> },
    PICKED_UP: { label: "Pedido en camino", color: "text-white", bgColor: "bg-orange-500", icon: <Truck className="w-5 h-5" /> },
    IN_DELIVERY: { label: "En camino", color: "text-white", bgColor: "bg-[#e60012]", icon: <Truck className="w-5 h-5" /> },
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-5 h-5" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-5 h-5" /> },
};

export default function MisPedidosPage() {
    const { data: session, status: authStatus } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "completed">("active");

    const isAuthenticated = authStatus === "authenticated";
    const userId = session?.user?.id;

    const loadOrders = useCallback(async (silent = false) => {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) setOrders(await res.json());
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // Real-time order updates via WebSocket
    const { isConnected } = useRealtimeOrders({
        role: "customer",
        userId: userId || undefined,
        enabled: isAuthenticated && !!userId,
        onStatusChange: (orderId, status) => {
            // Update order status in real-time
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status } : o
            ));
        },
        onOrderCancelled: (orderId) => {
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status: "CANCELLED" } : o
            ));
        },
        onDriverAssigned: (orderId) => {
            // Reload to get driver details
            loadOrders(true);
        },
    });

    useEffect(() => {
        if (!isAuthenticated) {
            if (authStatus !== "loading") setLoading(false);
            return;
        }

        loadOrders();
        // Fallback polling every 30 seconds (reduced from 10s since we have real-time)
        const intervalId = setInterval(() => loadOrders(true), 30000);
        return () => clearInterval(intervalId);
    }, [isAuthenticated, authStatus, loadOrders]);

    // Unified list filtering logic
    const activeStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY"];

    const activeOrders = useMemo(() => orders.filter(o => activeStatuses.includes(o.status)), [orders]);
    const completedOrders = useMemo(() => orders.filter(o => !activeStatuses.includes(o.status)), [orders]);

    const filteredOrders = useMemo(() => {
        if (filter === "active") return activeOrders;
        if (filter === "completed") return completedOrders;
        return orders;
    }, [filter, orders, activeOrders, completedOrders]);

    if (authStatus === "loading" || loading) {
        return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="w-10 h-10 animate-spin text-[#e60012]" /></div>;
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-white">
                <div className="relative mb-6">
                    <div className="w-32 h-32 bg-gray-50 rounded-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-200" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#e60012] rounded-full flex items-center justify-center shadow-lg">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Tus pedidos aparecerán aquí</h1>
                <p className="text-gray-500 mb-8 max-w-xs">Creá tu cuenta MOOVER y empezá a pedir con beneficios exclusivos.</p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Link href="/registro" className="w-full py-4 bg-[#e60012] text-white rounded-xl font-bold shadow-lg shadow-red-500/20">Crear mi cuenta</Link>
                    <Link href="/login" className="text-[#e60012] font-semibold py-3 font-bold">Iniciar sesión</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* CONTENT SECTION */}
            <div className={`flex-1 flex flex-col bg-white overflow-hidden`}>
                {/* Header / Tabs */}
                <div className="flex-shrink-0 border-b bg-white/80 backdrop-blur-md sticky top-0 z-30">
                    <div className="p-4 flex items-center justify-between">
                        <h1 className="text-xl font-black italic tracking-tighter text-gray-900 uppercase">Mis Pedidos</h1>
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-1 rounded-full">{orders.length} TOTAL</span>
                    </div>
                    <div className="px-4 pb-3 flex gap-2">
                        {[{ key: "active", label: "Activos", count: activeOrders.length }, { key: "completed", label: "Historial", count: completedOrders.length }].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key as any)}
                                className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${filter === tab.key
                                    ? "bg-gray-900 text-white shadow-lg"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }`}
                            >
                                {tab.label} {tab.count > 0 && `(${tab.count})`}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders List */}
                <div className="flex-1 overflow-y-auto p-4 pb-20 space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center">
                            <ShoppingBag className="w-16 h-16 text-gray-100 mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No hay pedidos {filter === "active" ? "activos" : "en el historial"}</p>
                            <Link href="/productos" className="mt-4 px-6 py-3 bg-[#e60012] text-white font-bold rounded-xl text-sm">Hacer un pedido</Link>
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const status = statusConfig[order.status] || statusConfig.PENDING;
                            const isActive = activeStatuses.includes(order.status);

                            return (
                                <div
                                    key={order.id}
                                    className={`group bg-white border-2 rounded-2xl transition-all duration-300 ${isActive
                                        ? "border-gray-900"
                                        : "border-gray-100 hover:border-gray-200"
                                        }`}
                                >
                                    <div className={`px-4 py-2 flex items-center justify-between border-b ${isActive ? "bg-gray-50" : ""}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-[#e60012] animate-pulse" : "bg-gray-300"}`} />
                                            <span className="text-xs font-black uppercase tracking-widest text-gray-900">{status.label}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                                            {new Date(order.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "long" })}
                                        </span>
                                    </div>

                                    <div className="p-4">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1 min-w-0">
                                                {order.merchant && (
                                                    <h3 className="font-black text-lg italic tracking-tighter text-gray-900 uppercase leading-none mb-1 truncate">
                                                        {order.merchant.name}
                                                    </h3>
                                                )}
                                                <div className="flex items-center gap-2 mb-3">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[2px]">
                                                        Pedido #{order.orderNumber}
                                                    </span>
                                                    {(order as any).isPickup && (
                                                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-black uppercase tracking-wider h-fit">
                                                            Retiro en Local
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {order.items.slice(0, 3).map((item) => (
                                                        <span key={item.id} className="text-sm font-black text-gray-900 bg-yellow-400/20 border border-yellow-400/30 px-3 py-1 rounded-xl">
                                                            {item.quantity}x {item.name}
                                                        </span>
                                                    ))}
                                                    {order.items.length > 3 && (
                                                        <span className="text-xs font-bold text-gray-400 px-2 py-1">
                                                            +{order.items.length - 3} más
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right ml-4">
                                                <p className="text-xl font-black text-[#e60012] leading-none mb-1">{formatPrice(order.total)}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{order.items.length} {order.items.length === 1 ? "Producto" : "Productos"}</p>
                                            </div>
                                        </div>

                                        {/* Status progress for active orders */}
                                        {isActive && (
                                            <div className="mt-4 pt-4 border-t border-gray-50">
                                                <div className="flex items-center gap-1.5 h-1.5">
                                                    {["PENDING", "CONFIRMED", "PREPARING", "READY", "IN_DELIVERY", "DELIVERED"].map((step, idx) => {
                                                        const stepOrder = ["PENDING", "CONFIRMED", "PREPARING", "READY", "IN_DELIVERY", "DELIVERED"];
                                                        const currentIdx = stepOrder.indexOf(order.status);
                                                        const stepIdx = stepOrder.indexOf(step);
                                                        const isDone = stepIdx <= currentIdx;
                                                        return <div key={step} className={`flex-1 h-full rounded-full transition-all duration-700 ${isDone ? "bg-gray-900" : "bg-gray-100"}`} />;
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 flex gap-2">
                                            <Link
                                                href={isActive ? `/seguimiento/${order.id}` : `/mis-pedidos/${order.id}`}
                                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isActive
                                                    ? "bg-gray-900 text-white shadow-md active:scale-95"
                                                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                                    }`}
                                            >
                                                {isActive ? "Seguir Pedido" : "Ver Detalle"}
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>

                                            {order.driver?.user.phone && isActive && (
                                                <a
                                                    href={`tel:${order.driver.user.phone}`}
                                                    className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-md hover:bg-green-600 transition-all active:scale-90"
                                                >
                                                    <Phone className="w-5 h-5 shadow-sm" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
