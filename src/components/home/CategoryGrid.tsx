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

    // First 3 categories fixed, rest scrollable
    const fixedCategories = categories.slice(0, 3);
    const scrollableCategories = categories.slice(3);

    const FixedCategoryCard = ({ cat }: { cat: Category }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center w-full"
            >
                <div className="w-full aspect-square bg-white rounded-2xl shadow-md flex flex-col items-center justify-end p-2 pb-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100">
                    <div className="flex-1 w-full flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 text-center leading-tight truncate w-full px-0.5">
                        {cat.name}
                    </span>
                </div>
            </Link>
        );
    };

    const ScrollableCategoryCard = ({ cat }: { cat: Category }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center flex-shrink-0"
            >
                <div className="w-[85px] aspect-square bg-white rounded-2xl shadow-md flex flex-col items-center justify-end p-2 pb-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100">
                    <div className="flex-1 w-full flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-[10px] font-bold text-gray-700 text-center leading-tight truncate w-full px-0.5">
                        {cat.name}
                    </span>
                </div>
            </Link>
        );
    };

    return (
        <section className="py-3 px-3 space-y-3">
            {/* Row 1: Fixed 3 categories - full width */}
            <div className="grid grid-cols-3 gap-2">
                {fixedCategories.map((cat) => (
                    <FixedCategoryCard key={cat.id} cat={cat} />
                ))}
            </div>

            {/* Row 2: Scrollable categories */}
            {scrollableCategories.length > 0 && (
                <div className="overflow-x-auto scrollbar-hide -mx-3 px-3" style={{ scrollbarWidth: 'none' }}>
                    <div className="flex gap-3 w-max">
                        {scrollableCategories.map((cat) => (
                            <ScrollableCategoryCard key={cat.id} cat={cat} />
                        ))}
                    </div>
                </div>
            )}

            {/* Ver todas button */}
            <div className="flex justify-end pt-1">
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
