"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import UploadImage from "@/components/ui/UploadImage";
import {
    ShoppingBag, Search, Loader2, ChevronLeft, Check,
    ImageIcon, Layers, ArrowRight, Plus, Sparkles,
    Package, ShoppingCart, Star, Clock, Zap, Gift,
    TrendingUp, ChevronRight
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    images: { url: string; alt: string | null }[];
    categories: { category: { id: string; name: string } }[];
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    price: number;
    starterPrice: number | null;
    isStarter: boolean;
    allowIndividualPurchase: boolean;
    parentId: string | null;
    children?: Category[];
    totalProducts?: number;
    isOwned?: boolean;
    _count?: { products: number };
}

interface PricingTier {
    id: string;
    name: string;
    minItems: number;
    maxItems: number | null;
    pricePerItem: number;
    totalPrice: number;
}

type ViewMode = "home" | "catalog" | "category-detail" | "custom-builder" | "manage";

export default function PackageCatalogPage() {
    const router = useRouter();
    const [view, setView] = useState<ViewMode>("home");
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
    const [ownedCategories, setOwnedCategories] = useState<string[]>([]);
    const [ownedProducts, setOwnedProducts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [cart, setCart] = useState<string[]>([]);
    const [purchasing, setPurchasing] = useState(false);
    const [subcategoryFilter, setSubcategoryFilter] = useState("all");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [catalogRes, prodRes] = await Promise.all([
                fetch("/api/merchant/packages/catalog"),
                fetch("/api/admin/products"),
            ]);

            const catalogData = await catalogRes.json();
            const prodData = await prodRes.json();

            if (catalogData.categories) setCategories(catalogData.categories);
            if (catalogData.pricingTiers) setPricingTiers(catalogData.pricingTiers);
            if (catalogData.ownedCategories) setOwnedCategories(catalogData.ownedCategories);
            if (catalogData.ownedProducts) setOwnedProducts(catalogData.ownedProducts);

            if (Array.isArray(prodData)) {
                setProducts(prodData.filter((p: any) => p.merchant === null && p.isActive === true));
            }
        } catch (error) {
            console.error("Error fetching catalog:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Filtered categories for search
    const filteredCategories = useMemo(() =>
        categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase())),
        [categories, search]
    );

    // Products in selected category
    const categoryProducts = useMemo(() => {
        if (!selectedCategory) return [];
        const catIds = [selectedCategory.id];
        if (selectedCategory.children) {
            catIds.push(...selectedCategory.children.map(c => c.id));
        }
        let filtered = products.filter(p =>
            p.categories.some(c => catIds.includes(c.category.id))
        );
        if (subcategoryFilter !== "all") {
            filtered = filtered.filter(p =>
                p.categories.some(c => c.category.id === subcategoryFilter)
            );
        }
        return filtered.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }, [selectedCategory, products, subcategoryFilter, search]);

    // All products for custom builder (searchable)
    const allSearchableProducts = useMemo(() =>
        products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
        [products, search]
    );

    // Current pricing tier for custom cart
    const currentTier = useMemo(() => {
        if (cart.length === 0) return null;
        return pricingTiers
            .filter(t => cart.length >= t.minItems && (!t.maxItems || cart.length <= t.maxItems))
            .sort((a, b) => a.pricePerItem - b.pricePerItem)[0] || null;
    }, [cart, pricingTiers]);

    // Next tier suggestion
    const nextTier = useMemo(() => {
        if (pricingTiers.length === 0) return null;
        return pricingTiers.find(t => t.minItems > cart.length) || null;
    }, [cart, pricingTiers]);

    const cartTotal = useMemo(() => {
        if (currentTier) return currentTier.pricePerItem * cart.length;
        const individualPrice = pricingTiers.find(t => t.minItems === 1)?.pricePerItem || 500;
        return individualPrice * cart.length;
    }, [cart, currentTier, pricingTiers]);

    const toggleCart = (productId: string) => {
        if (ownedProducts.includes(productId)) return;
        setCart(prev => prev.includes(productId)
            ? prev.filter(id => id !== productId)
            : [...prev, productId]
        );
    };

    const handlePurchase = async (type: string, catId?: string, prodIds?: string[]) => {
        setPurchasing(true);
        try {
            const res = await fetch("/api/merchant/packages/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    purchaseType: type,
                    categoryId: catId,
                    productIds: prodIds,
                }),
            });

            const data = await res.json();

            if (data.paymentMethod === "free") {
                // Free purchase — go to success page
                router.push(`/comercios/paquetes/resultado?status=success&free=true&count=${data.imported}`);
            } else if (data.initPoint) {
                // Redirect to MercadoPago
                const mpUrl = process.env.NODE_ENV === "production" ? data.initPoint : (data.sandboxInitPoint || data.initPoint);
                window.location.href = mpUrl;
            } else {
                console.error("No init_point in response:", data);
            }
        } catch (error) {
            console.error("Purchase error:", error);
        } finally {
            setPurchasing(false);
        }
    };

    // ============= HOME VIEW =============
    if (view === "home") {
        return (
            <div className="max-w-5xl mx-auto py-8 px-4 space-y-10 animate-in fade-in duration-500">
                <div className="text-center space-y-3">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter">
                        Catalogo <span className="text-[#e60012]">MOOVY</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-xl mx-auto">
                        Fotos profesionales, nombres y descripciones listas para tu tienda. Carga tu catalogo en minutos.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Option 1: Complete Package */}
                    <div
                        onClick={() => setView("catalog")}
                        className="group cursor-pointer bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-[#e60012] rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                            <Package className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Paquete Completo</h3>
                        <p className="text-sm text-slate-500 mb-4">Todos los productos de un rubro con fotos profesionales. La opcion mas economica por producto.</p>
                        <div className="flex items-center gap-1 text-[#e60012] text-sm font-bold">
                            Explorar rubros <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* Option 2: Build Your Own */}
                    <div
                        onClick={() => { setView("custom-builder"); setSearch(""); }}
                        className="group cursor-pointer bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform">
                            <ShoppingCart className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2">Arma el tuyo</h3>
                        <p className="text-sm text-slate-500 mb-4">Elegí productos individuales de cualquier rubro. Cuantos mas elegis, menos pagas por cada uno.</p>
                        {pricingTiers.length > 0 && (
                            <div className="text-xs text-blue-600 font-bold">
                                Desde ${pricingTiers[pricingTiers.length - 1]?.pricePerItem?.toLocaleString() || "—"}/producto
                            </div>
                        )}
                    </div>

                    {/* Option 3: Manage My Packages */}
                    <div
                        onClick={() => router.push("/comercios/productos/desde-paquetes")}
                        className="group cursor-pointer bg-slate-900 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform border border-white/20">
                            <Layers className="w-7 h-7" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-2">Mis Paquetes</h3>
                        <p className="text-sm text-white/60 mb-4">Gestiona los productos que ya adquiriste. Activa, oculta o personaliza precios de venta.</p>
                        <div className="flex items-center gap-1 text-white text-sm font-bold">
                            Gestionar <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </div>

                {/* Pricing Tiers Preview */}
                {pricingTiers.length > 0 && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100">
                        <div className="flex items-center gap-3 mb-5">
                            <TrendingUp className="w-6 h-6 text-blue-600" />
                            <h3 className="text-lg font-black text-slate-900">Cuantos mas elegis, menos pagas</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {pricingTiers.map(tier => (
                                <div key={tier.id} className="bg-white rounded-2xl p-4 text-center border border-blue-100">
                                    <p className="text-2xl font-black text-slate-900">${tier.pricePerItem.toLocaleString()}</p>
                                    <p className="text-xs text-slate-500 font-medium">por producto</p>
                                    <p className="text-sm font-bold text-blue-600 mt-2">{tier.name}</p>
                                    <p className="text-xs text-slate-400">${tier.totalPrice.toLocaleString()} total</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Purchase History Link */}
                <div className="text-center">
                    <button
                        onClick={() => router.push("/comercios/paquetes/historial")}
                        className="text-sm text-slate-400 hover:text-slate-600 font-bold transition flex items-center gap-1 mx-auto"
                    >
                        <Clock className="w-4 h-4" />
                        Ver historial de compras
                    </button>
                </div>
            </div>
        );
    }

    // ============= CATALOG VIEW (Browse by Rubro) =============
    if (view === "catalog" && !selectedCategory) {
        return (
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900">Paquetes por Rubro</h1>
                        <p className="text-sm text-slate-500">Elige un rubro para ver todos los productos incluidos</p>
                    </div>
                    <button onClick={() => { setView("home"); setSearch(""); }} className="px-4 py-2 text-slate-500 hover:text-slate-700 font-bold text-sm flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Volver
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar rubros..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#e60012]/20 focus:border-[#e60012] outline-none"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCategories.map(cat => (
                            <div
                                key={cat.id}
                                onClick={() => { setSelectedCategory(cat); setSearch(""); setSubcategoryFilter("all"); }}
                                className="group cursor-pointer bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-all duration-300"
                            >
                                <div className="aspect-[3/2] relative">
                                    {cat.image ? (
                                        <UploadImage src={cat.image} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                                            <Package className="w-16 h-16 text-white/20" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

                                    {cat.isOwned && (
                                        <div className="absolute top-3 left-3 bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Adquirido
                                        </div>
                                    )}

                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-xl font-black text-white">{cat.name}</h3>
                                        <p className="text-white/70 text-xs font-medium mt-1">
                                            {cat.totalProducts || cat._count?.products || 0} productos
                                        </p>
                                    </div>
                                </div>

                                <div className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-xl font-black text-slate-900">${(cat.price || 0).toLocaleString()}</p>
                                        {cat.starterPrice && (
                                            <p className="text-xs text-blue-600 font-medium">Starter desde ${cat.starterPrice.toLocaleString()}</p>
                                        )}
                                    </div>
                                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#e60012] group-hover:text-white transition-colors">
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ============= CATEGORY DETAIL VIEW =============
    if (view === "catalog" && selectedCategory) {
        const subcategories = selectedCategory.children || [];
        const totalInCat = categoryProducts.length;

        return (
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button onClick={() => { setSelectedCategory(null); setSearch(""); setSubcategoryFilter("all"); }} className="text-sm text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 mb-2">
                            <ChevronLeft className="w-4 h-4" /> Todos los rubros
                        </button>
                        <h1 className="text-2xl font-black text-slate-900">{selectedCategory.name}</h1>
                        <p className="text-sm text-slate-500">{totalInCat} productos con fotos profesionales</p>
                    </div>
                    <div className="flex gap-3">
                        {selectedCategory.starterPrice && !selectedCategory.isOwned && (
                            <button
                                onClick={() => handlePurchase("starter", selectedCategory.id)}
                                disabled={purchasing}
                                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Starter ${selectedCategory.starterPrice.toLocaleString()}</>}
                            </button>
                        )}
                        {!selectedCategory.isOwned && (
                            <button
                                onClick={() => handlePurchase("package", selectedCategory.id)}
                                disabled={purchasing}
                                className="px-6 py-3 bg-[#e60012] text-white rounded-xl font-black text-sm hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                    <>
                                        <ShoppingBag className="w-4 h-4" />
                                        Paquete Completo ${(selectedCategory.price || 0).toLocaleString()}
                                    </>
                                )}
                            </button>
                        )}
                        {selectedCategory.isOwned && (
                            <div className="px-6 py-3 bg-green-50 text-green-700 rounded-xl font-bold text-sm flex items-center gap-2 border border-green-200">
                                <Check className="w-4 h-4" /> Ya adquirido
                            </div>
                        )}
                    </div>
                </div>

                {/* Info banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-blue-900">Importacion automatica</p>
                        <p className="text-xs text-blue-700/70">Al comprar, todos los productos se agregan automaticamente a tu tienda. Despues podes ocultar los que no vendas.</p>
                    </div>
                </div>

                {/* Subcategory tabs */}
                {subcategories.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button
                            onClick={() => setSubcategoryFilter("all")}
                            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition ${subcategoryFilter === "all" ? "bg-[#e60012] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                        >
                            Todos ({totalInCat})
                        </button>
                        {subcategories.map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setSubcategoryFilter(sub.id)}
                                className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition ${subcategoryFilter === sub.id ? "bg-[#e60012] text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
                            >
                                {sub.name} ({sub._count?.products || 0})
                            </button>
                        ))}
                    </div>
                )}

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#e60012]/20 outline-none text-sm"
                    />
                </div>

                {/* Product grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryProducts.map(p => (
                        <div key={p.id} className="bg-white rounded-xl border border-slate-100 overflow-hidden">
                            <div className="aspect-square relative bg-slate-50">
                                {p.images?.[0]?.url ? (
                                    <UploadImage src={p.images[0].url} alt={p.name} fill className="object-cover" />
                                ) : (
                                    <UploadImageIcon className="w-10 h-10 absolute inset-0 m-auto text-slate-200" />
                                )}
                                {ownedProducts.includes(p.id) && (
                                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                                <h4 className="text-sm font-bold text-slate-900 line-clamp-2">{p.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-1">Foto + descripcion incluida</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // ============= CUSTOM BUILDER VIEW =============
    if (view === "custom-builder") {
        return (
            <div className="max-w-6xl mx-auto py-8 px-4 space-y-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between">
                    <div>
                        <button onClick={() => { setView("home"); setSearch(""); setCart([]); }} className="text-sm text-slate-400 hover:text-slate-600 font-bold flex items-center gap-1 mb-2">
                            <ChevronLeft className="w-4 h-4" /> Volver
                        </button>
                        <h1 className="text-2xl font-black text-slate-900">Arma tu propio paquete</h1>
                        <p className="text-sm text-slate-500">Selecciona productos de cualquier rubro</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar producto por nombre..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    />
                </div>

                {/* Upsell nudge */}
                {nextTier && cart.length > 0 && cart.length < nextTier.minItems && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                        <Gift className="w-5 h-5 text-blue-600 shrink-0" />
                        <p className="text-sm text-blue-900">
                            <span className="font-bold">Agrega {nextTier.minItems - cart.length} producto(s) mas</span> y desbloqueas el {nextTier.name} a ${nextTier.pricePerItem.toLocaleString()}/producto (ahorras ${((currentTier ? currentTier.pricePerItem : 500) - nextTier.pricePerItem) * cart.length}/total)
                        </p>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {allSearchableProducts.map(p => {
                            const isInCart = cart.includes(p.id);
                            const isOwned = ownedProducts.includes(p.id);

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => !isOwned && toggleCart(p.id)}
                                    className={`group cursor-pointer bg-white rounded-xl border-2 overflow-hidden transition-all ${isInCart ? "border-blue-500 ring-4 ring-blue-50 shadow-lg" : isOwned ? "border-green-200 opacity-60" : "border-slate-100 hover:border-slate-200 hover:shadow-md"}`}
                                >
                                    <div className="aspect-square relative bg-slate-50">
                                        {p.images?.[0]?.url ? (
                                            <UploadImage src={p.images[0].url} alt={p.name} fill className="object-cover" />
                                        ) : (
                                            <UploadImageIcon className="w-8 h-8 absolute inset-0 m-auto text-slate-200" />
                                        )}
                                        {isInCart && (
                                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                <Check className="w-10 h-10 text-white bg-blue-600 rounded-full p-2 shadow-lg" />
                                            </div>
                                        )}
                                        {isOwned && (
                                            <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                                                <Check className="w-3 h-3" />
                                            </div>
                                        )}
                                        {/* Category badge */}
                                        {p.categories[0] && (
                                            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                                                {p.categories[0].category.name}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3">
                                        <h4 className="text-xs font-bold text-slate-900 line-clamp-2">{p.name}</h4>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Sticky cart bar */}
                {cart.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-2xl p-4 animate-in slide-in-from-bottom duration-300">
                        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                                    {cart.length}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900 text-sm">
                                        {cart.length} producto{cart.length !== 1 ? "s" : ""} seleccionado{cart.length !== 1 ? "s" : ""}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {currentTier ? `${currentTier.name} — $${currentTier.pricePerItem.toLocaleString()}/producto` : `$${(pricingTiers.find(t => t.minItems === 1)?.pricePerItem || 500).toLocaleString()}/producto`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setCart([])} className="text-slate-400 hover:text-slate-600 text-sm font-bold">Limpiar</button>
                                <button
                                    onClick={() => handlePurchase("custom", undefined, cart)}
                                    disabled={purchasing}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-xl font-black text-sm hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                                >
                                    {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                        <>Comprar ${cartTotal.toLocaleString()}</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return null;
}
