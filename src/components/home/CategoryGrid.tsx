"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import Link from "next/link";
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
    const isPaused = useRef(false);
    const rafId = useRef(0);
    const prevTime = useRef(0);
    const resumeTimer = useRef<ReturnType<typeof setTimeout>>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (categories.length === 0) return;
        const t = setTimeout(() => setReady(true), 300);
        return () => clearTimeout(t);
    }, [categories.length]);

    const tick = useCallback((now: number) => {
        const el = scrollRef.current;
        if (el && !isPaused.current) {
            const maxScroll = el.scrollWidth - el.clientWidth;
            if (maxScroll > 0) {
                if (prevTime.current) {
                    const dt = Math.min(now - prevTime.current, 50);
                    el.scrollLeft += (22 * dt) / 1000;
                    // Al llegar al final, volver al inicio
                    if (el.scrollLeft >= maxScroll) {
                        el.scrollLeft = 0;
                    }
                }
                prevTime.current = now;
            }
        } else {
            prevTime.current = 0;
        }
        rafId.current = requestAnimationFrame(tick);
    }, []);

    useEffect(() => {
        if (!ready) return;
        rafId.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId.current);
    }, [ready, tick]);

    const pause = useCallback(() => {
        isPaused.current = true;
        prevTime.current = 0;
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
    }, []);

    const resume = useCallback(() => {
        if (resumeTimer.current) clearTimeout(resumeTimer.current);
        resumeTimer.current = setTimeout(() => {
            prevTime.current = 0;
            isPaused.current = false;
        }, 3000);
    }, []);

    if (categories.length === 0) return null;

    return (
        <div className="container mx-auto px-4">
            <h2 className="text-xl lg:text-2xl font-black text-gray-900 mb-4">
                Explorá por categorías
            </h2>
            <style>{`
                .catscroll { -ms-overflow-style: none; scrollbar-width: none; }
                .catscroll::-webkit-scrollbar { display: none; }
            `}</style>
            <div
                ref={scrollRef}
                className="catscroll overflow-x-auto py-1 px-4"
                onTouchStart={pause}
                onTouchEnd={resume}
                onMouseEnter={pause}
                onMouseLeave={resume}
            >
                <div className="flex gap-2 w-max">
                    {categories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/productos?categoria=${cat.slug}`}
                            className="flex-shrink-0 group"
                        >
                            <div className="flex flex-col items-center gap-1.5 w-[74px]">
                                <div className="w-[66px] h-[66px] rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center group-hover:bg-gray-200 group-hover:scale-105 transition-all duration-200">
                                    <CategoryImage cat={cat} />
                                </div>
                                <span className="text-xs font-bold text-gray-800 group-hover:text-[#e60012] transition-colors text-center leading-tight w-full truncate">
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
