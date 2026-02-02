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
    Plus
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
    _count?: { products: number };
}

export default function BuyFromCatalogPage() {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [cart, setCart] = useState<string[]>([]); // For individual selection
    const [ownedCategories, setOwnedCategories] = useState<string[]>([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch("/api/admin/products"),
                fetch("/api/admin/categories")
            ]);

            const prodData = await prodRes.json();
            const catData = await catRes.json();

            // Fetch merchant's owned categories
            const misPaquetesRes = await fetch("/api/comercios/mis-paquetes");
            const misPaquetesData = await misPaquetesRes.json();
            if (Array.isArray(misPaquetesData)) {
                setOwnedCategories(misPaquetesData.map((p: any) => p.id));
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
        setCart(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handlePurchase = async (mode: "package" | "items") => {
        if (mode === "package") {
            if (!selectedCategory) return;
            router.push(`/comercios/checkout?mode=package&categoryId=${selectedCategory.id}`);
        } else {
            if (cart.length === 0) return;
            router.push(`/comercios/checkout?mode=items&productIds=${cart.join(",")}`);
        }
    };

    // Filter categories by search
    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    // Products in selected category
    const productsInCategory = selectedCategory
        ? products.filter(p => p.categories.some(c => c.category.id === selectedCategory.id))
        : [];

    const filteredItems = productsInCategory.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

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
                        onClick={() => { setCompleted(false); setSelectedCategory(null); fetchData(); }}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition"
                    >
                        Ver más paquetes
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

    return (
        <div className="space-y-8">
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
                    {selectedCategory && (
                        <>
                            <button
                                onClick={() => setSelectedCategory(null)}
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
                            {filteredCategories.map((cat) => (
                                <div
                                    key={cat.id}
                                    onClick={() => { setSelectedCategory(cat); setSearch(""); }}
                                    className="group cursor-pointer bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                                >
                                    <div className="aspect-[4/3] relative">
                                        {cat.image ? (
                                            <Image src={cat.image} alt={cat.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                                        ) : (
                                            <div className="absolute inset-0 bg-slate-50 flex items-center justify-center text-slate-200">
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
                                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">Contiene {cat._count?.products || 0} SKU</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Precio</p>
                                                <p className="text-2xl font-black text-white">${(cat.price || 0).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 group-hover:bg-blue-600 transition-colors flex items-center justify-between">
                                        <span className="text-xs font-black uppercase tracking-widest text-slate-400 group-hover:text-white/80 transition-colors">Explorar Contenido</span>
                                        <ArrowRight className="w-5 h-5 text-blue-600 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            ))}
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
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => selectedCategory.allowIndividualPurchase && toggleInCart(p.id)}
                                    className={`group bg-white rounded-[2rem] border-2 transition-all duration-300 overflow-hidden flex flex-col ${isSelected ? "border-blue-600 ring-8 ring-blue-50 shadow-2xl" : "border-slate-50 shadow-sm hover:shadow-lg"
                                        } ${selectedCategory.allowIndividualPurchase ? "cursor-pointer" : ""}`}
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
                                            {selectedCategory.allowIndividualPurchase && (
                                                <div className={`p-2 rounded-xl transition-all ${isSelected ? "bg-blue-600 text-white rotate-0" : "bg-slate-50 text-slate-400 group-hover:rotate-12 transition-transform"}`}>
                                                    <Plus className={`w-5 h-5 ${isSelected ? "hidden" : "block"}`} />
                                                    <Check className={`w-5 h-5 ${isSelected ? "block" : "hidden"}`} />
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
