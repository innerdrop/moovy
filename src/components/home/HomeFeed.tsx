"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { Clock, ChevronRight, Store, Star } from "lucide-react";
import HomeHero from "./HomeHero";
import CategoryGrid from "./CategoryGrid";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MerchantPreview {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
    image: string | null;
    /** feat/portada-comercio: portada 16:5 opcional para las tarjetas anchas. */
    banner?: string | null;
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

    // Efecto de scroll lateral moderno: la tarjeta más cercana al centro se ve a
    // tamaño pleno y las de los costados se achican un toque (foco tipo carrusel).
    // Solo cuando la fila realmente scrollea (en desktop, si entran todas, no aplica).
    const abiertosRowRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const row = abiertosRowRef.current;
        if (!row) return;
        let raf = 0;
        const update = () => {
            const rect = row.getBoundingClientRect();
            const kids = Array.from(row.children) as HTMLElement[];
            if (row.scrollWidth <= row.clientWidth + 12) {
                kids.forEach((k) => (k.style.transform = ""));
                return;
            }
            const center = rect.left + rect.width / 2;
            kids.forEach((k) => {
                const r = k.getBoundingClientRect();
                const cc = r.left + r.width / 2;
                const d = Math.min(1, Math.abs(cc - center) / (rect.width * 0.6));
                k.style.transform = `scale(${(1 - d * 0.07).toFixed(3)})`;
            });
        };
        const onScroll = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(update);
        };
        update();
        row.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            row.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
            cancelAnimationFrame(raf);
        };
    }, [openMerchants.length]);

    return (
        <>
            {/* ── HERO ── */}
            <HomeHero
                categories={categories}
                selectedCategory={selectedCategory}
                onCategoryChange={handleCategoryChange}
            />

            {/* ── CATEGORÍAS (justo debajo del hero, como el diseño) ── */}
            <div className="pt-4 pb-1">
                <CategoryGrid categories={categories} />
            </div>

            {/* ── ABIERTOS AHORA (filterable) ── */}
            <section id="abiertos-ahora" className="py-5 lg:py-8 bg-white scroll-mt-16">
                <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
                    {/* Row header */}
                    <div className="flex items-center justify-between mb-3 lg:mb-4">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-xl font-black text-gray-900 tracking-tight">
                                {selectedCategory
                                    ? `${categories.find(c => c.slug === selectedCategory)?.name || "Filtrado"}`
                                    : "Abiertos ahora"
                                }
                            </h2>
                            {selectedCategory ? (
                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory(null)}
                                    className="text-xs text-[#e60012] font-semibold hover:underline"
                                >
                                    Ver todos
                                </button>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    En vivo
                                </span>
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
                            ref={abiertosRowRef}
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
    // feat/rediseno-home: tarjeta estilo delivery — portada 16:5 de fondo + logo
    // como avatar montado. Si no hay portada, un fondo neutro (no estiramos el logo).
    const initials = merchant.name
        .split(" ")
        .slice(0, 2)
        .map((w) => w.charAt(0))
        .join("")
        .toUpperCase();
    return (
        <Link
            href={`/tienda/${merchant.slug}`}
            className="flex-shrink-0 snap-center group w-[262px] origin-center will-change-transform transition-transform duration-100 ease-out"
        >
            <div className="rounded-[22px] overflow-hidden bg-white border border-gray-100 shadow-[0_6px_22px_rgba(30,10,5,0.09)] transition-transform duration-200 group-active:scale-[0.98]">
                {/* Portada — el contenedor NO recorta (para que el logo montado
                    sobresalga); solo la imagen se clipea en su propio wrapper. */}
                <div className="relative h-[118px] bg-gray-100">
                    <div className="absolute inset-0 overflow-hidden">
                        {merchant.banner ? (
                            <img
                                src={merchant.banner}
                                alt={merchant.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300" />
                        )}
                    </div>
                    {/* Badge Abierto */}
                    <span className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-white/95 text-green-700 text-[10.5px] font-black px-2.5 py-1 rounded-full shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        Abierto
                    </span>
                    {/* Badge tiempo */}
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/70 text-white text-[10.5px] font-bold px-2.5 py-1 rounded-full">
                        <Clock className="w-3 h-3" />
                        {merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min
                    </span>
                    {/* Logo avatar montado */}
                    <div className="absolute -bottom-7 left-3.5 w-16 h-16 rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center">
                        {merchant.image ? (
                            <img src={merchant.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-[22px] font-black text-gray-400">{initials}</span>
                        )}
                    </div>
                </div>
                {/* Info */}
                <div className="pt-10 px-3.5 pb-3.5">
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="font-black text-base text-gray-900 truncate">{merchant.name}</h3>
                        {merchant.rating && merchant.rating > 0 && (
                            <span className="flex items-center gap-1 bg-[#fff8e6] text-[#b45309] text-xs font-black px-2 py-0.5 rounded-lg flex-shrink-0">
                                <Star className="w-3 h-3 fill-[#f59e0b] text-[#f59e0b]" />
                                {merchant.rating.toFixed(1)}
                            </span>
                        )}
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-gray-400 font-semibold truncate">
                        {merchant.category ? `${merchant.category} · Envío desde el local` : "Envío desde el local"}
                    </p>
                </div>
            </div>
        </Link>
    );
}
          