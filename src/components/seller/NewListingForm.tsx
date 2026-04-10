"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ui/ImageUpload";
import { Loader2, Save, ArrowLeft, Tag, Gavel, ShoppingBag } from "lucide-react";
import Link from "next/link";

interface NewListingFormProps {
    categories: { id: string; name: string }[];
}

const DURATION_OPTIONS = [
    { value: 6, label: "6 horas" },
    { value: 12, label: "12 horas" },
    { value: 24, label: "1 día" },
    { value: 48, label: "2 días" },
    { value: 72, label: "3 días" },
];

const INCREMENT_OPTIONS = [
    { value: 100, label: "$100" },
    { value: 500, label: "$500" },
    { value: 1000, label: "$1.000" },
    { value: 5000, label: "$5.000" },
];

export default function NewListingForm({ categories }: NewListingFormProps) {
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [imageUrl, setImageUrl] = useState("");
    const [listingType, setListingType] = useState<"DIRECT" | "AUCTION">("DIRECT");

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
        // Campos de subasta
        startingPrice: "",
        bidIncrement: "500",
        auctionDuration: "24",
    });

    const isAuction = listingType === "AUCTION";

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError("");

        if (!imageUrl.trim()) {
            setError("Necesitás subir al menos 1 imagen para publicar");
            return;
        }

        if (!formData.title.trim()) {
            setError("El título es obligatorio");
            return;
        }

        if (isAuction) {
            const startingPrice = parseFloat(formData.startingPrice);
            if (isNaN(startingPrice) || startingPrice <= 0) {
                setError("El precio base de la subasta debe ser un número positivo");
                return;
            }
        } else {
            const price = parseFloat(formData.price);
            if (isNaN(price) || price <= 0) {
                setError("El precio debe ser un número positivo");
                return;
            }
        }

        setSaving(true);

        try {
            const payload: any = {
                title: formData.title.trim(),
                description: formData.description.trim() || null,
                condition: formData.condition,
                categoryId: formData.categoryId || null,
                weightKg: formData.weightKg ? parseFloat(formData.weightKg) : null,
                lengthCm: formData.lengthCm ? parseFloat(formData.lengthCm) : null,
                widthCm: formData.widthCm ? parseFloat(formData.widthCm) : null,
                heightCm: formData.heightCm ? parseFloat(formData.heightCm) : null,
                imageUrl: imageUrl || null,
                listingType,
            };

            if (isAuction) {
                payload.startingPrice = parseFloat(formData.startingPrice);
                payload.bidIncrement = parseInt(formData.bidIncrement);
                payload.auctionDuration = parseInt(formData.auctionDuration);
            } else {
                payload.price = parseFloat(formData.price);
                payload.stock = parseInt(formData.stock) || 1;
            }

            const res = await fetch("/api/seller/listings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push("/vendedor/listings");
                router.refresh();
            } else {
                const data = await res.json();
                setError(data.error || "Error al crear la publicación");
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
                    Volver a Mis Publicaciones
                </Link>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAuction ? "bg-violet-100" : "bg-emerald-100"}`}>
                        {isAuction ? (
                            <Gavel className="w-5 h-5 text-violet-600" />
                        ) : (
                            <Tag className="w-5 h-5 text-emerald-600" />
                        )}
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {isAuction ? "Nueva Subasta" : "Nueva Publicación"}
                        </h1>
                        <p className="text-sm text-gray-500">
                            {isAuction
                                ? "Subastá un artículo al mejor postor"
                                : "Publicá un producto a precio fijo"
                            }
                        </p>
                    </div>
                </div>

                {/* Selector de tipo */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo de publicación
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setListingType("DIRECT")}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                                !isAuction
                                    ? "border-emerald-500 bg-emerald-50"
                                    : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <ShoppingBag className={`w-5 h-5 ${!isAuction ? "text-emerald-600" : "text-gray-400"}`} />
                            <div className="text-left">
                                <p className={`font-semibold text-sm ${!isAuction ? "text-emerald-700" : "text-gray-700"}`}>
                                    Venta directa
                                </p>
                                <p className="text-xs text-gray-500">Precio fijo</p>
                            </div>
                        </button>
                        <button
                            type="button"
                            onClick={() => setListingType("AUCTION")}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition ${
                                isAuction
                                    ? "border-violet-500 bg-violet-50"
                                    : "border-gray-200 hover:border-gray-300"
                            }`}
                        >
                            <Gavel className={`w-5 h-5 ${isAuction ? "text-violet-600" : "text-gray-400"}`} />
                            <div className="text-left">
                                <p className={`font-semibold text-sm ${isAuction ? "text-violet-700" : "text-gray-700"}`}>
                                    Subasta
                                </p>
                                <p className="text-xs text-gray-500">Al mejor postor</p>
                            </div>
                        </button>
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
                            Imagen del producto *
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
                            placeholder={isAuction ? "Ej: Colección de vinilos años 80" : "Ej: iPhone 13 Pro Max 128GB"}
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
                            placeholder={isAuction ? "Describí lo que subastás, su estado y detalles importantes..." : "Describí tu producto..."}
                        />
                    </div>

                    {/* Campos de SUBASTA */}
                    {isAuction ? (
                        <>
                            {/* Precio base */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio base *
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    La subasta arranca desde este valor. Si nadie oferta más, no se vende.
                                </p>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                    <input
                                        type="number"
                                        value={formData.startingPrice}
                                        onChange={(e) => setFormData({ ...formData, startingPrice: e.target.value })}
                                        className="input w-full pl-8"
                                        placeholder="1000"
                                        min="1"
                                        step="1"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Incremento mínimo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Incremento mínimo por oferta
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    Cada nueva oferta debe superar la anterior por al menos este monto.
                                </p>
                                <div className="grid grid-cols-4 gap-2">
                                    {INCREMENT_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, bidIncrement: String(opt.value) })}
                                            className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition ${
                                                formData.bidIncrement === String(opt.value)
                                                    ? "border-violet-500 bg-violet-50 text-violet-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duración */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Duración de la subasta
                                </label>
                                <p className="text-xs text-gray-500 mb-2">
                                    La subasta se cierra automáticamente cuando se cumple el tiempo.
                                </p>
                                <div className="grid grid-cols-5 gap-2">
                                    {DURATION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, auctionDuration: String(opt.value) })}
                                            className={`py-2.5 px-2 rounded-xl text-sm font-semibold border-2 transition ${
                                                formData.auctionDuration === String(opt.value)
                                                    ? "border-violet-500 bg-violet-50 text-violet-700"
                                                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Precio y Stock — Venta directa */}
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
                        </>
                    )}

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
                            <option value="NUEVO">Nuevo</option>
                            <option value="USADO">Usado</option>
                            <option value="REACONDICIONADO">Reacondicionado</option>
                        </select>
                    </div>

                    {/* Peso y dimensiones */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Peso y dimensiones <span className="text-gray-400 font-normal">(opcional, ayuda al cálculo de envío)</span>
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

                    {/* Info box para subastas */}
                    {isAuction && (
                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-800">
                            <p className="font-semibold mb-1">Cómo funciona la subasta</p>
                            <ul className="space-y-1 text-xs text-violet-700">
                                <li>La subasta arranca inmediatamente al publicar</li>
                                <li>Los compradores ofertan por encima del precio actual</li>
                                <li>Si alguien oferta en los últimos 60 segundos, se extiende 2 minutos</li>
                                <li>El ganador tiene 24 horas para completar el pago</li>
                                <li>Si no paga, se ofrece al siguiente postor</li>
                            </ul>
                        </div>
                    )}

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
                            className={`flex-1 py-2.5 text-white rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2 font-semibold ${
                                isAuction
                                    ? "bg-violet-600 hover:bg-violet-700"
                                    : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                        >
                            {saving ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isAuction ? (
                                <Gavel className="w-5 h-5" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            {isAuction ? "Iniciar Subasta" : "Publicar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
