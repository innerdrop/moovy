"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";

interface NewListingFormProps {
    categories: { id: string; name: string }[];
}

export default function NewListingForm({ categories }: NewListingFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [imageUrl, setImageUrl] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        price: "",
        stock: "1",
        condition: "NUEVO",
        categoryId: "",
        weightKg: "",
        lengthCm: "",
        widthCm: "",
        heightCm: "",
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

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
            const res = await fetch("/api/seller/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    description: formData.description.trim() || null,
                    price,
                    stock: parseInt(formData.stock) || 1,
                    condition: formData.condition,
                    categoryId: formData.categoryId || null,
                    weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
                    lengthCm: formData.lengthCm ? parseFloat(formData.lengthCm) : null,
                    widthCm: formData.widthCm ? parseFloat(formData.widthCm) : null,
                    heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
                }),
            });

            if (res.ok) {
                const listing = await res.json();

                // Upload image if provided
                if (imageUrl && listing.id) {
                    await fetch(`/api/seller/listings/${listing.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({}), // placeholder; images handled separately
                    });
                }

                router.push("/vendedor/listings");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Error al crear la listing");
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
                <Link
                    href="/vendedor/listings"
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Mis Listings
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <Tag className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Nueva Listing</h1>
                        <p className="text-sm text-gray-500">Publicá un producto para vender</p>
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

                    {/* Peso y dimensiones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Peso y dimensiones <span className="text-gray-400 font-normal">(opcional, ayuda al calculo de envio)</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Peso (kg)</label>
                                <input
                                    type="number"
                                    value={formData.weightKg}
                                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                                    className="input w-full"
                                    placeholder="0.5"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Largo (cm)</label>
                                <input
                                    type="number"
                                    value={formData.lengthCm}
                                    onChange={(e) => setFormData({ ...formData, lengthCm: e.target.value })}
                                    className="input w-full"
                                    placeholder="30"
                                    min="0"
                                    step="1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Ancho (cm)</label>
                                <input
                                    type="number"
                                    value={formData.widthCm}
                                    onChange={(e) => setFormData({ ...formData, widthCm: e.target.value })}
                                    className="input w-full"
                                    placeholder="20"
                                    min="0"
                                    step="1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Alto (cm)</label>
                                <input
                                    type="number"
                                    value={formData.heightCm}
                                    onChange={(e) => setFormData({ ...formData, heightCm: e.target.value })}
                                    className="input w-full"
                                    placeholder="15"
                                    min="0"
                                    step="1"
                                />
                            </div>
                        </div>
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

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <Link
                            href="/vendedor/listings"
                            className="flex-1 py-2.5 text-center border border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-gray-700"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Publicar Listing
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
