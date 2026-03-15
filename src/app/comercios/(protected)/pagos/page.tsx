"use client";

import { useState, useEffect } from "react";
import {
    DollarSign,
    TrendingUp,
    Receipt,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    Percent,
    ShoppingBag,
} from "lucide-react";

interface OrderRow {
    id: string;
    orderNumber: string;
    total: number;
    merchantPayout: number | null;
    moovyCommission: number | null;
    paymentMethod: string | null;
    paymentStatus: string;
    createdAt: string;
}

interface Summary {
    commissionRate: number;
    thisMonth: { totalSales: number; payout: number; commission: number; orderCount: number };
    lastMonth: { totalSales: number; payout: number; commission: number; orderCount: number };
    allTime: { totalSales: number; payout: number; commission: number; orderCount: number };
}

function formatCurrency(n: number) {
    return `$${n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function MerchantPagosPage() {
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [recentOrders, setRecentOrders] = useState<OrderRow[]>([]);
    const [period, setPeriod] = useState<"thisMonth" | "lastMonth" | "allTime">("thisMonth");

    useEffect(() => {
        fetch("/api/merchant/earnings")
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data) {
                    setSummary(data.summary);
                    setRecentOrders(data.recentOrders || []);
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!summary) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">No se pudo cargar la informacion de pagos</p>
            </div>
        );
    }

    const current = summary[period];
    const periodLabels = {
        thisMonth: "Este mes",
        lastMonth: "Mes anterior",
        allTime: "Historico",
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                    Pagos y Comisiones
                </h1>
                <p className="text-gray-500">Resumen de tus ganancias y comisiones de MOOVY</p>
            </div>

            {/* Commission Rate Banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-3">
                <Percent className="w-5 h-5 text-blue-600" />
                <p className="text-sm text-blue-800">
                    Tu comision actual es del <span className="font-bold">{summary.commissionRate}%</span> sobre cada venta entregada.
                </p>
            </div>

            {/* Period Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
                {(["thisMonth", "lastMonth", "allTime"] as const).map((p) => (
                    <button
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                            period === p
                                ? "bg-white shadow-sm text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {periodLabels[p]}
                    </button>
                ))}
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    icon={<ShoppingBag className="w-5 h-5 text-blue-600" />}
                    label="Pedidos"
                    value={current.orderCount.toString()}
                    bg="bg-blue-50"
                />
                <KpiCard
                    icon={<Receipt className="w-5 h-5 text-gray-600" />}
                    label="Ventas totales"
                    value={formatCurrency(current.totalSales)}
                    bg="bg-gray-50"
                />
                <KpiCard
                    icon={<TrendingUp className="w-5 h-5 text-green-600" />}
                    label="Tu ganancia"
                    value={formatCurrency(current.payout)}
                    bg="bg-green-50"
                    valueClass="text-green-700"
                />
                <KpiCard
                    icon={<ArrowDownRight className="w-5 h-5 text-orange-600" />}
                    label={`Comision MOOVY (${summary.commissionRate}%)`}
                    value={formatCurrency(current.commission)}
                    bg="bg-orange-50"
                    valueClass="text-orange-700"
                />
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900">Ultimas transacciones</h2>
                </div>
                {recentOrders.length === 0 ? (
                    <div className="p-8 text-center text-gray-400">
                        No hay transacciones registradas
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentOrders.map((order) => (
                            <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        #{order.orderNumber}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(order.createdAt).toLocaleDateString("es-AR", {
                                            day: "numeric",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                        {" · "}
                                        {order.paymentMethod === "CASH" ? "Efectivo" : "MercadoPago"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-green-600 flex items-center gap-1 justify-end">
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                        {formatCurrency(order.merchantPayout || 0)}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        de {formatCurrency(order.total)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function KpiCard({
    icon,
    label,
    value,
    bg,
    valueClass = "text-gray-900",
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    bg: string;
    valueClass?: string;
}) {
    return (
        <div className={`rounded-xl p-4 ${bg}`}>
            <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs font-medium text-gray-500">{label}</span>
            </div>
            <p className={`text-xl font-bold ${valueClass}`}>{value}</p>
        </div>
    );
}
