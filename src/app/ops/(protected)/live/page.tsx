"use client";

// Ops Live Orders Dashboard - Real-time order monitoring
import { useState, useEffect, useCallback, useRef } from "react";
import { formatPrice } from "@/lib/delivery";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import {
    Package,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    RefreshCw,
    Loader2,
    User,
    MapPin,
    Phone,
    Bell,
    Activity,
    Wifi,
    WifiOff
} from "lucide-react";

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    deliveryStatus: string | null;
    total: number;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number }>;
    address: { street: string; number: string; city: string } | null;
    user: { name: string | null; email: string | null; phone: string | null } | null;
    driver: { user: { name: string } } | null;
    merchant: { name: string } | null;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Nuevo", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <Bell className="w-4 h-4" /> },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <CheckCircle className="w-4 h-4" /> },
    PREPARING: { label: "Preparando", color: "text-purple-600", bgColor: "bg-purple-100", icon: <Package className="w-4 h-4" /> },
    READY: { label: "Listo", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <Package className="w-4 h-4" /> },
    IN_DELIVERY: { label: "En camino", color: "text-orange-600", bgColor: "bg-orange-100", icon: <Truck className="w-4 h-4" /> },
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-4 h-4" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-4 h-4" /> },
};

export default function OpsLiveDashboardPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [stats, setStats] = useState({ pending: 0, inProgress: 0, ready: 0, inDelivery: 0 });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const loadOrders = useCallback(async (silent = false) => {
        try {
            const res = await fetch("/api/ops/orders/live");
            if (res.ok) {
                const data = await res.json();
                setOrders(data.orders || []);
                setStats(data.stats || { pending: 0, inProgress: 0, ready: 0, inDelivery: 0 });
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // Real-time order updates via WebSocket
    const { isConnected } = useRealtimeOrders({
        role: "admin",
        enabled: true,
        onNewOrder: (order) => {
            // Play notification sound for new orders
            if (audioRef.current) {
                audioRef.current.play().catch(() => { });
            }
            loadOrders(true);
        },
        onStatusChange: (orderId, status) => {
            // Update order status in list
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status } : o
            ));
            // Reload for stats update
            loadOrders(true);
        },
        onOrderCancelled: (orderId) => {
            setOrders(prev => prev.filter(o => o.id !== orderId));
            loadOrders(true);
        },
    });

    useEffect(() => {
        loadOrders();
        // Fallback polling every 15 seconds (reduced from 5s since we have real-time)
        const intervalId = setInterval(() => loadOrders(true), 15000);
        return () => clearInterval(intervalId);
    }, [loadOrders]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    // Group orders by status for Kanban-like view
    const pendingOrders = orders.filter(o => o.status === "PENDING");
    const preparingOrders = orders.filter(o => ["CONFIRMED", "PREPARING"].includes(o.status));
    const readyOrders = orders.filter(o => o.status === "READY");
    const inDeliveryOrders = orders.filter(o => o.status === "IN_DELIVERY");

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-[#e60012]" />
                        Operaciones en Vivo
                    </h1>
                    <p className="text-gray-500 text-sm">
                        Actualizado: {lastUpdate ? lastUpdate.toLocaleTimeString("es-AR") : "-"}
                    </p>
                </div>
                <button
                    onClick={() => loadOrders()}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                    title="Actualizar"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Live Stats Bar */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200 relative overflow-hidden">
                    {stats.pending > 0 && <div className="absolute top-0 right-0 w-3 h-3 bg-yellow-500 rounded-full animate-ping m-2" />}
                    <p className="text-sm font-medium text-yellow-700">Nuevos</p>
                    <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <p className="text-sm font-medium text-purple-700">Preparando</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.inProgress}</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <p className="text-sm font-medium text-indigo-700">Listos</p>
                    <p className="text-3xl font-bold text-indigo-900">{stats.ready}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <p className="text-sm font-medium text-orange-700">En Camino</p>
                    <p className="text-3xl font-bold text-orange-900">{stats.inDelivery}</p>
                </div>
            </div>

            {/* Live Order Columns (Kanban Style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 min-h-[400px]">
                {/* Pending Column */}
                <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                    <h3 className="font-bold text-yellow-800 mb-3 flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Nuevos ({pendingOrders.length})
                    </h3>
                    <div className="space-y-3">
                        {pendingOrders.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                        {pendingOrders.length === 0 && (
                            <p className="text-yellow-600 text-sm text-center py-4">Sin pedidos nuevos</p>
                        )}
                    </div>
                </div>

                {/* Preparing Column */}
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h3 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Preparando ({preparingOrders.length})
                    </h3>
                    <div className="space-y-3">
                        {preparingOrders.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                        {preparingOrders.length === 0 && (
                            <p className="text-purple-600 text-sm text-center py-4">Sin pedidos</p>
                        )}
                    </div>
                </div>

                {/* Ready Column */}
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                    <h3 className="font-bold text-indigo-800 mb-3 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        Listos ({readyOrders.length})
                    </h3>
                    <div className="space-y-3">
                        {readyOrders.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                        {readyOrders.length === 0 && (
                            <p className="text-indigo-600 text-sm text-center py-4">Sin pedidos listos</p>
                        )}
                    </div>
                </div>

                {/* In Delivery Column */}
                <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                    <h3 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        En Camino ({inDeliveryOrders.length})
                    </h3>
                    <div className="space-y-3">
                        {inDeliveryOrders.map(order => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                        {inDeliveryOrders.length === 0 && (
                            <p className="text-orange-600 text-sm text-center py-4">Sin entregas activas</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrderCard({ order }: { order: Order }) {
    const status = statusConfig[order.status] || statusConfig.PENDING;
    const createdAt = new Date(order.createdAt);
    const minutesAgo = Math.floor((Date.now() - createdAt.getTime()) / 60000);

    return (
        <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
                <span className="font-mono font-bold text-sm text-gray-900">{order.orderNumber}</span>
                <span className="text-xs text-gray-500">
                    {minutesAgo < 60 ? `${minutesAgo}m` : `${Math.floor(minutesAgo / 60)}h`}
                </span>
            </div>

            {/* Customer */}
            <p className="text-sm font-medium text-gray-900 truncate">{order.user?.name || "Cliente"}</p>

            {/* Address */}
            {order.address && (
                <p className="text-xs text-gray-500 truncate">
                    📍 {order.address.street} {order.address.number}
                </p>
            )}

            {/* Driver (if assigned) */}
            {order.driver && (
                <p className="text-xs text-green-600 mt-1">
                    🚚 {order.driver.user.name}
                </p>
            )}

            {/* Total */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">{order.items.length} items</span>
                <span className="font-bold text-[#e60012]">{formatPrice(order.total)}</span>
            </div>
        </div>
    );
}
