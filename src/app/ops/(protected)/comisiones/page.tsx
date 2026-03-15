// OPS Comisiones Page - Commission management
"use client";

import { useEffect, useState } from "react";
import {
    DollarSign,
    TrendingUp,
    AlertCircle,
    CheckCircle,
    Search,
    Store,
    Download,
    Loader2,
    Check,
} from "lucide-react";

interface CommissionData {
    id: string;
    name: string;
    image: string | null;
    commissionRate: number;
    totalSales: number;
    totalCommission: number;
    totalPayout: number;
    pendingCommission: number;
    pendingPayout: number;
    pendingOrderCount: number;
}

export default function ComisionesPage() {
    const [data, setData] = useState<CommissionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [markingPaid, setMarkingPaid] = useState<string | null>(null);
    const [justPaid, setJustPaid] = useState<string | null>(null);

    useEffect(() => {
        fetchCommissions();
    }, []);

    const fetchCommissions = async () => {
        try {
            const res = await fetch("/api/admin/comisiones");
            if (res.ok) {
                const json = await res.json();
                setData(json);
            }
        } catch (error) {
            console.error("Error fetching commissions:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsPaid = async (merchantId: string) => {
        setMarkingPaid(merchantId);
        try {
            const res = await fetch("/api/admin/comisiones", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ merchantId }),
            });
            if (res.ok) {
                setJustPaid(merchantId);
                setTimeout(() => setJustPaid(null), 2000);
                fetchCommissions();
            }
        } catch (error) {
            console.error("Error marking as paid:", error);
        } finally {
            setMarkingPaid(null);
        }
    };

    const exportCSV = () => {
        const headers = [
            "Comercio",
            "Tasa (%)",
            "Ventas Totales",
            "Comisión Moovy",
            "Ganancia Comercio",
            "Pendiente Comisión",
            "Pendiente Payout",
            "Pedidos Pendientes",
        ];
        const rows = filteredData.map((item) => [
            item.name,
            item.commissionRate,
            item.totalSales,
            item.totalCommission,
            item.totalPayout,
            item.pendingCommission,
            item.pendingPayout,
            item.pendingOrderCount,
        ]);

        const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `comisiones-moovy-${new Date().toISOString().split("T")[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const filteredData = data.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPending = data.reduce((acc, curr) => acc + curr.pendingCommission, 0);
    const totalEarnings = data.reduce((acc, curr) => acc + curr.totalCommission, 0);
    const totalPendingPayout = data.reduce((acc, curr) => acc + curr.pendingPayout, 0);
    const merchantsWithPending = data.filter((d) => d.pendingCommission > 0).length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestión de Comisiones</h1>
                    <p className="text-slate-500 text-sm">Comisiones generadas, saldos pendientes y pagos</p>
                </div>
                <button
                    onClick={exportCSV}
                    disabled={filteredData.length === 0}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    Exportar CSV
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-green-100 text-green-600 rounded-lg">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Ganancia Total</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                ${totalEarnings.toLocaleString("es-AR")}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Por Cobrar</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                ${totalPending.toLocaleString("es-AR")}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-100 text-red-500 rounded-lg">
                            <Store className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Por Pagar</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                ${totalPendingPayout.toLocaleString("es-AR")}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tasa Promedio</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {data.length > 0
                                    ? (data.reduce((acc, curr) => acc + curr.commissionRate, 0) / data.length).toFixed(1)
                                    : 0}%
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Alert if pending */}
            {merchantsWithPending > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <p className="text-sm text-amber-700">
                        <span className="font-bold">{merchantsWithPending} comercios</span> tienen comisiones pendientes de cobro.
                        Marcá como pagado cuando realices la transferencia.
                    </p>
                </div>
            )}

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
                {/* Filters */}
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar comercio..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                <th className="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comercio</th>
                                <th className="text-center px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasa</th>
                                <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ventas</th>
                                <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Comisión</th>
                                <th className="text-right px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payout</th>
                                <th className="text-right px-5 py-3.5 text-[10px] font-black text-amber-500 uppercase tracking-widest">Pendiente</th>
                                <th className="text-center px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse border-b border-slate-50">
                                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-32" /></td>
                                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-8 mx-auto" /></td>
                                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto" /></td>
                                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto" /></td>
                                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto" /></td>
                                        <td className="py-4 px-5"><div className="h-4 bg-slate-200 rounded w-20 ml-auto" /></td>
                                        <td className="py-4 px-5"><div className="h-6 bg-slate-200 rounded w-16 mx-auto" /></td>
                                    </tr>
                                ))
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Store className="w-5 h-5 text-slate-400" />
                                                    )}
                                                </div>
                                                <span className="font-bold text-gray-900 text-sm">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            <span className="text-sm font-medium text-slate-600">{item.commissionRate}%</span>
                                        </td>
                                        <td className="py-4 px-5 text-right font-bold text-gray-900 text-sm">
                                            ${item.totalSales.toLocaleString("es-AR")}
                                        </td>
                                        <td className="py-4 px-5 text-right text-green-600 font-bold text-sm">
                                            ${item.totalCommission.toLocaleString("es-AR")}
                                        </td>
                                        <td className="py-4 px-5 text-right text-slate-600 text-sm">
                                            ${item.totalPayout.toLocaleString("es-AR")}
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                            {item.pendingCommission > 0 ? (
                                                <div>
                                                    <span className="font-bold text-amber-600 text-sm">${item.pendingCommission.toLocaleString("es-AR")}</span>
                                                    <p className="text-[10px] text-slate-400">{item.pendingOrderCount} pedidos</p>
                                                </div>
                                            ) : (
                                                <span className="text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-5 text-center">
                                            {item.pendingCommission > 0 ? (
                                                <button
                                                    onClick={() => markAsPaid(item.id)}
                                                    disabled={markingPaid === item.id}
                                                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                        justPaid === item.id
                                                            ? "bg-green-500 text-white border-green-500"
                                                            : "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                                                    }`}
                                                >
                                                    {markingPaid === item.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : justPaid === item.id ? (
                                                        <Check className="w-4 h-4" />
                                                    ) : (
                                                        "Marcar Pagado"
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-green-50 text-green-600">
                                                    <CheckCircle className="w-3 h-3" /> Al día
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-slate-500">
                                        No se encontraron datos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="p-4 animate-pulse space-y-3">
                                <div className="h-5 bg-slate-200 rounded w-40" />
                                <div className="h-4 bg-slate-200 rounded w-24" />
                            </div>
                        ))
                    ) : filteredData.length > 0 ? (
                        filteredData.map((item) => (
                            <div key={item.id} className="p-4 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="w-5 h-5 text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">{item.name}</h3>
                                        <p className="text-xs text-slate-500">Tasa: {item.commissionRate}%</p>
                                    </div>
                                    {item.pendingCommission > 0 ? (
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-amber-600">${item.pendingCommission.toLocaleString("es-AR")}</p>
                                            <p className="text-[10px] text-slate-400">{item.pendingOrderCount} pedidos</p>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] font-bold text-green-600 uppercase">Al día</span>
                                    )}
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div className="bg-slate-50 rounded-lg p-2">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Ventas</p>
                                        <p className="text-xs font-bold text-gray-900">${item.totalSales.toLocaleString("es-AR")}</p>
                                    </div>
                                    <div className="bg-green-50 rounded-lg p-2">
                                        <p className="text-[9px] text-green-400 font-bold uppercase">Comisión</p>
                                        <p className="text-xs font-bold text-green-600">${item.totalCommission.toLocaleString("es-AR")}</p>
                                    </div>
                                    <div className="bg-slate-50 rounded-lg p-2">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Payout</p>
                                        <p className="text-xs font-bold text-gray-900">${item.totalPayout.toLocaleString("es-AR")}</p>
                                    </div>
                                </div>
                                {item.pendingCommission > 0 && (
                                    <button
                                        onClick={() => markAsPaid(item.id)}
                                        disabled={markingPaid === item.id}
                                        className={`w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                            justPaid === item.id
                                                ? "bg-green-500 text-white border-green-500"
                                                : "bg-green-50 text-green-600 border-green-100"
                                        }`}
                                    >
                                        {markingPaid === item.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                                        ) : justPaid === item.id ? (
                                            "Marcado"
                                        ) : (
                                            "Marcar como Pagado"
                                        )}
                                    </button>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center text-slate-500">No se encontraron datos</div>
                    )}
                </div>
            </div>
        </div>
    );
}
