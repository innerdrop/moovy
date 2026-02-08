"use client";

import React from "react";
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
    if (categories.length === 0) return null;

    // First 3 categories fixed (larger), rest scrollable
    const fixedCategories = categories.slice(0, 3);
    const scrollableCategories = categories.slice(3);

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

    // Square cards for scrollable row - smaller icons, visible text
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

    // "Ver más" card at the end - same size as categories
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

            {/* Row 2: Scrollable categories with subtle auto-scroll */}
            {scrollableCategories.length > 0 && (
                <div className="overflow-hidden -mx-3">
                    <div className="overflow-x-auto scrollbar-hide px-3 py-1" style={{ scrollbarWidth: 'none' }}>
                        <div className="flex gap-2 w-max animate-scroll-right">
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
