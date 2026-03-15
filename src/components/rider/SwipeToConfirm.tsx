"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronRight, Loader2 } from "lucide-react";

interface SwipeToConfirmProps {
    label: string;
    onConfirm: () => Promise<void>;
    bgColor?: string;
    shadowColor?: string;
    disabled?: boolean;
}

export default function SwipeToConfirm({
    label,
    onConfirm,
    bgColor = "bg-amber-500",
    shadowColor = "shadow-amber-500/30",
    disabled = false,
}: SwipeToConfirmProps) {
    const [dragX, setDragX] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isConfirming, setIsConfirming] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const startXRef = useRef(0);

    const THRESHOLD = 0.70; // 70% of container width to confirm

    const getMaxDrag = useCallback(() => {
        if (!containerRef.current) return 200;
        return containerRef.current.clientWidth - 64; // 64 = thumb width
    }, []);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (disabled || isConfirming || confirmed) return;
        startXRef.current = e.touches[0].clientX;
        setIsDragging(true);
    }, [disabled, isConfirming, confirmed]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;
        const diff = e.touches[0].clientX - startXRef.current;
        const maxDrag = getMaxDrag();
        setDragX(Math.max(0, Math.min(diff, maxDrag)));
    }, [isDragging, getMaxDrag]);

    const handleTouchEnd = useCallback(async () => {
        if (!isDragging) return;
        setIsDragging(false);

        const maxDrag = getMaxDrag();
        const ratio = dragX / maxDrag;

        if (ratio >= THRESHOLD) {
            // Snap to end and confirm
            setDragX(maxDrag);
            setConfirmed(true);
            setIsConfirming(true);
            navigator?.vibrate?.([50, 50, 100]);
            try {
                await onConfirm();
            } finally {
                // Reset after action completes
                setTimeout(() => {
                    setDragX(0);
                    setConfirmed(false);
                    setIsConfirming(false);
                }, 500);
            }
        } else {
            // Snap back
            setDragX(0);
        }
    }, [isDragging, dragX, getMaxDrag, onConfirm]);

    const progress = containerRef.current ? dragX / getMaxDrag() : 0;

    return (
        <div
            ref={containerRef}
            className={`relative w-full h-[62px] rounded-[22px] ${bgColor} shadow-xl ${shadowColor} overflow-hidden select-none touch-none`}
        >
            {/* Progress fill */}
            <div
                className="absolute inset-0 bg-white/10 rounded-[22px]"
                style={{
                    width: `${(progress * 100) + 16}%`,
                    transition: isDragging ? "none" : "width 0.3s ease",
                }}
            />

            {/* Label (fades as you drag) */}
            <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{
                    opacity: Math.max(0, 1 - progress * 2),
                    transition: isDragging ? "none" : "opacity 0.3s ease",
                }}
            >
                <span className="text-white font-black text-[13px] uppercase tracking-[2px]">
                    {label}
                </span>
            </div>

            {/* Animated arrows hint (fades as you drag) */}
            <div
                className="absolute right-20 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none"
                style={{
                    opacity: Math.max(0, 0.4 - progress * 1.5),
                    transition: isDragging ? "none" : "opacity 0.3s ease",
                }}
            >
                <ChevronRight className="w-4 h-4 text-white animate-pulse" />
                <ChevronRight className="w-4 h-4 text-white animate-pulse [animation-delay:150ms]" />
            </div>

            {/* Draggable thumb */}
            <div
                className="absolute top-[5px] left-[5px] w-[52px] h-[52px] rounded-[18px] bg-white flex items-center justify-center shadow-lg cursor-grab active:cursor-grabbing"
                style={{
                    transform: `translateX(${dragX}px)`,
                    transition: isDragging ? "none" : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {isConfirming ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
                ) : (
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                )}
            </div>
        </div>
    );
}
