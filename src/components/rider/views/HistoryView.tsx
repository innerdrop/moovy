"use client";

import { useState } from "react";
import {
    ChevronLeft,
    Package,
    MapPin,
    Calendar,
    Star
} from "lucide-react";

interface DeliveryRecord {
    id: string;
    orderNumber: string;
    merchantName: string;
    customerAddress: string;
    earnings: number;
    status: "completed" | "cancelled";
    rating: number | null;
    date: string;
    time: string;
}

interface HistoryViewProps {
    onBack: () => void;
}

export default function HistoryView({ onBack }: HistoryViewProps) {
    const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");

    // Mock data - replace with API
    const deliveries: DeliveryRecord[] = [
        { id: "1", orderNumber: "ORD-1234", merchantName: "Pizzería Don Juan", customerAddress: "Av. Colón 1234", earnings: 650, status: "completed", rating: 5, date: "2026-01-22", time: "14:35" },
        { id: "2", orderNumber: "ORD-1233", merchantName: "Sushi House", customerAddress: "Bv. San Juan 567", earnings: 720, status: "completed", rating: 4, date: "2026-01-22", time: "13:20" },
        { id: "3", orderNumber: "ORD-1232", merchantName: "Burger King", customerAddress: "Av. Rivadavia 890", earnings: 580, status: "completed", rating: null, date: "2026-01-22", time: "12:05" },
        { id: "4", orderNumber: "ORD-1231", merchantName: "Café Central", customerAddress: "Calle 9 de Julio 456", earnings: 0, status: "cancelled", rating: null, date: "2026-01-21", time: "19:45" },
        { id: "5", orderNumber: "ORD-1230", merchantName: "Heladería Italiana", customerAddress: "Av. Maipú 123", earnings: 550, status: "completed", rating: 5, date: "2026-01-21", time: "18:30" },
        { id: "6", orderNumber: "ORD-1229", merchantName: "Panadería Sol", customerAddress: "Calle Belgrano 789", earnings: 480, status: "completed", rating: 5, date: "2026-01-21", time: "16:15" },
    ];

    const filteredDeliveries = filter === "all"
        ? deliveries
        : deliveries.filter(d => d.status === filter);

    const stats = {
        total: deliveries.length,
        completed: deliveries.filter(d => d.status === "completed").length,
        cancelled: deliveries.filter(d => d.status === "cancelled").length,
        totalEarnings: deliveries.reduce((sum, d) => sum + d.earnings, 0)
    };

    const groupedDeliveries: Record<string, DeliveryRecord[]> = {};
    filteredDeliveries.forEach(d => {
        if (!groupedDeliveries[d.date]) groupedDeliveries[d.date] = [];
        groupedDeliveries[d.date].push(d);
    });

    return (
        <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-6 shadow-md">
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

            <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full space-y-4">
                {/* Filters */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { value: "all", label: "Todas" },
                        { value: "completed", label: "Completadas" },
                        { value: "cancelled", label: "Canceladas" },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value as any)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === f.value
                                ? "bg-green-500 text-white"
                                : "bg-white text-gray-700 shadow-sm"
                                }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Grouped by Date */}
                {Object.entries(groupedDeliveries).map(([date, records]) => (
                    <div key={date}>
                        <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <p className="text-sm font-medium text-gray-600">
                                {new Date(date).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
                            </p>
                        </div>
                        <div className="space-y-2">
                            {records.map((delivery) => (
                                <div key={delivery.id} className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <p className="font-semibold text-gray-900">{delivery.merchantName}</p>
                                            <p className="text-xs text-gray-500">#{delivery.orderNumber} • {delivery.time}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${delivery.status === "completed"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-red-100 text-red-700"
                                            }`}>
                                            {delivery.status === "completed" ? "Completado" : "Cancelado"}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                                        <MapPin className="w-4 h-4 text-gray-400" />
                                        {delivery.customerAddress}
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t">
                                        <div className="flex items-center gap-1">
                                            {delivery.rating ? (
                                                <>
                                                    {[...Array(5)].map((_, i) => (
                                                        <Star
                                                            key={i}
                                                            className={`w-4 h-4 ${i < delivery.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                                        />
                                                    ))}
                                                </>
                                            ) : (
                                                <span className="text-xs text-gray-400">Sin calificación</span>
                                            )}
                                        </div>
                                        <p className={`font-bold ${delivery.earnings > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                                            {delivery.earnings > 0 ? `+$${delivery.earnings}` : "-"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {filteredDeliveries.length === 0 && (
                    <div className="bg-white rounded-xl p-8 text-center">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No hay entregas para mostrar</p>
                    </div>
                )}
            </div>
        </div>
    );
}
