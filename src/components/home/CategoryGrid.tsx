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
    const isMobileRef = useRef(false);

    // First 3 categories fixed (larger), rest scrollable
    const fixedCategories = categories.slice(0, 3);
    const scrollableCategories = categories.slice(3);

    // Check if mobile on mount
    useEffect(() => {
        isMobileRef.current = window.innerWidth < 768;
        const handleResize = () => {
            isMobileRef.current = window.innerWidth < 768;
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Auto-scroll effect - works on both mobile and desktop
    useEffect(() => {
        if (scrollableCategories.length === 0) return;

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        let animationId: number;
        let lastTime = 0;
        const speed = 30; // pixels per second

        const autoScroll = (currentTime: number) => {
            if (lastTime === 0) lastTime = currentTime;
            const deltaTime = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            if (!isPausedRef.current && scrollContainer) {
                scrollContainer.scrollLeft += speed * deltaTime;

                // Reset to start when reaching halfway (seamless loop)
                const halfWidth = scrollContainer.scrollWidth / 2;
                if (scrollContainer.scrollLeft >= halfWidth) {
                    scrollContainer.scrollLeft = 0;
                }
            }
            animationId = requestAnimationFrame(autoScroll);
        };

        // Small delay before starting animation
        const timeoutId = setTimeout(() => {
            animationId = requestAnimationFrame(autoScroll);
        }, 500);

        return () => {
            clearTimeout(timeoutId);
            cancelAnimationFrame(animationId);
        };
    }, [scrollableCategories.length]);

    // Touch/mouse handlers using ref
    const handleInteractionStart = useCallback(() => {
        isPausedRef.current = true;
    }, []);

    const handleInteractionEnd = useCallback(() => {
        // Resume after a short delay
        setTimeout(() => {
            isPausedRef.current = false;
        }, 1500);
    }, []);

    // Early return AFTER all hooks
    if (categories.length === 0) return null;

    // Large cards for top row
    const FixedCategoryCard = ({ cat }: { cat: Category }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center w-full"
            >
                <div className="w-full aspect-square bg-white rounded-2xl shadow-md flex flex-col items-center justify-between p-2 md:p-4 pt-3 pb-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100">
                    <div className="w-full flex-1 flex items-center justify-center mb-1">
                        {icon}
                    </div>
                    <span className="text-sm md:text-base font-bold text-gray-700 text-center leading-tight w-full">
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
                <div className="w-[100px] h-[100px] md:w-[130px] md:h-[130px] bg-white rounded-2xl shadow-md flex flex-col items-center p-2 md:p-3 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100">
                    <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center flex-shrink-0">
                        {icon}
                    </div>
                    <span className="text-[11px] md:text-xs font-bold text-gray-700 text-center leading-tight w-full mt-auto line-clamp-2">
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
            <div className="w-[100px] h-[100px] md:w-[130px] md:h-[130px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-200">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 md:w-8 md:h-8 text-[#e60012]" />
                </div>
                <span className="text-[11px] md:text-xs font-bold text-gray-600 text-center leading-tight">
                    Ver más
                </span>
            </div>
        </Link>
    );

    return (
        <section className="py-3 md:py-6 px-3 md:px-8 lg:px-16 space-y-3 md:space-y-4 max-w-7xl mx-auto">
            {/* Row 1: Fixed 3 categories - larger */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                {fixedCategories.map((cat) => (
                    <FixedCategoryCard key={cat.id} cat={cat} />
                ))}
            </div>

            {/* Row 2: Scrollable categories with auto-scroll */}
            {scrollableCategories.length > 0 && (
                <div className="overflow-hidden -mx-3 md:-mx-8 lg:-mx-16">
                    <div
                        ref={scrollRef}
                        className="overflow-x-auto scrollbar-hide px-3 md:px-8 lg:px-16 py-1"
                        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                        onTouchStart={handleInteractionStart}
                        onTouchEnd={handleInteractionEnd}
                        onMouseDown={handleInteractionStart}
                        onMouseUp={handleInteractionEnd}
                        onMouseLeave={handleInteractionEnd}
                    >
                        <div className="flex gap-2 md:gap-3 w-max">
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
