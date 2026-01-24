
"use client";

import { useEffect, useState } from "react";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, Search, Store } from "lucide-react";

interface CommissionData {
    id: string;
    name: string;
    image: string | null;
    commissionRate: number;
    totalSales: number;
    totalCommission: number;
    totalPayout: number;
    pendingCommission: number;
}

export default function ComisionesPage() {
    const [data, setData] = useState<CommissionData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

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

    const filteredData = data.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPending = data.reduce((acc, curr) => acc + curr.pendingCommission, 0);
    const totalEarnings = data.reduce((acc, curr) => acc + curr.totalCommission, 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-navy">Gestión de Comisiones</h1>
                    <p className="text-gray-600">Visualiza las comisiones generadas y saldos pendientes.</p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-lg">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Ganancia Total (Histórico)</p>
                            <h3 className="text-2xl font-bold text-navy">
                                ${totalEarnings.toLocaleString("es-AR")}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Comisiones Pendientes</p>
                            <h3 className="text-2xl font-bold text-navy">
                                ${totalPending.toLocaleString("es-AR")}
                            </h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Tasa Promedio</p>
                            <h3 className="text-2xl font-bold text-navy">
                                {data.length > 0
                                    ? (data.reduce((acc, curr) => acc + curr.commissionRate, 0) / data.length).toFixed(1)
                                    : 0}%
                            </h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                {/* Filters */}
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
                    <div className="relative w-full sm:w-96">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar comercio..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-moovy/20 focus:border-moovy transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm border-b border-gray-100">
                                <th className="py-4 px-6 font-semibold">Comercio</th>
                                <th className="py-4 px-6 font-semibold text-center">Tasa</th>
                                <th className="py-4 px-6 font-semibold text-right">Ventas Totales</th>
                                <th className="py-4 px-6 font-semibold text-right">Comisión Moovy</th>
                                <th className="py-4 px-6 font-semibold text-right">Ganancia Comercio</th>
                                <th className="py-4 px-6 font-semibold text-right text-amber-600">Pendiente</th>
                                <th className="py-4 px-6 font-semibold text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-32"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-8 mx-auto"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        <td className="py-4 px-6"><div className="h-4 bg-gray-200 rounded w-20 ml-auto"></div></td>
                                        <td className="py-4 px-6"><div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div></td>
                                    </tr>
                                ))
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                                                    {item.image ? (
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Store className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <span className="font-medium text-navy">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center text-gray-600">
                                            {item.commissionRate}%
                                        </td>
                                        <td className="py-4 px-6 text-right font-medium text-gray-900">
                                            ${item.totalSales.toLocaleString("es-AR")}
                                        </td>
                                        <td className="py-4 px-6 text-right text-green-600 font-medium">
                                            ${item.totalCommission.toLocaleString("es-AR")}
                                        </td>
                                        <td className="py-4 px-6 text-right text-gray-600">
                                            ${item.totalPayout.toLocaleString("es-AR")}
                                        </td>
                                        <td className="py-4 px-6 text-right text-amber-600 font-bold">
                                            ${item.pendingCommission > 0 ? item.pendingCommission.toLocaleString("es-AR") : '-'}
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {item.pendingCommission > 0 ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    Pendiente
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    Al día
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-gray-500">
                                        No se encontraron datos
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
