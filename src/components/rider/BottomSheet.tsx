"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

type SheetState = "expanded" | "minimized" | "hidden";

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
    const [state, setState] = useState<SheetState>(initialState);
    const [isDragging, setIsDragging] = useState(false);
    const [dragY, setDragY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef(0);
    const currentStateRef = useRef(state);

    useEffect(() => {
        currentStateRef.current = state;
        onStateChange?.(state);
    }, [state, onStateChange]);

    const getHeightValue = useCallback((s: SheetState): string => {
        switch (s) {
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
            // Swiped down
            if (currentStateRef.current === "expanded") {
                setState("minimized");
            } else if (currentStateRef.current === "minimized") {
                setState("hidden");
            }
        } else if (dragY < -threshold) {
            // Swiped up
            if (currentStateRef.current === "hidden") {
                setState("minimized");
            } else if (currentStateRef.current === "minimized") {
                setState("expanded");
            }
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
            if (currentStateRef.current === "expanded") {
                setState("minimized");
            } else if (currentStateRef.current === "minimized") {
                setState("hidden");
            }
        } else if (dragY < -threshold) {
            if (currentStateRef.current === "hidden") {
                setState("minimized");
            } else if (currentStateRef.current === "minimized") {
                setState("expanded");
            }
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
            if (prev === "expanded") return "minimized";
            if (prev === "minimized") return "hidden";
            return "expanded";
        });
    }, []);

    const expand = useCallback(() => setState("expanded"), []);

    const height = getHeightValue(state);
    const dragOffset = isDragging ? Math.max(0, dragY) : 0;

    return (
        <>
            {/* Floating re-expand button when hidden */}
            {state === "hidden" && (
                <button
                    onClick={expand}
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 active:scale-95 transition-all animate-bounce"
                >
                    <ChevronUp className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Ver info</span>
                </button>
            )}

            {/* Main sheet container */}
            <div
                ref={containerRef}
                className="bg-white rounded-t-[32px] relative z-20 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col"
                style={{
                    height: state === "hidden" ? "0px" : `calc(${height} - ${dragOffset}px)`,
                    minHeight: state === "hidden" ? "0px" : minimizedHeight,
                    maxHeight: expandedHeight,
                    marginTop: state === "hidden" ? "0" : "-32px",
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

                    {/* State indicator */}
                    <div className="flex justify-center mt-1.5">
                        {state === "expanded" ? (
                            <ChevronDown className="w-4 h-4 text-gray-300" />
                        ) : (
                            <ChevronUp className="w-4 h-4 text-gray-300" />
                        )}
                    </div>
                </div>

                {/* Content area */}
                <div
                    className="flex-1 overflow-hidden"
                    style={{
                        opacity: state === "minimized" ? 0.7 : 1,
                        transition: "opacity 0.3s ease"
                    }}
                >
                    <div className={`h-full ${state === "expanded" ? "overflow-y-auto" : "overflow-hidden"}`}>
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
