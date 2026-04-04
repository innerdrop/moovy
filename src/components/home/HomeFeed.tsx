"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Clock, ChevronRight, Store, Star } from "lucide-react";
import HomeHero from "./HomeHero";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MerchantPreview {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    image: string | null;
    category: string | null;
    isOpen: boolean;
    rating: number | null;
    deliveryTimeMin: number;
    deliveryTimeMax: number;
    deliveryFee?: number;
    isPremium?: boolean;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    image?: string | null;
}

interface HomeFeedProps {
    merchants: MerchantPreview[];
    categories: Category[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function HomeFeed({
    merchants,
    categories,
}: HomeFeedProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const handleCategoryChange = useCallback((slug: string | null) => {
        setSelectedCategory(slug);
    }, []);

    // Open merchants, optionally filtered by category pill
    const openMerchants = useMemo(() => {
        let filtered = merchants.filter((m) => m.isOpen);

        if (selectedCategory) {
            // Find the category name from slug
            const cat = categories.find((c) => c.slug === selectedCategory);
            if (cat) {
                const catName = cat.name.toLowerCase();
                filtered = filtered.filter((m) => {
                    const mCat = (m.category || "").toLowerCase();
                    const mName = (m.name || "").toLowerCase();
                    return mCat.includes(catName) || mName.includes(catName) || catName.includes(mCat);
                });
            }
        }

        return filtered.slice(0, 12);
    }, [merchants, categories, selectedCategory]);

    return (
        <>
            {/* ── HERO ── */}
            <HomeHero
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
            />

            {/* ── ABIERTOS AHORA (filterable) ── */}
            <section className="py-5 lg:py-8 bg-white">
                <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
                    {/* Row header */}
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-1 h-5 rounded-full bg-green-500" />
                            <Clock className="w-4 h-4 text-green-600" />
                            <h2 className="text-lg lg:text-xl font-black text-gray-900">
                                {selectedCategory
                                    ? `${categories.find(c => c.slug === selectedCategory)?.name || "Filtrado"}`
                                    : "Abiertos ahora"
                                }
                            </h2>
                            {selectedCategory && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory(null)}
                                    className="text-xs text-[#e60012] font-semibold ml-1 hover:underline"
                                >
                                    Ver todos
                                </button>
                            )}
                        </div>
                        <Link
                            href={selectedCategory ? `/tiendas?categoria=${selectedCategory}` : "/tiendas?filter=abiertos"}
                            className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1"
                        >
                            Ver todos <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Merchant cards */}
                    {openMerchants.length > 0 ? (
                        <div
                            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1"
                            style={{ scrollbarWidth: "none" }}
                        >
                            {openMerchants.map((m) => (
                                <MerchantCard key={m.id} merchant={m} />
                            ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center">
                            <Store className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500 font-medium">
                                {selectedCategory
                                    ? "No hay locales de esta categoría abiertos ahora"
                                    : "No hay locales abiertos a esta hora. ¡Volvé pronto!"
                                }
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}

// ─── Merchant Card (inline — consistent with MerchantDiscoveryRow style) ────

function MerchantCard({ merchant }: { merchant: MerchantPreview }) {
    return (
        <Link
            href={`/tienda/${merchant.slug}`}
            className="flex-shrink-0 snap-start group w-[180px] lg:w-[220px]"
        >
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm transition-transform duration-200 group-hover:scale-[1.02] group-active:scale-[0.98]">
                {/* Image */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {merchant.image ? (
                        <img
                            src={merchant.image}
                            alt={merchant.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <span className="text-3xl font-bold text-gray-300">
                                {merchant.name.charAt(0)}
                            </span>
                        </div>
                    )}
                    {/* Open indicator */}
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" />
                </div>

                {/* Info */}
                <div className="p-2.5">
                    <h3 className="font-bold text-sm text-gray-900 truncate">{merchant.name}</h3>
                    {merchant.category && (
                        <p className="text-[11px] text-gray-400 font-medium truncate">{merchant.category}</p>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">
                            {merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min
                        </span>
                        {merchant.rating && merchant.rating > 0 && (
                            <>
                                <span className="text-xs text-gray-300">·</span>
                                <span className="text-xs text-yellow-600 font-semibold flex items-center gap-0.5">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    {merchant.rating.toFixed(1)}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
