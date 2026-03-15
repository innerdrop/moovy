"use client";

import React, { useEffect, useState, useRef } from "react";
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

export function ShiftSummaryModal({ isOpen, onClose, onConfirmDisconnect }: ShiftSummaryModalProps) {
    const [data, setData] = useState<ShiftSummaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setData(null);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);

        fetch("/api/driver/shift-summary")
            .then((res) => {
                if (!res.ok) throw new Error("Error al cargar resumen");
                return res.json();
            })
            .then((d) => setData(d))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
    }, [isOpen]);

    // Animated counter for earnings — hooks MUST be before any conditional return
    const [displayEarnings, setDisplayEarnings] = useState(0);
    const animFrameRef = useRef<number>(0);

    useEffect(() => {
        if (!data || data.totalDeliveries === 0) return;
        const target = data.totalEarnings;
        const duration = 1200;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayEarnings(Math.round(target * eased));
            if (progress < 1) {
                animFrameRef.current = requestAnimationFrame(animate);
            }
        };

        animFrameRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animFrameRef.current);
    }, [data]);

    if (!isOpen) return null;

    const formatTime = (minutes: number) => {
        if (minutes < 60) return `${minutes} min`;
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-[fadeIn_0.2s_ease-out]">
            <div className="bg-white dark:bg-[#1a1d27] rounded-t-[28px] sm:rounded-[28px] sm:mx-4 max-w-md w-full p-6 shadow-2xl animate-[slideUp_0.3s_cubic-bezier(0.32,0.72,0,1)]">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-500/10 rounded-full flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[3px] text-gray-400 dark:text-gray-500">
                        Resumen de tu turno
                    </p>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center gap-3 py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                            Calculando resumen...
                        </p>
                    </div>
                )}

                {/* Error */}
                {error && !loading && (
                    <div className="py-8 text-center">
                        <p className="text-sm text-red-500 font-medium">{error}</p>
                    </div>
                )}

                {/* Data */}
                {data && !loading && (
                    <>
                        {data.totalDeliveries === 0 ? (
                            /* Empty state */
                            <div className="py-8 text-center space-y-4">
                                <div className="w-16 h-16 bg-gray-50 dark:bg-[#22252f] rounded-full mx-auto flex items-center justify-center">
                                    <Bike className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                                        No tuviste entregas este turno.
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                        ¡La próxima será mejor!
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* Main earnings */}
                                <div className="text-center mb-6">
                                    <p className="text-4xl font-extrabold bg-gradient-to-r from-[#e60012] to-[#b8000e] bg-clip-text text-transparent">
                                        ${displayEarnings.toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-1">
                                        Ganancia total del turno
                                    </p>
                                </div>

                                {/* Stats grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6 animate-in fade-in zoom-in-95 duration-500 delay-300">
                                    <div className="bg-gray-50 dark:bg-[#22252f] rounded-[18px] p-4">
                                        <TrendingUp className="w-4 h-4 text-emerald-500 mb-2" />
                                        <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                                            {data.totalDeliveries}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                                            Entregas
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#22252f] rounded-[18px] p-4">
                                        <Star className="w-4 h-4 text-blue-500 mb-2" />
                                        <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                                            ${data.avgPerDelivery.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                                            Promedio
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#22252f] rounded-[18px] p-4">
                                        <Trophy className="w-4 h-4 text-amber-500 mb-2" />
                                        <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                                            ${data.bestDelivery?.earnings.toLocaleString() || "—"}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                                            Mejor entrega
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#22252f] rounded-[18px] p-4">
                                        <Clock className="w-4 h-4 text-purple-500 mb-2" />
                                        <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                                            {formatTime(data.totalMinutesOnline)}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">
                                            Tiempo activo
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Buttons */}
                {!loading && (
                    <div className="space-y-3 pt-2">
                        <button
                            onClick={onClose}
                            className="w-full bg-gray-50 dark:bg-[#22252f] text-gray-700 dark:text-gray-300 font-bold rounded-2xl py-4 text-[11px] uppercase tracking-widest active:scale-95 transition-all"
                        >
                            Seguir conectado
                        </button>
                        <button
                            onClick={onConfirmDisconnect}
                            className="w-full bg-[#e60012] text-white font-extrabold rounded-2xl py-4 text-[13px] uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
                        >
                            <Power className="w-4 h-4" />
                            Desconectarme
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
