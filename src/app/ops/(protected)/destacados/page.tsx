"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { confirm } from "@/store/confirm";
import {
    ChevronLeft,
    Loader2,
    Search,
    Star,
    Crown,
    AlertCircle,
    Check,
    X,
    Calendar,
    ArrowUp,
    ArrowDown,
    Badge,
} from "lucide-react";
import { toast } from "@/store/toast";

interface Merchant {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    isPremium: boolean;
    premiumTier: string | null;
    premiumUntil: string | null;
    displayOrder: number;
    approvalStatus: string;
    isActive: boolean;
    rating: number | null;
    _count: { orders: number };
}

interface StoreSettings {
    adMaxDestacadosSlots: number;
    adPricePlatino: number;
    adPriceDestacado: number;
    adPricePremium: number;
    adLaunchDiscountPercent: number;
}

const TIER_CONFIG = {
    platino: {
        label: "Platino",
        color: "bg-amber-100 border-amber-300",
        textColor: "text-amber-700",
        badgeColor: "bg-amber-500",
        description: "Posición #1 garantizada + push + badge premium",
    },
    destacado: {
        label: "Destacado",
        color: "bg-orange-100 border-orange-300",
        textColor: "text-orange-700",
        badgeColor: "bg-orange-500",
        description: "Top 3 + featured en categorías",
    },
    premium: {
        label: "Premium",
        color: "bg-blue-100 border-blue-300",
        textColor: "text-blue-700",
        badgeColor: "bg-blue-500",
        description: "Badge + posición preferencial",
    },
    basic: {
        label: "Básico",
        color: "bg-gray-100 border-gray-300",
        textColor: "text-gray-700",
        badgeColor: "bg-gray-400",
        description: "Sin premium",
    },
};

export default function DestacadosPage() {
    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        isPremium: false,
        premiumTier: "basic",
        premiumUntil: "",
        displayOrder: 0,
    });

    // Fetch merchants and settings
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [merchantRes, settingsRes] = await Promise.all([
                fetch("/api/admin/merchants?status=active"),
                fetch("/api/admin/settings"),
            ]);

            if (merchantRes.ok) {
                const data = await merchantRes.json();
                // Filter only approved merchants
                const approved = data.filter(
                    (m: Merchant) => m.approvalStatus === "APPROVED"
                );
                setMerchants(approved);
            }

            if (settingsRes.ok) {
                const settings = await settingsRes.json();
                setStoreSettings(settings);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar datos");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle edit open
    const handleEditOpen = (merchant: Merchant) => {
        setEditingId(merchant.id);
        setEditForm({
            isPremium: merchant.isPremium,
            premiumTier: merchant.premiumTier || "basic",
            premiumUntil: merchant.premiumUntil
                ? new Date(merchant.premiumUntil).toISOString().split("T")[0]
                : "",
            displayOrder: merchant.displayOrder,
        });
    };

    // Handle edit cancel
    const handleEditCancel = () => {
        setEditingId(null);
        setEditForm({
            isPremium: false,
            premiumTier: "basic",
            premiumUntil: "",
            displayOrder: 0,
        });
    };

    // Handle update merchant premium
    const handleUpdate = async (merchantId: string) => {
        const ok = await confirm({ title: "Actualizar destacado", message: "¿Confirmar cambios en el estado premium del comercio?", confirmLabel: "Actualizar", variant: "warning" });
        if (!ok) return;
        setUpdating(merchantId);
        try {
            const payload: any = {
                isPremium: editForm.isPremium,
                premiumTier: editForm.isPremium ? editForm.premiumTier : null,
                premiumUntil: editForm.isPremium && editForm.premiumUntil
                    ? new Date(editForm.premiumUntil).toISOString()
                    : null,
                displayOrder: editForm.displayOrder,
            };

            const res = await fetch(
                `/api/admin/merchants/${merchantId}/premium`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (res.ok) {
                const updated = await res.json();
                setMerchants((prev) =>
                    prev.map((m) => (m.id === merchantId ? updated : m))
                );
                toast.success("Comercio actualizado");
                handleEditCancel();
            } else {
                const error = await res.json();
                toast.error(error.error || "Error al actualizar");
            }
        } catch (error) {
            console.error("Error updating merchant:", error);
            toast.error("Error al actualizar");
        } finally {
            setUpdating(null);
        }
    };

    // Filter merchants
    const filteredMerchants = merchants.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase())
    );

    // Count premium merchants
    const premiumCount = merchants.filter((m) => m.isPremium).length;
    const platinos = merchants.filter((m) => m.premiumTier === "platino").length;
    const destacados = merchants.filter(
        (m) => m.premiumTier === "destacado"
    ).length;

    // Calculate revenue estimate (monthly)
    const estimateRevenue = () => {
        if (!storeSettings) return 0;
        let total = 0;
        merchants.forEach((m) => {
            if (!m.isPremium) return;
            const tier = m.premiumTier || "basic";
            if (tier === "platino") {
                total += storeSettings.adPricePlatino;
            } else if (tier === "destacado") {
                total += storeSettings.adPriceDestacado;
            } else if (tier === "premium") {
                total += storeSettings.adPricePremium;
            }
        });
        return total;
    };

    const formatPrice = (n: number) =>
        `$${n.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
    const formatDate = (date: string | null) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("es-AR");
    };
    const isExpired = (date: string | null) => {
        if (!date) return false;
        return new Date(date) < new Date();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 p-8 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-600 mx-auto mb-4" />
                    <p className="text-gray-600">Cargando comercios destacados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center gap-3 mb-6">
                        <Link
                            href="/ops"
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex items-center gap-2">
                            <Crown className="w-6 h-6 text-amber-600" />
                            <h1 className="text-2xl font-bold text-gray-900">
                                Comercios Destacados
                            </h1>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {/* Slots Card */}
                    <div className="bg-white rounded-xl border border-amber-200 p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600 font-medium">
                                    Slots Utilizados
                                </p>
                                <p className="text-3xl font-bold text-amber-700 mt-2">
                                    {premiumCount} /{" "}
                                    {storeSettings?.adMaxDestacadosSlots || 8}
                                </p>
                            </div>
                            <Badge className="w-12 h-12 bg-amber-100 text-amber-700" />
                        </div>
                    </div>

                    {/* Platino Card */}
                    <div className="bg-white rounded-lg border border-amber-100 p-6">
                        <p className="text-sm text-gray-600 font-medium">
                            Platino
                        </p>
                        <p className="text-3xl font-bold text-amber-600 mt-2">
                            {platinos}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            {formatPrice(storeSettings?.adPricePlatino || 0)}/mes
                        </p>
                    </div>

                    {/* Destacado Card */}
                    <div className="bg-white rounded-lg border border-orange-100 p-6">
                        <p className="text-sm text-gray-600 font-medium">
                            Destacado
                        </p>
                        <p className="text-3xl font-bold text-orange-600 mt-2">
                            {destacados}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                            {formatPrice(storeSettings?.adPriceDestacado || 0)}/mes
                        </p>
                    </div>

                    {/* Revenue Card */}
                    <div className="bg-white rounded-lg border border-green-100 p-6">
                        <p className="text-sm text-gray-600 font-medium">
                            Revenue Estimado
                        </p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            {formatPrice(estimateRevenue())}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">/mes</p>
                    </div>
                </div>

                {/* Pricing Reference Box */}
                {storeSettings && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="font-semibold text-blue-900 mb-3">
                                    Precios de Publicidad (Biblia Financiera)
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Platino
                                        </p>
                                        <p className="text-lg font-bold text-amber-600">
                                            {formatPrice(storeSettings.adPricePlatino)}
                                        </p>
                                        <p className="text-xs text-blue-700">
                                            /mes
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Destacado
                                        </p>
                                        <p className="text-lg font-bold text-orange-600">
                                            {formatPrice(storeSettings.adPriceDestacado)}
                                        </p>
                                        <p className="text-xs text-blue-700">
                                            /mes
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Premium
                                        </p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {formatPrice(storeSettings.adPricePremium)}
                                        </p>
                                        <p className="text-xs text-blue-700">
                                            /mes
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            Descuento Lanzamiento
                                        </p>
                                        <p className="text-lg font-bold text-blue-600">
                                            {storeSettings.adLaunchDiscountPercent}%
                                        </p>
                                        <p className="text-xs text-blue-700">
                                            primeros 3 meses
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar comercio..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                {/* Merchants Table */}
                {filteredMerchants.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">
                            {merchants.length === 0
                                ? "No hay comercios aprobados"
                                : "No se encontraron comercios"}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Comercio
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Estado
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Tier
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Vencimiento
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Orden
                                        </th>
                                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredMerchants.map((merchant) => (
                                        <tr
                                            key={merchant.id}
                                            className="hover:bg-gray-50 transition"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    {merchant.image && (
                                                        <Image
                                                            src={merchant.image}
                                                            alt={merchant.name}
                                                            width={40}
                                                            height={40}
                                                            className="rounded object-cover"
                                                        />
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {merchant.name}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {merchant._count.orders} pedidos
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {merchant.isPremium ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                        <Check className="w-3 h-3" />
                                                        Premium
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                        <X className="w-3 h-3" />
                                                        Básico
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {merchant.isPremium ? (
                                                    <span
                                                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                            TIER_CONFIG[
                                                                merchant.premiumTier as keyof typeof TIER_CONFIG
                                                            ]?.color ||
                                                            TIER_CONFIG.basic.color
                                                        }`}
                                                    >
                                                        {TIER_CONFIG[
                                                            merchant.premiumTier as keyof typeof TIER_CONFIG
                                                        ]?.label || "—"}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {merchant.isPremium &&
                                                merchant.premiumUntil ? (
                                                    <div>
                                                        <p
                                                            className={`font-medium ${
                                                                isExpired(
                                                                    merchant.premiumUntil
                                                                )
                                                                    ? "text-red-600"
                                                                    : "text-gray-900"
                                                            }`}
                                                        >
                                                            {formatDate(
                                                                merchant.premiumUntil
                                                            )}
                                                        </p>
                                                        {isExpired(
                                                            merchant.premiumUntil
                                                        ) && (
                                                            <p className="text-xs text-red-600">
                                                                Expirado
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {merchant.displayOrder}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingId === merchant.id ? (
                                                    // Edit Form
                                                    <div className="space-y-3 min-w-max">
                                                        {/* Premium Toggle */}
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={
                                                                    editForm.isPremium
                                                                }
                                                                onChange={(e) =>
                                                                    setEditForm({
                                                                        ...editForm,
                                                                        isPremium:
                                                                            e.target
                                                                                .checked,
                                                                    })
                                                                }
                                                                className="rounded"
                                                            />
                                                            <span className="text-sm text-gray-600">
                                                                Premium
                                                            </span>
                                                        </label>

                                                        {/* Tier Selector */}
                                                        {editForm.isPremium && (
                                                            <select
                                                                value={
                                                                    editForm.premiumTier
                                                                }
                                                                onChange={(e) =>
                                                                    setEditForm({
                                                                        ...editForm,
                                                                        premiumTier:
                                                                            e.target
                                                                                .value,
                                                                    })
                                                                }
                                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                            >
                                                                <option value="platino">
                                                                    Platino
                                                                </option>
                                                                <option value="destacado">
                                                                    Destacado
                                                                </option>
                                                                <option value="premium">
                                                                    Premium
                                                                </option>
                                                            </select>
                                                        )}

                                                        {/* Expiry Date */}
                                                        {editForm.isPremium && (
                                                            <input
                                                                type="date"
                                                                value={
                                                                    editForm.premiumUntil
                                                                }
                                                                onChange={(e) =>
                                                                    setEditForm({
                                                                        ...editForm,
                                                                        premiumUntil:
                                                                            e.target
                                                                                .value,
                                                                    })
                                                                }
                                                                className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                            />
                                                        )}

                                                        {/* Display Order */}
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={
                                                                editForm.displayOrder
                                                            }
                                                            onChange={(e) =>
                                                                setEditForm({
                                                                    ...editForm,
                                                                    displayOrder:
                                                                        parseInt(
                                                                            e.target
                                                                                .value,
                                                                            10
                                                                        ),
                                                                })
                                                            }
                                                            className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                                            placeholder="Orden"
                                                        />

                                                        {/* Action Buttons */}
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    handleUpdate(
                                                                        merchant.id
                                                                    )
                                                                }
                                                                disabled={
                                                                    updating ===
                                                                    merchant.id
                                                                }
                                                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium py-1 rounded transition disabled:opacity-50"
                                                            >
                                                                {updating ===
                                                                merchant.id ? (
                                                                    <Loader2 className="w-3 h-3 inline animate-spin" />
                                                                ) : (
                                                                    "Guardar"
                                                                )}
                                                            </button>
                                                            <button
                                                                onClick={
                                                                    handleEditCancel
                                                                }
                                                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 text-xs font-medium py-1 rounded transition"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    // View Mode
                                                    <button
                                                        onClick={() =>
                                                            handleEditOpen(
                                                                merchant
                                                            )
                                                        }
                                                        className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-700 text-sm font-medium rounded transition"
                                                    >
                                                        Editar
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
                    <h3 className="font-semibold text-amber-900 mb-3">
                        Guía de Tiers de Destacados
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                <p className="font-semibold text-amber-900">
                                    Platino
                                </p>
                            </div>
                            <p className="text-sm text-amber-800">
                                Posición #1 garantizada, push notification,
                                badge premium visible en la app.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <p className="font-semibold text-amber-900">
                                    Destacado
                                </p>
                            </div>
                            <p className="text-sm text-amber-800">
                                Top 3 en la home, featured en categorías
                                relevantes, mayor visibilidad.
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <p className="font-semibold text-amber-900">
                                    Premium
                                </p>
                            </div>
                            <p className="text-sm text-amber-800">
                                Badge premium visible en listados, posición
                                preferencial en búsquedas.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
