"use client";

// My Orders Page - Mis Pedidos
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";
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
    ExternalLink
} from "lucide-react";
import dynamic from "next/dynamic";

const OrderTrackingMiniMap = dynamic(
    () => import("@/components/orders/OrderTrackingMiniMap"),
    { ssr: false, loading: () => <div className="h-[180px] bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-xs text-gray-400">Cargando mapa...</div> }
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
        user: { name: string };
    };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pendiente", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <Clock className="w-5 h-5" /> },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <CheckCircle className="w-5 h-5" /> },
    PREPARING: { label: "Preparando", color: "text-purple-600", bgColor: "bg-purple-100", icon: <Package className="w-5 h-5" /> },
    READY: { label: "Listo", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <Package className="w-5 h-5" /> },
    DRIVER_ASSIGNED: { label: "Repartidor en camino", color: "text-white", bgColor: "bg-blue-500", icon: <Truck className="w-5 h-5" /> },
    PICKED_UP: { label: "Pedido recogido", color: "text-white", bgColor: "bg-orange-500", icon: <Truck className="w-5 h-5" /> },
    ON_THE_WAY: { label: "En camino", color: "text-white", bgColor: "bg-[#e60012]", icon: <Truck className="w-5 h-5" /> },
    IN_DELIVERY: { label: "En camino", color: "text-white", bgColor: "bg-[#e60012]", icon: <Truck className="w-5 h-5" /> },
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-5 h-5" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-5 h-5" /> },
};

export default function MisPedidosPage() {
    const { status: authStatus } = useSession();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

    const isAuthenticated = authStatus === "authenticated";

    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(false);
            return;
        }

        // Initial load
        loadOrders();

        // Polling every 10 seconds to keep statuses updated
        const intervalId = setInterval(() => {
            loadOrders(true); // silent refresh
        }, 10000);

        return () => clearInterval(intervalId);
    }, [isAuthenticated]);

    async function loadOrders(silent = false) {
        try {
            const res = await fetch("/api/orders");
            if (res.ok) setOrders(await res.json());
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }

    const activeStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "DRIVER_ASSIGNED", "PICKED_UP", "ON_THE_WAY", "IN_DELIVERY"];
    const filteredOrders = orders.filter(order => {
        if (filter === "active") return activeStatuses.includes(order.status);
        if (filter === "completed") return !activeStatuses.includes(order.status);
        return true;
    });

    // Loading state
    if (authStatus === "loading" || loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#e60012]" /></div>;
    }

    // ========== EMPTY STATE FOR ANONYMOUS USERS ==========
    if (!isAuthenticated) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center p-6 text-center">
                {/* Illustration */}
                <div className="relative mb-6">
                    <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-gray-300" />
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#e60012] rounded-full flex items-center justify-center shadow-lg">
                        <Rocket className="w-6 h-6 text-white" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Tus pedidos aparecerán aquí
                </h1>

                <p className="text-gray-500 mb-8 max-w-xs">
                    Creá tu cuenta MOOVER y empezá a pedir con envío gratis en tu primer pedido.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col gap-3 w-full max-w-xs">
                    <Link
                        href="/registro"
                        className="btn-primary py-4 text-lg flex items-center justify-center gap-2"
                    >
                        <Rocket className="w-5 h-5" />
                        Crear mi cuenta
                    </Link>

                    <Link
                        href="/login"
                        className="text-[#e60012] font-medium py-3"
                    >
                        Ya tengo cuenta, iniciar sesión
                    </Link>
                </div>

                {/* Benefit badges */}
                <div className="mt-8 flex flex-wrap justify-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full">
                        <Gift className="w-3 h-3" />
                        100 puntos de regalo
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full">
                        <Truck className="w-3 h-3" />
                        Envío gratis primer pedido
                    </span>
                </div>
            </div>
        );
    }

    // ========== ORDERS VIEW FOR AUTHENTICATED USERS ==========
    return (
        <>
            {/* Filter Tabs */}
            <div className="sticky top-14 z-30 bg-white border-b px-4 py-2">
                <div className="flex gap-2">
                    {[{ key: "all", label: "Todos" }, { key: "active", label: "Activos" }, { key: "completed", label: "Completados" }].map((tab) => (
                        <button key={tab.key} onClick={() => setFilter(tab.key as typeof filter)}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${filter === tab.key ? "bg-[#e60012] text-white" : "bg-gray-100 text-gray-600"}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-xl">
                        <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-600 mb-2">
                            {filter === "active" ? "No tenés pedidos activos" : filter === "completed" ? "No tenés pedidos completados" : "No tenés pedidos aún"}
                        </h2>
                        <p className="text-gray-500 mb-6 text-sm">Cuando hagas tu primer pedido, aparecerá acá</p>
                        <Link href="/productos" className="btn-primary">Ver Productos</Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredOrders.map((order) => {
                            const status = statusConfig[order.status] || statusConfig.PENDING;
                            const createdAt = new Date(order.createdAt);
                            const isActive = activeStatuses.includes(order.status);

                            return (
                                <div key={order.id} className={`bg-white rounded-xl overflow-hidden ${isActive ? "ring-2 ring-[#e60012]/30" : ""}`}>
                                    <div className={`px-4 py-3 ${status.bgColor} flex items-center justify-between`}>
                                        <div className="flex items-center gap-2">
                                            <span className={status.color}>{status.icon}</span>
                                            <span className={`font-semibold text-sm ${status.color}`}>{status.label}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {createdAt.toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-gray-900 text-lg">#{order.orderNumber}</p>
                                                <p className="text-sm text-gray-500">{order.items.length} {order.items.length === 1 ? "producto" : "productos"}</p>
                                            </div>
                                            <p className="text-xl font-bold text-[#e60012]">{formatPrice(order.total)}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5 mb-3">
                                            {order.items.slice(0, 2).map((item) => (
                                                <span key={item.id} className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-600">{item.quantity}x {item.name}</span>
                                            ))}
                                            {order.items.length > 2 && <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-500">+{order.items.length - 2} más</span>}
                                        </div>
                                        {order.address && (
                                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                                <MapPin className="w-3 h-3" />
                                                {order.address.street} {order.address.number}
                                            </div>
                                        )}
                                        {isActive && (
                                            <div className="mt-4 pt-3 border-t border-gray-100">
                                                {["DRIVER_ASSIGNED", "PICKED_UP", "IN_DELIVERY", "ON_THE_WAY"].includes(order.status) && (
                                                    <div className="mb-4">
                                                        <OrderTrackingMiniMap
                                                            orderId={order.id}
                                                            orderStatus={order.status}
                                                            merchantLat={order.merchant?.latitude}
                                                            merchantLng={order.merchant?.longitude}
                                                            merchantName={order.merchant?.name}
                                                            customerLat={order.address.latitude}
                                                            customerLng={order.address.longitude}
                                                            customerAddress={`${order.address.street} ${order.address.number}`}
                                                            initialDriverLat={order.driver?.latitude}
                                                            initialDriverLng={order.driver?.longitude}
                                                            height="180px"
                                                        />
                                                        <Link
                                                            href={`/seguimiento/${order.id}`}
                                                            className="mt-2 w-full bg-gray-50 text-gray-500 py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-gray-100 transition uppercase tracking-widest"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                            Pantalla Completa
                                                        </Link>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1">
                                                    {["PENDING", "CONFIRMED", "PREPARING", "READY", "IN_DELIVERY", "DELIVERED"].map((step, idx) => {
                                                        const stepOrder = ["PENDING", "CONFIRMED", "PREPARING", "READY", "IN_DELIVERY", "DELIVERED"];
                                                        const currentIdx = stepOrder.indexOf(order.status);
                                                        const stepIdx = stepOrder.indexOf(step);
                                                        const isCompleted = stepIdx <= currentIdx;

                                                        // Color logic: Yellow -> Orange -> Green
                                                        // 0-1: Yellow, 2-3: Orange, 4-5: Green
                                                        let barColor = "bg-[#e60012]"; // Default red
                                                        if (stepIdx <= 1) barColor = "bg-yellow-400";
                                                        else if (stepIdx <= 3) barColor = "bg-orange-500";
                                                        else barColor = "bg-green-500";

                                                        return <div key={step} className={`flex-1 h-1.5 rounded-full transition-colors duration-500 ${isCompleted ? barColor : "bg-gray-200"}`} />;
                                                    })}
                                                </div>
                                                <div className="flex justify-between mt-2 text-[10px] text-gray-400">
                                                    <span>Pedido</span><span>Listo</span><span>Entregado</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
