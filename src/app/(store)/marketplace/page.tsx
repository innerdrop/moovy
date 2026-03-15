"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ListingCard from "@/components/store/ListingCard";
import {
    Tag,
    Search,
    Loader2,
    SlidersHorizontal,
    X,
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
    { value: "NUEVO", label: "🟢 Nuevo" },
    { value: "USADO", label: "🟠 Usado" },
    { value: "REACONDICIONADO", label: "🔵 Reacondicionado" },
];

const LIMIT = 12;

export default function MarketplacePage() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [listings, setListings] = useState<Listing[]>([]);
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

    // Load categories
    useEffect(() => {
        fetch("/api/listings?limit=1")
            .then(() => {
                // Load categories separately
                fetch("/api/categories-public")
                    .then((r) => r.ok ? r.json() : [])
                    .then((data) => setCategories(Array.isArray(data) ? data : []))
                    .catch(() => { });
            })
            .catch(() => { });
    }, []);

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

    // Initial + filter change load
    useEffect(() => {
        setLoading(true);
        setOffset(0);
        fetch(buildUrl(0))
            .then((r) => r.json())
            .then((data) => {
                setListings(data.listings || []);
                setTotal(data.total || 0);
            })
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [buildUrl]);

    // Load more
    async function loadMore() {
        const newOffset = offset + LIMIT;
        setLoadingMore(true);
        try {
            const res = await fetch(buildUrl(newOffset));
            const data = await res.json();
            setListings((prev) => [...prev, ...(data.listings || [])]);
            setOffset(newOffset);
        } catch {
            // ignore
        } finally {
            setLoadingMore(false);
        }
    }

    const hasMore = listings.length < total;

    return (
        <div className="container mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Tag className="w-7 h-7 text-[#e60012]" />
                    Marketplace
                </h1>
                <p className="text-gray-500 mt-1">
                    Vendedores particulares — productos nuevos y usados
                </p>
            </div>

            {/* Search + Filter Toggle */}
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar en el marketplace..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:border-[#e60012] focus:ring-1 focus:ring-[#e60012]/20 outline-none transition"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-2.5 rounded-xl border transition flex items-center gap-2 ${showFilters || categoryId || condition
                            ? "bg-[#e60012] text-white border-[#e60012]"
                            : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm font-medium">Filtros</span>
                </button>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 space-y-4 animate-fadeIn">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Condición
                            </label>
                            <select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#e60012] outline-none"
                            >
                                {CONDITIONS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {categories.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Categoría
                                </label>
                                <select
                                    value={categoryId}
                                    onChange={(e) => setCategoryId(e.target.value)}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#e60012] outline-none"
                                >
                                    <option value="">Todas las categorías</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio mínimo
                            </label>
                            <input
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder="$0"
                                min="0"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#e60012] outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio máximo
                            </label>
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder="Sin límite"
                                min="0"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#e60012] outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Ordenar:</label>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:border-[#e60012] outline-none"
                            >
                                <option value="newest">Más recientes</option>
                                <option value="price_asc">Menor precio</option>
                                <option value="price_desc">Mayor precio</option>
                            </select>
                        </div>
                        {(categoryId || condition || minPrice || maxPrice) && (
                            <button
                                onClick={() => {
                                    setCategoryId("");
                                    setCondition("");
                                    setMinPrice("");
                                    setMaxPrice("");
                                    setSortBy("newest");
                                }}
                                className="text-sm text-[#e60012] font-medium hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Results */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
                </div>
            ) : listings.length === 0 ? (
                <div className="text-center py-20">
                    <Tag className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg font-medium">
                        No encontramos resultados
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                        Proba con otra busqueda o explora las categorias
                    </p>
                </div>
            ) : (
                <>
                    <p className="text-sm text-gray-500 mb-4">
                        {total} publicacion{total !== 1 ? "es" : ""}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {listings.map((listing) => (
                            <ListingCard key={listing.id} listing={listing} showAddButton />
                        ))}
                    </div>

                    {/* Load More */}
                    {hasMore && (
                        <div className="text-center mt-8">
                            <button
                                onClick={loadMore}
                                disabled={loadingMore}
                                className="px-8 py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-semibold hover:bg-gray-50 transition disabled:opacity-50"
                            >
                                {loadingMore ? (
                                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                                ) : (
                                    "Cargar más"
                                )}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
