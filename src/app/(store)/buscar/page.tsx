"use client";

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
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
    ShoppingBag,
    TrendingUp,
    ChevronRight
} from "lucide-react";
import ProductCard from "@/components/store/ProductCard";
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

/**
 * feat/vitrina-productos-y-buscador (2026-07-28): los resultados se agrupan POR
 * COMERCIO en vez de mostrarse en dos listas sueltas (comercios arriba,
 * productos abajo sin dueño).
 *
 * Por qué: buscar "cerveza" y ver 12 fotos de cerveza no ayuda — el vecino
 * necesita saber DE QUIÉN es cada una, si está abierto y cuánto tarda, porque
 * el pedido se arma por comercio (no se puede mezclar un producto de la
 * farmacia con uno del kiosco en el mismo envío). Es lo que hace PedidosYa.
 *
 * Reglas del armado:
 *  · Un comercio entra al listado si coincide su NOMBRE o si tiene productos
 *    que coinciden. Los que tienen productos van primero (son más relevantes:
 *    el vecino busca la cosa, no el negocio).
 *  · Entre esos, primero los ABIERTOS: mostrar arriba lo que se puede pedir ya.
 */
type GrupoComercio = {
    merchant: {
        id: string;
        name: string;
        slug: string;
        image: string | null;
        isOpen: boolean;
        rating: number | null;
        deliveryTimeMin?: number;
        deliveryTimeMax?: number;
        address?: string | null;
    };
    productos: ProductResult[];
};

function agruparPorComercio(
    productos: ProductResult[],
    comercios: MerchantResult[]
): GrupoComercio[] {
    const mapa = new Map<string, GrupoComercio>();

    // 1) Los comercios que matchearon por nombre entran siempre (aunque no
    //    tengan productos que coincidan: el vecino los buscaba a ellos).
    for (const m of comercios) {
        mapa.set(m.id, {
            merchant: {
                id: m.id,
                name: m.name,
                slug: m.slug,
                image: m.image,
                isOpen: m.isOpen,
                rating: m.rating,
                deliveryTimeMin: m.deliveryTimeMin,
                deliveryTimeMax: m.deliveryTimeMax,
                address: m.address,
            },
            productos: [],
        });
    }

    // 2) Cada producto se cuelga de su comercio; si el comercio no estaba en la
    //    lista (matcheó el producto, no el nombre), se crea el grupo.
    for (const prod of productos) {
        if (!prod.merchant) continue;
        const existente = mapa.get(prod.merchant.id);
        if (existente) {
            existente.productos.push(prod);
        } else {
            mapa.set(prod.merchant.id, {
                merchant: { ...prod.merchant },
                productos: [prod],
            });
        }
    }

    return Array.from(mapa.values()).sort((a, b) => {
        const conProductos = Number(b.productos.length > 0) - Number(a.productos.length > 0);
        if (conProductos !== 0) return conProductos;
        const abiertos = Number(b.merchant.isOpen) - Number(a.merchant.isOpen);
        if (abiertos !== 0) return abiertos;
        return b.productos.length - a.productos.length;
    });
}

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

    const urlQuery = searchParams.get("q") || "";
    const urlTab = (searchParams.get("tab") as Tab) || "comercios";

    const [query, setQuery] = useState(urlQuery);
    const [activeTab, setActiveTab] = useState<Tab>(urlTab);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(!!urlQuery);

    // Results
    const [products, setProducts] = useState<ProductResult[]>([]);
    // El total de productos ya no se muestra suelto: el contador de la pestaña
    // cuenta COMERCIOS (que es lo que ahora se lista). Se conserva porque el
    // endpoint lo devuelve y sirve para paginar más adelante.
    const [productTotal, setProductTotal] = useState(0);
    void productTotal;
    const [merchants, setMerchants] = useState<MerchantResult[]>([]);
    // true = parte de los resultados son PARECIDOS, no coincidencias exactas
    // (ej: alguien escribió "cocacola"). Se avisa: mostrar aproximados como si
    // fueran exactos es peor que no mostrar nada.
    const [hayAproximados, setHayAproximados] = useState(false);

    // Resultados agrupados por comercio (ver agruparPorComercio arriba).
    const grupos = useMemo(() => agruparPorComercio(products, merchants), [products, merchants]);
    const [listings, setListings] = useState<ListingResult[]>([]);
    const [listingTotal, setListingTotal] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<NodeJS.Timeout>(undefined);

    // Focus input on mount if no query
    useEffect(() => {
        if (!urlQuery) {
            inputRef.current?.focus();
        }
    }, [urlQuery]);

    // Sync state from URL searchParams — handles both initial load and
    // client-side navigation (e.g. "Ver todos los resultados" from overlay)
    useEffect(() => {
        if (urlQuery && urlQuery.length >= 2) {
            setQuery(urlQuery);
            setActiveTab(urlTab);
            setHasSearched(true);
            performSearch(urlQuery, urlTab);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlQuery, urlTab]);

    const performSearch = useCallback(async (searchQuery: string, tab: Tab) => {
        if (searchQuery.length < 2) {
            setProducts([]);
            setMerchants([]);
            setListings([]);
            setProductTotal(0);
            setHayAproximados(false);
            setListingTotal(0);
            setHasSearched(false);
            return;
        }

        setLoading(true);
        setHasSearched(true);

        try {
            // Fetch BOTH tabs in parallel so we can show accurate counts
            // and allow instant tab switching without re-fetching
            const [comerciosRes, marketplaceRes] = await Promise.all([
                fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&tab=comercios&limit=20`),
                fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&tab=marketplace&limit=20`),
            ]);

            const [comerciosData, marketplaceData] = await Promise.all([
                comerciosRes.json(),
                marketplaceRes.json(),
            ]);

            setHayAproximados(!!comerciosData.hayAproximados);
            setProducts(comerciosData.results || []);
            setProductTotal(comerciosData.total || 0);
            setMerchants(comerciosData.merchants || []);
            setListings(marketplaceData.results || []);
            setListingTotal(marketplaceData.total || 0);
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
            // No need to re-fetch — both tabs are preloaded
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
                <div className="flex items-center gap-3 px-4 lg:px-6 xl:px-8 py-3 max-w-7xl mx-auto">
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
                <div className="flex px-4 lg:px-6 xl:px-8 gap-1 max-w-7xl mx-auto w-full">
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
                        {hasSearched && grupos.length > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === "comercios" ? "bg-red-50 text-[#e60012]" : "bg-gray-100 text-gray-500"
                            }`}>
                                {grupos.length}
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
                        {hasSearched && listingTotal > 0 && (
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                activeTab === "marketplace" ? "bg-violet-50 text-[#7C3AED]" : "bg-gray-100 text-gray-500"
                            }`}>
                                {listingTotal}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            <div className="px-4 lg:px-6 xl:px-8 py-4 lg:py-6 max-w-7xl mx-auto">
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
                {!loading && hasSearched && activeTab === "comercios" && grupos.length === 0 && (
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

                {/* COMERCIOS TAB — resultados AGRUPADOS POR COMERCIO */}
                {!loading && hasSearched && activeTab === "comercios" && grupos.length > 0 && (
                    <div className="space-y-4">
                        {hayAproximados && (
                            <p className="text-[13px] text-gray-500 bg-amber-50 border border-amber-100 rounded-xl px-3.5 py-2.5">
                                No encontramos exactamente <b>«{query.trim()}»</b>. Te mostramos lo más parecido.
                            </p>
                        )}
                        {grupos.map((grupo) => (
                            <div
                                key={grupo.merchant.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(23,24,28,0.05)] overflow-hidden"
                            >
                                {/* Cabecera del comercio: quién vende, si está abierto y cuánto tarda */}
                                <Link
                                    href={`/tienda/${grupo.merchant.slug}`}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-50/60 transition"
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 relative">
                                        {grupo.merchant.image ? (
                                            <Image
                                                src={grupo.merchant.image}
                                                alt={grupo.merchant.name}
                                                fill
                                                sizes="48px"
                                                className={`object-cover ${grupo.merchant.isOpen ? "" : "grayscale"}`}
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Store className="w-5 h-5 text-gray-300" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-[15px] text-gray-900 truncate">
                                            {grupo.merchant.name}
                                        </p>
                                        <div className="flex items-center gap-2.5 mt-0.5 text-xs text-gray-500">
                                            {grupo.merchant.isOpen ? (
                                                <span className="inline-flex items-center gap-1 font-bold text-green-700">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                    Abierto
                                                </span>
                                            ) : (
                                                <span className="font-bold text-gray-400">Cerrado</span>
                                            )}
                                            <span className="inline-flex items-center gap-1">
                                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                                {grupo.merchant.rating ? grupo.merchant.rating.toFixed(1) : "Nuevo"}
                                            </span>
                                            {grupo.merchant.deliveryTimeMin !== undefined && (
                                                <span className="inline-flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {grupo.merchant.deliveryTimeMin}–{grupo.merchant.deliveryTimeMax} min
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                </Link>

                                {/* Sus productos que coinciden: riel horizontal, mismo
                                    lenguaje que el perfil del comercio. */}
                                {grupo.productos.length > 0 && (
                                    <div className="flex gap-3 overflow-x-auto scrollbar-hide px-3 pb-3">
                                        {grupo.productos.map((prod) => (
                                            <div
                                                key={prod.id}
                                                className="w-[42%] min-w-[132px] max-w-[168px] sm:w-44 flex-shrink-0"
                                            >
                                                <ProductCard
                                                    product={{
                                                        id: prod.id,
                                                        slug: prod.slug,
                                                        name: prod.name,
                                                        price: prod.price,
                                                        description: null,
                                                        image: prod.images?.[0]?.url ?? null,
                                                        merchantId: prod.merchant?.id,
                                                        merchant: prod.merchant
                                                            ? { isOpen: prod.merchant.isOpen }
                                                            : undefined,
                                                        points: null,
                                                        stock: prod.stock,
                                                    }}
                                                    showAddButton
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
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
