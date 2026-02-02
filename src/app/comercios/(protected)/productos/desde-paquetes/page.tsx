"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    Package,
    Loader2,
    ChevronLeft,
    ArrowRight,
    Layers,
    Eye,
    EyeOff,
    Check,
    X,
    Plus,
    ToggleLeft,
    ToggleRight,
    ShoppingBag,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { toggleProductActive, importCatalogProducts } from "@/app/comercios/actions";
import { cleanEncoding } from "@/lib/utils/stringUtils";

const cleanName = cleanEncoding;

interface PackageCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    isFullPackage?: boolean;
}

interface Product {
    id: string; // Master ID
    merchantProductId: string | null;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    isImported: boolean;
    image: string | null;
}

export default function ProductosDesdePaquetesPage() {
    const router = useRouter();
    const [packages, setPackages] = useState<PackageCategory[]>([]);
    const [selectedPackage, setSelectedPackage] = useState<PackageCategory | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [togglingProduct, setTogglingProduct] = useState<string | null>(null);

    // Fetch packages on mount
    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/comercios/mis-paquetes");
            if (res.ok) {
                const data = await res.json();
                setPackages(data);
            }
        } catch (error) {
            console.error("Error fetching packages:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async (packageId: string) => {
        try {
            setLoadingProducts(true);
            const res = await fetch(`/api/comercios/mis-paquetes/${packageId}/productos`);
            if (res.ok) {
                const data = await res.json();
                setProducts(data.products);
            }
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoadingProducts(false);
        }
    };

    const handleSelectPackage = (pkg: PackageCategory) => {
        setSelectedPackage(pkg);
        fetchProducts(pkg.id);
    };

    const handleBackToPackages = () => {
        setSelectedPackage(null);
        setProducts([]);
        fetchPackages(); // Refresh counts
    };

    const handleToggleProduct = async (merchantProductId: string, currentActive: boolean) => {
        setTogglingProduct(merchantProductId);
        try {
            const result = await toggleProductActive(merchantProductId, !currentActive);
            if (result.success) {
                // Update local state
                setProducts(prev => prev.map(p =>
                    p.merchantProductId === merchantProductId ? { ...p, isActive: !currentActive } : p
                ));
            } else {
                alert(result.error || "Error al actualizar el producto");
            }
        } catch (error) {
            console.error("Error toggling product:", error);
        } finally {
            setTogglingProduct(null);
        }
    };

    const handleImportProduct = async (masterId: string) => {
        setTogglingProduct(masterId);
        try {
            const result = await importCatalogProducts([masterId]);
            if (result.success) {
                // Refresh the current package products to see it as imported
                if (selectedPackage) {
                    await fetchProducts(selectedPackage.id);
                }
            } else {
                alert(result.error || "Error al importar el producto");
            }
        } catch (error) {
            console.error("Error importing product:", error);
        } finally {
            setTogglingProduct(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm animate-pulse">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Sincronizando tus adquisiciones...</p>
            </div>
        );
    }

    // Empty state - no packages
    if (!loading && packages.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-20 text-center bg-white rounded-[3rem] border border-gray-100 shadow-sm p-12">
                <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-blue-600">
                    <ShoppingBag className="w-12 h-12" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Tu Galería está Vacía
                </h1>
                <p className="text-gray-500 mb-8 font-medium max-w-md mx-auto leading-relaxed">
                    Aún no has activado productos del catálogo Moovy. Adquirí paquetes o productos individuales para empezar a vender con fotos profesionales.
                </p>
                <Link
                    href="/comercios/adquirir-paquetes"
                    className="inline-flex items-center gap-3 px-10 py-5 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition shadow-xl shadow-blue-200 active:scale-95"
                >
                    <Sparkles className="w-5 h-5" />
                    Explorar Catálogo Moovy
                </Link>
            </div>
        );
    }

    // Products view (when a package is selected)
    if (selectedPackage) {
        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <button
                            onClick={handleBackToPackages}
                            className="group flex items-center gap-2 text-gray-400 hover:text-blue-600 font-bold uppercase tracking-wider text-[10px] transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Volver a Mis Rubros
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
                                    {cleanName(selectedPackage.name)}
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${selectedPackage.isFullPackage
                                    ? "bg-blue-600 text-white border-blue-500"
                                    : "bg-amber-100 text-amber-700 border-amber-200"
                                    }`}>
                                    {selectedPackage.isFullPackage ? "Paquete Full" : "Items Adquiridos"}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium italic">
                                "{selectedPackage.description || "Gestión de visibilidad de productos Moovy"}"
                            </p>
                        </div>
                    </div>
                </header>

                {/* Dashboard Stats Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                            <Package className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Rubro</p>
                            <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
                            <Eye className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">En Tienda</p>
                            <p className="text-2xl font-bold text-green-600">{products.filter(p => p.isImported && p.isActive).length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600">
                            <EyeOff className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ocultos</p>
                            <p className="text-2xl font-bold text-amber-600">{products.filter(p => p.isImported && !p.isActive).length}</p>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-[2rem] border border-blue-50 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                            <Plus className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sin Agregar</p>
                            <p className="text-2xl font-bold text-blue-600">{products.filter(p => !p.isImported).length}</p>
                        </div>
                    </div>
                </div>

                {/* Products Grid - More Professional Look */}
                {loadingProducts ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                        <p className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando inventario...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className={`group bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden flex flex-col ${!product.isImported
                                    ? "border-blue-100 bg-blue-50/10 shadow-sm opacity-90"
                                    : product.isActive
                                        ? "border-green-100 shadow-sm hover:shadow-xl hover:-translate-y-1"
                                        : "border-gray-100 opacity-60 hover:opacity-90 grayscale-0"
                                    }`}
                            >
                                {/* Media Container */}
                                <div className="aspect-square relative overflow-hidden bg-gray-50 border-b border-gray-100">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-cover transition-all duration-700 group-hover:scale-110"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-200">
                                            <Package className="w-16 h-16" />
                                        </div>
                                    )}

                                    {/* Glassmorphism Badge */}
                                    <div className={`absolute top-4 left-4 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg border border-white/30 ${!product.isImported ? "bg-blue-600/90 text-white" :
                                        product.isActive ? "bg-green-600/90 text-white" : "bg-gray-800/80 text-white"
                                        }`}>
                                        {!product.isImported ? "En Catálogo" : product.isActive ? "Visible" : "Oculto"}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">
                                            {cleanName(product.name)}
                                        </h3>
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-xl font-black text-gray-900">
                                                ${product.price.toLocaleString("es-AR")}
                                            </p>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {product.isImported ? `Stock: ${product.stock} un.` : "Listo para importar"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Toggle / Import */}
                                    <button
                                        onClick={() => product.isImported
                                            ? handleToggleProduct(product.merchantProductId!, product.isActive)
                                            : handleImportProduct(product.id)
                                        }
                                        disabled={togglingProduct === (product.isImported ? product.merchantProductId : product.id)}
                                        className={`w-full py-4 px-4 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all flex items-center justify-center gap-3 ${!product.isImported
                                            ? "bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-lg shadow-blue-100" :
                                            product.isActive
                                                ? "bg-green-50 text-green-700 border-green-100 hover:bg-green-100"
                                                : "bg-blue-600 text-white border-blue-500 hover:bg-blue-700 shadow-lg shadow-blue-100"
                                            } disabled:opacity-50 active:scale-95`}
                                    >
                                        {togglingProduct === (product.isImported ? product.merchantProductId : product.id) ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : !product.isImported ? (
                                            <>
                                                <Plus className="w-5 h-5" />
                                                Agregar a mi Tienda
                                            </>
                                        ) : product.isActive ? (
                                            <>
                                                <ToggleRight className="w-5 h-5" />
                                                Quitar de Tienda
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="w-5 h-5 shadow-sm" />
                                                Activar en Tienda
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Packages Grid (default view) - Compact Redesign
    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Header Area */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-2">
                        Mis Productos Moovy
                    </h1>
                    <p className="text-lg text-gray-500 font-medium">
                        Gestioná la visibilidad de tus rubros y adquisiciones oficiales.
                    </p>
                </div>
                <Link
                    href="/comercios/adquirir-paquetes"
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-white border border-gray-100 text-blue-600 rounded-[1.25rem] font-bold hover:bg-blue-50 hover:border-blue-100 transition shadow-sm hover:shadow-md group"
                >
                    <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Adquirir más Contenido
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </header>

            {/* Premium Compact Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        onClick={() => handleSelectPackage(pkg)}
                        className="group cursor-pointer bg-white rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-2xl hover:border-blue-200 transition-all duration-500 overflow-hidden relative"
                    >
                        {/* Compact Visual Header */}
                        <div className="aspect-[2.2/1] relative overflow-hidden">
                            {pkg.image ? (
                                <Image
                                    src={pkg.image}
                                    alt={pkg.name}
                                    fill
                                    className="object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                                    <Layers className="w-12 h-12 text-white/20" />
                                </div>
                            )}

                            {/* Status Badges Overlay */}
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
                                <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-[0.2em] shadow-lg border border-white/20 ${pkg.isFullPackage
                                    ? "bg-blue-600 text-white"
                                    : "bg-white/90 backdrop-blur text-blue-700"
                                    }`}>
                                    {pkg.isFullPackage ? "Fulll Pack" : "Mixed Box"}
                                </span>

                                <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">{pkg.totalProducts} SKU</span>
                                </div>
                            </div>

                            {/* Gradient Fade */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/10" />
                        </div>

                        {/* Content Area */}
                        <div className="p-6 space-y-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                                    {cleanName(pkg.name)}
                                </h3>
                                <p className="text-xs text-gray-400 mt-1 line-clamp-1 font-medium italic">
                                    {pkg.description || "Colección de productos oficiales Moovy"}
                                </p>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                <div className="flex gap-2">
                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-gray-50 rounded-lg text-[10px] font-bold text-gray-500">
                                        Explorar Rubro
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </span>
                                </div>
                                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                    <Package className="w-5 h-5" />
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
