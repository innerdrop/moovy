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

    // Show max 8 categories in grid (4x2)
    const displayCategories = categories.slice(0, 8);

    return (
        <section className="py-3 px-4">
            {/* Header */}
            <h2 className="text-lg font-bold text-gray-900 mb-3">
                Explora Categorías
            </h2>

            {/* Grid 4x2 */}
            <div className="grid grid-cols-4 gap-2 mb-3">
                {displayCategories.map((cat) => {
                    const iconKey = cat.icon || cat.slug;
                    const icon = getCategoryIcon(iconKey);

                    return (
                        <Link
                            key={cat.id}
                            href={`/productos?categoria=${cat.slug}`}
                            className="group flex flex-col items-center"
                        >
                            {/* White rounded box - icon + text inside */}
                            <div className="w-full aspect-square bg-white rounded-2xl shadow-sm flex flex-col items-center justify-end p-1 pb-1.5 group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                                <div className="flex-1 w-full flex items-center justify-center p-0">
                                    {icon}
                                </div>
                                <span className="text-[9px] font-bold text-gray-700 text-center leading-none truncate w-full px-0.5 mt-0">
                                    {cat.name}
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="flex justify-end">
                <Link
                    href="/productos"
                    className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-[#e60012] transition-colors border border-gray-200 rounded-full px-3 py-1"
                >
                    Ver todas
                    <ChevronRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </section>
    );
}
