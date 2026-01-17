"use client";

import { useState, useEffect } from "react";
import { Loader2, Gift, X, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { formatPrice } from "@/lib/delivery";

interface PointsWidgetProps {
    orderTotal: number;
    pointsApplied: number;
    onApplyPoints: (points: number, discount: number) => void;
}

// Conversion rate: 100 points = $2 discount (2% return)
const POINTS_TO_DISCOUNT_RATE = 0.02;

export default function PointsWidget({ orderTotal, pointsApplied, onApplyPoints }: PointsWidgetProps) {
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState(0);
    const [selectedPoints, setSelectedPoints] = useState(0);
    const [wantsToUsePoints, setWantsToUsePoints] = useState(false);

    useEffect(() => {
        loadBalance();
    }, []);

    const loadBalance = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/points");
            if (res.ok) {
                const data = await res.json();
                setBalance(data.balance || 0);
            }
        } catch (error) {
            console.error("Error loading points:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculateDiscount = (points: number) => {
        return Math.round(points * POINTS_TO_DISCOUNT_RATE);
    };

    // Max discount cannot exceed order total
    const maxUsablePoints = Math.min(
        balance,
        Math.floor(orderTotal / POINTS_TO_DISCOUNT_RATE)
    );

    if (loading) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 animate-pulse flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    // Case 1: No points available
    if (balance < 100) {
        return (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-500 flex items-center gap-3">
                <Gift className="w-5 h-5 text-gray-400" />
                <div>
                    <p className="font-medium text-gray-700">Tenés {balance.toLocaleString("es-AR")} puntos</p>
                    <p className="text-xs">Seguí comprando para acumular más puntos.</p>
                </div>
            </div>
        );
    }

    // Case 2: Points Applied
    if (pointsApplied > 0) {
        const appliedDiscount = calculateDiscount(pointsApplied);
        return (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                        <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="font-bold text-green-700">¡Descuento aplicado!</p>
                        <p className="text-sm text-gray-700">
                            Usaste {pointsApplied.toLocaleString("es-AR")} puntos = <strong className="text-green-600">{formatPrice(appliedDiscount)}</strong> de descuento
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        setSelectedPoints(0);
                        setWantsToUsePoints(false);
                        onApplyPoints(0, 0);
                    }}
                    className="p-2 hover:bg-green-100 rounded-full transition text-gray-400 hover:text-red-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
        );
    }

    // Case 3: Ask user if they want to use points
    if (!wantsToUsePoints) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <button
                    onClick={() => setWantsToUsePoints(true)}
                    className="w-full flex items-center justify-between"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Gift className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-gray-900">¿Querés usar tus puntos?</p>
                            <p className="text-sm text-gray-500">Tenés {balance.toLocaleString("es-AR")} puntos disponibles</p>
                        </div>
                    </div>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </button>
            </div>
        );
    }

    // Case 4: Slider to select points
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <button
                onClick={() => setWantsToUsePoints(false)}
                className="w-full flex items-center justify-between mb-4"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Gift className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="text-left">
                        <h4 className="font-bold text-gray-900">Usá tus puntos</h4>
                        <p className="text-sm text-gray-500">Tenés {balance.toLocaleString("es-AR")} puntos disponibles</p>
                    </div>
                </div>
                <ChevronUp className="w-5 h-5 text-gray-400" />
            </button>

            {/* Slider */}
            <div className="mb-4">
                <input
                    type="range"
                    min="0"
                    max={maxUsablePoints}
                    step="100"
                    value={selectedPoints}
                    onChange={(e) => setSelectedPoints(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0</span>
                    <span>{maxUsablePoints.toLocaleString("es-AR")} pts</span>
                </div>
            </div>

            {/* Selected amount display */}
            <div className="bg-gray-50 rounded-xl p-4 text-center mb-4">
                <p className="text-3xl font-bold text-gray-900">{selectedPoints.toLocaleString("es-AR")}</p>
                <p className="text-sm text-gray-500">puntos</p>
                {selectedPoints > 0 && (
                    <p className="text-green-600 font-semibold mt-2">
                        = {formatPrice(calculateDiscount(selectedPoints))} de descuento
                    </p>
                )}
            </div>

            {/* Apply button */}
            <button
                onClick={() => onApplyPoints(selectedPoints, calculateDiscount(selectedPoints))}
                disabled={selectedPoints === 0}
                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition flex items-center justify-center gap-2"
            >
                <Sparkles className="w-4 h-4" />
                {selectedPoints > 0 ? "Aplicar puntos" : "Seleccioná cuántos puntos usar"}
            </button>
        </div>
    );
}
