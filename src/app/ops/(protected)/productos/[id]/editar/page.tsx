"use client";

// Admin Edit Product Page - Editar Producto
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    ArrowLeft,
    Save,
    Package,
    DollarSign,
    Tag,
    Box,
    Check,
    Loader2,
    Trash2,
    Upload,
    ImageIcon,
    X
} from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
}

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
    categories: Array<{ category: Category }>;
    images?: Array<{ url: string }>;
}

export default function EditProductPage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [stock, setStock] = useState("0");
    const [minStock, setMinStock] = useState("5");
    const [categoryId, setCategoryId] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmAction, setConfirmAction] = useState<{
        title: string;
        message: string;
        confirmText: string;
        confirmColor: string;
        icon: "save" | "delete";
        onConfirm: () => void
    } | null>(null);

    // Load product and categories
    useEffect(() => {
        async function loadData() {
            try {
                // Load categories
                const catRes = await fetch("/api/admin/categories");
                if (catRes.ok) {
                    const catData = await catRes.json();
                    setCategories(catData);
                }

                // Load product
                const prodRes = await fetch(`/api/admin/products/${productId}`);
                if (prodRes.ok) {
                    const product: Product = await prodRes.json();
                    setName(product.name);
                    setDescription(product.description || "");
                    setPrice(product.price.toString());
                    setCostPrice(product.costPrice.toString());
                    setStock(product.stock.toString());
                    setMinStock(product.minStock.toString());
                    setIsActive(product.isActive);
                    setIsFeatured(product.isFeatured);
                    if (product.categories[0]) {
                        setCategoryId(product.categories[0].category.id);
                    }
                    if (product.images?.[0]?.url) {
                        setImageUrl(product.images[0].url);
                    }
                } else {
                    setError("Producto no encontrado");
                }
            } catch (err) {
                console.error("Error loading data:", err);
                setError("Error al cargar el producto");
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [productId]);

    // Calculate margin
    const numPrice = Number(price) || 0;
    const numCost = Number(costPrice) || 0;
    const margin = numPrice - numCost;
    const marginPercent = numCost > 0
        ? ((margin / numCost) * 100).toFixed(1)
        : (numPrice > 0 ? "100.0" : "0.0");

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData
            });

            if (res.ok) {
                const data = await res.json();
                setImageUrl(data.url);
            }
        } catch (error) {
            console.error("Error uploading image:", error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setConfirmAction({
            title: "Guardar Cambios",
            message: `¿Querés guardar los cambios realizados en "${name}"?`,
            confirmText: "Guardar",
            confirmColor: "bg-green-600 hover:bg-green-700",
            icon: "save",
            onConfirm: async () => {
                setShowConfirmModal(false);
                setError("");
                setIsSaving(true);

                try {
                    const res = await fetch(`/api/admin/products/${productId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            name,
                            description,
                            price: Number(price),
                            costPrice: Number(costPrice),
                            stock: Number(stock),
                            minStock: Number(minStock),
                            categoryId,
                            isActive,
                            isFeatured,
                            imageUrl,
                        }),
                    });

                    if (res.ok) {
                        setSuccess(true);
                        setTimeout(() => {
                            router.push("/ops/catalogo-paquetes");
                        }, 1500);
                    } else {
                        const data = await res.json();
                        setError(data.error || "Error al actualizar el producto");
                    }
                } catch (err) {
                    setError("Error de conexión");
                } finally {
                    setIsSaving(false);
                }
            }
        });
        setShowConfirmModal(true);
    };

    const handleDelete = () => {
        setConfirmAction({
            title: "Eliminar Producto",
            message: `¿Estás seguro de eliminar "${name}"? Esta acción no se puede deshacer.`,
            confirmText: "Eliminar",
            confirmColor: "bg-red-600 hover:bg-red-700",
            icon: "delete",
            onConfirm: async () => {
                setShowConfirmModal(false);
                setIsDeleting(true);
                try {
                    const res = await fetch(`/api/admin/products/${productId}`, {
                        method: "DELETE",
                    });

                    if (res.ok) {
                        router.push("/ops/catalogo-paquetes");
                    } else {
                        const data = await res.json();
                        setError(data.error || "Error al eliminar el producto");
                    }
                } catch (err) {
                    setError("Error de conexión");
                } finally {
                    setIsDeleting(false);
                }
            }
        });
        setShowConfirmModal(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link
                        href="/ops/catalogo-paquetes"
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-navy">Editar Producto</h1>
                        <p className="text-gray-600">{name}</p>
                    </div>
                </div>

                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Eliminar producto"
                >
                    {isDeleting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Trash2 className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-medium text-green-800">¡Producto actualizado!</p>
                        <p className="text-sm text-green-600">Redirigiendo...</p>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Image Upload */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-navy mb-4 flex items-center gap-2">
                        <ImageIcon className="w-5 h-5 text-[#e60012]" />
                        Imagen del Producto
                    </h2>

                    <div className="flex items-center gap-6">
                        <div className="w-32 h-32 bg-slate-100 rounded-xl overflow-hidden relative border-2 border-dashed border-slate-200">
                            {imageUrl ? (
                                <>
                                    <Image src={imageUrl} alt={name} fill className="object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => setImageUrl("")}
                                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                    <ImageIcon className="w-8 h-8 mb-1" />
                                    <span className="text-[10px]">Sin imagen</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1">
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition">
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4" />
                                )}
                                {uploading ? "Subiendo..." : "Subir imagen"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                            <p className="text-xs text-slate-500 mt-2">
                                Formatos: JPG, PNG, WebP. Se optimizará automáticamente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-navy mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-[#e60012]" />
                        Información Básica
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del producto *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ej: Leche La Serenísima 1L"
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Descripción
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Descripción corta del producto"
                                className="input min-h-[80px]"
                                rows={3}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Categoría
                            </label>
                            <select
                                value={categoryId}
                                onChange={(e) => setCategoryId(e.target.value)}
                                className="input"
                            >
                                <option value="">Sin categoría</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-navy mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5 text-[#e60012]" />
                        Precios
                    </h2>

                    <div className="grid md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Costo *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={costPrice}
                                    onChange={(e) => setCostPrice(e.target.value)}
                                    placeholder="0"
                                    className="input !pl-10"
                                    required
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio de venta *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    placeholder="0"
                                    className="input !pl-10"
                                    required
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Margen
                            </label>
                            <div className={`input text-center font-bold ${margin > 0 ? "bg-green-50 text-green-600" : margin < 0 ? "bg-red-50 text-red-600" : "bg-gray-50 text-gray-500"}`}>
                                ${margin.toLocaleString()} ({marginPercent}%)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-navy mb-4 flex items-center gap-2">
                        <Box className="w-5 h-5 text-[#e60012]" />
                        Stock
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock actual
                            </label>
                            <input
                                type="number"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                placeholder="0"
                                className="input"
                                min="0"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock mínimo (alerta)
                            </label>
                            <input
                                type="number"
                                value={minStock}
                                onChange={(e) => setMinStock(e.target.value)}
                                placeholder="5"
                                className="input"
                                min="0"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="w-5 h-5 text-[#e60012] rounded"
                            />
                            <span className="text-sm text-gray-700">Activo (visible en tienda)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isFeatured}
                                onChange={(e) => setIsFeatured(e.target.checked)}
                                className="w-5 h-5 text-[#e60012] rounded"
                            />
                            <span className="text-sm text-gray-700">Destacado</span>
                        </label>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Link
                        href="/ops/catalogo-paquetes"
                        className="btn-outline flex-1 text-center"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isSaving || success}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </form>

            {/* Confirmation Modal */}
            {showConfirmModal && confirmAction && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform animate-in slide-in-from-bottom-4 duration-500">
                        <div className="p-6 text-center">
                            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${confirmAction.icon === "delete" ? "bg-red-100" : "bg-green-100"}`}>
                                {confirmAction.icon === "delete" ? (
                                    <Trash2 className="w-8 h-8 text-red-600" />
                                ) : (
                                    <Save className="w-8 h-8 text-green-600" />
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
                                className={`flex-1 py-3 text-white rounded-xl font-medium transition-colors ${confirmAction.confirmColor}`}
                            >
                                {confirmAction.confirmText}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
