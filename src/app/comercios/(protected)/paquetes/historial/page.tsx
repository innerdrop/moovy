"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Clock, CheckCircle2, XCircle, Package, Loader2,
    ChevronLeft, ShoppingBag, ArrowRight, AlertCircle
} from "lucide-react";

interface Purchase {
    id: string;
    purchaseType: string;
    categoryId: string | null;
    itemCount: number;
    amount: number;
    paymentStatus: string;
    paymentMethod: string | null;
    importStatus: string;
    importedCount: number;
    importedAt: string | null;
    promoCode: string | null;
    createdAt: string;
    category: { id: string; name: string; image: string | null } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    approved: { label: "Pagado", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
    pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
    rejected: { label: "Rechazado", color: "bg-red-100 text-red-700", icon: XCircle },
    refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-700", icon: AlertCircle },
};

const typeLabels: Record<string, string> = {
    package: "Paquete Completo",
    starter: "Paquete Starter",
    custom: "Pack Personalizado",
    individual: "Productos Individuales",
};

export default function PurchaseHistoryPage() {
    const [purchases, setPurchases] = useState<Purchase[]>([]);
    const [stats, setStats] = useState({ totalPurchases: 0, totalSpent: 0, totalImported: 0, pendingPayments: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/merchant/packages/history")
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
        <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <Link href="/comercios/adquirir-paquetes" className="text-sm text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 mb-2">
                        <ChevronLeft className="w-4 h-4" /> Volver al catalogo
                    </Link>
                    <h1 className="text-2xl font-black text-slate-900">Historial de Compras</h1>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-2xl font-black text-slate-900">{stats.totalPurchases}</p>
                    <p className="text-xs text-slate-500">Compras</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-2xl font-black text-slate-900">${stats.totalSpent.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Invertido</p>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-100">
                    <p className="text-2xl font-black text-slate-900">{stats.totalImported}</p>
                    <p className="text-xs text-slate-500">Productos importados</p>
                </div>
                {stats.pendingPayments > 0 && (
                    <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                        <p className="text-2xl font-black text-yellow-700">{stats.pendingPayments}</p>
                        <p className="text-xs text-yellow-600">Pagos pendientes</p>
                    </div>
                )}
            </div>

            {/* Purchase list */}
            {purchases.length === 0 ? (
                <div className="text-center py-16">
                    <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <h2 className="text-lg font-bold text-slate-400 mb-2">Sin compras todavia</h2>
                    <p className="text-sm text-slate-400 mb-6">Explora el catalogo de paquetes para potenciar tu tienda</p>
                    <Link href="/comercios/adquirir-paquetes" className="px-6 py-3 bg-[#e60012] text-white rounded-xl font-bold text-sm inline-flex items-center gap-2">
                        Explorar paquetes <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {purchases.map(purchase => {
                        const st = statusConfig[purchase.paymentStatus] || statusConfig.pending;
                        const StatusIcon = st.icon;

                        return (
                            <div key={purchase.id} className="bg-white rounded-xl border border-slate-100 p-5 flex items-center gap-4">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                                    <Package className="w-6 h-6 text-slate-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-900 text-sm truncate">
                                            {purchase.category?.name || typeLabels[purchase.purchaseType] || "Compra"}
                                        </h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${st.color} flex items-center gap-1`}>
                                            <StatusIcon className="w-3 h-3" />
                                            {st.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        {typeLabels[purchase.purchaseType]} · {purchase.itemCount} items · {new Date(purchase.createdAt).toLocaleDateString("es-AR")}
                                    </p>
                                    {purchase.importStatus === "imported" && (
                                        <p className="text-[10px] text-green-600 font-medium mt-0.5">
                                            {purchase.importedCount} productos importados
                                        </p>
                                    )}
                                    {purchase.promoCode && (
                                        <p className="text-[10px] text-blue-600 font-medium mt-0.5">
                                            Codigo: {purchase.promoCode}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-black text-slate-900">
                                        {purchase.amount === 0 ? "Gratis" : `$${purchase.amount.toLocaleString()}`}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                        {purchase.paymentMethod === "free" ? "Promo" : "MercadoPago"}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
