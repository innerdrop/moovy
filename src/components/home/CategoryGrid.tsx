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
        <section className="py-5 px-4">
            {/* Header */}
            <h2 className="text-xl font-bold text-gray-900 mb-5">
                Explora Categorías
            </h2>

            {/* Grid 4x2 */}
            <div className="grid grid-cols-4 gap-3 mb-5">
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
                            <div className="w-full aspect-square bg-white rounded-2xl shadow-sm flex flex-col items-center justify-center p-1.5 group-hover:shadow-md group-hover:scale-105 transition-all duration-200">
                                <div className="flex-1 w-full flex items-center justify-center">
                                    {icon}
                                </div>
                                <span className="text-[10px] font-bold text-gray-700 text-center leading-tight truncate w-full px-1 pb-0.5">
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
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-[#e60012] transition-colors border border-gray-200 rounded-full px-4 py-1.5"
                >
                    Ver todas
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>
        </section>
    );
}
