"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
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

// Organic blob shapes using clip-path
const blobShapes = [
    "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)", // Hexagon
    "ellipse(50% 45% at 50% 50%)", // Oval
    "circle(50% at 50% 50%)", // Circle
];

export default function CategoryGrid({ categories }: CategoryGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const isPausedRef = useRef(false);
    const [isClient, setIsClient] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [clickedCategory, setClickedCategory] = useState<Category | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const router = useRouter();

    // First 3 categories fixed (larger), rest scrollable
    const fixedCategories = categories.slice(0, 3);
    const scrollableCategories = categories.slice(3);

    // Create infinite loop array (triple the items for seamless loop)
    const infiniteCategories = scrollableCategories.length > 0
        ? [...scrollableCategories, ...scrollableCategories, ...scrollableCategories]
        : [];

    // Mark as client-side after mount
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Auto-scroll effect with seamless infinite loop
    useEffect(() => {
        if (!isClient) return;
        if (scrollableCategories.length === 0) return;

        const scrollContainer = scrollRef.current;
        if (!scrollContainer) return;

        const speed = 0.8; // pixels per interval

        // Start from the middle section
        const oneThird = scrollContainer.scrollWidth / 3;
        scrollContainer.scrollLeft = oneThird;

        const intervalId = setInterval(() => {
            if (!isPausedRef.current && scrollContainer) {
                scrollContainer.scrollLeft += speed;

                // When we reach 2/3 of scroll, jump back to 1/3 (seamless loop)
                const twoThirds = scrollContainer.scrollWidth * 2 / 3;
                if (scrollContainer.scrollLeft >= twoThirds) {
                    scrollContainer.scrollLeft = oneThird;
                }
            }
        }, 16); // ~60fps

        return () => clearInterval(intervalId);
    }, [isClient, scrollableCategories.length]);

    // Touch/mouse handlers
    const handleInteractionStart = useCallback(() => {
        isPausedRef.current = true;
    }, []);

    const handleInteractionEnd = useCallback(() => {
        setTimeout(() => {
            isPausedRef.current = false;
        }, 2000);
    }, []);

    // Handle category click with expand animation
    const handleCategoryClick = useCallback((e: React.MouseEvent, cat: Category) => {
        e.preventDefault();
        setClickedCategory(cat);
        setIsAnimating(true);

        // Navigate after animation
        setTimeout(() => {
            router.push(`/productos?categoria=${cat.slug}`);
        }, 400);
    }, [router]);

    // Early return AFTER all hooks
    if (categories.length === 0) return null;

    // Calculate dock magnification based on distance from hovered item
    const getDockScale = (index: number, hoveredIdx: number | null) => {
        if (hoveredIdx === null) return 1;
        const distance = Math.abs(index - hoveredIdx);
        if (distance === 0) return 1.5;
        if (distance === 1) return 1.25;
        if (distance === 2) return 1.1;
        return 1;
    };

    // Fixed category card - Circular organic design
    const FixedCategoryCard = ({ cat, index }: { cat: Category; index: number }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);
        const isHovered = hoveredIndex === index;
        const scale = getDockScale(index, hoveredIndex);
        const isClicked = clickedCategory?.id === cat.id;

        return (
            <button
                onClick={(e) => handleCategoryClick(e, cat)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="group flex flex-col items-center w-full relative"
                style={{
                    transform: isClicked ? 'scale(20)' : `scale(${scale})`,
                    transition: isClicked ? 'transform 0.4s cubic-bezier(0.4, 0, 0, 1)' : 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: isHovered || isClicked ? 10 : 1,
                    opacity: isClicked ? 0 : 1,
                }}
            >
                {/* Circular container with gradient border */}
                <div
                    className="relative w-full aspect-square"
                    style={{ maxWidth: '120px' }}
                >
                    {/* Glow effect on hover */}
                    <div
                        className="absolute inset-0 rounded-full blur-xl transition-opacity duration-300"
                        style={{
                            background: 'radial-gradient(circle, rgba(230,0,18,0.4) 0%, transparent 70%)',
                            opacity: isHovered ? 1 : 0,
                            transform: 'scale(1.2)',
                        }}
                    />

                    {/* Main circle with glass effect */}
                    <div
                        className="relative w-full h-full rounded-full flex flex-col items-center justify-center p-3 transition-all duration-200"
                        style={{
                            background: isHovered
                                ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)'
                                : 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(245,245,245,0.95) 100%)',
                            boxShadow: isHovered
                                ? '0 20px 40px rgba(230,0,18,0.2), 0 8px 16px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.5)'
                                : '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04), inset 0 1px 2px rgba(255,255,255,0.5)',
                            border: '1px solid rgba(255,255,255,0.8)',
                        }}
                    >
                        {/* Icon */}
                        <div
                            className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center transition-transform duration-200"
                            style={{
                                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                            }}
                        >
                            {icon}
                        </div>
                    </div>
                </div>

                {/* Label below */}
                <span
                    className="text-xs md:text-sm font-semibold text-gray-700 text-center mt-2 transition-all duration-200 line-clamp-2 px-1"
                    style={{
                        opacity: isHovered ? 1 : 0.8,
                        transform: isHovered ? 'translateY(2px)' : 'translateY(0)',
                    }}
                >
                    {cat.name}
                </span>

                {/* Reflection effect */}
                <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-4 rounded-full transition-opacity duration-200"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.08) 0%, transparent 70%)',
                        opacity: isHovered ? 0.6 : 0.3,
                    }}
                />
            </button>
        );
    };

    // Scrollable category - Dock style
    const DockCategoryCard = ({ cat, index }: { cat: Category; index: number }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);
        const globalIndex = index + 100; // Offset to avoid collision with fixed categories
        const isHovered = hoveredIndex === globalIndex;
        const scale = getDockScale(globalIndex, hoveredIndex);
        const isClicked = clickedCategory?.id === cat.id;

        return (
            <button
                onClick={(e) => handleCategoryClick(e, cat)}
                onMouseEnter={() => setHoveredIndex(globalIndex)}
                onMouseLeave={() => setHoveredIndex(null)}
                onTouchStart={() => setHoveredIndex(globalIndex)}
                onTouchEnd={() => setTimeout(() => setHoveredIndex(null), 100)}
                className="flex-shrink-0 flex flex-col items-center relative"
                style={{
                    transform: isClicked ? 'scale(20)' : `scale(${scale})`,
                    transition: isClicked ? 'transform 0.4s cubic-bezier(0.4, 0, 0, 1)' : 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    zIndex: isHovered || isClicked ? 10 : 1,
                    opacity: isClicked ? 0 : 1,
                    marginBottom: isHovered ? '10px' : '0',
                }}
            >
                {/* Glow effect */}
                <div
                    className="absolute inset-0 rounded-full blur-lg transition-opacity duration-200"
                    style={{
                        background: 'radial-gradient(circle, rgba(230,0,18,0.3) 0%, transparent 60%)',
                        opacity: isHovered ? 1 : 0,
                        transform: 'scale(1.3)',
                    }}
                />

                {/* Main circular container */}
                <div
                    className="relative w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center transition-all duration-150"
                    style={{
                        background: isHovered
                            ? 'linear-gradient(145deg, #ffffff 0%, #f8f8f8 100%)'
                            : 'linear-gradient(145deg, #fafafa 0%, #f0f0f0 100%)',
                        boxShadow: isHovered
                            ? '0 12px 28px rgba(230,0,18,0.15), 0 4px 8px rgba(0,0,0,0.08), inset 0 1px 1px rgba(255,255,255,0.6)'
                            : '0 2px 8px rgba(0,0,0,0.06), inset 0 1px 1px rgba(255,255,255,0.5)',
                        border: '1px solid rgba(255,255,255,0.9)',
                    }}
                >
                    <div
                        className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center"
                        style={{
                            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                            transition: 'transform 0.15s ease',
                        }}
                    >
                        {icon}
                    </div>
                </div>

                {/* Label with bounce animation */}
                <span
                    className="text-[10px] md:text-xs font-semibold text-gray-600 text-center mt-1.5 max-w-[70px] md:max-w-[90px] line-clamp-2 leading-tight transition-all duration-150"
                    style={{
                        opacity: isHovered ? 1 : 0.7,
                        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                    }}
                >
                    {cat.name}
                </span>

                {/* Reflection */}
                <div
                    className="absolute -bottom-1 w-10 h-2 rounded-full"
                    style={{
                        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.06) 0%, transparent 70%)',
                        opacity: isHovered ? 0.8 : 0.4,
                    }}
                />
            </button>
        );
    };

    return (
        <>
            {/* Fullscreen overlay for click animation */}
            {isAnimating && clickedCategory && (
                <div
                    className="fixed inset-0 z-50 pointer-events-none"
                    style={{
                        background: 'radial-gradient(circle at center, rgba(230,0,18,0.15) 0%, white 70%)',
                        animation: 'fadeIn 0.3s ease forwards',
                    }}
                />
            )}

            <section className="py-4 md:py-8 px-3 md:px-8 lg:px-16 max-w-7xl mx-auto space-y-6 md:space-y-8">
                {/* Row 1: Fixed 3 categories - Dock style */}
                <div
                    className="flex items-end justify-center gap-4 md:gap-8 py-4"
                    style={{
                        background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.02) 100%)',
                        borderRadius: '24px',
                    }}
                >
                    {fixedCategories.map((cat, index) => (
                        <FixedCategoryCard key={cat.id} cat={cat} index={index} />
                    ))}
                </div>

                {/* Row 2: Infinite scrolling dock */}
                {scrollableCategories.length > 0 && (
                    <div className="relative">
                        {/* Gradient fade edges */}
                        <div className="absolute left-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
                        <div className="absolute right-0 top-0 bottom-0 w-12 md:w-20 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

                        {/* Dock bar background */}
                        <div
                            className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[60px] md:h-[70px] rounded-full"
                            style={{
                                width: 'calc(100% - 40px)',
                                background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(245,245,245,0.9) 100%)',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.05), inset 0 1px 1px rgba(255,255,255,0.5)',
                                border: '1px solid rgba(255,255,255,0.6)',
                            }}
                        />

                        {/* Scrollable container */}
                        <div
                            ref={scrollRef}
                            className="overflow-x-auto scrollbar-hide py-4 relative z-20"
                            style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                            onTouchStart={handleInteractionStart}
                            onTouchEnd={handleInteractionEnd}
                            onMouseEnter={handleInteractionStart}
                            onMouseLeave={() => {
                                setHoveredIndex(null);
                                handleInteractionEnd();
                            }}
                        >
                            <div className="flex items-end gap-3 md:gap-5 px-16 md:px-24">
                                {infiniteCategories.map((cat, idx) => (
                                    <DockCategoryCard key={`${cat.id}-${idx}`} cat={cat} index={idx} />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </section>
        </>
    );
}
