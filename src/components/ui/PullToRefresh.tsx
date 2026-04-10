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
            {/* Pull indicator */}
            <div
                className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
                style={{
                    height: refreshing ? 48 : pullDistance > 10 ? pullDistance : 0,
                    opacity: showIndicator ? 1 : 0,
                }}
            >
                {refreshing ? (
                    <Loader2 className="w-5 h-5 text-[#e60012] animate-spin" />
                ) : (
                    <div
                        className="w-5 h-5 border-2 border-[#e60012] border-t-transparent rounded-full transition-transform"
                        style={{
                            transform: `rotate(${progress * 360}deg)`,
                            opacity: progress,
                        }}
                    />
                )}
            </div>

            {children}
        </div>
    );
}
