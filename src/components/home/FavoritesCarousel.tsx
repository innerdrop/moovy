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
        <section className="py-2 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 mb-2">
                <h2 className="text-lg font-bold text-gray-900">
                    Favoritos de la Semana
                </h2>
                <Link
                    href="/productos"
                    className="text-gray-400 hover:text-[#e60012] transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>

            {/* Carousel */}
            <div className="overflow-x-auto scrollbar-hide px-4" style={{ scrollbarWidth: 'none' }}>
                <div className="flex gap-3 pb-2 w-max">
                    {merchants.slice(0, 8).map((merchant, index) => (
                        <Link
                            key={merchant.id}
                            href={`/store/${merchant.slug}`}
                            className="flex-shrink-0 w-36 group"
                        >
                            <div className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all border border-gray-100">
                                {/* Image */}
                                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                    <img
                                        src={merchant.coverImage || merchant.logo || placeholderImages[index % placeholderImages.length]}
                                        alt={merchant.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    {merchant.isPremium && (
                                        <span className="absolute top-2 left-2 bg-[#e60012] text-white text-[9px] px-2 py-0.5 rounded-full font-bold">
                                            Promo
                                        </span>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="p-2.5">
                                    <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-[#e60012] transition-colors">
                                        {merchant.name}
                                    </h3>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-0.5">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i < 4 ? "fill-orange-400 text-orange-400" : "text-gray-200"}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-xs text-gray-500 font-medium">
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
