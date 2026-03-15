"use client";

import React, { useEffect, useState } from "react";
import {
    Trophy,
    TrendingUp,
    Clock,
    Star,
    Loader2,
    Power,
    Bike,
} from "lucide-react";

interface ShiftSummaryData {
    totalEarnings: number;
    totalDeliveries: number;
    avgPerDelivery: number;
    bestDelivery: {
        orderNumber: string;
        comercio: string;
        earnings: number;
    } | null;
    totalMinutesOnline: number;
}

interface ShiftSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmDisconnect: () => void;
}

export function ShiftSummaryModal({
    isOpen,
    onClose,
    onConfirmDisconnect,
}: ShiftSummaryModalProps) {
    const [data, setData] = useState<ShiftSummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            // Reset state when modal closes
            setData(null);
            setError(null);
            return;
        }

        // Fetch shift summary data
        const fetchData = async () => {
            setLoading(true);
            setError(null);

            try {
                const response = await fetch("/api/driver/shift-summary", {
                    method: "GET",
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    setError(
                        errorData.error || "Error al cargar el resumen"
                    );
                    return;
                }

                const result = await response.json();
                setData(result);
            } catch (err) {
                console.error("[ShiftSummaryModal] Fetch error:", err);
                setError("Error al cargar el resumen del turno");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
            <div className="bg-white rounded-t-[28px] sm:rounded-[28px] sm:mx-4 max-w-md w-full p-6 shadow-2xl animate-[slideUp_0.3s_ease-out]">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    <h2 className="text-[10px] font-black uppercase tracking-[3px] text-gray-400">
                        Resumen de tu turno
                    </h2>
                </div>

                {loading ? (
                    // Loading state
                    <div className="flex flex-col items-center justify-center py-12 gap-4">
                        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
                        <p className="text-sm text-gray-600">
                            Calculando resumen...
                        </p>
                    </div>
                ) : error ? (
                    // Error state
                    <div className="py-8 text-center">
                        <p className="text-red-600 text-sm font-medium">
                            {error}
                        </p>
                    </div>
                ) : data ? (
                    // Data loaded
                    <>
                        {/* Main earnings display */}
                        <div className="mb-6">
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2">
                                Ganancias totales
                            </p>
                            <p className="text-4xl font-extrabold bg-gradient-to-r from-[#e60012] to-[#b8000e] bg-clip-text text-transparent">
                                ${data.totalEarnings.toLocaleString("es-AR")}
                            </p>
                        </div>

                        {data.totalDeliveries === 0 ? (
                            // No deliveries state
                            <div className="py-8 text-center">
                                <Bike className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600 text-sm font-medium">
                                    No tuviste entregas este turno.
                                </p>
                                <p className="text-gray-500 text-xs mt-2">
                                    ¡La próxima será mejor!
                                </p>
                            </div>
                        ) : (
                            // Stats grid
                            <>
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    {/* Total Deliveries */}
                                    <div className="bg-gray-50 rounded-[18px] p-4 text-center">
                                        <TrendingUp className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                                        <p className="text-xl font-extrabold text-gray-900">
                                            {data.totalDeliveries}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                            Entregas
                                        </p>
                                    </div>

                                    {/* Average per delivery */}
                                    <div className="bg-gray-50 rounded-[18px] p-4 text-center">
                                        <Star className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                                        <p className="text-xl font-extrabold text-gray-900">
                                            ${data.avgPerDelivery.toLocaleString("es-AR")}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                            Promedio
                                        </p>
                                    </div>

                                    {/* Best delivery */}
                                    {data.bestDelivery && (
                                        <div className="bg-gray-50 rounded-[18px] p-4 text-center">
                                            <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                                            <p className="text-xl font-extrabold text-gray-900">
                                                ${data.bestDelivery.earnings.toLocaleString("es-AR")}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                                Mejor
                                            </p>
                                        </div>
                                    )}

                                    {/* Total time online */}
                                    <div className="bg-gray-50 rounded-[18px] p-4 text-center">
                                        <Clock className="w-5 h-5 text-gray-400 mx-auto mb-2" />
                                        <p className="text-xl font-extrabold text-gray-900">
                                            {Math.floor(
                                                data.totalMinutesOnline / 60
                                            )}
                                            h
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                            Conectado
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-gray-50 text-gray-700 font-bold rounded-2xl py-4 text-[11px] uppercase tracking-widest hover:bg-gray-100 transition"
                            >
                                Seguir conectado
                            </button>
                            <button
                                onClick={onConfirmDisconnect}
                                className="flex-1 bg-[#e60012] text-white font-extrabold rounded-2xl py-4 text-[13px] uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-[#b8000e] transition"
                            >
                                <Power className="w-4 h-4 inline mr-2" />
                                Desconectarme
                            </button>
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
