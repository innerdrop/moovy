"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Save,
    X,
    Trash2,
    Loader2,
    Image as ImageIcon,
    AlertCircle,
    Check
} from "lucide-react";
import Image from "next/image";

interface Category {
    id: string;
    name: string;
}

interface Product {
    id?: string;
    name: string;
    description: string;
    price: number;
    costPrice: number;
    stock: number;
    image: string | null;
    isActive: boolean;
    isFeatured: boolean;
    categoryIds: string[];
}

export default function ProductForm({
    initialData,
    categories
}: {
    initialData?: Product & { id?: string }, // Optional id if editing 
    categories: Category[]
}) {
    const router = useRouter();
    const isEditing = !!initialData?.id;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<Product>({
        name: initialData?.name || "",
        description: initialData?.description || "",
        price: initialData?.price || 0,
        costPrice: initialData?.costPrice || 0,
        stock: initialData?.stock || 0,
        image: initialData?.image || "",
        isActive: initialData?.isActive ?? true,
        isFeatured: initialData?.isFeatured ?? false,
        categoryIds: initialData?.categoryIds || [],
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === "number") {
            setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleCategoryToggle = (catId: string) => {
        setFormData(prev => {
            const current = prev.categoryIds;
            if (current.includes(catId)) {
                return { ...prev, categoryIds: current.filter(id => id !== catId) };
            } else {
                return { ...prev, categoryIds: [...current, catId] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const url = isEditing
                ? `/api/admin/products/${initialData.id}`
                : "/api/admin/products";

            const method = isEditing ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Error al guardar el producto");
            }

            router.push("/admin/products");
            router.refresh();
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Ocurrió un error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer (a menos que tenga historial, se desactivará).")) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/admin/products/${initialData?.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Error al eliminar");

            router.push("/admin/products");
            router.refresh();
        } catch (err) {
            alert("Error al eliminar el producto");
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-slate-900">
                    {isEditing ? "Editar Producto" : "Nuevo Producto"}
                </h1>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="btn-outline"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {loading && <Loader2 className="animate-spin w-4 h-4" />}
                        <Save className="w-4 h-4" />
                        Guardar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-2 border border-red-100">
                    <AlertCircle className="w-5 h-5" />
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                        <h2 className="font-semibold text-slate-900 border-b pb-2">Información Básica</h2>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input"
                                placeholder="Ej: Pizza Muzzarella"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                className="input resize-none"
                                rows={4}
                                placeholder="Descripción detallada del producto..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Precio de Venta ($)</label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    className="input font-medium"
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Costo Estimado ($)</label>
                                <input
                                    type="number"
                                    name="costPrice"
                                    value={formData.costPrice}
                                    onChange={handleChange}
                                    className="input text-slate-500"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-semibold text-slate-900 border-b pb-2 mb-4">Inventario</h2>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Actual</label>
                                <input
                                    type="number"
                                    name="stock"
                                    value={formData.stock}
                                    onChange={handleChange}
                                    className="input"
                                    min="0"
                                    required
                                />
                            </div>
                            <div className="flex-1 pt-6">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => handleCheckboxChange("isActive", e.target.checked)}
                                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm font-medium text-slate-700">Producto Activo (Visible)</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Image */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-semibold text-slate-900 border-b pb-2 mb-4">Imagen</h2>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">URL de la Imagen</label>
                            <input
                                type="text"
                                name="image"
                                value={formData.image || ""}
                                onChange={handleChange}
                                className="input text-xs"
                                placeholder="https://..."
                            />
                        </div>

                        <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden border border-slate-200 relative">
                            {formData.image ? (
                                <Image
                                    src={formData.image}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                    onError={() => setFormData(prev => ({ ...prev, image: "" }))} // Reset on error validation could be better
                                />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <ImageIcon className="w-10 h-10 mx-auto mb-2" />
                                    <span className="text-xs">Sin imagen</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Categories */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-semibold text-slate-900 border-b pb-2 mb-4">Categorías</h2>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {categories.map((cat) => (
                                <label key={cat.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition">
                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition ${formData.categoryIds.includes(cat.id)
                                        ? "bg-blue-600 border-blue-600 text-white"
                                        : "border-gray-300 bg-white"
                                        }`}>
                                        {formData.categoryIds.includes(cat.id) && <Check className="w-3.5 h-3.5" />}
                                    </div>
                                    <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={formData.categoryIds.includes(cat.id)}
                                        onChange={() => handleCategoryToggle(cat.id)}
                                    />
                                    <span className="text-sm text-slate-700">{cat.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Featured */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.isFeatured ? "bg-yellow-400" : "bg-gray-200"
                                }`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.isFeatured ? "translate-x-4" : "translate-x-0"
                                    }`} />
                            </div>
                            <span className="text-sm font-medium text-slate-700">Destacar en Home</span>
                            <input
                                type="checkbox"
                                className="hidden"
                                checked={formData.isFeatured}
                                onChange={(e) => handleCheckboxChange("isFeatured", e.target.checked)}
                            />
                        </label>
                    </div>

                    {/* Delete */}
                    {isEditing && (
                        <div className="pt-4 border-t border-slate-200">
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="w-full btn py-2 text-red-600 hover:bg-red-50 flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Eliminar Producto
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </form>
    );
}
