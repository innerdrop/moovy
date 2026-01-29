"use client";

// Admin New Product Page - Crear Nuevo Producto
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Save,
    Package,
    DollarSign,
    Tag,
    Box,
    Check,
} from "lucide-react";

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function NewProductPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [costPrice, setCostPrice] = useState("");
    const [stock, setStock] = useState("0");
    const [categoryId, setCategoryId] = useState("");
    const [isActive, setIsActive] = useState(true);
    const [isFeatured, setIsFeatured] = useState(false);

    // Load categories
    useEffect(() => {
        async function loadCategories() {
            try {
                const res = await fetch("/api/admin/categories");
                if (res.ok) {
                    const data = await res.json();
                    setCategories(data);
                }
            } catch (err) {
                console.error("Error loading categories:", err);
            }
        }
        loadCategories();
    }, []);

    // Generate slug from name
    const generateSlug = (text: string) => {
        return text
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    };

    // Calculate margin
    const margin = Number(price) - Number(costPrice);
    const marginPercent = costPrice ? ((margin / Number(costPrice)) * 100).toFixed(1) : "0";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const res = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    slug: generateSlug(name),
                    description,
                    price: Number(price),
                    costPrice: Number(costPrice),
                    stock: Number(stock),
                    categoryId,
                    isActive,
                    isFeatured,
                }),
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/admin/productos");
                }, 1500);
            } else {
                const data = await res.json();
                setError(data.error || "Error al crear el producto");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <Link
                    href="/admin/productos"
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-navy">Nuevo Producto</h1>
                    <p className="text-gray-600">Completá los datos del producto</p>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <Check className="w-6 h-6 text-green-600" />
                    <div>
                        <p className="font-medium text-green-800">¡Producto creado exitosamente!</p>
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
                {/* Basic Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-navy mb-4 flex items-center gap-2">
                        <Package className="w-5 h-5 text-moovy" />
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
                        <DollarSign className="w-5 h-5 text-moovy" />
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
                                    className="input pl-12"
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
                                    className="input pl-12"
                                    required
                                    min="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Margen
                            </label>
                            <div className={`input text-center font-bold ${margin > 0 ? "bg-green-50 text-green-600" : "bg-gray-50 text-gray-500"}`}>
                                ${margin > 0 ? margin : 0} ({marginPercent}%)
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-navy mb-4 flex items-center gap-2">
                        <Box className="w-5 h-5 text-moovy" />
                        Stock
                    </h2>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock inicial
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

                        <div className="flex items-center gap-6 pt-6">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    className="w-5 h-5 text-moovy rounded"
                                />
                                <span className="text-sm text-gray-700">Activo</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={isFeatured}
                                    onChange={(e) => setIsFeatured(e.target.checked)}
                                    className="w-5 h-5 text-moovy rounded"
                                />
                                <span className="text-sm text-gray-700">Destacado</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex gap-3">
                    <Link
                        href="/admin/productos"
                        className="btn-outline flex-1 text-center"
                    >
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        disabled={isLoading || success}
                        className="btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <span>Guardando...</span>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Producto
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

