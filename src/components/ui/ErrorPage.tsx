"use client";

import { AlertTriangle, RefreshCcw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
    portalName?: string;
    backHref: string;
    backLabel: string;
    accentColor?: string; // tailwind color class like "red" "blue" "green" "emerald"
}

export default function ErrorPage({
    error,
    reset,
    portalName,
    backHref,
    backLabel,
    accentColor = "red",
}: ErrorPageProps) {
    // Map color to tailwind classes
    const colorMap: Record<string, { bg: string; text: string; border: string; btnBg: string; btnHover: string }> = {
        red: {
            bg: "bg-red-50",
            text: "text-red-600",
            border: "border-red-200",
            btnBg: "bg-[#e60012]",
            btnHover: "hover:bg-red-700",
        },
        blue: {
            bg: "bg-blue-50",
            text: "text-blue-600",
            border: "border-blue-200",
            btnBg: "bg-blue-600",
            btnHover: "hover:bg-blue-700",
        },
        green: {
            bg: "bg-green-50",
            text: "text-green-600",
            border: "border-green-200",
            btnBg: "bg-green-600",
            btnHover: "hover:bg-green-700",
        },
        emerald: {
            bg: "bg-emerald-50",
            text: "text-emerald-600",
            border: "border-emerald-200",
            btnBg: "bg-emerald-600",
            btnHover: "hover:bg-emerald-700",
        },
    };

    const colors = colorMap[accentColor] || colorMap.red;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center space-y-6">
                {/* Icon */}
                <div className={`mx-auto w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center`}>
                    <AlertTriangle className={`w-8 h-8 ${colors.text}`} />
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        ¡Ups! Algo salió mal
                    </h1>
                    {portalName && (
                        <p className="text-sm text-gray-400 mt-1">Portal: {portalName}</p>
                    )}
                </div>

                {/* Message */}
                <p className="text-gray-600">
                    Ocurrió un error inesperado. Podés intentar de nuevo o volver al inicio.
                </p>

                {/* Error digest (dev only) */}
                {error.digest && (
                    <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg p-2 break-all">
                        Error ID: {error.digest}
                    </p>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => reset()}
                        className={`inline-flex items-center justify-center gap-2 px-6 py-3 ${colors.btnBg} ${colors.btnHover} text-white font-semibold rounded-xl transition-colors`}
                    >
                        <RefreshCcw className="w-4 h-4" />
                        Reintentar
                    </button>
                    <Link
                        href={backHref}
                        className={`inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors`}
                    >
                        <Home className="w-4 h-4" />
                        {backLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
}
