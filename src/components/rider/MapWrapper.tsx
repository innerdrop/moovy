"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

// ── Stable reference to avoid useJsApiLoader re-init on navigations ──
const LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

// ═══════════════════════════════════════════════
//  MapSkeleton — instant visual while JS loads
// ═══════════════════════════════════════════════
function MapSkeleton({ message = "Cargando mapa..." }: { message?: string }) {
    return (
        <div className="h-full w-full bg-gray-100 relative overflow-hidden">
            {/* Shimmer animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />

            {/* Fake map grid lines */}
            <div className="absolute inset-0 opacity-[0.04]">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`h-${i}`} className="absolute left-0 right-0 border-t border-gray-400" style={{ top: `${(i + 1) * 12}%` }} />
                ))}
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={`v-${i}`} className="absolute top-0 bottom-0 border-l border-gray-400" style={{ left: `${(i + 1) * 16}%` }} />
                ))}
            </div>

            {/* Center indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-gray-300 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{message}</p>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════
//  MapWrapper — manages load lifecycle
// ═══════════════════════════════════════════════
interface MapWrapperProps {
    children: (isLoaded: boolean) => React.ReactNode;
    fallback?: React.ReactNode;
}

export default function MapWrapper({ children, fallback }: MapWrapperProps) {
    const [mounted, setMounted] = useState(false);

    // Hydration-safe: only render map after client mount
    useEffect(() => {
        setMounted(true);
    }, []);

    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script", // singleton — won't reload on navigations
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: LIBRARIES,
        language: "es",
        region: "AR",
    });

    // SSR / pre-mount — show skeleton immediately
    if (!mounted) {
        return fallback || <MapSkeleton />;
    }

    // Load error
    if (loadError) {
        return (
            <div className="h-full w-full bg-red-50 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <MapPin className="w-10 h-10 text-red-300" />
                <p className="text-sm font-bold text-red-400">Error al cargar Google Maps</p>
                <button
                    onClick={() => window.location.reload()}
                    className="text-xs text-red-500 underline"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // Script still loading? Show skeleton
    if (!isLoaded) {
        return fallback || <MapSkeleton />;
    }

    // Ready — render the actual map
    return <>{children(true)}</>;
}

// Export skeleton for use as dynamic() loading fallback
export { MapSkeleton };
