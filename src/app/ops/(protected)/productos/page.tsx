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
                    <div className="hidden md:block bg-white rounded-xl shadow-sm overflow-hidden">
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
                                            <tr key={product.id} className="hover:bg-slate-50 transition">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                                                            {image ? (
                                                                <Image src={image} alt={product.name} width={48} height={48} className="object-cover" />
                                                            ) : (
                                                                <Package className="w-5 h-5 text-slate-400" />
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-slate-900 truncate">{product.name}</p>
                                                            <p className="text-xs text-slate-500 truncate">{product.categories.map(c => c.category.name).join(", ") || "Sin categoría"}</p>
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
                                                        <span className="text-sm text-slate-400">MOOVY</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-bold text-red-600">{formatPrice(product.price)}</span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isLowStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                                        }`}>
                                                        {isLowStock && <AlertTriangle className="w-3 h-3" />}
                                                        {product.stock}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                                        }`}>
                                                        {product.isActive ? "Activo" : "Inactivo"}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link
                                                            href={`/ops/productos/${product.id}/editar`}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                                                            title="Editar"
                                                        >
                                                            <Edit className="w-4 h-4 text-slate-600" />
                                                        </Link>
                                                        <button
                                                            onClick={() => toggleActive(product.id)}
                                                            disabled={actionLoading === product.id}
                                                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                                                            title={product.isActive ? "Desactivar" : "Activar"}
                                                        >
                                                            {actionLoading === product.id ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : product.isActive ? (
                                                                <EyeOff className="w-4 h-4 text-slate-600" />
                                                            ) : (
                                                                <Eye className="w-4 h-4 text-green-600" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setDeleteModal(product)}
                                                            className="p-2 hover:bg-red-50 rounded-lg transition"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-500" />
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

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {products.map((product) => {
                            const isLowStock = product.stock <= product.minStock;
                            const image = product.images[0]?.url;

                            return (
                                <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm">
                                    <div className="flex gap-3">
                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                                            {image ? (
                                                <Image src={image} alt={product.name} width={64} height={64} className="object-cover" />
                                            ) : (
                                                <Package className="w-6 h-6 text-slate-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-900 truncate">{product.name}</p>
                                            <p className="text-xs text-slate-500 truncate">{product.merchant?.name || "MOOVY"}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-bold text-red-600 text-sm">{formatPrice(product.price)}</span>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isLowStock ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                                    }`}>
                                                    {isLowStock && <AlertTriangle className="w-3 h-3" />}
                                                    {product.stock}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                                    }`}>
                                                    {product.isActive ? "Activo" : "Inactivo"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-1 mt-3 pt-3 border-t">
                                        <Link
                                            href={`/ops/productos/${product.id}/editar`}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                                        >
                                            <Edit className="w-5 h-5 text-slate-600" />
                                        </Link>
                                        <button
                                            onClick={() => toggleActive(product.id)}
                                            disabled={actionLoading === product.id}
                                            className="p-2 hover:bg-slate-100 rounded-lg transition"
                                        >
                                            {actionLoading === product.id ? (
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                            ) : product.isActive ? (
                                                <EyeOff className="w-5 h-5 text-slate-600" />
                                            ) : (
                                                <Eye className="w-5 h-5 text-green-600" />
                                            )}
                                        </button>
                                        <button
                                            onClick={() => setDeleteModal(product)}
                                            className="p-2 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 className="w-5 h-5 text-red-500" />
                                        </button>
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
