"use client";

import { useState, useEffect } from "react";
import {
    Package, DollarSign, Store, TrendingUp, Loader2,
    CheckCircle2, Clock, XCircle, Download
} from "lucide-react";

interface PurchaseItem {
    id: string;
    merchantId: string;
    merchantName: string;
    purchaseType: string;
    categoryName: string | null;
    itemCount: number;
    amount: number;
    paymentStatus: string;
    paymentMethod: string | null;
    importStatus: string;
    importedCount: number;
    promoCode: string | null;
    createdAt: string;
}

const statusBadge: Record<string, { label: string; color: string }> = {
    approved: { label: "Pagado", color: "bg-green-100 text-green-700" },
    pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700" },
    rejected: { label: "Rechazado", color: "bg-red-100 text-red-700" },
};

const typeLabels: Record<string, string> = {
    package: "Completo",
    starter: "Starter",
    custom: "Custom",
    individual: "Individual",
};

export default function PackageSalesPage() {
    const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, revenue: 0, merchants: 0, imported: 0 });

    useEffect(() => {
        fetch("/api/admin/package-sales")
            .then(res => res.json())
            .then(data => {
                if (data.purchases) setPurchases(data.purchases);
                if (data.stats) setStats(data.stats);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Ventas de Paquetes</h1>
                    <p className="text-sm text-gray-500">Historial de compras B2B de catalogos por comercios</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg"><Package className="w-5 h-5 text-blue-600" /></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                    <p className="text-xs text-gray-500">Compras totales</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-green-100 rounded-lg"><DollarSign className="w-5 h-5 text-green-600" /></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">${stats.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Revenue total</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 rounded-lg"><Store className="w-5 h-5 text-purple-600" /></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.merchants}</p>
                    <p className="text-xs text-gray-500">Comercios compraron</p>
                </div>
                <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 rounded-lg"><TrendingUp className="w-5 h-5 text-orange-600" /></div>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stats.imported}</p>
                    <p className="text-xs text-gray-500">Productos importados</p>
                </div>
            </div>

            {/* Purchases Table */}
            {purchases.length === 0 ? (
                <div className="bg-white rounded-xl p-12 text-center border border-gray-100">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Aun no hay compras de paquetes</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs">Comercio</th>
                                    <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs">Paquete</th>
                                    <th className="text-left py-3 px-4 font-bold text-gray-600 text-xs">Tipo</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-600 text-xs">Items</th>
                                    <th className="text-right py-3 px-4 font-bold text-gray-600 text-xs">Monto</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-600 text-xs">Estado</th>
                                    <th className="text-center py-3 px-4 font-bold text-gray-600 text-xs">Import</th>
                                    <th className="text-right py-3 px-4 font-bold text-gray-600 text-xs">Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(p => {
                                    const st = statusBadge[p.paymentStatus] || statusBadge.pending;
                                    return (
                                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                            <td className="py-3 px-4 font-medium text-gray-900">{p.merchantName}</td>
                                            <td className="py-3 px-4 text-gray-600">{p.categoryName || "Custom"}</td>
                                            <td className="py-3 px-4">
                                                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                    {typeLabels[p.purchaseType] || p.purchaseType}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-center text-gray-600">{p.itemCount}</td>
                                            <td className="py-3 px-4 text-right font-bold text-gray-900">
                                                {p.amount === 0 ? <span className="text-blue-600">Gratis</span> : `$${p.amount.toLocaleString()}`}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {p.importStatus === "imported" ? (
                                                    <span className="text-green-600 text-xs font-medium">{p.importedCount} OK</span>
                                                ) : p.importStatus === "failed" ? (
                                                    <span className="text-red-500 text-xs font-medium">Error</span>
                                                ) : (
                                                    <span className="text-yellow-600 text-xs font-medium">Pendiente</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right text-xs text-gray-400">
                                                {new Date(p.createdAt).toLocaleDateString("es-AR")}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
