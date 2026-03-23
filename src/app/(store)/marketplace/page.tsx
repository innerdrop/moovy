"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ListingCard from "@/components/store/ListingCard";
import {
    Search,
    Loader2,
    X,
    Sparkles,
    ChevronDown,
    SlidersHorizontal,
    ArrowRight,
    PackageSearch,
    ShieldCheck,
    Tag,
    TrendingUp,
    Users,
    Flame,
} from "lucide-react";

interface Listing {
    id: string;
    title: string;
    price: number;
    stock: number;
    condition: string;
    sellerId: string;
    images: { url: string; order: number }[];
    seller: {
        id: string;
        displayName: string | null;
        rating: number | null;
        avatar: string | null;
        isVerified?: boolean;
    };
    category: { id: string; name: string; slug: string } | null;
    soldCount?: number;
    favCount?: number;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    listingCount: number;
}

const CONDITIONS = [
    { value: "", label: "Todas" },
    { value: "NUEVO", label: "Nuevo" },
    { value: "USADO", label: "Usado" },
    { value: "REACONDICIONADO", label: "Reacondicionado" },
];

const CATEGORY_EMOJIS: Record<string, string> = {
    electronica: "📱", ropa: "👕", hogar: "🏠", deportes: "⚽",
    gaming: "🎮", libros: "📚", "niños": "🧸", herramientas: "🔧",
    vehiculos: "🚗", musica: "🎵", mascotas: "🐾", jardin: "🌱",
    arte: "🎨", juguetes: "🧸", belleza: "💄", salud: "💊",
};

const LIMIT = 12;

export default function MarketplacePage() {
    const searchParams = useSearchParams();
    const sellCtaRef = useRef<HTMLDivElement>(null);
    const [sellCtaVisible, setSellCtaVisible] = useState(false);

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

    // Total listings for hero stat
    const totalListings = useRef(0);

    // Fetch categories scoped to MARKETPLACE
    useEffect(() => {
        fetch("/api/categories-public?scope=MARKETPLACE")
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setCategories(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    // Fetch featured (real: by seller rating + sales)
    useEffect(() => {
        fetch("/api/listings/featured")
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setFeaturedListings(Array.isArray(data) ? data : []))
            .catch(() => {});
    }, []);

    // Sell CTA scroll reveal
    useEffect(() => {
        const el = sellCtaRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setSellCtaVisible(true); },
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
                if (!totalListings.current) totalListings.current = data.total || 0;
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
    const isSearching = !!search;

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

    // Total count for hero (use totalListings ref to avoid flicker)
    const heroTotal = totalListings.current || total;

    return (
        <div className="mp-page">

            {/* ═══════════════════════════════════════════
                HERO — Compacto, orientado a acción
               ═══════════════════════════════════════════ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#4C1D95]">
                {/* Orbs decorativos */}
                <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-purple-400/10 blur-3xl mp-orb-1" />
                <div className="pointer-events-none absolute -left-12 bottom-[-20px] h-40 w-40 rounded-full bg-fuchsia-400/10 blur-2xl mp-orb-2" />

                <div className="relative z-10 mx-auto max-w-5xl px-4 pb-5 pt-6 lg:pb-7 lg:pt-8">
                    {/* Title row */}
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-black leading-tight text-white sm:text-3xl lg:text-4xl tracking-tight">
                                Marketplace
                                <span className="ml-2 bg-gradient-to-r from-purple-200 to-fuchsia-200 bg-clip-text text-transparent">
                                    Ushuaia
                                </span>
                            </h1>
                            <p className="mt-1.5 text-sm text-white/70 sm:text-base font-semibold">
                                Comprá y vendé entre vecinos. Publicar es gratis.
                            </p>
                        </div>
                        <Link
                            href="/vendedor/registro"
                            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-white/25 active:scale-95"
                        >
                            <Tag className="h-3.5 w-3.5" />
                            Vender
                        </Link>
                    </div>

                    {/* Stats row */}
                    <div className="mt-3 flex items-center gap-4 text-xs text-white/50 sm:gap-6 sm:text-sm">
                        <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-400" />
                            <strong className="font-bold text-white/70">{heroTotal || "…"}</strong> publicaciones
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-purple-300" />
                            <strong className="font-bold text-white/70">{categories.length}</strong> categorías
                        </span>
                        <span className="flex items-center gap-1">
                            <ShieldCheck className="h-3 w-3 text-blue-300" />
                            Compra protegida
                        </span>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-5xl px-4">

                {/* ═══════ BUSCADOR (único, debajo del hero) ═══════ */}
                <div className="sticky top-[56px] z-40 -mx-4 px-4 pt-3 pb-1 backdrop-blur-xl" style={{ background: "rgba(245,240,255,0.95)" }}>
                    <div className="mp-search-glass flex items-center rounded-2xl p-1 mb-2">
                        <div className="flex flex-1 items-center gap-2.5 px-3.5 py-2">
                            <Search className="h-4.5 w-4.5 flex-shrink-0 text-purple-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar en marketplace..."
                                className="w-full bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
                            />
                            {search && (
                                <button onClick={() => setSearch("")} className="text-gray-400 hover:text-gray-600 transition">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ═══════ CATEGORY CHIPS con contadores ═══════ */}
                    {categories.length > 0 && (
                        <div className="mp-fade-scroll">
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <button
                                    onClick={() => setCategoryId("")}
                                    className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
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
                                        className={`flex flex-shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 ${
                                            categoryId === cat.id
                                                ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md shadow-purple-500/20 mp-chip-active"
                                                : "border border-purple-200/60 bg-white/80 text-gray-600 hover:border-purple-300 hover:bg-purple-50 active:scale-95"
                                        }`}
                                    >
                                        <span>{getCategoryEmoji(cat.slug)}</span>
                                        {cat.name}
                                        <span className={`text-[10px] font-bold ${categoryId === cat.id ? "text-white/70" : "text-purple-400"}`}>
                                            {cat.listingCount}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ═══════ FILTER BAR ═══════ */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100/50 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-purple-400">
                            {loading ? "..." : `${total} resultado${total !== 1 ? "s" : ""}`}
                        </span>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all duration-200 active:scale-95 ${
                                hasActiveFilters || showFilters
                                    ? "border-[#7C3AED] bg-purple-50 text-[#7C3AED]"
                                    : "border-purple-200/50 bg-white/60 text-purple-500 hover:border-purple-300 hover:bg-purple-50"
                            }`}
                        >
                            <SlidersHorizontal className="h-3 w-3" />
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
                        className="rounded-xl border border-purple-200/50 bg-white/60 px-2.5 py-1 text-xs font-medium text-purple-600 outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200"
                    >
                        <option value="newest">Más recientes</option>
                        <option value="price_asc">Menor precio</option>
                        <option value="price_desc">Mayor precio</option>
                    </select>
                </div>

                {/* ═══════ FILTERS PANEL ═══════ */}
                {showFilters && (
                    <div className="animate-fadeIn mt-2 mb-2 rounded-2xl border border-purple-100 bg-white/70 p-4 backdrop-blur-sm">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Condición</label>
                                <select value={condition} onChange={(e) => setCondition(e.target.value)} className="w-full rounded-xl border border-purple-200/50 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200">
                                    {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            {categories.length > 0 && (
                                <div>
                                    <label className="mb-1 block text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Categoría</label>
                                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full rounded-xl border border-purple-200/50 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200">
                                        <option value="">Todas</option>
                                        {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name} ({cat.listingCount})</option>)}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Precio mín.</label>
                                <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="$0" min="0" className="w-full rounded-xl border border-purple-200/50 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200" />
                            </div>
                            <div>
                                <label className="mb-1 block text-[11px] font-semibold text-purple-600 uppercase tracking-wide">Precio máx.</label>
                                <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Sin límite" min="0" className="w-full rounded-xl border border-purple-200/50 bg-white px-3 py-2 text-sm outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-purple-200" />
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══════ FEATURED — Real (por rating + ventas del vendedor) ═══════ */}
                {!loading && featuredListings.length > 0 && !search && !hasActiveFilters && (
                    <section className="mt-4 mb-4">
                        <div className="mb-2.5 flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-sm">
                                <Flame className="h-3 w-3 text-white" />
                            </div>
                            <h2 className="text-base font-bold text-gray-800 sm:text-lg">Destacados</h2>
                            <span className="text-[10px] font-medium text-purple-400 bg-purple-50 px-2 py-0.5 rounded-full">
                                Mejores vendedores
                            </span>
                        </div>
                        <div className="mp-fade-scroll">
                            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                {featuredListings.map((listing, i) => (
                                    <div key={listing.id} className={`w-[200px] flex-shrink-0 sm:w-[220px] mp-stagger mp-stagger-${i + 1}`}>
                                        <ListingCard listing={listing} showAddButton variant="marketplace" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* ═══════ MINI CTA vendedor — mobile only, flotante ═══════ */}
                <div className="sm:hidden flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100/60 px-3 py-2 my-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#7C3AED]/10">
                        <Tag className="h-4 w-4 text-[#7C3AED]" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-700 truncate">¿Tenés algo para vender?</p>
                        <p className="text-[10px] text-purple-400">Publicar es gratis</p>
                    </div>
                    <Link
                        href="/vendedor/registro"
                        className="flex-shrink-0 rounded-lg bg-[#7C3AED] px-3 py-1.5 text-[11px] font-bold text-white transition active:scale-95"
                    >
                        Publicar
                    </Link>
                </div>

                {/* ═══════ MAIN RESULTS ═══════ */}
                <section className="mt-1 pb-8">
                    {!loading && listings.length > 0 && (
                        <h2 className="mb-3 text-base font-bold text-gray-800 sm:text-lg">
                            {isSearching
                                ? `Resultados para "${search}"`
                                : categoryId
                                    ? `${categories.find(c => c.id === categoryId)?.name || "Categoría"}`
                                    : "Todas las publicaciones"
                            }
                        </h2>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="h-7 w-7 text-[#7C3AED] mp-spin-glow" />
                            <span className="text-xs font-medium text-purple-400">Buscando...</span>
                        </div>
                    ) : listings.length === 0 ? (
                        /* ═══════ EMPTY STATE INTELIGENTE ═══════ */
                        <div className="py-16 text-center">
                            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-100 to-fuchsia-50 mp-empty-float">
                                <PackageSearch className="h-12 w-12 text-purple-400" />
                            </div>

                            <h3 className="text-xl font-bold text-gray-800 sm:text-2xl">
                                {isSearching
                                    ? `No hay resultados para "${search}"`
                                    : hasActiveFilters
                                        ? "No encontramos publicaciones con estos filtros"
                                        : categoryId
                                            ? `Sin publicaciones en esta categoría`
                                            : "No hay publicaciones aún"
                                }
                            </h3>

                            <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
                                {isSearching
                                    ? "Intentá buscar con otras palabras, letras o números"
                                    : hasActiveFilters
                                        ? "Los filtros que aplicaste no coinciden con ninguna publicación"
                                        : categoryId
                                            ? "Sé el primero en publicar en esta categoría"
                                            : "Todavía no hay publicaciones en el marketplace"
                                }
                            </p>

                            <div className="mt-6 flex flex-col items-center gap-3">
                                {/* Primary CTA: Clear filters or Explore */}
                                {hasActiveFilters ? (
                                    <button
                                        onClick={clearFilters}
                                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50 active:scale-95"
                                    >
                                        <X className="h-4 w-4" />
                                        Limpiar filtros
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => { setCategoryId(""); setSearch(""); }}
                                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/30 transition hover:shadow-purple-500/50 active:scale-95"
                                    >
                                        <Sparkles className="h-4 w-4" />
                                        Explorar todas las publicaciones
                                    </button>
                                )}

                                {/* Secondary CTA: Publish */}
                                <Link
                                    href="/vendedor/registro"
                                    className="flex items-center gap-2 rounded-xl border-2 border-[#7C3AED] px-6 py-2.5 text-sm font-bold text-[#7C3AED] transition hover:bg-purple-50 active:scale-95"
                                >
                                    <Tag className="h-4 w-4" />
                                    Publicá tu primer producto
                                </Link>
                            </div>

                            {/* Suggest popular categories */}
                            {categories.filter(c => c.listingCount > 0).length > 0 && (
                                <div className="mt-8 border-t border-purple-100 pt-6">
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Explorá estas categorías</p>
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {categories.filter(c => c.listingCount > 0).slice(0, 6).map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => { setCategoryId(cat.id); setSearch(""); }}
                                                className="group flex items-center gap-2 rounded-full border border-purple-200/60 bg-white/80 px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-[#7C3AED] hover:bg-purple-50 hover:text-[#7C3AED] active:scale-95"
                                            >
                                                <span className="text-sm">{getCategoryEmoji(cat.slug)}</span>
                                                {cat.name}
                                                <span className="text-[10px] font-bold text-purple-400 group-hover:text-[#7C3AED]">{cat.listingCount}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                                {listings.map((listing, i) => (
                                    <div key={listing.id} className={`mp-stagger mp-stagger-${(i % 12) + 1}`}>
                                        <ListingCard listing={listing} showAddButton variant="marketplace" />
                                    </div>
                                ))}
                            </div>

                            {/* ═══════ SELL CTA — scroll reveal (desktop) ═══════ */}
                            {listings.length >= 8 && (
                                <div
                                    ref={sellCtaRef}
                                    className={`my-8 overflow-hidden rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#5B21B6] p-5 shadow-lg lg:flex lg:items-center lg:justify-between lg:p-8 transition-all duration-700 ${sellCtaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                                >
                                    <div className="relative z-10">
                                        <h3 className="text-xl font-bold text-white lg:text-2xl">
                                            ¿Tenés algo para vender?
                                        </h3>
                                        <p className="mt-1 text-sm text-white/50">
                                            Publicá gratis y llegá a vecinos de Ushuaia.
                                        </p>
                                    </div>
                                    <Link
                                        href="/vendedor/registro"
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-[#7C3AED] shadow-lg transition hover:shadow-xl active:scale-95 lg:mt-0"
                                    >
                                        Empezar a vender
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>
                                    <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-purple-400/10 blur-2xl" />
                                </div>
                            )}

                            {/* Load More */}
                            {hasMore && (
                                <div className="mt-6 mb-4 text-center">
                                    <button
                                        onClick={loadMore}
                                        disabled={loadingMore}
                                        className="inline-flex items-center gap-2 rounded-2xl border border-purple-200 bg-white/70 px-7 py-3 text-sm font-bold text-[#7C3AED] shadow-sm backdrop-blur-sm transition-all hover:bg-purple-50 hover:shadow-md hover:shadow-purple-500/10 active:scale-95 disabled:opacity-50"
                                    >
                                        {loadingMore ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Ver más publicaciones
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
