"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
    Package,
    Plus,
    Search,
    Edit,
    ImageIcon,
    Loader2,
    AlertCircle,
    ChevronLeft,
    Layers,
    Check,
    Settings2,
    Archive,
    Trash2,
    MoreVertical,
    Eye,
    Tag,
    X,
    FolderPlus,
    EyeOff,
    Power,
    Ban,
    Upload,
    Camera,
    Save
} from "lucide-react";

interface Product {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    stock: number;
    isActive: boolean;
    categories: { category: { id: string, name: string } }[];
    images: { url: string; alt: string | null }[];
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


export default function CatalogPackagesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [view, setView] = useState<"packages" | "pending">("packages");
    const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
    const [subcategoryFilter, setSubcategoryFilter] = useState<string>("all");
    const [uploading, setUploading] = useState(false);

    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assigningProduct, setAssigningProduct] = useState<Product | null>(null);
    const [targetCategoryId, setTargetCategoryId] = useState("");
    const [categoryForm, setCategoryForm] = useState({
        name: "",
        description: "",
        price: 5000,
        allowIndividualPurchase: true,
        image: "",
        parentId: "" as string | null
    });

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        confirmText?: string;
        confirmColor?: string;
        icon?: "save" | "delete";
        onConfirm: () => void
    } | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodRes, catRes] = await Promise.all([
                fetch("/api/admin/products"),
                fetch("/api/admin/categories")
            ]);

            const prodData = await prodRes.json();
            const catData = await catRes.json();

            // Filter only master products (no merchantId)
            setProducts(prodData.filter((p: any) => p.merchant === null));
            setCategories(catData);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Derived State
    const pendingProducts = products.filter(p => p.categories.length === 0);

    // Get all category IDs to filter (including children if parent category)
    const getCategoryIds = (cat: Category): string[] => {
        const ids = [cat.id];
        // Find the full category object from categories array to get children
        const fullCategory = categories.find(c => c.id === cat.id);
        if (fullCategory?.children && fullCategory.children.length > 0) {
            fullCategory.children.forEach(child => ids.push(child.id));
        }
        return ids;
    };

    // Get subcategories of selected category (if it's a parent)
    const selectedCategoryChildren = selectedCategory
        ? categories.find(c => c.id === selectedCategory.id)?.children || []
        : [];

    const productsInCategory = selectedCategory
        ? products.filter(p => {
            // If subcategory filter is active, only show that subcategory's products
            if (subcategoryFilter !== "all") {
                return p.categories.some(c => c.category.id === subcategoryFilter);
            }
            // Otherwise show all products from this category and its children
            const categoryIds = getCategoryIds(selectedCategory);
            return p.categories.some(c => categoryIds.includes(c.category.id));
        })
        : [];

    // Show only root categories (with children inside them)
    const filteredCategories = categories.filter(c =>
        !c.parentId && c.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredPending = pendingProducts.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredProductsInCategory = productsInCategory.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    // Handlers
    const saveCategoryData = async () => {
        const isEditing = !!editingCategory;
        const url = "/api/admin/categories";
        const method = isEditing ? "PATCH" : "POST";
        const body = isEditing ? { id: editingCategory.id, ...categoryForm } : categoryForm;

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setShowCategoryModal(false);
                setEditingCategory(null);
                setCategoryForm({ name: "", description: "", price: 5000, allowIndividualPurchase: true, image: "", parentId: null });
                fetchData();
            }
        } catch (error) {
            console.error("Error saving category:", error);
        }
    };

    const handleCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEditing = !!editingCategory;

        if (isEditing) {
            // Show confirmation modal for edits
            setConfirmAction({
                title: "Guardar Cambios",
                message: `¿Querés guardar los cambios realizados en el paquete "${categoryForm.name}"?`,
                confirmText: "Guardar",
                confirmColor: "bg-green-600 hover:bg-green-700",
                icon: "save",
                onConfirm: async () => {
                    setShowConfirmModal(false);
                    await saveCategoryData();
                }
            });
            setShowConfirmModal(true);
        } else {
            // For new packages, save directly
            await saveCategoryData();
        }
    };

    const openEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setCategoryForm({
            name: cat.name,
            description: cat.description || "",
            price: cat.price,
            allowIndividualPurchase: cat.allowIndividualPurchase,
            image: cat.image || "",
            parentId: cat.parentId || null
        });
        setShowCategoryModal(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setCategoryForm(prev => ({ ...prev, image: data.url }));
            } else {
                alert("Error al subir la imagen");
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Error de conexión al subir la imagen");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteCategory = (categoryId: string, categoryName: string) => {
        setConfirmAction({
            title: "Eliminar Paquete",
            message: `¿Estás seguro de que querés eliminar el rubro "${categoryName}"? Solo se podrá eliminar si no tiene productos asociados.`,
            confirmText: "Eliminar",
            confirmColor: "bg-red-600 hover:bg-red-700",
            icon: "delete",
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/admin/categories?id=${categoryId}`, {
                        method: "DELETE"
                    });

                    if (res.ok) {
                        fetchData();
                    } else {
                        const error = await res.json();
                        setConfirmAction({
                            title: "Error",
                            message: error.error || "No se pudo eliminar el rubro. Asegurate de que esté vacío.",
                            confirmText: "Aceptar",
                            confirmColor: "bg-slate-600 hover:bg-slate-700",
                            onConfirm: () => setShowConfirmModal(false)
                        });
                        return;
                    }
                } catch (error) {
                    console.error("Error deleting category:", error);
                }
                setShowConfirmModal(false);
            }
        });
        setShowConfirmModal(true);
    };

    const handleAssignCategory = async () => {
        if (!assigningProduct || !targetCategoryId) return;
        try {
            const res = await fetch("/api/admin/products", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: assigningProduct.id,
                    action: "update",
                    categoryIds: [targetCategoryId]
                })
            });

            if (res.ok) {
                setShowAssignModal(false);
                setAssigningProduct(null);
                setTargetCategoryId("");
                fetchData();
            }
        } catch (error) {
            console.error("Error assigning category:", error);
        }
    };

    const handleToggleStatus = async (productId: string) => {
        try {
            const res = await fetch("/api/admin/products", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: productId,
                    action: "toggle_active"
                })
            });

            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Error toggling status:", error);
        }
    };

    const handleDeleteProduct = async (productId: string) => {
        if (!confirm("¿Estás seguro de que querés eliminar este producto oficial?")) return;
        try {
            const res = await fetch(`/api/admin/products?id=${productId}`, {
                method: "DELETE"
            });

            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {selectedCategory ? `Paquete: ${selectedCategory.name}` : "Catálogo de Paquetes"}
                    </h1>
                    <p className="text-slate-600">
                        {selectedCategory
                            ? `Gestionando ${productsInCategory.length} productos del rubro ${selectedCategory.name}.`
                            : view === "packages"
                                ? "Administra los rubros de información oficial y sus precios."
                                : `Tienes ${pendingProducts.length} productos pendientes de asignar a un rubro.`}
                    </p>
                </div>
                <div className="flex gap-2">
                    {selectedCategory && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => { setSelectedCategory(null); setSubcategoryFilter("all"); }}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition font-medium"
                            >
                                <ChevronLeft className="w-4 h-4" />
                                Volver
                            </button>
                            <Link
                                href="/ops/productos/nuevo"
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-bold"
                            >
                                <Plus className="w-4 h-4" />
                                Agregar Producto
                            </Link>
                        </div>
                    )}

                    {!selectedCategory && (
                        <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                            <button
                                onClick={() => setView("packages")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition ${view === "packages" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                <Layers className="w-4 h-4 inline-block mr-2" />
                                Paquetes
                            </button>
                            <button
                                onClick={() => setView("pending")}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition flex items-center ${view === "pending" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                            >
                                <Archive className="w-4 h-4 inline-block mr-2" />
                                Pendientes
                                {pendingProducts.length > 0 && (
                                    <span className="ml-2 px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full text-[10px]">
                                        {pendingProducts.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setCategoryForm({ name: "", description: "", price: 5000, allowIndividualPurchase: true, image: "", parentId: null });
                            setShowCategoryModal(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-bold"
                    >
                        <Plus className="w-5 h-5" />
                        Nuevo Paquete
                    </button>
                </div>
            </div>

            {/* Search & Stats Area */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder={selectedCategory ? `Buscar en ${selectedCategory.name}...` : "Buscar rubro o categoría..."}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-red-500 transition-all"
                        />
                    </div>
                </div>
                <div className="bg-red-600 rounded-2xl p-4 shadow-lg text-white flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase opacity-80 leading-none mb-1">Total SKU Maetros</p>
                        <h4 className="text-2xl font-black">{products.length}</h4>
                    </div>
                    <Package className="w-8 h-8 opacity-20" />
                </div>
            </div>

            {/* Subcategory Filter - only show when viewing a parent category with children */}
            {selectedCategory && selectedCategoryChildren.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Filtrar por:</span>
                    <button
                        onClick={() => setSubcategoryFilter("all")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${subcategoryFilter === "all"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }`}
                    >
                        Todos ({productsInCategory.length})
                    </button>
                    {selectedCategoryChildren.map(child => (
                        <button
                            key={child.id}
                            onClick={() => setSubcategoryFilter(child.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${subcategoryFilter === child.id
                                ? "bg-red-600 text-white"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {child.name} ({child._count?.products || 0})
                        </button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-red-600 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">Cargando base de datos oficial...</p>
                    </div>
                </div>
            ) : selectedCategory ? (
                /* LEVEL 2: PRODUCT LIST (CARDS) */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredProductsInCategory.map((product) => (
                        <div key={product.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col">
                            <div className="aspect-square bg-slate-100 relative overflow-hidden">
                                {product.images?.[0]?.url ? (
                                    <Image src={product.images[0].url} alt={product.name} fill className={`object-cover group-hover:scale-105 transition-all duration-500 ${!product.isActive ? "grayscale opacity-50" : ""}`} />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
                                        <ImageIcon className="w-12 h-12 mb-2" />
                                        <span className="text-xs">Sin imagen oficial</span>
                                    </div>
                                )}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md ${product.isActive ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"}`}>
                                        {product.isActive ? "Activo" : "Oculto"}
                                    </span>
                                </div>
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => handleToggleStatus(product.id)}
                                        className={`p-3 rounded-full shadow-lg hover:scale-110 transition ${product.isActive ? "bg-red-500 text-white" : "bg-green-500 text-white"}`}
                                        title={product.isActive ? "Desactivar" : "Activar"}
                                    >
                                        <Power className="w-5 h-5" />
                                    </button>
                                    <Link href={`/ops/productos/${product.id}/editar`} className="p-3 bg-white text-slate-900 rounded-full shadow-lg hover:scale-110 transition">
                                        <Edit className="w-5 h-5" />
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="p-3 bg-slate-900 text-white rounded-full shadow-lg hover:scale-110 transition hover:bg-red-600"
                                        title="Eliminar Producto"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-black text-slate-900 text-lg leading-tight mb-2 uppercase tracking-tight">{product.name}</h3>
                                <p className="text-sm text-slate-500 line-clamp-2 italic flex-1 mb-4">
                                    {product.description || "Ficha técnica oficial cargada."}
                                </p>
                                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                    <span>Información Maestro</span>
                                    <Check className="w-4 h-4 text-green-500" />
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredProductsInCategory.length === 0 && (
                        <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-500 text-lg font-medium">Este paquete aún no tiene productos asignados.</p>
                        </div>
                    )}
                </div>
            ) : view === "pending" ? (
                /* PENDING PRODUCTS LIST */
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <Archive className="w-5 h-5 text-red-600" />
                            Listado de Pendientes por Asignar
                        </h2>
                        <p className="text-sm text-slate-500">Estos productos han sido creados pero no pertenecen a ningún paquete de venta aún.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                    <th className="px-6 py-4">Producto</th>
                                    <th className="px-6 py-4 text-center">SKU / Slug</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPending.map(p => (
                                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative border border-slate-200">
                                                    {p.images?.[0]?.url ? (
                                                        <Image src={p.images[0].url} alt={p.name} fill className="object-cover" />
                                                    ) : <ImageIcon className="w-5 h-5 absolute inset-0 m-auto text-slate-300" />}
                                                </div>
                                                <span className="font-bold text-slate-800">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-mono text-xs text-slate-400">{p.slug}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.isActive ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                                                {p.isActive ? "Activo" : "Oculto"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/ops/productos/${p.id}/editar`} className="p-2 text-slate-400 hover:text-red-600 transition">
                                                    <Edit className="w-5 h-5" />
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setAssigningProduct(p);
                                                        setShowAssignModal(true);
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-blue-600 transition"
                                                    title="Asignar Categoría"
                                                >
                                                    <FolderPlus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPending.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                                            ¡Genial! No hay productos sin asignar.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* PACKAGES VIEW - Apple-inspired Design */
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filteredCategories.map((cat) => {
                        const hasChildren = cat.children && cat.children.length > 0;
                        const totalProducts = hasChildren
                            ? cat.children!.reduce((sum, c) => sum + (c._count?.products || 0), 0)
                            : (cat._count?.products || 0);

                        return hasChildren ? (
                            /* MASTER PACKAGE CARD - Simple expandable */
                            <div
                                key={cat.id}
                                className="group bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden shadow-xl"
                            >
                                {/* Header */}
                                <div className="p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                                                <Layers className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white text-lg">{cat.name}</h3>
                                                <p className="text-white/60 text-xs mt-0.5">Paquete Master</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-white">{cat.children!.length}</p>
                                            <p className="text-[10px] text-white/50 uppercase tracking-widest">Subcategorías</p>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 text-center">
                                            <p className="text-2xl font-bold text-white">{totalProducts}</p>
                                            <p className="text-[10px] text-white/50 uppercase tracking-widest">Productos</p>
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl mb-4">
                                        <span className="text-white/60 text-sm">Precio paquete completo</span>
                                        <span className="text-xl font-bold text-white">${(cat.price || 0).toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Subcategories List */}
                                <div className="bg-white rounded-t-3xl p-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Subpaquetes incluidos</p>
                                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                        {cat.children!.map(child => (
                                            <div
                                                key={child.id}
                                                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl group/child hover:bg-slate-100 transition cursor-pointer"
                                                onClick={() => setSelectedCategory(child)}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                                        <Package className="w-4 h-4 text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <span className="text-sm font-medium text-slate-700">{child.name}</span>
                                                        <p className="text-[10px] text-slate-400">{child._count?.products || 0} productos</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-slate-600">${(child.price || 0).toLocaleString()}</span>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); openEditCategory(child); }}
                                                        className="p-1.5 text-slate-300 hover:text-blue-600 hover:bg-white rounded transition opacity-0 group-hover/child:opacity-100"
                                                    >
                                                        <Edit className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => setSelectedCategory(cat)}
                                        className="w-full mt-3 py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-sm font-medium hover:from-red-600 hover:to-rose-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Ver todos los productos
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* REGULAR PACKAGE CARD - Leaf category */
                            <div
                                key={cat.id}
                                className="group relative bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500"
                            >
                                {/* Compact Image Header */}
                                <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-50 relative overflow-hidden">
                                    {cat.image ? (
                                        <Image
                                            src={cat.image}
                                            alt={cat.name}
                                            fill
                                            className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                                                <Layers className="w-7 h-7 text-slate-400" />
                                            </div>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                                            className="p-2 bg-white/90 backdrop-blur-md text-slate-600 rounded-xl hover:bg-white hover:text-blue-600 shadow-lg transition-all"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id, cat.name); }}
                                            className="p-2 bg-white/90 backdrop-blur-md text-slate-600 rounded-xl hover:bg-white hover:text-red-600 shadow-lg transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between gap-4 mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-slate-900 text-base leading-tight truncate">
                                                {cat.name}
                                            </h3>
                                            <p className="text-slate-500 text-xs mt-1">
                                                {cat._count?.products || 0} productos
                                            </p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-2xl font-bold text-slate-900">
                                                ${(cat.price || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => setSelectedCategory(cat)}
                                        className="w-full py-2.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl text-sm font-medium hover:from-red-600 hover:to-rose-700 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                        <Package className="w-4 h-4" />
                                        Ver productos
                                    </button>
                                </div>
                            </div>
                        );
                    })}

                    {/* Add New Card */}
                    <button
                        onClick={() => {
                            setEditingCategory(null);
                            setCategoryForm({ name: "", description: "", price: 5000, allowIndividualPurchase: true, image: "", parentId: null });
                            setShowCategoryModal(true);
                        }}
                        className="h-full min-h-[220px] rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-red-300 hover:text-red-500 hover:bg-red-50/30 transition-all duration-300 group"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center group-hover:shadow-md group-hover:scale-110 transition-all">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="font-medium text-sm">Nuevo Paquete</span>
                    </button>
                </div>
            )}

            {/* Category Modal (Create/Edit) */}
            {showCategoryModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                    {editingCategory ? "Editar Paquete" : "Nuevo Paquete"}
                                </h3>
                            </div>
                            <button onClick={() => setShowCategoryModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-900">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleCategorySubmit} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Nombre del Rubro</label>
                                <input
                                    required
                                    type="text"
                                    value={categoryForm.name}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                    placeholder="Ej: Gaseosas y Bebidas"
                                    className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Precio del Paquete Datos ($)</label>
                                <input
                                    required
                                    type="number"
                                    value={categoryForm.price}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, price: parseFloat(e.target.value) })}
                                    className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 transition-all font-bold text-lg"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Categoría Padre (opcional)</label>
                                <select
                                    value={categoryForm.parentId || ""}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, parentId: e.target.value || null })}
                                    className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 transition-all text-sm"
                                >
                                    <option value="">Sin categoría padre (raíz)</option>
                                    {categories
                                        .filter(c => !c.parentId && c.id !== editingCategory?.id)
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Descripción</label>
                                <textarea
                                    value={categoryForm.description}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                    placeholder="En este rubro los comercios podrán adquirir..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 transition-all text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Imagen de Portada</label>
                                <div className="flex flex-col gap-3">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={categoryForm.image}
                                            onChange={(e) => setCategoryForm({ ...categoryForm, image: e.target.value })}
                                            placeholder="URL de la imagen..."
                                            className="flex-1 px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-red-500 transition-all text-xs font-mono"
                                        />
                                        <label className="flex items-center justify-center p-3 bg-slate-900 text-white rounded-2xl cursor-pointer hover:bg-slate-800 transition shadow-lg shadow-slate-200">
                                            {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={uploading}
                                            />
                                        </label>
                                    </div>

                                    {categoryForm.image && (
                                        <div className="relative aspect-[16/6] rounded-xl overflow-hidden border border-slate-100 bg-slate-50 group/preview">
                                            <Image
                                                src={categoryForm.image}
                                                alt="Preview"
                                                fill
                                                className="object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                }}
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 bg-black/20 transition-opacity">
                                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Vista Previa</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <input
                                    type="checkbox"
                                    id="allowIndividual"
                                    checked={categoryForm.allowIndividualPurchase}
                                    onChange={(e) => setCategoryForm({ ...categoryForm, allowIndividualPurchase: e.target.checked })}
                                    className="w-5 h-5 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                                />
                                <label htmlFor="allowIndividual" className="text-sm font-bold text-slate-700 cursor-pointer leading-tight">
                                    Permitir adquisición de items sueltos
                                    <span className="block text-[10px] font-medium text-slate-400 uppercase mt-0.5">El comercio puede elegir SKUs específicos</span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                            >
                                {editingCategory ? "Guardar Cambios" : "Crear Paquete"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 uppercase tracking-tight text-sm">Asignar a Paquete</h3>
                            <button onClick={() => setShowAssignModal(false)} className="p-1.5 hover:bg-slate-100 rounded-full transition">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-xs text-slate-500 font-medium">Seleccioná a qué rubro pertenece <b>{assigningProduct?.name}</b>:</p>
                            <select
                                value={targetCategoryId}
                                onChange={(e) => setTargetCategoryId(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border-transparent rounded-2xl focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all font-bold text-slate-700 appearance-none"
                            >
                                <option value="">Seleccionar rubro...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                            <button
                                onClick={handleAssignCategory}
                                disabled={!targetCategoryId}
                                className="w-full py-3 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-100"
                            >
                                Confirmar Asignación
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirmModal && confirmAction && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${confirmAction.icon === "save" ? "bg-green-100" : "bg-red-100"}`}>
                                {confirmAction.icon === "save" ? (
                                    <Save className="w-8 h-8 text-green-600" />
                                ) : (
                                    <Trash2 className="w-8 h-8 text-red-600" />
                                )}
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                                {confirmAction.title}
                            </h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                {confirmAction.message}
                            </p>
                        </div>
                        <div className="p-4 bg-slate-50 flex gap-3">
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmAction.onConfirm}
                                className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors ${confirmAction.confirmColor || "bg-red-600 hover:bg-red-700"}`}
                            >
                                {confirmAction.confirmText || "Confirmar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
