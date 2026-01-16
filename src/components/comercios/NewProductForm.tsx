"use client";

import { useState } from "react";
import { createProduct } from "@/app/comercios/actions";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from 'next/link';

interface NewProductFormProps {
    categories: { id: string; name: string }[];
}

export default function NewProductForm({ categories }: NewProductFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError("");

        if (!imageUrl) {
            setError("Debes subir una imagen para el producto");
            setIsLoading(false);
            return;
        }

        formData.append("imageUrl", imageUrl);

        const result = await createProduct(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        } else {
            // Redirect happens in server action
        }
    };

    return (
        <form action={handleSubmit} className="space-y-8 max-w-2xl mx-auto">
            {/* Header / Actions */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/comercios/productos"
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Nuevo Producto</h1>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary flex items-center gap-2 px-6"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    Guardar Producto
                </button>
            </div>

            {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left Column: Image */}
                <div className="md:col-span-1 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagen del Producto
                        </label>
                        <ImageUpload
                            value={imageUrl}
                            onChange={setImageUrl}
                            disabled={isLoading}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            Recomendado: 800x800px. Formato cuadrado.
                        </p>
                    </div>
                </div>

                {/* Right Column: Details */}
                <div className="md:col-span-2 space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Producto
                        </label>
                        <input
                            name="name"
                            type="text"
                            required
                            placeholder="Ej. Hamburguesa Doble con Queso"
                            className="input"
                            disabled={isLoading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                        </label>
                        <select
                            name="categoryId"
                            className="input"
                            disabled={isLoading || categories.length === 0}
                            defaultValue=""
                        >
                            <option value="" disabled>Seleccionar categoría...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                        {categories.length === 0 && (
                            <p className="text-xs text-yellow-600 mt-1">
                                No hay categorías activas. Contacta a soporte.
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    placeholder="0.00"
                                    className="input pl-8"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock Inicial
                            </label>
                            <input
                                name="stock"
                                type="number"
                                min="0"
                                required
                                placeholder="Ej. 100"
                                className="input"
                                defaultValue="100"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción (Opcional)
                        </label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Describe los ingredientes o detalles..."
                            className="input"
                            disabled={isLoading}
                        />
                    </div>
                </div>
            </div>
        </form>
    );
}
