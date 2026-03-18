"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, CreditCard, Banknote, Loader2, ArrowUp, ArrowDown, Home, Store, Users, Download } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/delivery";

interface RevenueData {
    allTime: {
        totalSales: number;
        moovyCommission: number;
        merchantPayouts: number;
        deliveryFees: number;
        orderCount: number;
        sellerCommissions: number;
        sellerPayouts: number;
    };
    thisMonth: { totalSales: number; moovyCommission: number; merchantPayouts: number; orderCount: number };
    lastMonth: { totalSales: number; moovyCommission: number; merchantPayouts: number; orderCount: number };
    byPaymentMethod: {
        mercadopago: { count: number; total: number };
        cash: { count: number; total: number };
    };
}

export default function RevenuePage() {
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const fetchRevenue = () => {
        setLoading(true);
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        fetch(`/api/ops/revenue?${params}`)
            .then((r) => r.json())
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRevenue();
    }, [dateFrom, dateTo]);

    const exportCSV = () => {
        if (!data) return;
        const rows = [
            ["Métrica", "Valor"],
            ["Ventas Totales", data.allTime.totalSales],
            ["Revenue MOOVY", data.allTime.moovyCommission + data.allTime.sellerCommissions],
            ["Payouts Comercios", data.allTime.merchantPayouts],
            ["Payouts Vendedores", data.allTime.sellerPayouts],
            ["Delivery Fees", data.allTime.deliveryFees],
            ["Pedidos", data.allTime.orderCount],
            ["MercadoPago Total", data.byPaymentMethod.mercadopago.total],
            ["Efectivo Total", data.byPaymentMethod.cash.total],
        ];
        const csv = rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `revenue-moovy-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    if (!data) {
        return <p className="text-center py-20 text-gray-400">Error al cargar datos de revenue</p>;
    }

    const growthPct = data.lastMonth.totalSales > 0
        ? ((data.thisMonth.totalSales - data.lastMonth.totalSales) / data.lastMonth.totalSales * 100)
        : 0;

    const totalMoovyRevenue = data.allTime.moovyCommission + data.allTime.sellerCommissions;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Revenue Dashboard</h1>
                    <p className="text-gray-500">Visión general de ingresos y comisiones</p>
                </div>
                <div className="flex items-center gap-3">
                    <Link href="/ops" className="btn-secondary flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Inicio
                    </Link>
                    <button onClick={exportCSV} disabled={!data} className="btn-secondary flex items-center gap-2 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed">
                        <Download className="w-4 h-4" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* Date Filters */}
            <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                {(dateFrom || dateTo) && (
                    <button onClick={() => { setDateFrom(""); setDateTo(""); }} className="mt-6 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline">
                        Limpiar filtros
                    </button>
                )}
            </div>

            {/* Main KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Ventas Totales"
                    value={formatPrice(data.allTime.totalSales)}
                    sub={`${data.allTime.orderCount} pedidos`}
                    icon={<DollarSign className="w-5 h-5" />}
                    color="bg-blue-500"
                />
                <KpiCard
                    label="Revenue MOOVY"
                    value={formatPrice(totalMoovyRevenue)}
                    sub="Comisiones merchant + seller"
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="bg-green-500"
                />
                <KpiCard
                    label="Payouts Comercios"
                    value={formatPrice(data.allTime.merchantPayouts)}
                    sub="Total pagado a merchants"
                    icon={<Store className="w-5 h-5" />}
                    color="bg-red-500"
                />
                <KpiCard
                    label="Payouts Vendedores"
                    value={formatPrice(data.allTime.sellerPayouts)}
                    sub="Total pagado a sellers"
                    icon={<Users className="w-5 h-5" />}
                    color="bg-orange-500"
                />
            </div>

            {/* Month comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Este Mes</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ventas</span>
                            <span className="font-bold">{formatPrice(data.thisMonth.totalSales)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Comisiones MOOVY</span>
                            <span className="font-bold text-green-600">{formatPrice(data.thisMonth.moovyCommission)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payouts</span>
                            <span className="font-bold">{formatPrice(data.thisMonth.merchantPayouts)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Pedidos</span>
                            <span className="font-bold">{data.thisMonth.orderCount}</span>
                        </div>
                        {growthPct !== 0 && (
                            <div className={`flex items-center gap-1 text-sm font-medium ${growthPct > 0 ? "text-green-600" : "text-red-600"}`}>
                                {growthPct > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                {Math.abs(growthPct).toFixed(1)}% vs mes anterior
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 p-6">
                    <h2 className="font-semibold text-gray-900 mb-4">Mes Anterior</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">Ventas</span>
                            <span className="font-bold">{formatPrice(data.lastMonth.totalSales)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Comisiones MOOVY</span>
                            <span className="font-bold text-green-600">{formatPrice(data.lastMonth.moovyCommission)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Payouts</span>
                            <span className="font-bold">{formatPrice(data.lastMonth.merchantPayouts)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Pedidos</span>
                            <span className="font-bold">{data.lastMonth.orderCount}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Por Método de Pago</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">MercadoPago</p>
                            <p className="font-bold text-gray-900">{formatPrice(data.byPaymentMethod.mercadopago.total)}</p>
                            <p className="text-xs text-gray-400">{data.byPaymentMethod.mercadopago.count} pedidos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white">
                            <Banknote className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Efectivo</p>
                            <p className="font-bold text-gray-900">{formatPrice(data.byPaymentMethod.cash.total)}</p>
                            <p className="text-xs text-gray-400">{data.byPaymentMethod.cash.count} pedidos</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Revenue breakdown */}
            <div className="bg-white rounded-xl border border-gray-100 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Desglose Histórico</h2>
                <div className="space-y-3">
                    <Row label="Ventas totales (bruto)" value={data.allTime.totalSales} />
                    <Row label="(-) Payouts a comercios" value={-data.allTime.merchantPayouts} negative />
                    <Row label="(-) Payouts a vendedores" value={-data.allTime.sellerPayouts} negative />
                    <div className="border-t pt-3">
                        <Row label="= Revenue neto MOOVY" value={totalMoovyRevenue} highlight />
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                        Comisiones merchant: {formatPrice(data.allTime.moovyCommission)} | Comisiones seller: {formatPrice(data.allTime.sellerCommissions)} | Delivery fees: {formatPrice(data.allTime.deliveryFees)}
                    </div>
                </div>
            </div>
        </div>
    );
}

function KpiCard({ label, value, sub, icon, color }: { label: string; value: string; sub: string; icon: React.ReactNode; color: string }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center text-white`}>
                    {icon}
                </div>
                <span className="text-sm text-gray-500">{label}</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-400 mt-1">{sub}</p>
        </div>
    );
}

function Row({ label, value, negative, highlight }: { label: string; value: number; negative?: boolean; highlight?: boolean }) {
    return (
        <div className="flex justify-between items-center">
            <span className={highlight ? "font-bold text-gray-900" : "text-gray-500 text-sm"}>{label}</span>
            <span className={`font-bold ${highlight ? "text-green-600 text-lg" : negative ? "text-red-500" : "text-gray-900"}`}>
                {formatPrice(Math.abs(value))}
            </span>
        </div>
    );
}
