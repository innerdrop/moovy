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

    // Split categories: first 3 fixed, rest scrollable
    const fixedCategories = categories.slice(0, 3);
    const scrollableCategories = categories.slice(3);

    const CategoryItem = ({ cat, className = "" }: { cat: Category, className?: string }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className={`group flex flex-col items-center gap-2 ${className}`}
            >
                <div className="w-[85px] h-[85px] bg-white rounded-2xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.1)] flex flex-col items-center justify-center gap-1 group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-gray-100">
                    <div className="scale-90 h-10 flex items-center justify-center text-gray-800">
                        {icon}
                    </div>
                    <span className="text-[11px] font-bold text-gray-600 text-center truncate px-1 w-full group-hover:text-[#e60012] transition-colors">
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

            {/* Top Row: Fixed 3 Categories */}
            <div className="px-5 grid grid-cols-3 gap-3">
                {fixedCategories.map((cat) => (
                    <CategoryItem key={`fixed-${cat.id}`} cat={cat} className="w-full" />
                ))}
            </div>

            {/* Bottom Row: Manual Scrollable Carousel */}
            {scrollableCategories.length > 0 && (
                <div className="overflow-x-auto scrollbar-hide px-5 pb-2" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex gap-3 w-max">
                        {scrollableCategories.map((cat) => (
                            <CategoryItem key={`scroll-${cat.id}`} cat={cat} className="w-[85px] flex-shrink-0" />
                        ))}
                    </div>
                </div>
            )}
        </section>
    );
}
