"use client";

import { useState, useEffect } from "react";
import { Loader2, Gift, X, Sparkles } from "lucide-react";
import { formatPrice } from "@/lib/delivery";

interface PointsWidgetProps {
    orderTotal: number;
    pointsApplied: number;
    onApplyPoints: (points: number, discount: number) => void;
}

export default function PointsWidget({ orderTotal, pointsApplied, onApplyPoints }: PointsWidgetProps) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<{
        currentBalance: number;
        pointsUsable: number;
        discountAmount: number;
        minPointsToRedeem: number;
        canUsePoints: boolean;
    } | null>(null);

    useEffect(() => {
        calculatePoints();
    }, [orderTotal]);

    const calculatePoints = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/points/calculate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderTotal }),
            });
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error("Error calculating points:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 animate-pulse flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!data) return null;

    // Case 1: Can't use points (not enough points)
    if (!data.canUsePoints) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 flex items-center gap-3">
                <Gift className="w-5 h-5 text-gray-400" />
                <div>
                    <p className="font-medium text-gray-700">Tenés {data.currentBalance} puntos Moovy</p>
                    <p className="text-xs">Necesitás al menos {data.minPointsToRedeem} para canjear en esta compra.</p>
                </div>
            </div>
        );
    }

    // Case 2: Points Applied
    if (pointsApplied > 0) {
        return (
            <div className="bg-[#e60012]/5 border border-[#e60012]/20 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#e60012] rounded-full flex items-center justify-center text-white shadow-sm">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="font-bold text-[#e60012]">¡Descuento aplicado!</p>
                        <p className="text-sm text-gray-700">
                            Usaste <span className="font-bold">{pointsApplied}</span> puntos para descontar <span className="font-bold text-[#e60012]">{formatPrice(data.discountAmount)}</span>
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => onApplyPoints(0, 0)}
                    className="p-2 hover:bg-[#e60012]/10 rounded-full transition text-gray-400 hover:text-[#e60012]"
                    title="Quitar descuento"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // Case 3: Available to use
    return (
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-[#e60012] rounded-full blur-2xl opacity-20"></div>

            <div className="relative z-10 flex items-start gap-4">
                <div className="w-10 h-10 bg-[#e60012] rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-900/20">
                    <Gift className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <h4 className="font-bold text-lg mb-1">¡Tenés puntos disponibles!</h4>
                    <p className="text-gray-300 text-sm leading-relaxed mb-3">
                        Usá tus <strong className="text-white">{data.pointsUsable} puntos</strong> y ahorrá <strong className="text-[#e60012] bg-white/10 px-1.5 py-0.5 rounded ml-1">{formatPrice(data.discountAmount)}</strong> en esta compra.
                    </p>

                    <div className="flex items-center justify-between mt-4">
                        <p className="text-xs text-gray-400">
                            Saldo: {data.currentBalance} puntos
                        </p>
                        <button
                            onClick={() => onApplyPoints(data.pointsUsable, data.discountAmount)}
                            className="text-sm bg-[#e60012] hover:bg-[#c4000f] text-white px-5 py-2 rounded-lg font-bold transition shadow-lg shadow-red-600/20 active:transform active:scale-95"
                        >
                            Aplicar Descuento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
