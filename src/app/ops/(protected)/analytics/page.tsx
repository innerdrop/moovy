"use client";

import { useState, useEffect } from "react";
import {
    BarChart3,
    TrendingUp,
    Package,
    Users,
    Store,
    Truck,
    DollarSign,
    Calendar,
    Loader2,
    ArrowUp,
    ArrowDown,
    ShoppingCart
} from "lucide-react";

interface Stats {
    orders: {
        total: number;
        today: number;
        pending: number;
        delivered: number;
        cancelled: number;
    };
    revenue: {
        total: number;
        today: number;
        thisWeek: number;
        thisMonth: number;
    };
    users: {
        total: number;
        clients: number;
        merchants: number;
        drivers: number;
    };
    topMerchants: Array<{ id: string; name: string; orders: number; revenue: number }>;
    topProducts: Array<{ id: string; name: string; sold: number }>;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"today" | "week" | "month">("week");

    useEffect(() => {
        fetchStats();
    }, [period]);

    async function fetchStats() {
        try {
            const res = await fetch(`/api/admin/analytics?period=${period}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    }

    const formatPrice = (n: number) => `$${n.toLocaleString("es-AR")}`;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    // Default values if no data
    const data = stats || {
        orders: { total: 0, today: 0, pending: 0, delivered: 0, cancelled: 0 },
        revenue: { total: 0, today: 0, thisWeek: 0, thisMonth: 0 },
        users: { total: 0, clients: 0, merchants: 0, drivers: 0 },
        topMerchants: [],
        topProducts: []
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-[#e60012]" />
                        Analytics
                    </h1>
                    <p className="text-gray-600">Estadísticas y métricas de la plataforma</p>
                </div>

                {/* Period Selector */}
                <div className="flex gap-2">
                    {[
                        { value: "today", label: "Hoy" },
                        { value: "week", label: "Semana" },
                        { value: "month", label: "Mes" }
                    ].map((p) => (
                        <button
                            key={p.value}
                            onClick={() => setPeriod(p.value as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === p.value
                                    ? "bg-[#e60012] text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <DollarSign className="w-8 h-8 opacity-80" />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Ingresos</span>
                    </div>
                    <p className="text-3xl font-bold">{formatPrice(data.revenue.thisWeek)}</p>
                    <p className="text-sm text-white/70">esta semana</p>
                </div>

                {/* Orders */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <ShoppingCart className="w-8 h-8 opacity-80" />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Pedidos</span>
                    </div>
                    <p className="text-3xl font-bold">{data.orders.total}</p>
                    <p className="text-sm text-white/70">{data.orders.today} hoy</p>
                </div>

                {/* Users */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Users className="w-8 h-8 opacity-80" />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Usuarios</span>
                    </div>
                    <p className="text-3xl font-bold">{data.users.total}</p>
                    <p className="text-sm text-white/70">{data.users.clients} clientes</p>
                </div>

                {/* Drivers */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                    <div className="flex items-center justify-between mb-3">
                        <Truck className="w-8 h-8 opacity-80" />
                        <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Repartidores</span>
                    </div>
                    <p className="text-3xl font-bold">{data.users.drivers}</p>
                    <p className="text-sm text-white/70">activos</p>
                </div>
            </div>

            {/* Orders by Status */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#e60012]" />
                    Estado de Pedidos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <p className="text-2xl font-bold text-yellow-700">{data.orders.pending}</p>
                        <p className="text-sm text-yellow-600">Pendientes</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-700">{data.orders.delivered}</p>
                        <p className="text-sm text-green-600">Entregados</p>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-700">{data.orders.cancelled}</p>
                        <p className="text-sm text-red-600">Cancelados</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-700">{data.orders.total}</p>
                        <p className="text-sm text-blue-600">Total</p>
                    </div>
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Top Merchants */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                        <Store className="w-5 h-5 text-[#e60012]" />
                        Top Comercios
                    </h3>
                    {data.topMerchants.length > 0 ? (
                        <div className="space-y-3">
                            {data.topMerchants.map((m, i) => (
                                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                                        }`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{m.name}</p>
                                        <p className="text-xs text-gray-500">{m.orders} pedidos</p>
                                    </div>
                                    <p className="font-bold text-green-600">{formatPrice(m.revenue)}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hay datos aún</p>
                    )}
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#e60012]" />
                        Productos Más Vendidos
                    </h3>
                    {data.topProducts.length > 0 ? (
                        <div className="space-y-3">
                            {data.topProducts.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-400' : 'bg-gray-300'
                                        }`}>
                                        {i + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">{p.name}</p>
                                    </div>
                                    <p className="font-bold text-[#e60012]">{p.sold} vendidos</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-8">No hay datos aún</p>
                    )}
                </div>
            </div>

            {/* Revenue Summary */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="font-bold text-navy mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#e60012]" />
                    Resumen de Ingresos
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Hoy</p>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(data.revenue.today)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Esta Semana</p>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(data.revenue.thisWeek)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Este Mes</p>
                        <p className="text-xl font-bold text-gray-900">{formatPrice(data.revenue.thisMonth)}</p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-xl font-bold text-green-600">{formatPrice(data.revenue.total)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
