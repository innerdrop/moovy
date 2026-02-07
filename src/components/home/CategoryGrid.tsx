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

    // Split categories: first 3 fixed (larger), rest scrollable (smaller)
    const fixedCategories = categories.slice(0, 3);
    const scrollableCategories = categories.slice(3);

    // Large category item for the top row
    const LargeCategoryItem = ({ cat }: { cat: Category }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center"
            >
                <div className="w-full aspect-square max-w-[110px] bg-white rounded-2xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center gap-2 group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-gray-100 p-3">
                    <div className="w-14 h-14 flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-xs font-bold text-gray-700 text-center truncate w-full group-hover:text-[#e60012] transition-colors">
                        {cat.name}
                    </span>
                </div>
            </Link>
        );
    };

    // Smaller category item for the scrollable row
    const SmallCategoryItem = ({ cat }: { cat: Category }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center flex-shrink-0"
            >
                <div className="w-[75px] h-[75px] bg-white rounded-xl shadow-[0_3px_10px_-3px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center gap-1 group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-gray-100">
                    <div className="w-9 h-9 flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-[10px] font-bold text-gray-600 text-center truncate px-1 w-full group-hover:text-[#e60012] transition-colors">
                        {cat.name}
                    </span>
                </div>
            </Link>
        );
    };

    return (
        <section className="py-4 space-y-4 overflow-hidden">
            <div className="px-5 flex items-center justify-between">
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

            {/* Top Row: Fixed 3 Large Categories */}
            <div className="px-5 grid grid-cols-3 gap-4 justify-items-center">
                {fixedCategories.map((cat) => (
                    <LargeCategoryItem key={`fixed-${cat.id}`} cat={cat} />
                ))}
            </div>

            {/* Bottom Row: Smaller Scrollable Categories */}
            {scrollableCategories.length > 0 && (
                <div className="overflow-x-auto scrollbar-hide px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex gap-3 w-max">
                        {scrollableCategories.map((cat) => (
                            <SmallCategoryItem key={`scroll-${cat.id}`} cat={cat} />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
