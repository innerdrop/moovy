"use client";

import Link from "next/link";
import { ChevronRight, Star } from "lucide-react";

interface Merchant {
    id: string;
    name: string;
    slug: string;
    logo?: string | null;
    coverImage?: string | null;
    isPremium?: boolean;
}

interface FavoritesCarouselProps {
    merchants: Merchant[];
}

const placeholderImages = [
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&h=200&fit=crop"
];

export default function FavoritesCarousel({ merchants }: FavoritesCarouselProps) {
    if (!merchants || merchants.length === 0) return null;

    return (
        <section className="py-3 md:py-6 overflow-hidden max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-8 lg:px-16 mb-3 md:mb-6">
                <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                    Favoritos de la Semana
                </h2>
                <Link
                    href="/productos"
                    className="text-gray-400 hover:text-[#e60012] transition-colors flex items-center gap-1 md:text-lg"
                >
                    <span className="hidden md:inline">Ver todos</span>
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </Link>
            </div>

            {/* Carousel */}
            <div className="overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-16" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-3 md:gap-5 pb-2 w-max">
                    {merchants.slice(0, 8).map((merchant, index) => (
                        <Link
                            key={merchant.id}
                            href={`/store/${merchant.slug}`}
                            className="flex-shrink-0 w-40 md:w-56 lg:w-64 group"
                        >
                            <div className="bg-white rounded-2xl md:rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-gray-100">
                                {/* Image */}
                                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                    <img
                                        src={merchant.coverImage || merchant.logo || placeholderImages[index % placeholderImages.length]}
                                        alt={merchant.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    {merchant.isPremium && (
                                        <span className="absolute top-2 md:top-3 left-2 md:left-3 bg-[#e60012] text-white text-[9px] md:text-xs px-2 md:px-3 py-0.5 md:py-1 rounded-full font-bold">
                                            Promo
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-2.5 md:p-4">
                                    <h3 className="font-bold text-gray-900 text-sm md:text-base truncate group-hover:text-[#e60012] transition-colors">
                                        {merchant.name}
                                    </h3>
                                    <div className="flex items-center justify-between mt-1 md:mt-2">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 md:w-4 md:h-4 ${i < 4 ? "fill-orange-400 text-orange-400" : "text-gray-200"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs md:text-sm text-gray-500 font-medium">
                                            {(1000 + index * 300).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
