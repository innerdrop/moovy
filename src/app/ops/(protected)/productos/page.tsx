// Admin Products Page - Gestión de Productos con Filtros y Acciones
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Package,
    Search,
    Edit,
    Trash2,
    AlertTriangle,
    Store,
    Eye,
    EyeOff,
    Loader2,
    X,
    Building2,
    Filter
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    costPrice: number;
    stock: number;
    minStock: number;
    isActive: boolean;
    isFeatured: boolean;
    merchant: { id: string; name: string; slug: string } | null;
    categories: { category: { id: string; name: string } }[];
    images: { url: string; alt: string | null }[];
}

interface Merchant {
    id: string;
    name: string;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [merchantFilter, setMerchantFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<Product | null>(null);

    // Fetch products
    const fetchProducts = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (merchantFilter) params.set("merchantId", merchantFilter);
            if (statusFilter) params.set("status", statusFilter);

            const res = await fetch(`/api/admin/products?${params}`);
            const data = await res.json();

            // Filter out master products (merchant is null) to show only merchant products
            const merchantOnly = data.filter((p: any) => p.merchant !== null);
            setProducts(merchantOnly);

            // Extract unique merchants from the merchant products list
            const uniqueMerchants = new Map<string, Merchant>();
            merchantOnly.forEach((p: Product) => {
                if (p.merchant) {
                    uniqueMerchants.set(p.merchant.id, p.merchant);
                }
            });
            setMerchants(Array.from(uniqueMerchants.values()));
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [merchantFilter, statusFilter]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Toggle product active
    const toggleActive = async (id: string) => {
        setActionLoading(id);
        try {
            await fetch("/api/admin/products", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "toggle_active" })
            });
            fetchProducts();
        } catch (error) {
            console.error("Error toggling product:", error);
        } finally {
            setActionLoading(null);
        }
    };

    // Delete product
    const deleteProduct = async () => {
        if (!deleteModal) return;
        setActionLoading(deleteModal.id);
        try {
            await fetch(`/api/admin/products?id=${deleteModal.id}`, {
                method: "DELETE"
            });
            setDeleteModal(null);
            fetchProducts();
        } catch (error) {
            console.error("Error deleting product:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const formatPrice = (price: number) => `$${price.toLocaleString("es-AR")}`;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Productos de Comercios</h1>
                    <p className="text-slate-600">Supervisión de productos subidos por vendedores ({products.length})</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar productos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>

                {/* Merchant Filter */}
                <select
                    value={merchantFilter}
                    onChange={(e) => setMerchantFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white md:w-52"
                >
                    <option value="">Todos los comercios</option>
                    {merchants.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>

                {/* Status Filter */}
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white md:w-40"
                >
                    <option value="">Todos</option>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                </select>
            </div>

            {/* Products Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-red-500" />
                </div>
            ) : products.length > 0 ? (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left p-4 font-semibold text-slate-600 text-sm">Producto</th>
                                        <th className="text-left p-4 font-semibold text-slate-600 text-sm">Comercio</th>
                                        <th className="text-right p-4 font-semibold text-slate-600 text-sm">Precio</th>
                                        <th className="text-center p-4 font-semibold text-slate-600 text-sm">Stock</th>
                                        <th className="text-center p-4 font-semibold text-slate-600 text-sm">Estado</th>
                                        <th className="text-right p-4 font-semibold text-slate-600 text-sm">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {products.map((product) => {
                                        const isLowStock = product.stock <= product.minStock;
                                        const image = product.images[0]?.url;

                                        return (
                                            <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                                                            {image ? (
                                                                <Image src={image} alt={product.name} width={48} height={48} className="object-cover" />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-navy truncate">{product.name}</p>
                                                            <p className="text-xs text-slate-500 truncate">
                                                                {product.categories.map(c => c.category.name).join(", ") || "Sin categoría"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {product.merchant ? (
                                                        <div className="flex items-center gap-2">
                                                            <Building2 className="w-4 h-4 text-slate-400" />
                                                            <span className="text-sm text-slate-700">{product.merchant.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm font-medium text-moovy">MOOVY</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-red-600">{formatPrice(product.price)}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${isLowStock ? "bg-red-100 text-red-700 border border-red-200" : "bg-green-100 text-green-700 border border-green-200"
                                                        }`}>
                                                        {isLowStock && <AlertTriangle className="w-3 h-3" />}
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => toggleActive(product.id)}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold transition ${product.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                                                            }`}
                                                    >
                                                        {product.isActive ? "Activo" : "Inactivo"}
                                                    </button>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={`/ops/productos/${product.id}/editar`}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-moovy"
                                                            title="Editar"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Link>
                                                        <button
                                                            onClick={() => toggleActive(product.id)}
                                                            disabled={actionLoading === product.id}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-500 hover:text-green-600"
                                                            title={product.isActive ? "Desactivar" : "Activar"}
                                                        >
                                                            {actionLoading === product.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : product.isActive ? (
                                                                <EyeOff className="w-4 h-4" />
                                                            ) : (
                                                                <Eye className="w-4 h-4 text-green-600" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal(product)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition text-slate-500 hover:text-red-500"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Mobile Cards: Premium Design (Matching Slides) */}
                    <div className="md:hidden space-y-4">
                        {products.map((product) => {
                            const isLowStock = product.stock <= product.minStock;
                            const image = product.images[0]?.url;

                            return (
                                <div key={product.id} className={`bg-white rounded-2xl p-4 shadow-sm border ${product.isActive ? "border-slate-100" : "border-slate-300 opacity-70"}`}>
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm flex-shrink-0">
                                            {image ? (
                                                <Image src={image} alt={product.name} width={80} height={80} className="object-cover" />
                                            ) : (
                                                <Package className="w-8 h-8 text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="font-bold text-navy text-lg line-clamp-1 leading-tight">{product.name}</h3>
                                                <span className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${product.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                                    {product.isActive ? "Active" : "Off"}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-slate-400 mt-0.5 flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {product.merchant?.name || "MOOVY SYSTEM"}
                                            </p>

                                            <div className="flex items-center gap-3 mt-3">
                                                <span className="font-extrabold text-moovy text-lg">{formatPrice(product.price)}</span>
                                                <div className="flex items-center gap-1.5">
                                                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${isLowStock ? "bg-red-50 text-red-600 ring-1 ring-red-100" : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"}`}>
                                                        <Package className="w-3 h-3" />
                                                        {product.stock}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Row - Mobile */}
                                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => toggleActive(product.id)}
                                                disabled={actionLoading === product.id}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${product.isActive ? "bg-slate-50 text-slate-600 hover:bg-slate-100" : "bg-green-50 text-green-700 hover:bg-green-100"}`}
                                            >
                                                {actionLoading === product.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin text-moovy" />
                                                ) : product.isActive ? (
                                                    <>
                                                        <EyeOff className="w-4 h-4" />
                                                        Disimular
                                                    </>
                                                ) : (
                                                    <>
                                                        <Eye className="w-4 h-4" />
                                                        Publicar
                                                    </>
                                                )}
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link
                                                href={`/ops/productos/${product.id}/editar`}
                                                className="p-2.5 bg-slate-50 text-slate-600 hover:text-moovy hover:bg-red-50 rounded-xl transition-all border border-slate-100"
                                            >
                                                <Edit className="w-5 h-5" />
                                            </Link>
                                            <button
                                                onClick={() => setDeleteModal(product)}
                                                className="p-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all border border-red-100"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>

            ) : (
                <div className="bg-white rounded-xl p-12 text-center shadow-sm">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No hay productos</h3>
                    <p className="text-slate-500">No se encontraron productos con los filtros aplicados</p>
                </div>
            )}

            {/* Delete Modal */}
            {deleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Eliminar Producto</h3>
                            <button onClick={() => setDeleteModal(null)} className="p-2 hover:bg-slate-100 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-slate-600 mb-6">
                            ¿Estás seguro de eliminar <strong>{deleteModal.name}</strong>? El producto será desactivado y no aparecerá en la tienda.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteModal(null)}
                                className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition font-medium"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={deleteProduct}
                                disabled={actionLoading === deleteModal.id}
                                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium flex items-center justify-center gap-2"
                            >
                                {actionLoading === deleteModal.id ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        Eliminar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
