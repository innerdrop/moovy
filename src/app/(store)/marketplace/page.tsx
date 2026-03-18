"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/store/ListingCard";
import {
    Tag,
    Search,
    Loader2,
    X,
    Star,
    Sparkles,
    ChevronRight,
    ChevronDown,
    SlidersHorizontal,
    ArrowRight,
    PackageSearch,
} from "lucide-react";

interface Listing {
    id: string;
    title: string;
    price: number;
    condition: string;
    sellerId: string;
    images: { url: string; order: number }[];
    seller: {
        id: string;
        displayName: string | null;
        rating: number | null;
        avatar: string | null;
    };
    category: { id: string; name: string; slug: string } | null;
}

interface Category {
    id: string;
    name: string;
    slug: string;
}

const CONDITIONS = [
    { value: "", label: "Todas" },
    { value: "NUEVO", label: "Nuevo" },
    { value: "USADO", label: "Usado" },
    { value: "REACONDICIONADO", label: "Reacondicionado" },
];

const CATEGORY_EMOJIS: Record<string, string> = {
    electronica: "📱", ropa: "👕", hogar: "🏠", deportes: "⚽",
    gaming: "🎮", libros: "📚", niños: "🧸", herramientas: "🔧",
    vehiculos: "🚗", musica: "🎵", mascotas: "🐾", jardin: "🌱",
    arte: "🎨", juguetes: "🧸", belleza: "💄", salud: "💊",
};

const LIMIT = 12;
const FEATURED_LIMIT = 6;

export default function MarketplacePage() {
    const searchParams = useSearchParams();
    const ctaRef = useRef<HTMLDivElement>(null);
    const [ctaVisible, setCtaVisible] = useState(false);

    const [listings, setListings] = useState<Listing[]>([]);
    const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [offset, setOffset] = useState(0);

    const [categories, setCategories] = useState<Category[]>([]);
    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [categoryId, setCategoryId] = useState(searchParams.get("categoryId") || "");
    const [condition, setCondition] = useState(searchParams.get("condition") || "");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [sortBy, setSortBy] = useState("newest");
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetch("/api/categories-public")
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    useEffect(() => {
        fetch(`/api/listings?limit=${FEATURED_LIMIT}&sortBy=newest`)
            .then((r) => r.json())
            .then((data) => setFeaturedListings(data.listings || []))
            .catch(() => {});
    }, []);

    // Intersection observer for CTA scroll reveal
    useEffect(() => {
        const el = ctaRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setCtaVisible(true); },
            { threshold: 0.2 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, [listings]);

    const buildUrl = useCallback(
        (off: number) => {
            const params = new URLSearchParams();
            if (categoryId) params.set("categoryId", categoryId);
            if (condition) params.set("condition", condition);
            if (search) params.set("search", search);
            if (minPrice) params.set("minPrice", minPrice);
            if (maxPrice) params.set("maxPrice", maxPrice);
            if (sortBy && sortBy !== "newest") params.set("sortBy", sortBy);
            params.set("limit", LIMIT.toString());
            params.set("offset", off.toString());
            return `/api/listings?${params.toString()}`;
        },
        [categoryId, condition, search, minPrice, maxPrice, sortBy]
    );

    useEffect(() => {
        setLoading(true);
        setOffset(0);
        fetch(buildUrl(0))
            .then((r) => r.json())
            .then((data) => {
                setListings(data.listings || []);
                setTotal(data.total || 0);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [buildUrl]);

    async function loadMore() {
        const newOffset = offset + LIMIT;
        setLoadingMore(true);
        try {
            const res = await fetch(buildUrl(newOffset));
            const data = await res.json();
            setListings((prev) => [...prev, ...(data.listings || [])]);
            setOffset(newOffset);
        } catch {
            /* ignore */
        } finally {
            setLoadingMore(false);
        }
    }

    const hasMore = listings.length < total;
    const hasActiveFilters = !!(categoryId || condition || minPrice || maxPrice);

    function getCategoryEmoji(slug: string): string {
        const normalized = slug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return CATEGORY_EMOJIS[normalized] || "🏷️";
    }

    function clearFilters() {
        setCategoryId("");
        setCondition("");
        setMinPrice("");
        setMaxPrice("");
        setSortBy("newest");
    }

    return (
        <div className="mp-page">
            {/* ═══════ HERO ═══════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95] px-4 pb-14 pt-10 lg:pb-16 lg:pt-14">
                {/* Floating orbs */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-purple-400/10 blur-3xl mp-orb-1" />
                <div className="pointer-events-none absolute -left-20 bottom-[-40px] h-56 w-56 rounded-full bg-fuchsia-400/10 blur-2xl mp-orb-2" />
                <div className="pointer-events-none absolute right-[20%] top-[30%] h-32 w-32 rounded-full bg-violet-300/8 blur-xl mp-orb-2" />

                <div className="relative z-10 mx-auto max-w-5xl">
                    <h1 className="mb-3 text-[28px] font-extrabold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
                        Marketplace
                        <br />
                        <span className="bg-gradient-to-r from-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
                            entre vecinos
                        </span>
                    </h1>
                    <p className="mb-7 max-w-sm text-[15px] leading-relaxed text-white/60 lg:max-w-md lg:text-base">
                        Comprá y vendé productos nuevos y usados en tu ciudad. Publicar es gratis.
                    </p>

                    {/* Search bar — glass */}
                    <div className="mp-search-glass flex max-w-xl items-center rounded-2xl p-1.5">
                        <div className="flex flex-1 items-center gap-3 px-4 py-2.5">
                            <Search className="h-5 w-5 flex-shrink-0 text-purple-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="¿Qué estás buscando?"
                                className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400 lg:text-[15px]"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <button className="hidden rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:shadow-purple-500/40 active:scale-95 sm:block">
                            Buscar
                        </button>
                    </div>

                    {/* Stats */}
                    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-xs text-white/50 lg:text-sm">
                        <span><strong className="font-bold text-white/80">{total || "…"}</strong> publicaciones</span>
                        <span className="hidden sm:inline text-white/30">•</span>
                        <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <strong className="font-bold text-white/80">4.8</strong> satisfacción
                        </span>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-5xl px-4">
                {/* ═══════ CATEGORY CHIPS ═══════ */}
                {categories.length > 0 && (
                    <div className="sticky top-[57px] z-40 -mx-4 px-4 pb-1 pt-4 backdrop-blur-lg" style={{ background: "rgba(245,240,255,0.92)" }}>
                        <div className="mp-fade-scroll">
                            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <button
                                    onClick={() => setCategoryId("")}
                                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                                        !categoryId
                                            ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md shadow-purple-500/20 mp-chip-active"
                                            : "border border-purple-200/60 bg-white/80 text-gray-600 hover:border-purple-300 hover:bg-purple-50 active:scale-95"
                                    }`}
                                >
                                    <span>🏷️</span> Todos
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setCategoryId(categoryId === cat.id ? "" : cat.id)}
                                        className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-200 ${
                                            categoryId === cat.id
                                                ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md shadow-purple-500/20 mp-chip-active"
                                                : "border border-purple-200/60 bg-white/80 text-gray-600 hover:border-purple-300 hover:bg-purple-50 active:scale-95"
                                        }`}
                                    >
                                        <span>{getCategoryEmoji(cat.slug)}</span>
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ FILTER BAR ═══════ */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100/50 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium text-purple-400">
                            {total} publicacion{total !== 1 ? "es" : ""}
                        </span>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-95 ${
                                hasActiveFilters || showFilters
                                    ? "border-[#7C3AED] bg-purple-50 text-[#7C3AED]"
                                    : "border-purple-200/50 bg-white/60 text-purple-500 hover:border-purple-300 hover:bg-purple-50"
                            }`}
                        >
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            Filtros
                            {hasActiveFilters && (
                                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">
                                    {[condition, minPrice, maxPrice].filter(Boolean).length}
                                </span>
                            )}
                            <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showFilters ? "rotate-180" : ""}`} />
                        </button>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="text-xs font-semibold text-[#7C3AED] hover:underline active:scale-95">
                                Limpiar
                            </button>
                        )}
                    </div>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="rounded-xl border border-purple-200/50 bg-white/60 px-3 py-1.5 text-xs font-medium text-purple-600 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200"
                    >
                        <option value="newest">Más recientes</option>
                        <option value="price_asc">Menor precio</option>
                        <option value="price_desc">Mayor precio</option>
                    </select>
                </div>

                {/* ═══════ FILTERS PANEL ═══════ */}
                {showFilters && (
                    <div className="animate-fadeIn mt-3 mb-2 rounded-2xl border border-purple-100 bg-white/70 p-4 backdrop-blur-sm">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-purple-600">Condición</label>
                                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-xl border border-purple-200/50 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200">
                                    {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            {categories.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-purple-600">Categoría</label>
                                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-purple-200/50 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200">
                                        <option value="">Todas las categorías</option>
                                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-purple-600">Precio mínimo</label>
                                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="$0" min="0" className="w-full rounded-xl border border-purple-200/50 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200" />
                            </div>
                            <div>
                                <label className="mb-1 block text-xs font-semibold text-purple-600">Precio máximo</label>
                                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Sin límite" min="0" className="w-full rounded-xl border border-purple-200/50 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ FEATURED ═══════ */}
                {!loading && featuredListings.length > 0 && !search && !hasActiveFilters && (
                    <section className="mt-6 mb-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="flex items-center gap-2 text-base font-extrabold text-gray-800 lg:text-lg">
                                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm shadow-amber-500/30">
                                    <Sparkles className="h-3.5 w-3.5 text-white" />
                                </span>
                                Destacados
                            </h2>
                            <span className="flex items-center gap-1 text-xs font-semibold text-[#7C3AED] transition hover:gap-2">
                                Ver todos <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                        </div>
                        <div className="mp-fade-scroll">
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {featuredListings.map((listing, i) => (
                                    <div key={listing.id} className={`w-[240px] flex-shrink-0 sm:w-[270px] mp-stagger mp-stagger-${i + 1}`}>
                                        <ListingCard listing={listing} showAddButton variant="marketplace" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════ MAIN RESULTS ═══════ */}
                <section className="mt-2 pb-8">
                    {!loading && listings.length > 0 && (
                        <h2 className="mb-4 text-base font-extrabold text-gray-800">
                            Todas las publicaciones
                        </h2>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <Loader2 className="h-8 w-8 text-[#7C3AED] mp-spin-glow" />
                            <span className="text-sm font-medium text-purple-400">Cargando...</span>
                        </div>
                    ) : listings.length === 0 ? (
                        <div className="py-24 text-center">
                            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-fuchsia-50 mp-empty-float">
                                <PackageSearch className="h-12 w-12 text-purple-300" />
                            </div>
                            <p className="text-lg font-bold text-gray-700">No encontramos resultados</p>
                            <p className="mt-1.5 text-sm text-purple-400">Probá con otra búsqueda o explorá las categorías</p>
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="mt-4 rounded-xl bg-[#7C3AED] px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition hover:shadow-purple-500/40 active:scale-95">
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                                {listings.map((listing, i) => (
                                    <div key={listing.id} className={`mp-stagger mp-stagger-${(i % 12) + 1}`}>
                                        <ListingCard listing={listing} showAddButton variant="marketplace" />
                                    </div>
                                ))}
                            </div>

                            {/* CTA — scroll reveal */}
                            {listings.length >= 8 && (
                                <div ref={ctaRef} className={`my-10 overflow-hidden rounded-3xl bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] p-6 shadow-xl shadow-purple-500/10 lg:flex lg:items-center lg:justify-between lg:p-10 transition-all duration-700 ${ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
                                    <div className="relative z-10 max-w-md">
                                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                                            <Tag className="h-5 w-5 text-white" />
                                        </div>
                                        <h3 className="text-xl font-extrabold text-white lg:text-2xl">
                                            ¿Tenés algo para vender?
                                        </h3>
                                        <p className="mt-2 text-sm leading-relaxed text-white/60">
                                            Publicar es gratis y en minutos. Llegá a vecinos de Ushuaia que buscan lo que ofrecés.
                                        </p>
                                        <Link
                                            href="/vendedor/registro"
                                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:shadow-xl active:scale-95"
                                        >
                                            Empezar a vender
                                            <ArrowRight className="h-4 w-4" />
                                        </Link>
                                    </div>
                                    {/* Decorative orbs */}
                                    <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-purple-400/10 blur-2xl" />
                                    <div className="pointer-events-none absolute bottom-0 right-[20%] h-28 w-28 rounded-full bg-fuchsia-400/10 blur-xl" />
                                </div>
                            )}

                            {/* Load More */}
                            {hasMore && (
                                <div className="mt-8 mb-4 text-center">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-white/70 px-8 py-3.5 text-sm font-bold text-[#7C3AED] shadow-sm backdrop-blur-sm transition-all hover:bg-purple-50 hover:shadow-md hover:shadow-purple-500/10 active:scale-95 disabled:opacity-50"
                                    >
                                        {loadingMore ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Cargar más publicaciones
                                                <ChevronDown className="h-4 w-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
