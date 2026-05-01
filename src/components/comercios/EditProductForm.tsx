"use client";

import { useState } from "react";
import { updateProduct, deleteProduct } from "@/app/comercios/actions";
import MultiImageUpload from "@/components/ui/MultiImageUpload";
import SizeSelector from "@/components/comercios/SizeSelector";
import { ProductSize, SIZE_METADATA, getSizeFromWeight } from "@/lib/product-weight";
import { Loader2, Save, ArrowLeft, Trash2, AlertTriangle, Sparkles, Info, Settings } from "lucide-react";
import Link from 'next/link';

interface EditProductFormProps {
    product: {
        id: string;
        name: string;
        description: string;
        price: number;
        stock: number;
        imageUrls: string[];
        categoryId: string;
        isActive: boolean;
        // Rama feat/peso-volumen-productos
        weightGrams: number | null;
        volumeMl: number | null;
        packageCategoryId: string | null;
    };
    categories: { id: string; name: string }[];
}

export default function EditProductForm({ product, categories }: EditProductFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [imageUrls, setImageUrls] = useState<string[]>(product.imageUrls);
    const [error, setError] = useState("");

    // Rama feat/peso-volumen-productos: estado para campos editables + sugerencia
    const [weightGrams, setWeightGrams] = useState<string>(
        product.weightGrams != null ? String(product.weightGrams) : ""
    );
    const [volumeMl, setVolumeMl] = useState<string>(
        product.volumeMl != null ? String(product.volumeMl) : ""
    );
    const [packageCategoryId, setPackageCategoryId] = useState<string>(product.packageCategoryId || "");
    const [name, setName] = useState<string>(product.name);
    const [description, setDescription] = useState<string>(product.description);
    // Tamaño: si el producto ya tenía weightGrams cargado, derivar la categoría
    const [productSize, setProductSize] = useState<ProductSize | null>(
        product.weightGrams != null ? getSizeFromWeight(product.weightGrams) : null
    );
    const [advancedMode, setAdvancedMode] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [suggestionInfo, setSuggestionInfo] = useState<string>("");

    /**
     * Click en una card de SizeSelector. Autocompleta los gramos/volumen
     * internos según la metadata canónica de la categoría.
     */
    const handleSelectSize = (size: ProductSize) => {
        const meta = SIZE_METADATA[size];
        setProductSize(size);
        setWeightGrams(String(meta.weightGrams));
        setVolumeMl(String(meta.volumeMl));
    };

    const handleSubmit = async (formData: FormData) => {
        setIsLoading(true);
        setError("");

        if (imageUrls.length === 0) {
            setError("Debes subir al menos una imagen para el producto");
            setIsLoading(false);
            return;
        }

        // Send all image URLs as JSON array
        formData.append("imageUrls", JSON.stringify(imageUrls));

        const result = await updateProduct(product.id, formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    };

    /**
     * Pide sugerencia de peso/volumen al endpoint de cache+heurística.
     * Autocompleta los campos editables. El comercio puede ajustar.
     */
    const handleSuggestWeight = async () => {
        if (!name || name.trim().length < 2) {
            setSuggestionInfo("Ingresá un nombre antes de pedir sugerencia");
            setTimeout(() => setSuggestionInfo(""), 3000);
            return;
        }
        setIsSuggesting(true);
        setSuggestionInfo("");
        try {
            const res = await fetch("/api/comercios/products/suggest-weight", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description: description || null }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setSuggestionInfo(err.error || "No se pudo obtener sugerencia");
                return;
            }
            const data = await res.json();
            if (data.weightGrams && data.volumeMl) {
                const suggestedSize: ProductSize = data.suggestedSize || getSizeFromWeight(data.weightGrams);
                setProductSize(suggestedSize);
                setWeightGrams(String(data.weightGrams));
                setVolumeMl(String(data.volumeMl));
                if (data.packageCategoryId) setPackageCategoryId(data.packageCategoryId);
                const sourceLabel =
                    data.source === "CACHE" ? "encontrado en catálogo común" :
                    data.source === "AI" ? "sugerido por IA" :
                    data.source === "HEURISTIC" ? "estimado por nombre" :
                    "sugerencia";
                const sizeName = SIZE_METADATA[suggestedSize].displayName;
                setSuggestionInfo(`Tamaño ${sourceLabel}: ${sizeName}. Podés cambiarlo si no coincide.`);
            } else {
                setSuggestionInfo("No encontramos tamaño para este producto. Elegí uno manualmente.");
            }
            setTimeout(() => setSuggestionInfo(""), 6000);
        } catch (err) {
            setSuggestionInfo("Error al obtener sugerencia. Cargá los valores manualmente.");
            setTimeout(() => setSuggestionInfo(""), 4000);
        } finally {
            setIsSuggesting(false);
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
                    {/* Left Column: Images */}
                    <div className="md:col-span-1 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Imágenes del Producto
                            </label>
                            <MultiImageUpload
                                values={imageUrls}
                                onChange={setImageUrls}
                                maxImages={4}
                                disabled={isLoading}
                            />
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
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                                        className="input !pl-10"
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
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe los ingredientes o detalles..."
                                className="input"
                                disabled={isLoading}
                            />
                        </div>

                        {/* Tamaño del producto — rama feat/peso-volumen-productos */}
                        <div className="border-t border-gray-100 pt-5">
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Tamaño del producto</h3>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Elegí el tamaño. Define qué vehículo usamos para entregarlo.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleSuggestWeight}
                                    disabled={isLoading || isSuggesting}
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 transition disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isSuggesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    Sugerir
                                </button>
                            </div>

                            <SizeSelector
                                value={productSize}
                                onChange={handleSelectSize}
                                disabled={isLoading}
                            />

                            {suggestionInfo && (
                                <p className="text-xs text-blue-600 font-semibold mt-3 flex items-center gap-1.5">
                                    <Info className="w-3.5 h-3.5 flex-shrink-0" />
                                    {suggestionInfo}
                                </p>
                            )}

                            {/* Modo avanzado */}
                            <div className="mt-5 pt-4 border-t border-gray-50">
                                <button
                                    type="button"
                                    onClick={() => setAdvancedMode((v) => !v)}
                                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-blue-600 font-semibold transition"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                    {advancedMode ? "Ocultar modo avanzado" : "Modo avanzado: tipear gramos exactos"}
                                </button>
                                {advancedMode && (
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Peso por unidad (g)</label>
                                            <input
                                                name="weightGrams"
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="Ej. 1500"
                                                className="input"
                                                disabled={isLoading}
                                                value={weightGrams}
                                                onChange={(e) => setWeightGrams(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Volumen por unidad (ml)</label>
                                            <input
                                                name="volumeMl"
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="Ej. 1500"
                                                className="input"
                                                disabled={isLoading}
                                                value={volumeMl}
                                                onChange={(e) => setVolumeMl(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Hidden inputs para enviar al server cuando NO está modo avanzado */}
                            {!advancedMode && (
                                <>
                                    <input type="hidden" name="weightGrams" value={weightGrams} />
                                    <input type="hidden" name="volumeMl" value={volumeMl} />
                                </>
                            )}
                            <input type="hidden" name="packageCategoryId" value={packageCategoryId} />
                            <input type="hidden" name="productSize" value={productSize ?? ""} />
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
