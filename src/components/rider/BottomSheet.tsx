"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { ChevronUp } from "lucide-react";

// 3 states: expanded -> minimized -> hidden
type SheetState = "expanded" | "minimized" | "hidden";

const STORAGE_KEY = "moovy-rider-bottomsheet-state";

interface BottomSheetProps {
    children: React.ReactNode;
    initialState?: SheetState;
    onStateChange?: (state: SheetState) => void;
}

export default function BottomSheet({
    children,
    initialState = "minimized",
    onStateChange
}: BottomSheetProps) {
    const [state, setState] = useState<SheetState>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && ["expanded", "minimized"].includes(saved)) {
                return saved as SheetState;
            }
        }
        return initialState;
    });
    const [isDragging, setIsDragging] = useState(false);
    const [dragY, setDragY] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef(0);

    // Persist + notify parent
    useEffect(() => {
        onStateChange?.(state);
        if (typeof window !== "undefined") {
            localStorage.setItem(STORAGE_KEY, state);
        }
    }, [state, onStateChange]);

    // ── Translate values for each state ──
    // expanded = 0 (show full), minimized = partial, hidden = off-screen
    const getTranslateY = useCallback((s: SheetState): string => {
        switch (s) {
            case "expanded": return "0%";
            case "minimized": return "calc(100% - 160px)";
            // Ensure hidden is no longer used or just return 100% as fallback
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
        const deltaY = e.touches[0].clientY - startYRef.current;
        setDragY(deltaY);
    }, [isDragging]);

    const handleTouchEnd = useCallback(() => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 60;

        if (dragY > threshold) {
            // Swiped DOWN — collapse
            setState(prev => {
                if (prev === "expanded") return "minimized";
                if (prev === "minimized") return "minimized";
                return prev;
            });
        } else if (dragY < -threshold) {
            // Swiped UP — expand
            setState(prev => {
                if (prev === "hidden") return "minimized";
                if (prev === "minimized") return "expanded";
                return prev;
            });
        }

        setDragY(0);
    }, [isDragging, dragY]);

    // ── Mouse handlers (desktop dev) ──
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

        const threshold = 60;
        if (dragY > threshold) {
            setState(prev => {
                if (prev === "expanded") return "minimized";
                if (prev === "minimized") return "minimized";
                return prev;
            });
        } else if (dragY < -threshold) {
            setState(prev => {
                if (prev === "hidden") return "minimized";
                if (prev === "minimized") return "expanded";
                return prev;
            });
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
            if (prev === "expanded") return "minimized";
            if (prev === "minimized") return "expanded";
            return "minimized";
        });
    }, []);

    const expand = useCallback(() => setState("minimized"), []);

    // Drag offset (only allow dragging down from expanded, or up from minimized)
    const clampedDrag = isDragging ? dragY : 0;

    return (
        <>


            {/* Main sheet — fixed at bottom, slides via translateY */}
            <div
                ref={containerRef}
                className={`fixed bottom-0 left-0 right-0 z-20 bg-white flex flex-col ${state === "hidden" ? "pointer-events-none" : ""}`}
                style={{
                    height: "70vh",
                    borderRadius: "24px 24px 0 0",
                    boxShadow: state !== "hidden" ? "0 -8px 30px rgba(0,0,0,0.12)" : "none",
                    transform: `translateY(${getTranslateY(state)}) translateY(${Math.max(0, clampedDrag)}px)`,
                    transition: isDragging ? "none" : "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                    opacity: state === "hidden" ? 0 : 1,
                    paddingBottom: 'env(safe-area-inset-bottom)',
                }}
            >
                {/* Drag Handle — 48px tall for touch */}
                <div
                    className="flex-shrink-0 pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onMouseDown={handleMouseDown}
                    onClick={cycleState}
                    style={{ minHeight: "48px" }}
                >
                    {/* Visual handle bar */}
                    <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto" />

                    <div className="flex justify-center mt-1.5">
                        <ChevronUp className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${state === "expanded" ? "rotate-180" : ""}`} />
                    </div>
                </div>

                {/* Scrollable content */}
                <div className={`flex-1 overflow-hidden ${state === "expanded" ? "overflow-y-auto" : "overflow-hidden"}`}>
                    {children}
                </div>
            </div>
        </>
    );
}
