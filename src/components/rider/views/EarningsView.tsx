"use client";

import { useState, useEffect } from "react";
import {
    TrendingUp,
    Calendar,
    ChevronLeft,
    ArrowUp,
    ArrowDown,
    Loader2,
    Wallet
} from "lucide-react";

interface EarningDay {
    date: string;
    deliveries: number;
    earnings: number;
}

interface EarningsData {
    period: string;
    totalEarnings: number;
    totalDeliveries: number;
    avgPerDelivery: number;
    avgPerDay: number;
    previousPeriodTotal: number;
    dailyBreakdown: EarningDay[];
}

interface EarningsViewProps {
    onBack: () => void;
}

export default function EarningsView({ onBack }: EarningsViewProps) {
    const [period, setPeriod] = useState<"week" | "month">("week");
    const [data, setData] = useState<EarningsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEarnings = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/driver/earnings?period=${period}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (e) {
                console.error("Error fetching earnings:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchEarnings();
    }, [period]);

    const change = data && data.previousPeriodTotal > 0
        ? ((data.totalEarnings - data.previousPeriodTotal) / data.previousPeriodTotal) * 100
        : 0;
    const isPositive = change >= 0;

    return (
        <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#e60012] to-[#b8000e] text-white px-4 py-6 shadow-md">
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
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === "week" ? "bg-white text-[#e60012]" : "bg-white/20"
                                }`}
                        >
                            Esta semana
                        </button>
                        <button
                            onClick={() => setPeriod("month")}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${period === "month" ? "bg-white text-[#e60012]" : "bg-white/20"
                                }`}
                        >
                            Este mes
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-6 pb-24 max-w-4xl mx-auto w-full space-y-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
                    </div>
                ) : data ? (
                    <>
                        {/* Main Stats */}
                        <div className="bg-white rounded-xl p-6 shadow-sm">
                            <div className="text-center mb-6">
                                <p className="text-gray-500 text-sm mb-1">Total ganado</p>
                                <p className="text-4xl font-bold text-gray-900">${data.totalEarnings.toLocaleString()}</p>
                                {data.previousPeriodTotal > 0 && (
                                    <div className={`flex items-center justify-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                        {isPositive ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                                        {Math.abs(change).toFixed(1)}% vs {period === "week" ? "semana" : "mes"} anterior
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">{data.totalDeliveries}</p>
                                    <p className="text-xs text-gray-500">Entregas</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">${data.avgPerDelivery}</p>
                                    <p className="text-xs text-gray-500">Por entrega</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-gray-900">${data.avgPerDay.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500">Por dia</p>
                                </div>
                            </div>
                        </div>

                        {/* Daily Breakdown */}
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b">
                                <h3 className="font-semibold text-gray-900">Desglose por dia</h3>
                            </div>
                            {data.dailyBreakdown.length > 0 ? (
                                <div className="divide-y">
                                    {data.dailyBreakdown.map((day) => (
                                        <div key={day.date} className="p-4 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                                    <Calendar className="w-5 h-5 text-[#e60012]" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {new Date(day.date + "T12:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric" })}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{day.deliveries} entrega{day.deliveries !== 1 ? "s" : ""}</p>
                                                </div>
                                            </div>
                                            <p className="font-bold text-gray-900">${day.earnings.toLocaleString()}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <Wallet className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-400 text-sm">Sin entregas en este periodo</p>
                                </div>
                            )}
                        </div>

                        {/* Tips */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                            <div className="flex items-start gap-3">
                                <TrendingUp className="w-6 h-6 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold mb-1">Consejo para ganar mas</p>
                                    <p className="text-sm text-white/80">
                                        Los viernes y sabados son los dias con mas pedidos. Mantente activo!
                                    </p>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-20 text-gray-400">
                        Error al cargar datos
                    </div>
                )}
            </div>
        </div>
    );
}
