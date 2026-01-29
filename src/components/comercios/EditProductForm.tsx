"use client";

import { useState } from "react";
import { updateProduct, deleteProduct } from "@/app/comercios/actions";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, ArrowLeft, Trash2, AlertTriangle } from "lucide-react";
import Link from 'next/link';

interface EditProductFormProps {
    product: {
        id: string;
        name: string;
        description: string;
        price: number;
        stock: number;
        imageUrl: string;
        categoryId: string;
        isActive: boolean;
    };
    categories: { id: string; name: string }[];
}

export default function EditProductForm({ product, categories }: EditProductFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [imageUrl, setImageUrl] = useState(product.imageUrl);
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

        const result = await updateProduct(product.id, formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        const result = await deleteProduct(product.id);

        if (result?.error) {
            setError(result.error);
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
        // Redirect happens on success
    };

    return (
        <>
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
                        <h1 className="text-2xl font-bold text-gray-900">Editar Producto</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowDeleteConfirm(true)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            disabled={isLoading || isDeleting}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
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
                            Guardar Cambios
                        </button>
                    </div>
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
                                defaultValue={product.name}
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
                                defaultValue={product.categoryId}
                            >
                                <option value="" disabled>Seleccionar categoría...</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
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
                                        defaultValue={product.price}
                                        placeholder="0.00"
                                        className="input pl-12"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Stock
                                </label>
                                <input
                                    name="stock"
                                    type="number"
                                    min="0"
                                    required
                                    defaultValue={product.stock}
                                    placeholder="Ej. 100"
                                    className="input"
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
                                defaultValue={product.description}
                                placeholder="Describe los ingredientes o detalles..."
                                className="input"
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                </div>
            </form>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900">Eliminar Producto</h3>
                                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
                            </div>
                        </div>
                        <p className="text-gray-600 mb-6">
                            ¿Estás seguro de que querés eliminar <strong>{product.name}</strong>?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium"
                                disabled={isDeleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
                                disabled={isDeleting}
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
