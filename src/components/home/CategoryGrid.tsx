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

    // First 3 categories fixed (larger), rest scrollable (smaller squares)
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
                <div className="w-full aspect-square bg-white rounded-2xl shadow-md flex flex-col items-center justify-end p-3 pb-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100">
                    <div className="flex-1 w-full flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-xs font-bold text-gray-700 text-center leading-tight truncate w-full">
                        {cat.name}
                    </span>
                </div>
            </Link>
        );
    };

    // Square cards for scrollable row - with visible text
    const ScrollableCategoryCard = ({ cat }: { cat: Category }) => {
        const iconKey = cat.icon || cat.slug;
        const icon = getCategoryIcon(iconKey);

        return (
            <Link
                href={`/productos?categoria=${cat.slug}`}
                className="group flex flex-col items-center flex-shrink-0"
            >
                <div className="w-[100px] h-[100px] bg-white rounded-2xl shadow-md flex flex-col items-center p-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-100">
                    <div className="w-full h-[65px] flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-[11px] font-bold text-gray-700 text-center leading-tight truncate w-full mt-auto">
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
            <div className="w-[100px] h-[100px] bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-md flex flex-col items-center justify-center gap-2 group-hover:shadow-lg group-hover:scale-105 transition-all duration-200 border border-gray-200">
                <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-[#e60012]" />
                </div>
                <span className="text-[11px] font-bold text-gray-600 text-center leading-tight">
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

            {/* Row 2: Scrollable categories - smaller squares + Ver más */}
            {scrollableCategories.length > 0 && (
                <div className="overflow-hidden -mx-3">
                    <div className="overflow-x-auto scrollbar-hide px-3 py-1" style={{ scrollbarWidth: 'none' }}>
                        <div className="flex gap-2 w-max pr-3">
                            {scrollableCategories.map((cat) => (
                                <ScrollableCategoryCard key={cat.id} cat={cat} />
                            ))}
                            <VerMasCard />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
