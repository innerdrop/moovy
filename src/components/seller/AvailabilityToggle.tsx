"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Power,
    Pause,
    Clock,
    Loader2,
    ChevronDown,
    Calendar,
} from "lucide-react";

interface SellerStatus {
    isOnline: boolean;
    isPaused: boolean;
    pauseEndsAt: string | null;
    preparationMinutes: number;
    scheduleEnabled: boolean;
    scheduleJson: string | null;
}

const PAUSE_OPTIONS = [
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
    { value: 60, label: "1 hora" },
] as const;

const PREP_OPTIONS = [
    { value: 5, label: "5 min" },
    { value: 10, label: "10 min" },
    { value: 15, label: "15 min" },
    { value: 30, label: "30 min" },
] as const;

export default function AvailabilityToggle() {
    const [status, setStatus] = useState<SellerStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [showPauseMenu, setShowPauseMenu] = useState(false);
    const [countdown, setCountdown] = useState("");

    const fetchStatus = useCallback(async () => {
        try {
            const res = await fetch("/api/seller/availability");
            if (res.ok) {
                setStatus(await res.json());
            }
        } catch {
            // ignore
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    // Countdown timer for pause
    useEffect(() => {
        if (!status?.isPaused || !status.pauseEndsAt) {
            setCountdown("");
            return;
        }

        const updateCountdown = () => {
            const remaining = new Date(status.pauseEndsAt!).getTime() - Date.now();
            if (remaining <= 0) {
                setCountdown("");
                fetchStatus(); // Re-fetch to update status
                return;
            }
            const mins = Math.floor(remaining / 60000);
            const secs = Math.floor((remaining % 60000) / 1000);
            setCountdown(`${mins}:${secs.toString().padStart(2, "0")}`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [status?.isPaused, status?.pauseEndsAt, fetchStatus]);

    async function sendAction(body: Record<string, unknown>) {
        setUpdating(true);
        setShowPauseMenu(false);
        try {
            const res = await fetch("/api/seller/availability", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (res.ok) {
                setStatus(await res.json());
            }
        } catch {
            // ignore
        } finally {
            setUpdating(false);
        }
    }

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-14 bg-gray-100 rounded-xl" />
            </div>
        );
    }

    if (!status) return null;

    const isOnlineAndActive = status.isOnline && !status.isPaused;
    const isPaused = status.isOnline && status.isPaused;
    const isOffline = !status.isOnline;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Main Toggle Bar */}
            <div
                className={`p-4 sm:p-5 flex items-center justify-between gap-4 ${
                    isOnlineAndActive
                        ? "bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-100"
                        : isPaused
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100"
                        : "bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200"
                }`}
            >
                <div className="flex items-center gap-3">
                    {/* Status Indicator */}
                    <div
                        className={`w-3 h-3 rounded-full ${
                            isOnlineAndActive
                                ? "bg-green-500 animate-pulse"
                                : isPaused
                                ? "bg-amber-500"
                                : "bg-red-400"
                        }`}
                    />
                    <div>
                        <p className="font-bold text-gray-900">
                            {isOnlineAndActive
                                ? "Abierto"
                                : isPaused
                                ? "Pausado"
                                : "Cerrado"}
                        </p>
                        <p className="text-xs text-gray-500">
                            {isOnlineAndActive
                                ? "Recibiendo pedidos"
                                : isPaused && countdown
                                ? `Vuelve en ${countdown}`
                                : "No recibe pedidos"}
                        </p>
                    </div>
                </div>

                {/* Toggle Button */}
                <button
                    onClick={() =>
                        sendAction({
                            action: isOffline ? "online" : "offline",
                        })
                    }
                    disabled={updating}
                    className={`relative w-14 h-8 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isOffline
                            ? "bg-gray-300 focus:ring-gray-400"
                            : "bg-emerald-500 focus:ring-emerald-500"
                    }`}
                >
                    {updating ? (
                        <Loader2 className="w-4 h-4 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                    ) : (
                        <span
                            className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                isOffline ? "left-1" : "left-7"
                            }`}
                        />
                    )}
                </button>
            </div>

            {/* Controls (visible when online) */}
            {status.isOnline && (
                <div className="p-4 sm:p-5 space-y-4">
                    {/* Pause Controls */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Pause className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                                Pausar temporalmente
                            </span>
                        </div>

                        {isPaused ? (
                            <button
                                onClick={() => sendAction({ action: "online" })}
                                disabled={updating}
                                className="px-3 py-1.5 text-xs font-semibold bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                            >
                                Reanudar
                            </button>
                        ) : (
                            <div className="relative">
                                <button
                                    onClick={() => setShowPauseMenu(!showPauseMenu)}
                                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition"
                                >
                                    Pausar
                                    <ChevronDown className="w-3 h-3" />
                                </button>
                                {showPauseMenu && (
                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 py-1 min-w-[120px]">
                                        {PAUSE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() =>
                                                    sendAction({
                                                        action: "pause",
                                                        pauseMinutes: opt.value,
                                                    })
                                                }
                                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Preparation Time */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                                Tiempo de preparacion
                            </span>
                        </div>
                        <div className="flex gap-1">
                            {PREP_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() =>
                                        sendAction({
                                            action: "prepTime",
                                            preparationMinutes: opt.value,
                                        })
                                    }
                                    disabled={updating}
                                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                                        status.preparationMinutes === opt.value
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Schedule Toggle */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-700">
                                Horario programado
                            </span>
                        </div>
                        <button
                            onClick={() =>
                                sendAction({
                                    action: "schedule",
                                    scheduleEnabled: !status.scheduleEnabled,
                                    scheduleJson: status.scheduleJson,
                                })
                            }
                            disabled={updating}
                            className={`relative w-10 h-6 rounded-full transition-colors duration-200 ${
                                status.scheduleEnabled
                                    ? "bg-emerald-500"
                                    : "bg-gray-300"
                            }`}
                        >
                            <span
                                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                                    status.scheduleEnabled
                                        ? "left-[18px]"
                                        : "left-0.5"
                                }`}
                            />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
