"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Store } from "lucide-react";
import { getCategoryIcon } from "@/lib/icons";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    image?: string | null;
}

interface CategoryGridProps {
    categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const autoScrolling = useRef(true);
    const rafId = useRef(0);
    const prevTime = useRef(0);
    const resumeTimerId = useRef<ReturnType<typeof setTimeout>>(null);

    // Auto-scroll loop
    const tick = useCallback((now: number) => {
        const el = scrollRef.current;
        if (el && autoScrolling.current) {
            if (prevTime.current) {
                const dt = now - prevTime.current;
                el.scrollLeft += (25 * dt) / 1000; // 25px/s
                // Seamless reset at halfway (duplicate point)
                const half = el.scrollWidth / 2;
                if (el.scrollLeft >= half) el.scrollLeft -= half;
            }
            prevTime.current = now;
        }
        rafId.current = requestAnimationFrame(tick);
    }, []);

    useEffect(() => {
        if (categories.length === 0) return;
        rafId.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId.current);
    }, [categories.length, tick]);

    // Pause auto-scroll on touch — native scroll takes over
    const onTouchStart = useCallback(() => {
        autoScrolling.current = false;
        prevTime.current = 0;
        if (resumeTimerId.current) clearTimeout(resumeTimerId.current);
    }, []);

    const onTouchEnd = useCallback(() => {
        resumeTimerId.current = setTimeout(() => {
            prevTime.current = 0;
            autoScrolling.current = true;
        }, 3000);
    }, []);

    if (categories.length === 0) return null;

    const items = [...categories, ...categories];

    return (
        <div className="overflow-hidden">
            <div
                ref={scrollRef}
                className="flex gap-2 overflow-x-scroll py-1 px-4"
                style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                    touchAction: "pan-x",
                }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                onMouseEnter={onTouchStart}
                onMouseLeave={onTouchEnd}
            >
                {/* Hide webkit scrollbar */}
                <style>{`.cat-scroll::-webkit-scrollbar { display: none; }`}</style>
                {items.map((cat, idx) => (
                    <Link
                        key={`${cat.id}-${idx}`}
                        href={`/productos?categoria=${cat.slug}`}
                        className="flex-shrink-0 group cat-scroll"
                    >
                        <div className="flex flex-col items-center gap-1.5 w-[74px]">
                            <div className="w-[66px] h-[66px] rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-105 transition-all duration-200">
                                <CategoryImage cat={cat} />
                            </div>
                            <span className="text-[12px] font-bold text-gray-800 group-hover:text-[#e60012] transition-colors text-center leading-tight w-full truncate">
                                {cat.name}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

function CategoryImage({ cat }: { cat: Category }) {
    if (cat.image) {
        return (
            <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-contain"
            />
        );
    }

    const iconKey = cat.icon || cat.slug;
    const icon = getCategoryIcon(iconKey);

    return <div className="w-full h-full flex items-center justify-center p-1">{icon}</div>;
}
