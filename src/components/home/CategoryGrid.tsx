"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
}

interface CategoryGridProps {
    categories: Category[];
}

// SVG Icons for categories
const categoryIcons: Record<string, React.ReactNode> = {
    vinos: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <path d="M20 5 L25 18 Q25 25 20 28 Q15 25 15 18 L20 5" fill="#8B0000" />
            <rect x="18" y="28" width="4" height="8" fill="#8B4513" />
            <ellipse cx="20" cy="37" rx="6" ry="2" fill="#8B4513" />
            <path d="M30 8 L35 20 Q35 27 30 30" stroke="#DC143C" strokeWidth="3" fill="none" />
        </svg>
    ),
    bebidas: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <path d="M10 10 L12 35 L28 35 L30 10 Z" fill="#e60012" />
            <ellipse cx="20" cy="10" rx="10" ry="3" fill="#cc0010" />
            <rect x="14" y="18" width="12" height="4" fill="#fff" opacity="0.3" />
            <circle cx="20" cy="28" r="4" fill="#fff" opacity="0.2" />
        </svg>
    ),
    snacks: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            {/* Pizza slice */}
            <path d="M8 30 L20 5 L32 30 Z" fill="#FFD700" />
            <circle cx="15" cy="22" r="3" fill="#e60012" />
            <circle cx="22" cy="18" r="2.5" fill="#e60012" />
            <circle cx="18" cy="26" r="2" fill="#e60012" />
            <path d="M8 30 Q20 33 32 30" fill="#DAA520" />
        </svg>
    ),
    kioscos: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect x="8" y="15" width="24" height="20" fill="#4A90D9" rx="2" />
            <path d="M5 15 L20 5 L35 15 Z" fill="#e60012" />
            <rect x="16" y="22" width="8" height="13" fill="#87CEEB" />
            <rect x="10" y="18" width="5" height="5" fill="#fff" />
            <rect x="25" y="18" width="5" height="5" fill="#fff" />
        </svg>
    ),
    esenciales: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect x="5" y="12" width="18" height="14" fill="#4A90D9" rx="2" />
            <rect x="17" y="18" width="18" height="14" fill="#e60012" rx="2" />
            <rect x="7" y="14" width="6" height="3" fill="#fff" opacity="0.5" />
            <rect x="19" y="20" width="6" height="3" fill="#fff" opacity="0.5" />
        </svg>
    ),
    aperitivos: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            {/* Popcorn bucket */}
            <path d="M10 15 L12 35 L28 35 L30 15 Z" fill="#e60012" />
            <path d="M8 15 L32 15 L30 12 L10 12 Z" fill="#cc0010" />
            {/* Popcorn */}
            <circle cx="16" cy="10" r="4" fill="#FFF8DC" />
            <circle cx="24" cy="10" r="4" fill="#FFF8DC" />
            <circle cx="20" cy="7" r="4" fill="#FFFACD" />
            <circle cx="14" cy="6" r="3" fill="#FFF8DC" />
            <circle cx="26" cy="6" r="3" fill="#FFF8DC" />
        </svg>
    ),
    lacteos: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <path d="M12 8 L14 12 L26 12 L28 8 Z" fill="#87CEEB" />
            <rect x="14" y="12" width="12" height="22" fill="#fff" stroke="#ddd" strokeWidth="1" rx="2" />
            <rect x="16" y="15" width="8" height="6" fill="#87CEEB" rx="1" />
            <text x="17" y="20" fontSize="5" fill="#fff" fontWeight="bold">MILK</text>
        </svg>
    ),
    golosinas: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <circle cx="20" cy="20" r="10" fill="#FF69B4" />
            <path d="M12 15 Q8 12 10 8" stroke="#FF69B4" strokeWidth="4" fill="none" />
            <path d="M28 15 Q32 12 30 8" stroke="#FF69B4" strokeWidth="4" fill="none" />
            <circle cx="17" cy="18" r="2" fill="#fff" opacity="0.5" />
        </svg>
    ),
    limpieza: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect x="14" y="8" width="12" height="24" fill="#4ECDC4" rx="3" />
            <rect x="16" y="4" width="8" height="6" fill="#45B7AA" rx="2" />
            <rect x="16" y="14" width="8" height="8" fill="#fff" rx="1" />
            <path d="M18 30 Q20 35 22 30" stroke="#fff" strokeWidth="2" fill="none" />
        </svg>
    ),
    almacen: (
        <svg viewBox="0 0 40 40" className="w-8 h-8">
            <rect x="8" y="20" width="24" height="15" fill="#8B4513" rx="2" />
            <rect x="10" y="22" width="8" height="6" fill="#DEB887" />
            <rect x="22" y="22" width="8" height="6" fill="#DEB887" />
            <rect x="14" y="30" width="12" height="5" fill="#DEB887" />
            <path d="M5 20 L20 8 L35 20 Z" fill="#A0522D" />
        </svg>
    )
};

// Default icon for unknown categories
const defaultIcon = (
    <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="20" r="14" fill="#e60012" />
        <rect x="16" y="12" width="8" height="16" fill="#fff" rx="2" />
    </svg>
);

export default function CategoryGrid({ categories }: CategoryGridProps) {
    // Fill to 10 if we have enough
    const displayCategories = categories.length > 0 ? categories.slice(0, 10) : [];

    return (
        <section className="py-6">
            <div className="px-5 mb-5 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                    Explora Categorías
                </h2>
                <Link
                    href="/productos"
                    className="text-sm font-bold text-gray-400 flex items-center gap-0.5 hover:text-[#e60012] transition-colors"
                >
                    Ver todas
                    <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            {/* Scrollable Container */}
            <div className="overflow-x-auto scrollbar-hide px-5" style={{ scrollbarWidth: 'none' }}>
                <div className="grid grid-rows-2 grid-flow-col gap-x-4 gap-y-6 pb-2" style={{ width: 'max-content' }}>
                    {displayCategories.map((cat, index) => {
                        const icon = categoryIcons[cat.slug] || defaultIcon;
                        return (
                            <Link
                                key={`${cat.id}-${index}`}
                                href={`/productos?categoria=${cat.slug}`}
                                className="flex flex-col items-center gap-3 w-[85px] group"
                            >
                                <div className="w-[85px] h-[85px] bg-white rounded-[24px] shadow-[0_8px_20px_-6px_rgba(0,0,0,0.12)] flex items-center justify-center group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 border border-gray-50/50">
                                    <div className="scale-110">
                                        {icon}
                                    </div>
                                </div>
                                <span className="text-[13px] font-bold text-gray-600 text-center truncate w-full group-hover:text-[#e60012] transition-colors">
                                    {cat.name}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
