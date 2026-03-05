"use client";

import { useState, useEffect } from "react";
import {
    ShoppingCart,
    Loader2,
    Package,
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    AlertCircle,
} from "lucide-react";

interface SubOrder {
    id: string;
    status: string;
    total: number;
    sellerPayout: number | null;
    createdAt: string;
    items: { id: string; name: string; quantity: number; price: number }[];
    order: {
        orderNumber: string;
        createdAt: string;
        user: { name: string | null } | null;
    };
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pendiente", color: "text-yellow-600", bgColor: "bg-yellow-100", icon: <Clock className="w-4 h-4" /> },
    CONFIRMED: { label: "Confirmado", color: "text-blue-600", bgColor: "bg-blue-100", icon: <Package className="w-4 h-4" /> },
    PREPARING: { label: "Preparando", color: "text-purple-600", bgColor: "bg-purple-100", icon: <Package className="w-4 h-4" /> },
    READY: { label: "Listo", color: "text-indigo-600", bgColor: "bg-indigo-100", icon: <Package className="w-4 h-4" /> },
    IN_DELIVERY: { label: "En camino", color: "text-orange-600", bgColor: "bg-orange-100", icon: <Truck className="w-4 h-4" /> },
    DELIVERED: { label: "Entregado", color: "text-green-600", bgColor: "bg-green-100", icon: <CheckCircle className="w-4 h-4" /> },
    CANCELLED: { label: "Cancelado", color: "text-red-600", bgColor: "bg-red-100", icon: <XCircle className="w-4 h-4" /> },
};

const FILTER_TABS = [
    { key: "", label: "Todos" },
    { key: "PENDING", label: "Pendientes" },
    { key: "DELIVERED", label: "Entregados" },
    { key: "CANCELLED", label: "Cancelados" },
];

export default function VendedorPedidosPage() {
    const [orders, setOrders] = useState<SubOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("");

    useEffect(() => {
        loadOrders();
    }, [filter]);

    async function loadOrders() {
        setLoading(true);
        try {
            const url = filter
                ? `/api/seller/orders?status=${filter}`
                : "/api/seller/orders";
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (error) {
            console.error("Error loading orders:", error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6 text-emerald-600" />
                    Mis Ventas
                </h1>
                <p className="text-gray-500">Pedidos de tus listings</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1">
                {FILTER_TABS.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition ${filter === tab.key
                                ? "bg-emerald-600 text-white"
                                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <AlertCircle className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium text-lg">No hay ventas registradas</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order) => {
                        const config = statusConfig[order.status] || {
                            label: order.status,
                            color: "text-gray-600",
                            bgColor: "bg-gray-100",
                            icon: <Package className="w-4 h-4" />,
                        };

                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p className="font-bold text-gray-900">
                                            #{order.order.orderNumber}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {order.order.user?.name || "Cliente"} •{" "}
                                            {new Date(order.order.createdAt).toLocaleDateString("es-AR")}
                                        </p>
                                    </div>
                                    <span
                                        className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${config.bgColor} ${config.color}`}
                                    >
                                        {config.icon}
                                        {config.label}
                                    </span>
                                </div>

                                {/* Items */}
                                <div className="space-y-1 mb-3">
                                    {order.items.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-gray-600">
                                                {item.quantity}x {item.name}
                                            </span>
                                            <span className="text-gray-900 font-medium">
                                                ${(item.price * item.quantity).toLocaleString("es-AR")}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Totals */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                    <div className="text-sm">
                                        <span className="text-gray-500">Total: </span>
                                        <span className="font-bold text-gray-900">
                                            ${order.total.toLocaleString("es-AR")}
                                        </span>
                                    </div>
                                    {order.sellerPayout !== null && (
                                        <div className="text-sm">
                                            <span className="text-gray-500">Tu ganancia: </span>
                                            <span className="font-bold text-emerald-600">
                                                ${order.sellerPayout.toLocaleString("es-AR")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
