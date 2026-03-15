"use client";

import { useState, useEffect } from "react";
import {
    ChevronLeft,
    Package,
    MapPin,
    Calendar,
    Loader2
} from "lucide-react";

interface DeliveryRecord {
    id: string;
    orderNumber: string;
    comercio: string;
    direccion: string;
    estado: string;
    total: number;
    createdAt: string;
}

interface HistoryViewProps {
    onBack: () => void;
}

export default function HistoryView({ onBack }: HistoryViewProps) {
    const [filter, setFilter] = useState<"all" | "DELIVERED" | "CANCELLED">("all");
    const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/driver/orders?status=historial`);
                if (res.ok) {
                    const data = await res.json();
                    setDeliveries(data);
                }
            } catch (e) {
                console.error("Error fetching history:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const filteredDeliveries = filter === "all"
        ? deliveries
        : deliveries.filter(d => d.estado === filter);

    const stats = {
        total: deliveries.length,
        completed: deliveries.filter(d => d.estado === "DELIVERED").length,
        cancelled: deliveries.filter(d => d.estado === "CANCELLED").length,
        totalEarnings: deliveries.reduce((sum, d) => sum + (d.total || 0), 0)
    };

    // Group by date
    const groupedDeliveries: Record<string, DeliveryRecord[]> = {};
    filteredDeliveries.forEach(d => {
        const dateKey = new Date(d.createdAt).toISOString().split("T")[0];
        if (!groupedDeliveries[dateKey]) groupedDeliveries[dateKey] = [];
        groupedDeliveries[dateKey].push(d);
    });

    return (
        <div className="absolute inset-0 z-50 bg-gray-50 dark:bg-[#0f1117] flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#e60012] to-[#b8000e] text-white px-4 py-6 shadow-md">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Historial de Entregas</h1>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/20 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold">{stats.total}</p>
                            <p className="text-xs text-white/80">Total</p>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold">{stats.completed}</p>
                            <p className="text-xs text-white/80">Completadas</p>
                        </div>
                        <div className="bg-white/20 rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold">${stats.totalEarnings.toLocaleString()}</p>
                            <p className="text-xs text-white/80">Ganado</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 max-w-4xl mx-auto w-full space-y-4">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { value: "all", label: "Todas" },
                        { value: "DELIVERED", label: "Completadas" },
                        { value: "CANCELLED", label: "Canceladas" },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value as any)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === f.value
                                ? "bg-[#e60012] text-white"
                                : "bg-white dark:bg-[#1a1d27] text-gray-700 dark:text-gray-300 shadow-sm dark:shadow-none"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
                    </div>
                ) : (
                    <>
                        {/* Grouped by Date */}
                        {Object.entries(groupedDeliveries)
                            .sort(([a], [b]) => b.localeCompare(a))
                            .map(([date, records]) => (
                            <div key={date}>
                                <div className="flex items-center gap-2 mb-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        {new Date(date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {records.map((delivery) => (
                                        <div key={delivery.id} className="bg-white dark:bg-[#1a1d27] rounded-xl p-4 shadow-sm">
                                            <div className="flex items-start justify-between mb-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-white">{delivery.comercio}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        #{delivery.orderNumber} • {new Date(delivery.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${delivery.estado === "DELIVERED"
                                                    ? "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400"
                                                    : "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400"
                                                    }`}>
                                                    {delivery.estado === "DELIVERED" ? "Completado" : "Cancelado"}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                {delivery.direccion}
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t dark:border-white/10">
                                                <span className="text-xs text-gray-400">Pedido total</span>
                                                <p className={`font-bold ${delivery.total > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                                    {delivery.total > 0 ? `$${delivery.total.toLocaleString()}` : "-"}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {filteredDeliveries.length === 0 && (
                            <div className="bg-white dark:bg-[#1a1d27] rounded-xl p-10 text-center space-y-3">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-[#22252f] rounded-full mx-auto flex items-center justify-center">
                                    <Package className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No hay entregas para mostrar</p>
                                    <p className="text-xs text-gray-400 mt-1">Tu historial aparecerá aquí</p>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
