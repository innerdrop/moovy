"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    ShoppingBag,
    Search,
    Loader2,
    ChevronLeft,
    Check,
    ImageIcon,
    Layers,
    Info,
    ArrowRight,
    Plus,
    Sparkles
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    images: { url: string; alt: string | null }[];
    categories: { category: { id: string, name: string } }[];
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    price: number;
    allowIndividualPurchase: boolean;
    parentId: string | null;
    parent?: Category | null;
    children?: Category[];
    _count?: { products: number };
}

export default function BuyFromCatalogPage() {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<"selection" | "catalog">("selection");
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [cart, setCart] = useState<string[]>([]); // For individual selection
    const [ownedCategories, setOwnedCategories] = useState<string[]>([]);
    const [ownedProducts, setOwnedProducts] = useState<string[]>([]);
    const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes, acqRes] = await Promise.all([
                fetch("/api/admin/products"),
                fetch("/api/admin/categories"),
                fetch("/api/comercios/adquisiciones")
            ]);

            const prodData = await prodRes.json();
            const catData = await catRes.json();
            const acqData = await acqRes.json();

            if (!acqData.error) {
                setOwnedCategories(acqData.categories || []);
                setOwnedProducts(acqData.products || []);
            }

            if (Array.isArray(prodData)) {
                // Filter: Only master products (merchant is null) AND currently active in Ops
                setProducts(prodData.filter((p: any) => p.merchant === null && p.isActive === true));
            }
            if (Array.isArray(catData)) {
                setCategories(catData);
            }
        } catch (error) {
            console.error("Error fetching catalog:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const toggleInCart = (id: string) => {
        if (ownedProducts.includes(id)) return; // Don't add if already owned
        setCart(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handlePurchase = async (mode: "package" | "items") => {
        if (mode === "package") {
            if (!selectedCategory) return;
            router.push(`/comercios/checkout?mode=package&categoryId=${selectedCategory.id}`);
        } else {
            const newItems = cart.filter(id => !ownedProducts.includes(id));
            if (newItems.length === 0) return;
            router.push(`/comercios/checkout?mode=items&productIds=${newItems.join(",")}`);
        }
    };

    // Filter categories - only show master packages (root categories, no parentId)
    const filteredCategories = categories.filter(c =>
        !c.parentId && c.name.toLowerCase().includes(search.toLowerCase())
    );

    // Get all category IDs including children for product filtering
    const getCategoryIds = (cat: Category): string[] => {
        const ids = [cat.id];
        const fullCategory = categories.find(c => c.id === cat.id);
        if (fullCategory?.children && fullCategory.children.length > 0) {
            fullCategory.children.forEach(child => ids.push(child.id));
        }
        return ids;
    };

    // Products in selected category (including children subcategories)
    const productsInCategory = selectedCategory
        ? products.filter(p => {
            // If subcategoryFilter is set, filter by that specific subcategory
            if (subcategoryFilter !== "all") {
                return p.categories.some(c => c.category.id === subcategoryFilter);
            }
            // Otherwise show all products from the master package (including all subcategories)
            const categoryIds = getCategoryIds(selectedCategory);
            return p.categories.some(c => categoryIds.includes(c.category.id));
        })
        : [];

    const filteredItems = productsInCategory.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    // Get subcategories of selected master package for the filter
    const subcategories = selectedCategory?.children || [];

    if (completed) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                    <Check className="w-12 h-12 text-green-600" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">¡Información Vinculada!</h2>
                <p className="text-slate-600 max-w-md mx-auto mb-8 font-medium">
                    La base de datos, fotos oficiales y fichas técnicas se han copiado con éxito a tu panel de productos.
                </p>
                <div className="flex gap-4">
                    <button
                        onClick={() => { setCompleted(false); setSelectedCategory(null); setViewMode("selection"); fetchData(); }}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition"
                    >
                        Volver al Inicio
                    </button>
                    <a
                        href="/comercios/productos"
                        className="px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-50 transition"
                    >
                        Ir a Mis Productos
                    </a>
                </div>
            </div>
        );
    }

    if (viewMode === "selection") {
        return (
            <div className="max-w-5xl mx-auto py-12 space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">
                        PAQUETES <span className="text-blue-600">MOOVY</span>
                    </h1>
                    <p className="text-xl text-slate-500 font-medium max-w-2xl mx-auto">
                        Gestiona tus adquisiciones oficiales o explora nuevos rubros para potenciar tu catálogo.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Opción 1: Explorar Catálogo */}
                    <div
                        onClick={() => setViewMode("catalog")}
                        className="group relative cursor-pointer bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShoppingBag className="w-32 h-32 text-blue-600 rotate-12" />
                        </div>

                        <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 mb-8 group-hover:scale-110 transition-transform">
                            <Plus className="w-10 h-10 stroke-[3px]" />
                        </div>

                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-4">
                            ADQUIRIR NUEVOS PAQUETES
                        </h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-8">
                            Explora el catálogo oficial de Moovy, adquiere rubros completos con fotos profesionales y descripciones técnicas listas para vender.
                        </p>

                        <div className="flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-sm">
                            Explorar Catálogo
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>

                    {/* Opción 2: Mis Paquetes */}
                    <div
                        onClick={() => router.push("/comercios/productos/desde-paquetes")}
                        className="group relative cursor-pointer bg-slate-900 rounded-[3rem] p-10 shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Layers className="w-32 h-32 text-white -rotate-12" />
                        </div>

                        <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform border border-white/20">
                            <Layers className="w-10 h-10" />
                        </div>

                        <h3 className="text-3xl font-black text-white tracking-tight leading-none mb-4">
                            GESTIONAR MIS PAQUETES
                        </h3>
                        <p className="text-white/60 font-medium leading-relaxed mb-8">
                            Administra la visibilidad de los productos que ya has adquirido. Activa o quita items de tu tienda oficial en segundos.
                        </p>

                        <div className="flex items-center gap-2 text-white font-black uppercase tracking-widest text-sm">
                            Ver mis adquisiciones
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </div>
                    </div>
                </div>

                <div className="pt-8 text-center flex items-center justify-center gap-6">
                    <div className="flex -space-x-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                {i}
                            </div>
                        ))}
                    </div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                        +500 comercios ya operan con Paquetes Moovy
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-poppins">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                        {selectedCategory ? selectedCategory.name : "Adquisición de Datos"}
                    </h1>
                    <p className="text-slate-600 font-medium">
                        {selectedCategory
                            ? `Adquirí la información oficial de ${productsInCategory.length} productos Moovy.`
                            : "Explorá los rubros oficiales y cargá tu tienda con fotos profesionales."}
                    </p>
                </div>

                <div className="flex gap-2">
                    {!selectedCategory && (
                        <button
                            onClick={() => setViewMode("selection")}
                            className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition flex items-center gap-2"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            Volver
                        </button>
                    )}

                    {selectedCategory && (
                        <>
                            <button
                                onClick={() => { setSelectedCategory(null); setSubcategoryFilter("all"); }}
                                className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition flex items-center gap-2"
                            >
                                <ChevronLeft className="w-5 h-5" />
                                Otros Paquetes
                            </button>

                            <button
                                onClick={() => handlePurchase("package")}
                                disabled={isProcessing}
                                className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShoppingBag className="w-5 h-5" />}
                                Adquirir Paquete Full (${(selectedCategory.price || 0).toLocaleString()})
                            </button>
                        </>
                    )}
                </div>
            </header>

            {/* Level 1: Categories Gallery */}
            {!selectedCategory ? (
                <div className="space-y-8">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Buscar rubros (ej: Almacén, Limpieza, Bebidas)..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-12 pr-6 py-5 bg-white border border-slate-100 rounded-3xl shadow-sm italic focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500/50 outline-none transition-all text-lg"
                        />
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {filteredCategories.map((cat) => {
                                const hasChildren = cat.children && cat.children.length > 0;
                                const totalProducts = hasChildren
                                    ? cat.children!.reduce((sum, c) => sum + (c._count?.products || 0), 0)
                                    : (cat._count?.products || 0);

                                return (
                                    <div
                                        key={cat.id}
                                        onClick={() => { setSelectedCategory(cat); setSearch(""); }}
                                        className="group cursor-pointer bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                                    >
                                        <div className="aspect-[4/3] relative">
                                            {cat.image ? (
                                                <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white/20">
                                                    <Layers className="w-20 h-20" />
                                                </div>
                                            )}
                                            {ownedCategories.includes(cat.id) && (
                                                <div className="absolute top-6 left-6 z-10">
                                                    <div className="bg-green-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg border border-white/20 flex items-center gap-1.5 animate-in slide-in-from-left duration-300">
                                                        <Check className="w-3 h-3" />
                                                        Adquirido
                                                    </div>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent"></div>
                                            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                                                <div>
                                                    <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">{cat.name}</h3>
                                                    {hasChildren ? (
                                                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                                                            {cat.children!.length} subcategorías · {totalProducts} productos
                                                        </p>
                                                    ) : (
                                                        <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                                                            Contiene {cat._count?.products || 0} SKU
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Precio</p>
                                                    <p className="text-2xl font-black text-white">${(cat.price || 0).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Subcategories list for master packages */}
                                        {hasChildren && (
                                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Incluye:</p>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {cat.children!.slice(0, 5).map(child => (
                                                        <span key={child.id} className="text-xs font-medium bg-white text-slate-600 px-2 py-1 rounded-lg border border-slate-200">
                                                            {child.name}
                                                        </span>
                                                    ))}
                                                    {cat.children!.length > 5 && (
                                                        <span className="text-xs font-bold text-slate-400 px-2 py-1">
                                                            +{cat.children!.length - 5} más
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="p-4 bg-slate-50 group-hover:bg-blue-600 transition-colors flex items-center justify-between">
                                            <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white/80 transition-colors">Explorar Contenido</span>
                                            <ArrowRight className="w-5 h-5 text-blue-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* Level 2: Package Drill-down */
                <div className="space-y-8 animate-in slide-in-from-right duration-500">
                    {/* Notice bar */}
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-blue-900">Estás viendo la base de datos de {selectedCategory.name}</p>
                            <p className="text-xs text-blue-700/80">Todos los productos incluyen foto profesional y descripción. Podrás ajustar tus precios de venta luego de la adquisición.</p>
                        </div>
                    </div>

                    {/* Subcategory Navigation Tabs */}
                    {subcategories.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-2 overflow-hidden">
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                                <button
                                    onClick={() => setSubcategoryFilter("all")}
                                    className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${subcategoryFilter === "all"
                                        ? "bg-blue-600 text-white shadow-lg"
                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        }`}
                                >
                                    Todos ({productsInCategory.length > 0 ? products.filter(p => {
                                        const categoryIds = getCategoryIds(selectedCategory);
                                        return p.categories.some(c => categoryIds.includes(c.category.id));
                                    }).length : 0})
                                </button>
                                {subcategories.map(sub => {
                                    const subProductCount = products.filter(p =>
                                        p.categories.some(c => c.category.id === sub.id)
                                    ).length;
                                    return (
                                        <button
                                            key={sub.id}
                                            onClick={() => setSubcategoryFilter(sub.id)}
                                            className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${subcategoryFilter === sub.id
                                                ? "bg-blue-600 text-white shadow-lg"
                                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                        >
                                            {sub.name} ({subProductCount})
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Selection Controls if allowed */}
                    {selectedCategory.allowIndividualPurchase && cart.length > 0 && (
                        <div className="sticky top-6 z-20 bg-white/80 backdrop-blur-md p-4 rounded-3xl border-2 border-blue-600 shadow-xl flex items-center justify-between animate-in slide-in-from-top duration-300">
                            <div className="flex items-center gap-4 pl-4">
                                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg">
                                    <Check className="w-6 h-6" />
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{cart.length} productos seleccionados</h4>
                                    <p className="text-sm text-slate-500 font-medium">Estás adquiriendo items de forma individual</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setCart([])} className="px-6 py-3 text-slate-400 hover:text-slate-600 font-bold transition">Cancelar</button>
                                <button
                                    onClick={() => handlePurchase("items")}
                                    disabled={isProcessing}
                                    className="px-8 py-3 bg-blue-600 text-white rounded-[1.25rem] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg active:scale-95"
                                >
                                    Adquirir Seleccionados
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredItems.map(p => {
                            const isSelected = cart.includes(p.id);
                            const isAlreadyOwned = ownedProducts.includes(p.id) || ownedCategories.includes(selectedCategory.id);

                            return (
                                <div
                                    key={p.id}
                                    onClick={() => selectedCategory.allowIndividualPurchase && !isAlreadyOwned && toggleInCart(p.id)}
                                    className={`group bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden flex flex-col ${isSelected ? "border-blue-600 ring-8 ring-blue-50 shadow-2xl" :
                                        isAlreadyOwned ? "border-green-100 bg-gray-50/50 opacity-80" : "border-slate-50 shadow-sm hover:shadow-lg"
                                        } ${selectedCategory.allowIndividualPurchase && !isAlreadyOwned ? "cursor-pointer" : ""}`}
                                >
                                    <div className="aspect-square relative overflow-hidden bg-slate-50">
                                        {p.images?.[0]?.url ? (
                                            <Image src={p.images[0].url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                                        ) : <ImageIcon className="w-12 h-12 absolute inset-0 m-auto text-slate-200" />}

                                        {isSelected && (
                                            <div className="absolute inset-0 bg-blue-600/30 backdrop-blur-[2px] flex items-center justify-center">
                                                <Check className="w-16 h-16 text-white bg-blue-600 rounded-full p-4 shadow-2xl animate-in zoom-in duration-300" />
                                            </div>
                                        )}

                                        {isAlreadyOwned && (
                                            <div className="absolute inset-0 bg-green-500/10 backdrop-blur-[1px] flex items-center justify-center">
                                                <div className="bg-green-500 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-in zoom-in">
                                                    <Check className="w-4 h-4" />
                                                    Adquirido
                                                </div>
                                            </div>
                                        )}

                                        <div className="absolute top-4 right-4">
                                            <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-2xl text-[10px] font-black text-blue-600 shadow-xl border border-blue-50 uppercase tracking-widest">
                                                ID: {p.slug.split('-')[0]}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <h3 className="text-lg font-black text-slate-900 leading-tight uppercase tracking-tight mb-2 group-hover:text-blue-600 transition-colors">{p.name}</h3>
                                        <p className="text-sm text-slate-500 font-medium italic line-clamp-2 mb-4 flex-1">
                                            {p.description || "Este producto cuenta con información técnica detallada."}
                                        </p>
                                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">Moovy Oficial</span>
                                            {selectedCategory.allowIndividualPurchase && !isAlreadyOwned && (
                                                <div className={`p-2 rounded-xl transition-all ${isSelected ? "bg-blue-600 text-white rotate-0" : "bg-slate-50 text-slate-400 group-hover:rotate-12 transition-transform"}`}>
                                                    <Plus className={`w-5 h-5 ${isSelected ? "hidden" : "block"}`} />
                                                    <Check className={`w-5 h-5 ${isSelected ? "block" : "hidden"}`} />
                                                </div>
                                            )}
                                            {isAlreadyOwned && (
                                                <div className="p-2 bg-green-50 text-green-500 rounded-xl">
                                                    <Check className="w-5 h-5" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
