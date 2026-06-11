"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, ArrowLeft, Edit, X } from "lucide-react";
import { confirm } from "@/store/confirm";

interface ListingData {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock: number;
    condition: string;
    categoryId: string | null;
    images: { url: string; order: number }[];
}

interface EditListingFormProps {
    listing: ListingData;
    categories: { id: string; name: string }[];
}

export default function EditListingForm({ listing, categories }: EditListingFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [imageUrl, setImageUrl] = useState(listing.images?.[0]?.url || "");

    const [formData, setFormData] = useState({
        title: listing.title,
        description: listing.description || "",
        price: listing.price.toString(),
        stock: listing.stock.toString(),
        condition: listing.condition,
        categoryId: listing.categoryId || "",
    });

    // s4-4c-01: snapshot del estado inicial para detectar cambios sin guardar.
    // Mismo patron que EditProductForm del comercio (feat/comercio-ux-guardar-y-totales):
    // banner flotante "Tenes cambios sin guardar" + confirmacion al salir.
    const initialState = useRef({
        title: listing.title,
        description: listing.description || "",
        price: listing.price.toString(),
        stock: listing.stock.toString(),
        condition: listing.condition,
        categoryId: listing.categoryId || "",
        imageUrl: listing.images?.[0]?.url || "",
    });

    const isDirty =
        formData.title !== initialState.current.title ||
        formData.description !== initialState.current.description ||
        formData.price !== initialState.current.price ||
        formData.stock !== initialState.current.stock ||
        formData.condition !== initialState.current.condition ||
        formData.categoryId !== initialState.current.categoryId ||
        imageUrl !== initialState.current.imageUrl;

    // Descartar: vuelve todo a los valores iniciales sin guardar.
    function handleDiscard() {
        setFormData({
            title: initialState.current.title,
            description: initialState.current.description,
            price: initialState.current.price,
            stock: initialState.current.stock,
            condition: initialState.current.condition,
            categoryId: initialState.current.categoryId,
        });
        setImageUrl(initialState.current.imageUrl);
        setError("");
    }

    // Salir (Volver / Cancelar): si hay cambios sin guardar, pop-up de
    // confirmacion antes de irse (regla #24: modal Moovy, no window.confirm).
    async function handleExit() {
        if (isDirty) {
            const ok = await confirm({
                title: "¿Salir sin guardar?",
                message: "Hiciste cambios en esta publicación que todavía no guardaste. Si salís ahora, se pierden.",
                confirmLabel: "Salir sin guardar",
                cancelLabel: "Seguir editando",
                variant: "warning",
            });
            if (!ok) return;
        }
        router.push("/vendedor/listings");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!imageUrl.trim() && listing.images.length === 0) {
            setError("Necesitás subir al menos 1 imagen para publicar tu listing");
            return;
        }

        if (!formData.title.trim()) {
            setError("El título es obligatorio");
            return;
        }

        const price = parseFloat(formData.price);
        if (isNaN(price) || price <= 0) {
            setError("El precio debe ser un número positivo");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch(`/api/seller/listings/${listing.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    description: formData.description.trim() || null,
                    price,
                    stock: parseInt(formData.stock) || 1,
                    condition: formData.condition,
                    categoryId: formData.categoryId || null,
                    imageUrl: imageUrl || null,
                }),
            });

            if (res.ok) {
                router.push("/vendedor/listings");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Error al actualizar la listing");
            }
        } catch {
            setError("Error de conexión");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-6">
                {/* s4-4c-01: boton (no Link) para poder interceptar la salida
                    con cambios sin guardar y mostrar el pop-up de confirmacion */}
                <button
                    type="button"
                    onClick={handleExit}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Mis Listings
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Edit className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Editar Listing</h1>
                        <p className="text-sm text-gray-500">Modificá los datos de tu publicación</p>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Imagen */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Imagen del producto
                        </label>
                        <ImageUpload value={imageUrl} onChange={setImageUrl} />
                    </div>

                    {/* Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="input w-full"
                            placeholder="Ej: iPhone 13 Pro Max 128GB"
                            required
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input w-full h-24 resize-none"
                            placeholder="Describí tu producto..."
                        />
                    </div>

                    {/* Precio y Stock */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Precio *
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="input w-full pl-8"
                                    placeholder="0"
                                    min="1"
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Stock
                            </label>
                            <input
                                type="number"
                                value={formData.stock}
                                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                className="input w-full"
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Condición */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Condición
                        </label>
                        <select
                            value={formData.condition}
                            onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                            className="input w-full"
                        >
                            <option value="NUEVO">🟢 Nuevo</option>
                            <option value="USADO">🟠 Usado</option>
                            <option value="REACONDICIONADO">🔵 Reacondicionado</option>
                        </select>
                    </div>

                    {/* Categoría */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Categoría
                        </label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                            className="input w-full"
                        >
                            <option value="">Sin categoría</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Actions — s4-4c-01: Cancelar intercepta la salida si hay
                        cambios sin guardar. El guardado vive en el banner flotante
                        (aparece solo cuando hay cambios), igual que en el portal
                        del comercio. */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={handleExit}
                            className="flex-1 py-2.5 text-center border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-gray-700"
                        >
                            Cancelar
                        </button>
                    </div>

                    {/* s4-4c-01: banner flotante "cambios sin guardar". bottom-16
                        para no chocar con el BottomNav mobile del layout vendedor
                        (z-50); z-30 queda abajo de modales. */}
                    {isDirty && (
                        <div className="fixed left-0 right-0 bottom-16 z-30 px-3 sm:px-4 pb-2 pointer-events-none animate-in slide-in-from-bottom-2 duration-200">
                            <div className="max-w-2xl mx-auto pointer-events-auto bg-white border border-gray-200 rounded-2xl shadow-2xl p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
                                <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
                                <p className="text-xs sm:text-sm font-semibold text-gray-700 flex-1 min-w-0 truncate">
                                    Tenés cambios sin guardar
                                </p>
                                <button
                                    type="button"
                                    onClick={handleDiscard}
                                    disabled={saving}
                                    className="px-3 py-2 text-xs sm:text-sm font-semibold text-gray-600 hover:text-gray-900 transition disabled:opacity-50 flex items-center gap-1 flex-shrink-0"
                                    title="Descartar cambios"
                                >
                                    <X className="w-4 h-4" />
                                    <span className="hidden sm:inline">Descartar</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-4 py-2 text-xs sm:text-sm font-bold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Save className="w-4 h-4" />
                                    )}
                                    <span>Guardar</span>
                                </button>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
