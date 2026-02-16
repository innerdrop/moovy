"use client";

import { useState } from "react";
import {
    TrendingUp,
    Calendar,
    ChevronLeft,
    ArrowUp,
    ArrowDown
} from "lucide-react";

interface EarningDay {
    date: string;
    deliveries: number;
    earnings: number;
}

interface EarningsViewProps {
    onBack: () => void;
}

export default function EarningsView({ onBack }: EarningsViewProps) {
    const [period, setPeriod] = useState<"week" | "month">("week");

    // Mock data - replace with API
    const weekData: EarningDay[] = [
        { date: "2026-01-22", deliveries: 8, earnings: 4800 },
        { date: "2026-01-21", deliveries: 12, earnings: 7200 },
        { date: "2026-01-20", deliveries: 6, earnings: 3600 },
        { date: "2026-01-19", deliveries: 10, earnings: 6000 },
        { date: "2026-01-18", deliveries: 15, earnings: 9000 },
        { date: "2026-01-17", deliveries: 9, earnings: 5400 },
        { date: "2026-01-16", deliveries: 11, earnings: 6600 },
    ];

    const totalEarnings = weekData.reduce((sum, d) => sum + d.earnings, 0);
    const totalDeliveries = weekData.reduce((sum, d) => sum + d.deliveries, 0);
    const avgPerDelivery = totalDeliveries > 0 ? Math.round(totalEarnings / totalDeliveries) : 0;
    const avgPerDay = Math.round(totalEarnings / weekData.length);

    // Compare to previous period
    const previousTotal = 38000;
    const change = ((totalEarnings - previousTotal) / previousTotal) * 100;
    const isPositive = change >= 0;

    return (
        <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-6 shadow-md">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 mb-4">
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Mis Ganancias</h1>
                    </div>

                    {/* Period Selector */}
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPeriod("week")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === "week" ? "bg-white text-blue-600" : "bg-white/20"
                                }`}
                        >
                            Esta semana
                        </button>
                        <button
                            onClick={() => setPeriod("month")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === "month" ? "bg-white text-blue-600" : "bg-white/20"
                                }`}
                        >
                            Este mes
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
                {/* Main Stats */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <div className="text-center mb-6">
                        <p className="text-gray-500 text-sm mb-1">Total ganado</p>
                        <p className="text-4xl font-bold text-gray-900">${totalEarnings.toLocaleString()}</p>
                        <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            {Math.abs(change).toFixed(1)}% vs semana anterior
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">{totalDeliveries}</p>
                            <p className="text-xs text-gray-500">Entregas</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">${avgPerDelivery}</p>
                            <p className="text-xs text-gray-500">Por entrega</p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-900">${avgPerDay.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">Por día</p>
                        </div>
                    </div>
                </div>

                {/* Daily Breakdown */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold text-gray-900">Desglose por día</h3>
                    </div>
                    <div className="divide-y">
                        {weekData.map((day) => (
                            <div key={day.date} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {new Date(day.date).toLocaleDateString("es-AR", { weekday: "long", day: "numeric" })}
                                        </p>
                                        <p className="text-xs text-gray-500">{day.deliveries} entregas</p>
                                    </div>
                                </div>
                                <p className="font-bold text-gray-900">${day.earnings.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-start gap-3">
                        <TrendingUp className="w-6 h-6 flex-shrink-0" />
                        <div>
                            <p className="font-semibold mb-1">Consejo para ganar más</p>
                            <p className="text-sm text-white/80">
                                Los viernes y sábados son los días con más pedidos. ¡Mantente activo!
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
