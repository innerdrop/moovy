"use client";

import React, { useRef, useCallback, useState } from "react";
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
    const [isPaused, setIsPaused] = useState(false);
    const resumeTimer = useRef<ReturnType<typeof setTimeout>>(null);

    const handleInteractionStart = useCallback(() => {
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        setIsPaused(true);
    }, []);

    const handleInteractionEnd = useCallback(() => {
        resumeTimer.current = setTimeout(() => setIsPaused(false), 2500);
    }, []);

    if (categories.length === 0) return null;

    // Duplicate for seamless loop
    const items = [...categories, ...categories];

    // Duration scales with number of items for consistent speed
    const duration = categories.length * 3;

    return (
        <div className="overflow-hidden">
            <style>{`
                @keyframes scroll-categories {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
            <div
                className="py-1 px-4"
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseEnter={handleInteractionStart}
                onMouseLeave={handleInteractionEnd}
            >
                <div
                    className="flex gap-2 w-max"
                    style={{
                        animation: `scroll-categories ${duration}s linear infinite`,
                        animationPlayState: isPaused ? "paused" : "running",
                    }}
                >
                    {items.map((cat, idx) => (
                        <Link
                            key={`${cat.id}-${idx}`}
                            href={`/productos?categoria=${cat.slug}`}
                            className="flex-shrink-0 group"
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
        </div>
    );
}

// Image with fallback to icon
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
