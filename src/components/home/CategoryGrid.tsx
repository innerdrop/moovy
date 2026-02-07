"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryIcon } from "@/lib/icons";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

interface CategoryGridProps {
    categories: Category[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);

    // Duplicate categories significantly to ensure seamless infinite scroll
    // Only if we have categories, otherwise empty array
    const displayCategories = categories.length > 0
        ? [...categories, ...categories, ...categories, ...categories]
        : [];

    useEffect(() => {
        const scrollContainer = scrollRef.current;
        if (!scrollContainer || displayCategories.length === 0) return;

        let animationFrameId: number;
        let scrollPos = 0;
        const speed = 0.5; // Adjust speed here (pixels per frame)

        const scroll = () => {
            if (!isPaused && scrollContainer) {
                scrollPos += speed;

                // If we've scrolled past the first set of items (approx), reset to 0
                // We assume the first set width is roughly total scroll width / 4
                if (scrollPos >= scrollContainer.scrollWidth / 4) {
                    scrollPos = 0;
                }

                scrollContainer.scrollLeft = scrollPos;
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPaused, displayCategories.length]);

    if (categories.length === 0) return null;

    return (
        <section className="py-4">
            <div className="px-5 mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">
                    Explora Categorías
                </h2>
                <Link
                    href="/productos"
                    className="text-xs font-bold text-gray-400 flex items-center gap-0.5 hover:text-[#e60012] transition-colors"
                >
                    Ver todas
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>

            {/* Auto-Scroll Container */}
            <div
                ref={scrollRef}
                className="overflow-x-hidden whitespace-nowrap px-0 scrollbar-hide"
                style={{ scrollbarWidth: 'none' }}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                onTouchStart={() => setIsPaused(true)}
                onTouchEnd={() => setIsPaused(false)}
            >
                <div className="inline-grid grid-rows-2 grid-flow-col gap-x-2.5 gap-y-3 pb-2 px-5">
                    {displayCategories.map((cat, index) => {
                        // Use the icon from DB if available, otherwise try to match by slug fallback in getCategoryIcon
                        // We pass cat.icon first, if null it falls back to slug logic inside getCategoryIcon? 
                        // Actually getCategoryIcon takes a string key. 
                        // Let's modify logic: if cat.icon exists use it, else use cat.slug as key
                        const iconKey = cat.icon || cat.slug;
                        const icon = getCategoryIcon(iconKey);

                        return (
                            <Link
                                key={`${cat.id}-${index}`}
                                href={`/productos?categoria=${cat.slug}`}
                                className="group w-[82px]"
                            >
                                <div className="w-[82px] h-[82px] bg-white rounded-2xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center gap-1 group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-gray-100">
                                    <div className="scale-90 h-10 flex items-center justify-center text-gray-800">
                                        {icon}
                                    </div>
                                    <span className="text-[11px] font-bold text-gray-600 text-center truncate px-1 w-full group-hover:text-[#e60012] transition-colors">
                                        {cat.name}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
