"use client";

import React, { useRef, useEffect, useCallback } from "react";
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
    const isPausedRef = useRef(false);

    // First 3 categories fixed (larger), rest scrollable
    const fixedCategories = categories.slice(0, 3);
    const scrollableCategories = categories.slice(3);

    // Auto-scroll effect - using ref to avoid re-creating animation loop
    useEffect(() => {
        if (scrollableCategories.length === 0) return;

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId: number;
        const speed = 0.5; // pixels per frame

        const autoScroll = () => {
            if (!isPausedRef.current && scrollContainer) {
                scrollContainer.scrollLeft += speed;

                // Reset to start when reaching halfway (seamless loop)
                const halfWidth = scrollContainer.scrollWidth / 2;
                if (scrollContainer.scrollLeft >= halfWidth) {
                    scrollContainer.scrollLeft = 0;
                }
            }
            animationId = requestAnimationFrame(autoScroll);
        };

        animationId = requestAnimationFrame(autoScroll);

        return () => cancelAnimationFrame(animationId);
    }, [scrollableCategories.length]);

    // Early return after hooks
    if (categories.length === 0) return null;

    // Touch/mouse handlers using ref
    const handleInteractionStart = useCallback(() => {
        isPausedRef.current = true;
    }, []);

    const handleInteractionEnd = useCallback(() => {
        // Resume after a short delay
        setTimeout(() => {
            isPausedRef.current = false;
        }, 1000);
    }, []);

    // Large cards for top row
    const FixedCategoryCard = ({ cat }: { cat: Category }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center w-full"
            >
                <div className="w-full aspect-square bg-white rounded-2xl shadow-md flex flex-col items-center justify-between p-2 pt-3 pb-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100">
                    <div className="w-full flex-1 flex items-center justify-center mb-1">
                        {icon}
                    </div>
                    <span className="text-sm font-bold text-gray-700 text-center leading-tight w-full">
                        {cat.name}
                    </span>
                </div>
            </Link>
        );
    };

    // Square cards for scrollable row
    const ScrollableCategoryCard = ({ cat }: { cat: Category }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center flex-shrink-0"
            >
                <div className="w-[115px] h-[115px] bg-white rounded-2xl shadow-md flex flex-col items-center p-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100">
                    <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
                        {icon}
                    </div>
                    <span className="text-xs font-bold text-gray-700 text-center leading-tight w-full mt-auto line-clamp-2">
                        {cat.name}
                    </span>
                </div>
            </Link>
        );
    };

    // "Ver más" card at the end
    const VerMasCard = () => (
        <Link
            href="/productos"
            className="group flex flex-col items-center flex-shrink-0"
        >
            <div className="w-[115px] h-[115px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-200">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ChevronRight className="w-8 h-8 text-[#e60012]" />
                </div>
                <span className="text-xs font-bold text-gray-600 text-center leading-tight">
                    Ver más
                </span>
            </div>
        </Link>
    );

    return (
        <section className="py-3 px-3 space-y-3">
            {/* Row 1: Fixed 3 categories - larger */}
            <div className="grid grid-cols-3 gap-2">
                {fixedCategories.map((cat) => (
                    <FixedCategoryCard key={cat.id} cat={cat} />
                ))}
            </div>

            {/* Row 2: Scrollable categories with auto-scroll */}
            {scrollableCategories.length > 0 && (
                <div className="overflow-hidden -mx-3">
                    <div
                        ref={scrollRef}
                        className="overflow-x-auto scrollbar-hide px-3 py-1"
                        style={{ scrollbarWidth: 'none' }}
                        onTouchStart={handleInteractionStart}
                        onTouchEnd={handleInteractionEnd}
                        onMouseDown={handleInteractionStart}
                        onMouseUp={handleInteractionEnd}
                        onMouseLeave={handleInteractionEnd}
                    >
                        <div className="flex gap-2 w-max">
                            {/* Duplicate items for seamless loop */}
                            {[...scrollableCategories, ...scrollableCategories].map((cat, idx) => (
                                <ScrollableCategoryCard key={`${cat.id}-${idx}`} cat={cat} />
                            ))}
                            <VerMasCard />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
