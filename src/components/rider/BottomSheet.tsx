"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronUp, ChevronDown, Maximize2, Minimize2 } from "lucide-react";

// 4 states: fullscreen -> expanded -> minimized -> hidden
type SheetState = "fullscreen" | "expanded" | "minimized" | "hidden";

const STORAGE_KEY = "moovy-rider-bottomsheet-state";

interface BottomSheetProps {
    children: React.ReactNode;
    initialState?: SheetState;
    expandedHeight?: string;  // e.g., "45vh"
    minimizedHeight?: string; // e.g., "120px"
    onStateChange?: (state: SheetState) => void;
}

export default function BottomSheet({
    children,
    initialState = "expanded",
    expandedHeight = "45vh",
    minimizedHeight = "120px",
    onStateChange
}: BottomSheetProps) {
    // Load initial state from localStorage or use prop
    const [state, setState] = useState<SheetState>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && ["fullscreen", "expanded", "minimized", "hidden"].includes(saved)) {
                return saved as SheetState;
            }
        }
        return initialState;
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragY, setDragY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef(0);
    const currentStateRef = useRef(state);

    // Persist state to localStorage
    useEffect(() => {
        currentStateRef.current = state;
        onStateChange?.(state);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, state);
        }
    }, [state, onStateChange]);

    const getHeightValue = useCallback((s: SheetState): string => {
        switch (s) {
            case "fullscreen": return "100vh";
            case "expanded": return expandedHeight;
            case "minimized": return minimizedHeight;
            case "hidden": return "0px";
        }
    }, [expandedHeight, minimizedHeight]);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        startYRef.current = e.touches[0].clientY;
        setIsDragging(true);
        setDragY(0);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        const currentY = e.touches[0].clientY;
        const deltaY = currentY - startYRef.current;
        setDragY(deltaY);
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 50; // minimum drag distance to trigger state change

        if (dragY > threshold) {
            // Swiped down - collapse
            setState(prev => {
                if (prev === "fullscreen") return "expanded";
                if (prev === "expanded") return "minimized";
                if (prev === "minimized") return "hidden";
                return prev;
            });
        } else if (dragY < -threshold) {
            // Swiped up - expand
            setState(prev => {
                if (prev === "hidden") return "minimized";
                if (prev === "minimized") return "expanded";
                if (prev === "expanded") return "fullscreen";
                return prev;
            });
        }

        setDragY(0);
    }, [isDragging, dragY]);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        startYRef.current = e.clientY;
        setIsDragging(true);
        setDragY(0);
    }, []);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return;
        const deltaY = e.clientY - startYRef.current;
        setDragY(deltaY);
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 50;

        if (dragY > threshold) {
            setState(prev => {
                if (prev === "fullscreen") return "expanded";
                if (prev === "expanded") return "minimized";
                if (prev === "minimized") return "hidden";
                return prev;
            });
        } else if (dragY < -threshold) {
            setState(prev => {
                if (prev === "hidden") return "minimized";
                if (prev === "minimized") return "expanded";
                if (prev === "expanded") return "fullscreen";
                return prev;
            });
        }

        setDragY(0);
    }, [isDragging, dragY]);

    // Mouse event listeners
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
            if (prev === "fullscreen") return "expanded";
            if (prev === "expanded") return "minimized";
            if (prev === "minimized") return "hidden";
            return "expanded";
        });
    }, []);

    const expand = useCallback(() => setState("expanded"), []);
    const toggleFullscreen = useCallback(() => {
        setState(prev => prev === "fullscreen" ? "expanded" : "fullscreen");
    }, []);

    const height = getHeightValue(state);
    const dragOffset = isDragging ? Math.max(0, dragY) : 0;
    const isFullscreen = state === "fullscreen";

    return (
        <>
            {/* Floating re-expand button when hidden */}
            {state === "hidden" && (
                <button
                    onClick={expand}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#e60012] text-white px-8 py-5 rounded-2xl shadow-[0_10px_40px_rgba(230,0,18,0.5)] flex items-center gap-3 active:scale-95 transition-transform border-2 border-white/20"
                    style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
                >
                    <ChevronUp className="w-7 h-7" />
                    <span className="text-base font-black uppercase tracking-widest">Mostrar Info</span>
                </button>
            )}

            {/* Main sheet container */}
            <div
                ref={containerRef}
                className={`bg-white relative z-20 overflow-hidden flex flex-col ${isFullscreen ? "rounded-none fixed inset-0" : "rounded-t-[32px] shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)]"}`}
                style={{
                    height: state === "hidden" ? "0px" : (isFullscreen ? "100vh" : `calc(${height} - ${dragOffset}px)`),
                    minHeight: state === "hidden" ? "0px" : minimizedHeight,
                    maxHeight: isFullscreen ? "100vh" : expandedHeight,
                    marginTop: state === "hidden" ? "0" : (isFullscreen ? "0" : "-32px"),
                    transition: isDragging ? "none" : "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: state === "hidden" ? 0 : 1,
                    pointerEvents: state === "hidden" ? "none" : "auto"
                }}
            >
                {/* Drag Handle */}
                <div
                    className="flex-shrink-0 pt-2 pb-3 cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onClick={cycleState}
                >
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto hover:bg-gray-300 transition" />

                    {/* State indicator with fullscreen toggle */}
                    <div className="flex justify-center items-center mt-1.5 gap-3">
                        {state === "fullscreen" ? (
                            <ChevronDown className="w-4 h-4 text-gray-300" />
                        ) : state === "expanded" ? (
                            <ChevronDown className="w-4 h-4 text-gray-300" />
                        ) : (
                            <ChevronUp className="w-4 h-4 text-gray-300" />
                        )}
                    </div>
                </div>

                {/* Fullscreen toggle button */}
                {(state === "expanded" || state === "fullscreen") && (
                    <button
                        onClick={toggleFullscreen}
                        className="absolute top-3 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-all z-10"
                        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
                    >
                        {isFullscreen ? (
                            <Minimize2 className="w-4 h-4 text-gray-600" />
                        ) : (
                            <Maximize2 className="w-4 h-4 text-gray-600" />
                        )}
                    </button>
                )}

                {/* Content area */}
                <div
                    className="flex-1 overflow-hidden"
                    style={{
                        opacity: state === "minimized" ? 0.7 : 1,
                        transition: "opacity 0.3s ease"
                    }}
                >
                    <div className={`h-full ${state === "expanded" || state === "fullscreen" ? "overflow-y-auto" : "overflow-hidden"}`}>
                        {children}
                    </div>
                </div>

                {/* Minimized state label overlay */}
                {state === "minimized" && (
                    <div
                        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white via-white/90 to-transparent h-16 flex items-end justify-center pb-3 pointer-events-none"
                    >
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            Desliza hacia arriba para ver más
                        </span>
                    </div>
                )}
            </div>
        </>
    );
}

