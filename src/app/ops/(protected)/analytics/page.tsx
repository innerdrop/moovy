"use client";

import { useState, useEffect, useCallback } from "react";
import {
    BarChart3,
    TrendingUp,
    Package,
    Users,
    Store,
    Truck,
    DollarSign,
    Loader2,
    ShoppingCart,
    RefreshCw,
    TrendingDown,
    Star,
    Clock,
} from "lucide-react";

interface AnalyticsData {
    period: string;
    business: {
        totalOrders: number;
        grossRevenue: number;
        moovyRevenue: number;
        averageTicket: number;
        cancellationRate: number;
        newUserRegistrations: number;
        paymentSplit: {
            cash: number;
            mercadopago: number;
        };
    };
    merchants: {
        activeCount: number;
        registeredCount: number;
        averageRating: number;
        inactiveCount: number;
        topByOrders: Array<{
            id: string;
            name: string;
            ordersCount: number;
            revenue: number;
            rating: number;
        }>;
    };
    drivers: {
        activeCount: number;
        registeredCount: number;
        averageRating: number;
        statusBreakdown: {
            online: number;
            offline: number;
            busy: number;
        };
        topByDeliveries: Array<{
            id: string;
            name: string;
            deliveriesCount: number;
            rating: number;
        }>;
    };
    buyers: {
        activeBuyersCount: number;
        repeatRate: number;
        newUserCount: number;
    };
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<"today" | "week" | "month">("today");
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/admin/analytics?period=${period}`);
            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setLastRefresh(new Date());
            }
        } catch (error) {
            console.error("Error fetching analytics:", error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        fetchStats();
        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const formatPrice = (n: number) => `$${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
    const formatPercent = (n: number) => `${n.toFixed(1)}%`;
    const formatRating = (n: number) => `${n.toFixed(2)}★`;

    if (loading && !stats) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="text-center py-10 text-gray-500">
                <p>No se pudieron cargar los datos de analytics</p>
            </div>
        );
    }

    const data = stats;
    const periodLabel =
        period === "today" ? "Hoy" : period === "week" ? "Esta Semana" : "Este Mes";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-7 h-7 text-[#e60012]" />
                        Analytics Dashboard
                    </h1>
                    <p className="text-gray-600">
                        Métricas de negocio, comercios, repartidores y compradores
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {/* Period Selector */}
                    <div className="flex gap-2">
                        {[
                            { value: "today", label: "Hoy" },
                            { value: "week", label: "Semana" },
                            { value: "month", label: "Mes" },
                        ].map((p) => (
                            <button
                                key={p.value}
                                onClick={() => setPeriod(p.value as "today" | "week" | "month")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                    period === p.value
                                        ? "bg-[#e60012] text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition disabled:opacity-50"
                        title="Actualizar datos"
                    >
                        <RefreshCw
                            className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                        />
                    </button>

                    {lastRefresh && (
                        <span className="text-xs text-gray-500">
                            Actualizado hace{" "}
                            {Math.round((Date.now() - lastRefresh.getTime()) / 1000)}s
                        </span>
                    )}
                </div>
            </div>

            {/* === BUSINESS METRICS === */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#e60012]" />
                    Métricas de Negocio ({periodLabel})
                </h2>

                {/* KPI Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Gross Revenue */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-sm opacity-80">Ingresos Brutos</p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatPrice(data.business.grossRevenue)}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-xs text-white/70">
                            {data.business.totalOrders} pedidos
                        </p>
                    </div>

                    {/* Moovy Revenue */}
                    <div className="bg-gradient-to-br from-[#e60012] to-red-700 rounded-xl p-5 text-white">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-sm opacity-80">Ingresos MOOVY</p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatPrice(data.business.moovyRevenue)}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-xs text-white/70">
                            ~8% comisión promedio
                        </p>
                    </div>

                    {/* Average Ticket */}
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-sm opacity-80">Ticket Promedio</p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatPrice(data.business.averageTicket)}
                                </p>
                            </div>
                            <ShoppingCart className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-xs text-white/70">
                            {data.business.totalOrders > 0
                                ? `${data.business.totalOrders} pedidos`
                                : "Sin pedidos"}
                        </p>
                    </div>

                    {/* Cancellation Rate */}
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-sm opacity-80">Cancelación</p>
                                <p className="text-3xl font-bold mt-1">
                                    {formatPercent(data.business.cancellationRate)}
                                </p>
                            </div>
                            <TrendingDown className="w-8 h-8 opacity-50" />
                        </div>
                        <p className="text-xs text-white/70">tasa de cancelación</p>
                    </div>
                </div>

                {/* Business Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Payment Split */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-4">
                            Métodos de Pago
                        </h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Efectivo</span>
                                <span className="font-bold text-gray-900">
                                    {data.business.paymentSplit.cash}{" "}
                                    <span className="text-sm text-gray-500">
                                        ({formatPercent(
                                            (data.business.paymentSplit.cash /
                                                data.business.totalOrders) *
                                                100
                                        )})
                                    </span>
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">MercadoPago</span>
                                <span className="font-bold text-gray-900">
                                    {data.business.paymentSplit.mercadopago}{" "}
                                    <span className="text-sm text-gray-500">
                                        ({formatPercent(
                                            (data.business.paymentSplit.mercadopago /
                                                data.business.totalOrders) *
                                                100
                                        )})
                                    </span>
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* New Users */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Users className="w-4 h-4 text-[#e60012]" />
                            Nuevos Usuarios
                        </h4>
                        <p className="text-4xl font-bold text-[#e60012] mb-2">
                            {data.business.newUserRegistrations}
                        </p>
                        <p className="text-sm text-gray-600">
                            registros en el período
                        </p>
                    </div>

                    {/* Orders Summary */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Package className="w-4 h-4 text-[#e60012]" />
                            Total de Pedidos
                        </h4>
                        <p className="text-4xl font-bold text-gray-900 mb-2">
                            {data.business.totalOrders}
                        </p>
                        <p className="text-sm text-gray-600">
                            en el período seleccionado
                        </p>
                    </div>
                </div>
            </section>

            {/* === MERCHANTS METRICS === */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Store className="w-5 h-5 text-[#e60012]" />
                    Comercios
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Activos (Aprobados)</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {data.merchants.activeCount}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Registrados</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {data.merchants.registeredCount}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Calificación Promedio</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatRating(data.merchants.averageRating)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Inactivos (7+ días)</p>
                        <p className="text-3xl font-bold text-orange-600">
                            {data.merchants.inactiveCount}
                        </p>
                    </div>
                </div>

                {/* Top Merchants */}
                {data.merchants.topByOrders.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-4">
                            Top Comercios por Pedidos
                        </h4>
                        <div className="space-y-3">
                            {data.merchants.topByOrders.map((merchant, idx) => (
                                <div
                                    key={merchant.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <span
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                            idx === 0
                                                ? "bg-yellow-500"
                                                : idx === 1
                                                  ? "bg-gray-400"
                                                  : idx === 2
                                                    ? "bg-orange-400"
                                                    : "bg-gray-300"
                                        }`}
                                    >
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {merchant.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {merchant.ordersCount} pedidos •{" "}
                                            {formatRating(merchant.rating)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">
                                            {formatPrice(merchant.revenue)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* === DRIVERS METRICS === */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-[#e60012]" />
                    Repartidores
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Activos (En línea)</p>
                        <p className="text-3xl font-bold text-green-600">
                            {data.drivers.activeCount}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Registrados</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {data.drivers.registeredCount}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Calificación Promedio</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatRating(data.drivers.averageRating)}
                        </p>
                    </div>
                    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1">Estado Actual</p>
                        <div className="flex gap-2 items-center text-xs mt-2">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                {data.drivers.statusBreakdown.online}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                {data.drivers.statusBreakdown.busy}
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                {data.drivers.statusBreakdown.offline}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Top Drivers */}
                {data.drivers.topByDeliveries.length > 0 && (
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-4">
                            Top Repartidores por Entregas
                        </h4>
                        <div className="space-y-3">
                            {data.drivers.topByDeliveries.map((driver, idx) => (
                                <div
                                    key={driver.id}
                                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <span
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                            idx === 0
                                                ? "bg-yellow-500"
                                                : idx === 1
                                                  ? "bg-gray-400"
                                                  : idx === 2
                                                    ? "bg-orange-400"
                                                    : "bg-gray-300"
                                        }`}
                                    >
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 truncate">
                                            {driver.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {driver.deliveriesCount} entregas •{" "}
                                            {formatRating(driver.rating)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </section>

            {/* === BUYERS METRICS === */}
            <section className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#e60012]" />
                    Compradores
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Activos (Últimos 30 días)
                        </p>
                        <p className="text-4xl font-bold text-gray-900 mt-2">
                            {data.buyers.activeBuyersCount}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Tasa de Repetición
                        </p>
                        <p className="text-4xl font-bold text-blue-600 mt-2">
                            {formatPercent(data.buyers.repeatRate)}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                            compradores que vuelven a comprar
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                            <Star className="w-4 h-4" />
                            Nuevos Compradores
                        </p>
                        <p className="text-4xl font-bold text-[#e60012] mt-2">
                            {data.buyers.newUserCount}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">en el período</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
