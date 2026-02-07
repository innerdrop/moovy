"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getCategoryIcon } from "@/lib/icons";

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
}

interface CategoryGridConfig {
    columns: number;
    rows: number;
    cardSize: "small" | "medium" | "large";
    scrollable: boolean;
    autoScroll: boolean;
    autoScrollSpeed: number;
    maxCategories: number;
}

interface CategoryGridProps {
    categories: Category[];
    config?: CategoryGridConfig;
}

const defaultConfig: CategoryGridConfig = {
    columns: 4,
    rows: 2,
    cardSize: "medium",
    scrollable: false,
    autoScroll: false,
    autoScrollSpeed: 3000,
    maxCategories: 8,
};

// Card size mappings
const cardSizes = {
    small: {
        iconContainer: "w-8 h-8",
        text: "text-[9px]",
        padding: "p-1",
    },
    medium: {
        iconContainer: "flex-1 w-full",
        text: "text-[11px]",
        padding: "p-2",
    },
    large: {
        iconContainer: "flex-1 w-full",
        text: "text-xs",
        padding: "p-2.5",
    },
};

export default function CategoryGrid({ categories, config }: CategoryGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const cfg = { ...defaultConfig, ...config };

    if (categories.length === 0) return null;

    // Calculate visible categories
    const maxVisible = cfg.columns * cfg.rows;
    const displayCategories = categories.slice(0, Math.min(cfg.maxCategories, maxVisible));

    // Auto-scroll effect
    useEffect(() => {
        if (!cfg.autoScroll || !cfg.scrollable || !scrollRef.current) return;

        const container = scrollRef.current;
        let scrollPosition = 0;
        const scrollStep = 100; // pixels per step

        const interval = setInterval(() => {
            scrollPosition += scrollStep;
            if (scrollPosition >= container.scrollWidth - container.clientWidth) {
                scrollPosition = 0;
            }
            container.scrollTo({ left: scrollPosition, behavior: "smooth" });
        }, cfg.autoScrollSpeed);

        return () => clearInterval(interval);
    }, [cfg.autoScroll, cfg.scrollable, cfg.autoScrollSpeed]);

    const sizeConfig = cardSizes[cfg.cardSize];
    const gridCols = cfg.columns === 3 ? "grid-cols-3" : "grid-cols-4";

    // Scrollable mode
    if (cfg.scrollable) {
        return (
            <section className="py-4 px-3 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">
                        Explora Categorías
                    </h2>
                    <Link
                        href="/productos"
                        className="text-gray-400 hover:text-[#e60012] transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </Link>
                </div>

                <div
                    ref={scrollRef}
                    className="overflow-x-auto scrollbar-hide pb-2"
                    style={{ scrollbarWidth: "none" }}
                >
                    <div className="flex gap-3 w-max">
                        {categories.slice(0, cfg.maxCategories).map((cat) => {
                            const iconKey = cat.icon || cat.slug;
                            const icon = getCategoryIcon(iconKey);

                            return (
                                <Link
                                    key={cat.id}
                                    href={`/productos?categoria=${cat.slug}`}
                                    className="group flex-shrink-0"
                                    style={{ width: cfg.cardSize === "small" ? "70px" : cfg.cardSize === "large" ? "100px" : "85px" }}
                                >
                                    <div className={`w-full aspect-square bg-white rounded-2xl shadow-md flex flex-col items-center justify-end ${sizeConfig.padding} group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100`}>
                                        <div className={`${sizeConfig.iconContainer} flex items-center justify-center`}>
                                            {icon}
                                        </div>
                                        <span className={`${sizeConfig.text} font-bold text-gray-700 text-center leading-tight truncate w-full px-0.5`}>
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

    // Grid mode (default)
    return (
        <section className="py-4 px-3">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
                Explora Categorías
            </h2>

            <div className={`grid ${gridCols} gap-2.5 mb-4`}>
                {displayCategories.map((cat) => {
                    const iconKey = cat.icon || cat.slug;
                    const icon = getCategoryIcon(iconKey);

                    return (
                        <Link
                            key={cat.id}
                            href={`/productos?categoria=${cat.slug}`}
                            className="group flex flex-col items-center"
                        >
                            <div className={`w-full aspect-square bg-white rounded-2xl shadow-md flex flex-col items-center justify-end ${sizeConfig.padding} group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100`}>
                                <div className={`${sizeConfig.iconContainer} flex items-center justify-center`}>
                                    {icon}
                                </div>
                                <span className={`${sizeConfig.text} font-bold text-gray-700 text-center leading-tight truncate w-full px-0.5`}>
                                    {cat.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            <div className="flex justify-end">
                <Link
                    href="/productos"
                    className="inline-flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-[#e60012] transition-colors border border-gray-200 rounded-full px-4 py-2"
                >
                    Ver todas
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}
