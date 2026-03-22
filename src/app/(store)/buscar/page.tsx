"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    Search,
    X,
    ArrowLeft,
    Store,
    Tag,
    Loader2,
    Star,
    Clock,
    MapPin,
    ShoppingBag,
    TrendingUp
} from "lucide-react";
import ListingCard from "@/components/store/ListingCard";

// ============================================
// TYPES
// ============================================
interface ProductResult {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    images: { url: string }[];
    merchant: {
        id: string;
        name: string;
        slug: string;
        isOpen: boolean;
        image: string | null;
        rating: number | null;
    } | null;
}

interface MerchantResult {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    isOpen: boolean;
    isVerified: boolean;
    isPremium: boolean;
    premiumTier: string | null;
    rating: number | null;
    deliveryTimeMin: number;
    deliveryTimeMax: number;
    deliveryFee: number;
    address: string | null;
}

interface ListingResult {
    id: string;
    title: string;
    price: number;
    condition: string;
    images: { url: string; order: number }[];
    sellerId?: string;
    seller: {
        id?: string;
        displayName: string | null;
        rating: number | null;
        avatar: string | null;
    };
    category?: { name: string } | null;
}

type Tab = "comercios" | "marketplace";

const POPULAR_SEARCHES = [
    "Pizza", "Hamburguesa", "Farmacia", "Ropa", "Electrónica",
    "Bebidas", "Panadería", "Sushi", "Celulares", "Zapatillas"
];

// ============================================
// MAIN PAGE
// ============================================
export default function BuscarPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
            </div>
        }>
            <BuscarContent />
        </Suspense>
    );
}

function BuscarContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const initialQuery = searchParams.get("q") || "";
    const initialTab = (searchParams.get("tab") as Tab) || "comercios";

    const [query, setQuery] = useState(initialQuery);
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(!!initialQuery);

    // Results
    const [products, setProducts] = useState<ProductResult[]>([]);
    const [productTotal, setProductTotal] = useState(0);
    const [merchants, setMerchants] = useState<MerchantResult[]>([]);
    const [listings, setListings] = useState<ListingResult[]>([]);
    const [listingTotal, setListingTotal] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(undefined);

    // Focus input on mount
    useEffect(() => {
        if (!initialQuery) {
            inputRef.current?.focus();
        }
    }, [initialQuery]);

    // Search on initial load if query present
    useEffect(() => {
        if (initialQuery) {
            performSearch(initialQuery, initialTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const performSearch = useCallback(async (searchQuery: string, tab: Tab) => {
        if (searchQuery.length < 2) {
            setProducts([]);
            setMerchants([]);
            setListings([]);
            setProductTotal(0);
            setListingTotal(0);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);

        try {
            const res = await fetch(
                `/api/search?q=${encodeURIComponent(searchQuery)}&tab=${tab}&limit=20`
            );
            const data = await res.json();

            if (tab === "marketplace") {
                setListings(data.results || []);
                setListingTotal(data.total || 0);
            } else {
                setProducts(data.results || []);
                setProductTotal(data.total || 0);
                setMerchants(data.merchants || []);
            }
        } catch (error) {
            console.error("Search error:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            if (value.trim().length >= 2) {
                // Update URL without navigation
                window.history.replaceState(
                    null,
                    "",
                    `/buscar?q=${encodeURIComponent(value.trim())}&tab=${activeTab}`
                );
                performSearch(value.trim(), activeTab);
            } else {
                setHasSearched(false);
                setProducts([]);
                setMerchants([]);
                setListings([]);
            }
        }, 350);
    };

    const handleTabChange = (tab: Tab) => {
        setActiveTab(tab);
        if (query.trim().length >= 2) {
            window.history.replaceState(
                null,
                "",
                `/buscar?q=${encodeURIComponent(query.trim())}&tab=${tab}`
            );
            performSearch(query.trim(), tab);
        }
    };

    const handlePopularSearch = (term: string) => {
        setQuery(term);
        window.history.replaceState(
            null,
            "",
            `/buscar?q=${encodeURIComponent(term)}&tab=${activeTab}`
        );
        performSearch(term, activeTab);
    };

    const handleClear = () => {
        setQuery("");
        setHasSearched(false);
        setProducts([]);
        setMerchants([]);
        setListings([]);
        window.history.replaceState(null, "", "/buscar");
        inputRef.current?.focus();
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Search Header */}
            <div className="bg-white sticky top-0 z-30 border-b border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="Buscar comercios, productos, marketplace..."
                            className="w-full pl-10 pr-10 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:bg-white transition"
                        />
                        {query && (
                            <button
                                onClick={handleClear}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex px-4 gap-1">
                    <button
                        onClick={() => handleTabChange("comercios")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border-b-2 transition ${
                            activeTab === "comercios"
                                ? "border-[#e60012] text-[#e60012]"
                                : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        <Store className="w-4 h-4" />
                        Comercios
                        {activeTab === "comercios" && hasSearched && (
                            <span className="text-xs bg-red-50 text-[#e60012] px-1.5 py-0.5 rounded-full">
                                {productTotal + merchants.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => handleTabChange("marketplace")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold border-b-2 transition ${
                            activeTab === "marketplace"
                                ? "border-[#7C3AED] text-[#7C3AED]"
                                : "border-transparent text-gray-400 hover:text-gray-600"
                        }`}
                    >
                        <Tag className="w-4 h-4" />
                        Marketplace
                        {activeTab === "marketplace" && hasSearched && (
                            <span className="text-xs bg-violet-50 text-[#7C3AED] px-1.5 py-0.5 rounded-full">
                                {listingTotal}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="px-4 py-4">
                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
                    </div>
                )}

                {/* Empty State - Before Search */}
                {!loading && !hasSearched && (
                    <div className="py-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-8 h-8 text-gray-300" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1">
                                ¿Qué estás buscando?
                            </h2>
                            <p className="text-sm text-gray-500">
                                Buscá en comercios y marketplace de Ushuaia
                            </p>
                        </div>

                        {/* Popular Searches */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                    Búsquedas populares
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {POPULAR_SEARCHES.map((term) => (
                                    <button
                                        key={term}
                                        onClick={() => handlePopularSearch(term)}
                                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm text-gray-700 hover:border-[#e60012] hover:text-[#e60012] transition"
                                    >
                                        {term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* No Results */}
                {!loading && hasSearched && activeTab === "comercios" && products.length === 0 && merchants.length === 0 && (
                    <div className="text-center py-16">
                        <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-900 mb-1">Sin resultados</h3>
                        <p className="text-sm text-gray-500">
                            No encontramos &quot;{query}&quot; en comercios. Probá en Marketplace.
                        </p>
                        <button
                            onClick={() => handleTabChange("marketplace")}
                            className="mt-4 px-4 py-2 bg-violet-50 text-[#7C3AED] rounded-xl text-sm font-semibold hover:bg-violet-100 transition"
                        >
                            Buscar en Marketplace
                        </button>
                    </div>
                )}

                {!loading && hasSearched && activeTab === "marketplace" && listings.length === 0 && (
                    <div className="text-center py-16">
                        <Tag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <h3 className="font-bold text-gray-900 mb-1">Sin resultados</h3>
                        <p className="text-sm text-gray-500">
                            No encontramos &quot;{query}&quot; en marketplace. Probá en Comercios.
                        </p>
                        <button
                            onClick={() => handleTabChange("comercios")}
                            className="mt-4 px-4 py-2 bg-red-50 text-[#e60012] rounded-xl text-sm font-semibold hover:bg-red-100 transition"
                        >
                            Buscar en Comercios
                        </button>
                    </div>
                )}

                {/* COMERCIOS TAB RESULTS */}
                {!loading && hasSearched && activeTab === "comercios" && (
                    <div className="space-y-6">
                        {/* Merchants */}
                        {merchants.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Comercios ({merchants.length})
                                </h3>
                                <div className="space-y-2">
                                    {merchants.map((m) => (
                                        <Link
                                            key={m.id}
                                            href={`/tienda/${m.slug}`}
                                            className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100 hover:shadow-md transition"
                                        >
                                            <div className="w-14 h-14 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                                {m.image ? (
                                                    <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Store className="w-6 h-6 text-gray-300" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <p className="font-bold text-gray-900 truncate">{m.name}</p>
                                                    {m.isOpen ? (
                                                        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                            ABIERTO
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                                            CERRADO
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                    <span className="flex items-center gap-0.5">
                                                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                        {m.rating ? m.rating.toFixed(1) : "Nuevo"}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Clock className="w-3 h-3" />
                                                        {m.deliveryTimeMin}-{m.deliveryTimeMax}min
                                                    </span>
                                                    {m.address && (
                                                        <span className="flex items-center gap-0.5 truncate">
                                                            <MapPin className="w-3 h-3" />
                                                            {m.address}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Products */}
                        {products.length > 0 && (
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                                    Productos ({productTotal})
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {products.map((p) => (
                                        <Link
                                            key={p.id}
                                            href={`/productos/${p.slug}`}
                                            className="bg-white rounded-xl border border-gray-100 overflow-hidden group hover:shadow-md transition"
                                        >
                                            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                                {p.images?.[0]?.url ? (
                                                    <img
                                                        src={p.images[0].url}
                                                        alt={p.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <ShoppingBag className="w-8 h-8 text-gray-300" />
                                                    </div>
                                                )}
                                                {p.stock <= 0 && (
                                                    <span className="absolute top-2 right-2 text-xs font-bold text-white bg-gray-900/70 px-2 py-0.5 rounded-full">
                                                        Agotado
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <p className="font-semibold text-sm text-gray-800 line-clamp-2 group-hover:text-[#e60012] transition">
                                                    {p.name}
                                                </p>
                                                {p.merchant && (
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                                                        {p.merchant.name}
                                                    </p>
                                                )}
                                                <p className="text-base font-bold text-[#e60012] mt-1">
                                                    ${p.price.toLocaleString("es-AR")}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* MARKETPLACE TAB RESULTS */}
                {!loading && hasSearched && activeTab === "marketplace" && listings.length > 0 && (
                    <div>
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">
                            Publicaciones ({listingTotal})
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
