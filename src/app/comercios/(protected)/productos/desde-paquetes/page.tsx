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
    ToggleLeft,
    ToggleRight,
    ShoppingBag,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { toggleProductActive } from "@/app/comercios/actions";

interface PackageCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    image: string | null;
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
}

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    isActive: boolean;
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

    const handleToggleProduct = async (productId: string, currentActive: boolean) => {
        setTogglingProduct(productId);
        try {
            const result = await toggleProductActive(productId, !currentActive);
            if (result.success) {
                // Update local state
                setProducts(prev => prev.map(p =>
                    p.id === productId ? { ...p, isActive: !currentActive } : p
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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando paquetes...</p>
            </div>
        );
    }

    // Empty state - no packages
    if (!loading && packages.length === 0) {
        return (
            <div className="max-w-2xl mx-auto py-16 text-center">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8">
                    <ShoppingBag className="w-12 h-12 text-slate-300" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">
                    No tenés paquetes
                </h1>
                <p className="text-slate-500 mb-8 font-medium max-w-md mx-auto">
                    Aún no has adquirido ningún paquete de productos. Explorá nuestro catálogo y empezá a vender con datos oficiales de Moovy.
                </p>
                <Link
                    href="/comercios/adquirir-paquetes"
                    className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                    <Sparkles className="w-5 h-5" />
                    Explorar Paquetes
                </Link>
            </div>
        );
    }

    // Products view (when a package is selected)
    if (selectedPackage) {
        return (
            <div className="space-y-8 animate-in slide-in-from-right duration-500">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <button
                            onClick={handleBackToPackages}
                            className="flex items-center gap-2 text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[10px] mb-2 transition"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Volver a Paquetes
                        </button>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                            {selectedPackage.name}
                        </h1>
                        <p className="text-slate-500 font-medium">
                            Activá o desactivá productos de este paquete
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-xl">
                            <Eye className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-bold text-green-700">
                                {products.filter(p => p.isActive).length} activos
                            </span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
                            <EyeOff className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-bold text-slate-500">
                                {products.filter(p => !p.isActive).length} inactivos
                            </span>
                        </div>
                    </div>
                </header>

                {/* Info Banner */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                    <Package className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-sm font-bold text-blue-900">Gestión rápida de visibilidad</p>
                        <p className="text-xs text-blue-700/80">
                            Los productos activos aparecen en tu tienda. Los inactivos están ocultos pero no se eliminan.
                        </p>
                    </div>
                </div>

                {/* Products Grid */}
                {loadingProducts ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className={`group bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden ${product.isActive
                                        ? "border-green-200 shadow-sm hover:shadow-lg"
                                        : "border-slate-100 opacity-70 hover:opacity-100"
                                    }`}
                            >
                                {/* Product Image */}
                                <div className="aspect-square relative overflow-hidden bg-slate-50">
                                    {product.image ? (
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className={`object-cover transition-all duration-500 ${product.isActive ? "group-hover:scale-105" : "grayscale"
                                                }`}
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-200">
                                            <Package className="w-16 h-16" />
                                        </div>
                                    )}

                                    {/* Status Badge */}
                                    <div className={`absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg ${product.isActive
                                            ? "bg-green-500 text-white"
                                            : "bg-slate-400 text-white"
                                        }`}>
                                        {product.isActive ? "Visible" : "Oculto"}
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-5 space-y-4">
                                    <div>
                                        <h3 className="font-black text-lg text-slate-900 uppercase tracking-tight leading-tight">
                                            {product.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 font-medium mt-1">
                                            ${product.price.toLocaleString("es-AR")} · Stock: {product.stock}
                                        </p>
                                    </div>

                                    {/* Toggle Button */}
                                    <button
                                        onClick={() => handleToggleProduct(product.id, product.isActive)}
                                        disabled={togglingProduct === product.id}
                                        className={`w-full py-3 px-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${product.isActive
                                                ? "bg-green-50 text-green-700 hover:bg-green-100"
                                                : "bg-slate-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                                            } disabled:opacity-50`}
                                    >
                                        {togglingProduct === product.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : product.isActive ? (
                                            <>
                                                <ToggleRight className="w-5 h-5" />
                                                En Tienda
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="w-5 h-5" />
                                                Activar
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

    // Packages Grid (default view)
    return (
        <div className="space-y-8">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                        Mis Paquetes
                    </h1>
                    <p className="text-slate-500 font-medium">
                        Explorá tus paquetes adquiridos y gestioná qué productos mostrar
                    </p>
                </div>
                <Link
                    href="/comercios/adquirir-paquetes"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                    <Sparkles className="w-5 h-5" />
                    Adquirir más paquetes
                </Link>
            </header>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        onClick={() => handleSelectPackage(pkg)}
                        className="group cursor-pointer bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                    >
                        {/* Image */}
                        <div className="aspect-[4/3] relative">
                            {pkg.image ? (
                                <Image
                                    src={pkg.image}
                                    alt={pkg.name}
                                    fill
                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                            ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                                    <Layers className="w-20 h-20 text-white/30" />
                                </div>
                            )}

                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/10 to-transparent" />

                            {/* Info on image */}
                            <div className="absolute bottom-6 left-6 right-6">
                                <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">
                                    {pkg.name}
                                </h3>
                                <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-1">
                                    {pkg.totalProducts} productos
                                </p>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-bold text-slate-600">
                                        {pkg.activeProducts} activos
                                    </span>
                                </div>
                                {pkg.inactiveProducts > 0 && (
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                                        <span className="text-xs font-bold text-slate-400">
                                            {pkg.inactiveProducts} ocultos
                                        </span>
                                    </div>
                                )}
                            </div>
                            <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
