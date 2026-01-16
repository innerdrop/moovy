"use client";

// Merchant Orders Page - Panel de Pedidos del Comercio
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";
import {
    ShoppingBag,
    Clock,
    CheckCircle,
    Package,
    Truck,
    XCircle,
    Loader2,
    RefreshCw,
    Bell
} from "lucide-react";

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    paymentStatus: string;
    total: number;
    createdAt: string;
    items: Array<{ id: string; name: string; quantity: number; price: number }>;
    address: { street: string; number: string; city: string } | null;
    user: { name: string | null; phone: string | null } | null;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Nuevo", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <Bell className="w-5 h-5" /> },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <CheckCircle className="w-5 h-5" /> },
    PREPARING: { label: "Preparando", color: "text-purple-600", bgColor: "bg-purple-100", icon: <Package className="w-5 h-5" /> },
    READY: { label: "Listo", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <Package className="w-5 h-5" /> },
    IN_DELIVERY: { label: "En camino", color: "text-orange-600", bgColor: "bg-orange-100", icon: <Truck className="w-5 h-5" /> },
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-5 h-5" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-5 h-5" /> },
};

export default function ComercioPedidosPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [filter, setFilter] = useState<"active" | "completed" | "all">("active");

    const loadOrders = useCallback(async (silent = false) => {
        try {
            // Fetch orders for the current merchant
            const res = await fetch("/api/merchant/orders");
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadOrders();
        // Poll every 10 seconds for new orders
        const intervalId = setInterval(() => loadOrders(true), 10000);
        return () => clearInterval(intervalId);
    }, [loadOrders]);

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdating(orderId);
        try {
            const res = await fetch(`/api/orders/${orderId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                // Reload orders to reflect change
                loadOrders(true);
            } else {
                alert("Error al actualizar el estado");
            }
        } catch (error) {
            console.error("Error updating order:", error);
            alert("Error de conexión");
        } finally {
            setUpdating(null);
        }
    };

    const activeStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY"];
    const filteredOrders = orders.filter(order => {
        if (filter === "active") return activeStatuses.includes(order.status);
        if (filter === "completed") return !activeStatuses.includes(order.status);
        return true;
    });

    // Count pending orders for badge
    const pendingCount = orders.filter(o => o.status === "PENDING").length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
                    <p className="text-gray-500">Gestiona los pedidos de tu comercio</p>
                </div>
                <button
                    onClick={() => loadOrders()}
                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition text-gray-600"
                    title="Actualizar"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Pending Orders Alert */}
            {pendingCount > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3 animate-pulse">
                    <Bell className="w-6 h-6 text-yellow-600" />
                    <p className="text-yellow-800 font-medium">
                        ¡Tenés <span className="font-bold">{pendingCount}</span> pedido{pendingCount > 1 ? "s" : ""} nuevo{pendingCount > 1 ? "s" : ""}!
                    </p>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {[
                    { key: "active", label: "Activos", count: orders.filter(o => activeStatuses.includes(o.status)).length },
                    { key: "completed", label: "Completados", count: orders.filter(o => !activeStatuses.includes(o.status)).length },
                    { key: "all", label: "Todos", count: orders.length },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key as typeof filter)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${filter === tab.key
                                ? "bg-white shadow-sm text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {filteredOrders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-600 mb-2">
                        {filter === "active" ? "No hay pedidos activos" : "No hay pedidos"}
                    </h2>
                    <p className="text-gray-400 text-sm">Los nuevos pedidos aparecerán aquí automáticamente</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredOrders.map((order) => {
                        const status = statusConfig[order.status] || statusConfig.PENDING;
                        const isUpdating = updating === order.id;
                        const isPending = order.status === "PENDING";

                        return (
                            <div
                                key={order.id}
                                className={`bg-white rounded-xl border overflow-hidden ${isPending ? "ring-2 ring-yellow-400 shadow-md" : "border-gray-100"
                                    }`}
                            >
                                {/* Order Header */}
                                <div className={`px-4 py-3 ${status.bgColor} flex items-center justify-between`}>
                                    <div className="flex items-center gap-2">
                                        <span className={status.color}>{status.icon}</span>
                                        <span className={`font-semibold text-sm ${status.color}`}>{status.label}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {order.orderNumber}
                                    </span>
                                </div>

                                {/* Order Body */}
                                <div className="p-4">
                                    {/* Customer & Time */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-bold text-gray-900">{order.user?.name || "Cliente"}</p>
                                            {order.user?.phone && (
                                                <a href={`tel:${order.user.phone}`} className="text-sm text-blue-600 hover:underline">
                                                    {order.user.phone}
                                                </a>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-blue-600">{formatPrice(order.total)}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(order.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Items Summary */}
                                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                                        <p className="text-xs font-medium text-gray-500 mb-1">Productos:</p>
                                        <ul className="text-sm text-gray-700 space-y-1">
                                            {order.items.map((item) => (
                                                <li key={item.id} className="flex justify-between">
                                                    <span>{item.quantity}x {item.name}</span>
                                                    <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Address */}
                                    {order.address && (
                                        <p className="text-xs text-gray-400 mb-4">
                                            📍 {order.address.street} {order.address.number}, {order.address.city}
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {order.status === "PENDING" && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Aceptar
                                            </button>
                                        )}

                                        {order.status === "CONFIRMED" && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "PREPARING")}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
                                                Empezar
                                            </button>
                                        )}

                                        {order.status === "PREPARING" && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, "READY")}
                                                disabled={isUpdating}
                                                className="flex-1 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                                            >
                                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                                Listo para Retirar
                                            </button>
                                        )}

                                        {/* Cancel Button for active orders */}
                                        {activeStatuses.includes(order.status) && (
                                            <button
                                                onClick={() => {
                                                    if (confirm("¿Estás seguro de cancelar este pedido?")) {
                                                        updateOrderStatus(order.id, "CANCELLED");
                                                    }
                                                }}
                                                disabled={isUpdating}
                                                className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition"
                                                title="Cancelar Pedido"
                                            >
                                                <XCircle className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
