"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
import { ChevronRight, Store } from "lucide-react";

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
    const isPausedRef = useRef(false);
    const [isClient, setIsClient] = useState(false);

    // First 3 categories fixed (larger), rest scrollable
    const fixedCategories = categories.slice(0, 3);
    const scrollableCategories = categories.slice(3);

    // Mark as client-side after mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Auto-scroll effect - infinite seamless loop
    useEffect(() => {
        if (!isClient) return;
        if (scrollableCategories.length === 0) return;

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const speed = 0.8; // pixels per interval

        const intervalId = setInterval(() => {
            if (!isPausedRef.current && scrollContainer) {
                scrollContainer.scrollLeft += speed;

                // Get the width of one complete set of items
                const contentWidth = scrollContainer.scrollWidth / 2;

                // Reset to start when reaching the duplicate set (seamless loop)
                if (scrollContainer.scrollLeft >= contentWidth) {
                    scrollContainer.scrollLeft = 0;
                }
            }
        }, 30); // ~33fps

        return () => clearInterval(intervalId);
    }, [isClient, scrollableCategories.length]);

    // Touch/mouse handlers — pause on interaction, resume after delay
    const handleInteractionStart = useCallback(() => {
        isPausedRef.current = true;
    }, []);

    const handleInteractionEnd = useCallback(() => {
        setTimeout(() => {
            isPausedRef.current = false;
        }, 2000);
    }, []);

    // Early return AFTER all hooks
    if (categories.length === 0) return null;

    // Category image/fallback renderer
    const CategoryImage = ({ cat, size }: { cat: Category; size: "lg" | "sm" }) => {
        const dimensions = size === "lg" ? "w-full h-full" : "w-16 h-16 md:w-20 md:h-20";
        const rounded = size === "lg" ? "rounded-xl" : "rounded-xl";

        if (cat.image) {
            return (
                <img
                    src={cat.image}
                    alt={cat.name}
                    className={`${dimensions} ${rounded} object-cover`}
                />
            );
        }

        return (
            <div className={`${dimensions} ${rounded} bg-gradient-to-br from-[#e60012] to-[#ff4444] flex items-center justify-center`}>
                <Store className={`${size === "lg" ? "w-8 h-8" : "w-6 h-6"} text-white`} />
            </div>
        );
    };

    // Large cards for top row (first 3)
    const FixedCategoryCard = ({ cat }: { cat: Category }) => (
        <Link
            href={`/productos?categoria=${cat.slug}`}
            className="group flex flex-col items-center w-full"
        >
            <div className="w-full aspect-square bg-white rounded-2xl shadow-md flex flex-col items-center justify-between p-2 md:p-3 pt-2 pb-2 group-hover:shadow-lg group-hover:scale-[1.03] transition-all duration-200 border border-gray-100 overflow-hidden">
                <div className="w-full flex-1 flex items-center justify-center mb-1 overflow-hidden rounded-xl">
                    <CategoryImage cat={cat} size="lg" />
                </div>
                <span className="text-xs md:text-sm font-bold text-gray-700 text-center leading-tight w-full truncate">
                    {cat.name}
                </span>
            </div>
        </Link>
    );

    // Square cards for scrollable row
    const ScrollableCategoryCard = ({ cat }: { cat: Category }) => (
        <Link
            href={`/productos?categoria=${cat.slug}`}
            className="group flex flex-col items-center flex-shrink-0"
        >
            <div className="w-[100px] h-[100px] md:w-[130px] md:h-[130px] bg-white rounded-2xl shadow-md flex flex-col items-center p-2 md:p-3 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100 overflow-hidden">
                <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg">
                    <CategoryImage cat={cat} size="sm" />
                </div>
                <span className="text-[11px] md:text-xs font-bold text-gray-700 text-center leading-tight w-full mt-1 line-clamp-1">
                    {cat.name}
                </span>
            </div>
        </Link>
    );

    // "Ver más" card
    const VerMasCard = () => (
        <Link
            href="/productos"
            className="group flex flex-col items-center flex-shrink-0"
        >
            <div className="w-[100px] h-[100px] md:w-[130px] md:h-[130px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-200">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#e60012]" />
                </div>
                <span className="text-[11px] md:text-xs font-bold text-gray-600 text-center leading-tight">
                    Ver más
                </span>
            </div>
        </Link>
    );

    // Create the items for infinite scroll (duplicated for seamless loop)
    const scrollItems = [...scrollableCategories];
    const duplicatedItems = [...scrollItems, ...scrollItems];

    return (
        <section className="py-3 md:py-6 px-3 md:px-8 lg:px-16 space-y-3 md:space-y-4 max-w-7xl mx-auto">
            {/* Row 1: Fixed 3 categories - larger */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
                {fixedCategories.map((cat) => (
                    <FixedCategoryCard key={cat.id} cat={cat} />
                ))}
            </div>

            {/* Row 2: Auto-scrolling categories + Ver más */}
            {scrollableCategories.length > 0 && (
                <div className="overflow-hidden -mx-3 md:-mx-8 lg:-mx-16">
                    <div
                        ref={scrollRef}
                        className="overflow-x-auto scrollbar-hide px-3 md:px-8 lg:px-16 py-1"
                        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
                        onTouchStart={handleInteractionStart}
                        onTouchEnd={handleInteractionEnd}
                        onMouseDown={handleInteractionStart}
                        onMouseUp={handleInteractionEnd}
                        onMouseLeave={handleInteractionEnd}
                    >
                        <div className="flex gap-2 md:gap-3 w-max">
                            {duplicatedItems.map((cat, idx) => (
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
