"use client";

import { useState, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface PullToRefreshProps {
    children: React.ReactNode;
    onRefresh?: () => Promise<void>;
}

const THRESHOLD = 80; // px to pull before triggering refresh
const MAX_PULL = 120;

export default function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
    const [pulling, setPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const startY = useRef(0);
    const currentY = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        // Only activate when scrolled to top
        if (window.scrollY > 5) return;
        startY.current = e.touches[0].clientY;
        currentY.current = startY.current;
        setPulling(true);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!pulling || refreshing) return;
        if (window.scrollY > 5) {
            setPulling(false);
            setPullDistance(0);
            return;
        }

        currentY.current = e.touches[0].clientY;
        const diff = currentY.current - startY.current;

        if (diff > 0) {
            // Dampen the pull with a curve (feels more natural)
            const dampened = Math.min(MAX_PULL, diff * 0.4);
            setPullDistance(dampened);
        }
    }, [pulling, refreshing]);

    const handleTouchEnd = useCallback(async () => {
        if (!pulling) return;
        setPulling(false);

        if (pullDistance >= THRESHOLD && !refreshing) {
            setRefreshing(true);
            try {
                if (onRefresh) {
                    await onRefresh();
                } else {
                    // Default: reload the page
                    window.location.reload();
                    return; // Don't reset state, page will reload
                }
            } catch {
                // silent
            }
            setRefreshing(false);
        }

        setPullDistance(0);
    }, [pulling, pullDistance, refreshing, onRefresh]);

    const progress = Math.min(1, pullDistance / THRESHOLD);
    const showIndicator = pullDistance > 10 || refreshing;

    return (
        <div
            ref={containerRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Spinner flotante (overlay) — patrón de apps pro: un círculo que aparece
                POR ENCIMA del contenido, sin empujar el header ni cortar la tarjeta de
                búsqueda. No ocupa lugar en el layout, así nada se desplaza. */}
            {showIndicator && (
                <div
                    className="fixed left-1/2 -translate-x-1/2 z-[60] pointer-events-none transition-opacity duration-200"
                    style={{
                        top: "calc(env(safe-area-inset-top) + 64px)",
                        opacity: refreshing || pullDistance > 20 ? 1 : Math.max(0, progress),
                    }}
                >
                    <div className="w-9 h-9 rounded-full bg-white shadow-[0_6px_16px_rgba(0,0,0,0.18)] flex items-center justify-center">
                        {refreshing ? (
                            <Loader2 className="w-5 h-5 text-[#e60012] animate-spin" />
                        ) : (
                            <div
                                className="w-5 h-5 border-2 border-[#e60012] border-t-transparent rounded-full"
                                style={{ transform: `rotate(${progress * 360}deg)` }}
                            />
                        )}
                    </div>
                </div>
            )}

            {children}
        </div>
    );
}
