"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
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
    const isPausedRef = useRef(false);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Auto-scroll with requestAnimationFrame (works on mobile)
    useEffect(() => {
        if (!isClient || categories.length === 0) return;

        const el = scrollRef.current;
        if (!el) return;

        const speed = 30; // pixels per second

        const animate = (timestamp: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = timestamp;
            const delta = timestamp - lastTimeRef.current;
            lastTimeRef.current = timestamp;

            if (!isPausedRef.current && el) {
                el.scrollLeft += (speed * delta) / 1000;
                const half = el.scrollWidth / 2;
                if (el.scrollLeft >= half) el.scrollLeft = 0;
            }

            rafRef.current = requestAnimationFrame(animate);
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isClient, categories.length]);

    const handleInteractionStart = useCallback(() => {
        isPausedRef.current = true;
    }, []);

    const handleInteractionEnd = useCallback(() => {
        setTimeout(() => {
            isPausedRef.current = false;
            lastTimeRef.current = 0; // reset to avoid jump
        }, 2000);
    }, []);

    if (categories.length === 0) return null;

    // Duplicated for seamless infinite loop
    const duplicated = [...categories, ...categories];

    return (
        <div className="overflow-hidden">
            <div
                ref={scrollRef}
                className="overflow-x-auto scrollbar-hide py-1 px-4"
                style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd}
            >
                <div className="flex gap-3 w-max">
                    {duplicated.map((cat, idx) => (
                        <Link
                            key={`${cat.id}-${idx}`}
                            href={`/productos?categoria=${cat.slug}`}
                            className="flex-shrink-0 group"
                        >
                            <div className="flex flex-col items-center gap-2 w-[76px]">
                                <div className="w-[64px] h-[64px] rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-105 transition-all duration-200">
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
