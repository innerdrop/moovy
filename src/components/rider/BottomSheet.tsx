"use client";

import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
    ChevronDown,
    ChevronUp,
    ArrowUp,
    ArrowUpRight,
    ArrowRight,
    ArrowUpLeft,
    ArrowLeft,
    RotateCcw,
    Navigation,
    MapPin,
    Clock,
    Flag,
} from "lucide-react";
import { useColorScheme } from "@/hooks/useColorScheme";

// ── Types ──

type SheetState = "expanded" | "mid" | "minimized" | "hidden";

const STORAGE_KEY = "moovy-rider-bottomsheet-state";

interface NavigationStep {
    instruction: string;
    distance: string;
    duration: string;
    maneuver?: string;
}

interface BottomSheetProps {
    children: React.ReactNode;
    initialState?: SheetState;
    onStateChange?: (state: SheetState) => void;
    // Nav strip data (from unified NavigationHUD)
    navCurrentStep?: NavigationStep | null;
    navNextStep?: NavigationStep | null;
    navTotalDistance?: string;
    navTotalDuration?: string;
    navStepsRemaining?: number;
    navDestinationName?: string;
    navIsPickedUp?: boolean;
    navIsNavigating?: boolean;
}

// ── Helpers (moved from NavigationHUD) ──

function getManeuverIcon(maneuver?: string, className = "w-7 h-7") {
    if (!maneuver) return <ArrowUp className={className} />;
    if (maneuver.includes("left") && maneuver.includes("sharp"))
        return <ArrowLeft className={className} />;
    if (maneuver.includes("left"))
        return <ArrowUpLeft className={className} />;
    if (maneuver.includes("right") && maneuver.includes("sharp"))
        return <ArrowRight className={className} />;
    if (maneuver.includes("right"))
        return <ArrowUpRight className={className} />;
    if (maneuver.includes("uturn") || maneuver.includes("u-turn"))
        return <RotateCcw className={className} />;
    return <ArrowUp className={className} />;
}

function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ");
}

// ── Component ──

export default function BottomSheet({
    children,
    initialState = "minimized",
    onStateChange,
    navCurrentStep,
    navNextStep,
    navTotalDistance,
    navTotalDuration,
    navStepsRemaining = 0,
    navDestinationName,
    navIsPickedUp,
    navIsNavigating,
}: BottomSheetProps) {
    const isDark = useColorScheme() === "dark";
    const [state, setState] = useState<SheetState>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && ["expanded", "mid", "minimized"].includes(saved)) {
                return saved as SheetState;
            }
        }
        return initialState;
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragY, setDragY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef(0);

    useEffect(() => {
        onStateChange?.(state);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, state);
        }
    }, [state, onStateChange]);

    const getTranslateY = useCallback((s: SheetState): string => {
        switch (s) {
            case "expanded": return "15%";
            case "mid": return "calc(100% - 320px - max(80px, env(safe-area-inset-bottom)))";
            case "minimized": return "calc(100% - 160px - max(80px, env(safe-area-inset-bottom)))";
            case "hidden": return "100%";
        }
    }, []);

    // ── Touch handlers ──
    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startYRef.current = e.touches[0].clientY;
        setIsDragging(true);
        setDragY(0);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        setDragY(e.touches[0].clientY - startYRef.current);
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        const threshold = 50;
        if (dragY > threshold) {
            // Swipe down: expanded→mid→minimized
            setState(prev => prev === "expanded" ? "mid" : prev === "mid" ? "minimized" : prev);
        } else if (dragY < -threshold) {
            // Swipe up: minimized→mid→expanded
            setState(prev => prev === "minimized" ? "mid" : prev === "mid" ? "expanded" : prev === "hidden" ? "minimized" : prev);
        }
        setDragY(0);
    }, [isDragging, dragY]);

    // ── Mouse handlers (desktop) ──
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        startYRef.current = e.clientY;
        setIsDragging(true);
        setDragY(0);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        setDragY(e.clientY - startYRef.current);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);
        const threshold = 50;
        if (dragY > threshold) {
            setState(prev => prev === "expanded" ? "mid" : prev === "mid" ? "minimized" : prev);
        } else if (dragY < -threshold) {
            setState(prev => prev === "minimized" ? "mid" : prev === "mid" ? "expanded" : prev === "hidden" ? "minimized" : prev);
        }
        setDragY(0);
    }, [isDragging, dragY]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
            return () => {
                window.removeEventListener("mousemove", handleMouseMove);
                window.removeEventListener("mouseup", handleMouseUp);
            };
        }
    }, [isDragging, handleMouseMove, handleMouseUp]);

    const cycleState = useCallback(() => {
        setState(prev => {
            if (prev === "minimized") return "mid";
            if (prev === "mid") return "expanded";
            return "minimized";
        });
    }, []);

    const clampedDrag = isDragging ? dragY : 0;
    const hasNav = navIsNavigating && navCurrentStep;

    // Memoize the nav strip so map re-renders from parent don't re-render it
    const navStrip = useMemo(() => {
        if (!hasNav || !navCurrentStep) return null;
        return (
            <div
                className="flex items-center gap-3"
                style={{ padding: "0 16px 14px", position: "relative", zIndex: 1 }}
            >
                {/* Maneuver icon — white box */}
                <div
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                        width: 52, height: 52, borderRadius: 16,
                        background: isDark ? "#1a1d27" : "#fff",
                        boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.4)" : "0 4px 16px rgba(0,0,0,0.15)",
                    }}
                >
                    <span style={{ color: "#e60012" }}>
                        {getManeuverIcon(navCurrentStep.maneuver, "w-7 h-7 stroke-[2.5]")}
                    </span>
                </div>

                {/* Instruction text */}
                <div className="flex-1 min-w-0">
                    <p
                        className="font-extrabold leading-tight tracking-tight"
                        style={{ color: "#fff", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                    >
                        {stripHtml(navCurrentStep.instruction)}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span
                            className="font-black tracking-tight"
                            style={{ color: "rgba(255,255,255,0.95)", fontSize: 20, lineHeight: 1 }}
                        >
                            {navCurrentStep.distance}
                        </span>
                        <span
                            className="font-bold uppercase tracking-wider"
                            style={{
                                color: "rgba(255,255,255,0.55)", fontSize: 8,
                                background: "rgba(0,0,0,0.15)",
                                padding: "2px 7px", borderRadius: 5,
                            }}
                        >
                            Distancia
                        </span>
                    </div>
                </div>

                {/* Expand / collapse toggle */}
                <button
                    onClick={cycleState}
                    className="flex-shrink-0 flex items-center justify-center"
                    style={{
                        width: 32, height: 32, borderRadius: 999,
                        background: "rgba(255,255,255,0.2)",
                        border: "none",
                    }}
                >
                    {state === "expanded" ? (
                        <ChevronDown className="w-4 h-4" style={{ color: "#fff" }} />
                    ) : (
                        <ChevronUp className="w-4 h-4" style={{ color: "#fff" }} />
                    )}
                </button>
            </div>
        );
    }, [hasNav, navCurrentStep, state, cycleState]);

    // Stats bar for the expanded state (only when navigating)
    const statsBar = useMemo(() => {
        if (!hasNav) return null;
        return (
            <div
                style={{
                    display: "grid", gridTemplateColumns: "1fr 1fr",
                    background: isDark ? "#1a1d27" : "#fff", borderRadius: 16, overflow: "hidden",
                    boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 10px rgba(0,0,0,0.06)",
                }}
            >
                <div className="flex items-center gap-2.5" style={{ padding: "12px 16px", borderRight: isDark ? "1px solid #2a2d37" : "1px solid #f1f1f1" }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 10,
                        background: "rgba(230,0,18,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Clock className="w-3.5 h-3.5" style={{ color: "#e60012" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#f1f3f7" : "#111", lineHeight: 1.1 }}>{navTotalDuration}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Tiempo est.</div>
                    </div>
                </div>
                <div className="flex items-center gap-2.5" style={{ padding: "12px 16px" }}>
                    <div style={{
                        width: 30, height: 30, borderRadius: 10,
                        background: "rgba(230,0,18,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <Navigation className="w-3.5 h-3.5" style={{ color: "#e60012" }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#f1f3f7" : "#111", lineHeight: 1.1 }}>{navTotalDistance}</div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.5px" }}>Total</div>
                    </div>
                </div>
            </div>
        );
    }, [hasNav, navTotalDuration, navTotalDistance, isDark]);

    // Destination + next step bar (only when navigating)
    const destBar = useMemo(() => {
        if (!hasNav) return null;
        return (
            <div
                className="flex items-center justify-between"
                style={{
                    background: isDark ? "#1a1d27" : "#fff", borderRadius: 14, padding: "12px 16px",
                    boxShadow: isDark ? "0 2px 10px rgba(0,0,0,0.4)" : "0 2px 10px rgba(0,0,0,0.06)",
                }}
            >
                <div className="flex items-center gap-2.5">
                    <div style={{
                        width: 30, height: 30, borderRadius: 999,
                        background: "rgba(230,0,18,0.08)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        {navIsPickedUp ? (
                            <Flag className="w-3.5 h-3.5" style={{ color: "#e60012" }} />
                        ) : (
                            <MapPin className="w-3.5 h-3.5" style={{ color: "#e60012" }} />
                        )}
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#f1f3f7" : "#111", maxWidth: 120 }} className="truncate">
                        {navDestinationName}
                    </span>
                </div>

                {navNextStep && navStepsRemaining > 1 && (
                    <div className="flex items-center gap-1.5" style={{ maxWidth: 150 }}>
                        <span style={{ color: isDark ? "#666" : "#ccc" }}>
                            {getManeuverIcon(navNextStep.maneuver, "w-3 h-3")}
                        </span>
                        <p className="truncate" style={{ fontSize: 10, fontWeight: 500, color: "#9ca3af" }}>
                            Luego: <span style={{ color: isDark ? "#b0b5be" : "#6b7280" }}>{stripHtml(navNextStep.instruction)}</span>
                        </p>
                    </div>
                )}
            </div>
        );
    }, [hasNav, navIsPickedUp, navDestinationName, navNextStep, navStepsRemaining, isDark]);

    return (
        <div
            ref={containerRef}
            className={`fixed bottom-0 left-0 right-0 z-20 flex flex-col ${state === "hidden" ? "pointer-events-none" : ""}`}
            style={{
                height: "70vh",
                borderRadius: "28px 28px 0 0",
                overflow: "hidden",
                background: isDark ? "#0f1117" : "#f8f9fb",
                boxShadow: state !== "hidden" ? (isDark ? "0 -12px 50px rgba(0,0,0,0.5)" : "0 -12px 50px rgba(0,0,0,0.18)") : "none",
                transform: `translateY(${getTranslateY(state)}) translateY(${Math.max(0, clampedDrag)}px)`,
                transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                willChange: "transform",
                opacity: state === "hidden" ? 0 : 1,
                paddingBottom: "env(safe-area-inset-bottom)",
                fontFamily: "var(--font-sans), 'Nunito', sans-serif",
            }}
        >
            {/* ── Red branded header / Nav strip ── */}
            <div
                style={{
                    background: "linear-gradient(135deg, #e60012 0%, #b8000e 100%)",
                    position: "relative",
                    flexShrink: 0,
                }}
            >
                {/* Radial highlight */}
                <div style={{
                    position: "absolute", inset: 0,
                    background: "radial-gradient(circle at 15% 40%, rgba(255,255,255,0.15) 0%, transparent 55%)",
                    pointerEvents: "none",
                }} />

                {/* Drag handle */}
                <div
                    className="flex flex-col items-center cursor-grab active:cursor-grabbing touch-none select-none"
                    style={{ padding: "10px 0 6px", position: "relative", zIndex: 1, minHeight: 36 }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onClick={cycleState}
                >
                    <div style={{
                        width: 36, height: 4, borderRadius: 99,
                        background: "rgba(255,255,255,0.3)",
                    }} />
                </div>

                {/* Nav instruction strip (when navigating) */}
                {navStrip}

                {/* Simple chevron when NOT navigating */}
                {!hasNav && (
                    <div
                        className="flex justify-center pb-2"
                        style={{ position: "relative", zIndex: 1 }}
                    >
                        <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${state === "expanded" ? "rotate-180" : ""}`}
                            style={{ color: "rgba(255,255,255,0.5)" }}
                        />
                    </div>
                )}
            </div>

            {/* ── Mid section: stats + dest (visible at mid & expanded) ── */}
            <div
                style={{
                    background: isDark ? "#0f1117" : "#f8f9fb",
                    overflow: "hidden",
                    maxHeight: state === "minimized" || state === "hidden" ? 0 : 200,
                    opacity: state === "minimized" || state === "hidden" ? 0 : 1,
                    transition: "max-height 0.3s ease, opacity 0.25s ease",
                }}
            >
                {hasNav && (
                    <div style={{ padding: "12px 16px 0", display: "flex", flexDirection: "column", gap: 10 }}>
                        {statsBar}
                        {destBar}
                    </div>
                )}
            </div>

            {/* ── Scrollable body (visible unless hidden) ── */}
            <div
                className={`flex-1 ${state === "expanded" ? "overflow-y-auto" : "overflow-hidden"}`}
                style={{
                    opacity: state === "hidden" ? 0 : 1,
                    transition: "opacity 0.25s ease",
                    pointerEvents: state === "hidden" ? "none" : "auto",
                }}
            >
                <div style={{ padding: "16px 16px 80px", display: "flex", flexDirection: "column", gap: 12 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
