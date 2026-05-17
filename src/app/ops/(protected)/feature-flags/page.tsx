"use client";

// feat/feature-flags-ops (2026-05-13): pagina OPS para gestionar feature flags.
// Lista los flags agrupados por scope con toggle visual, descripcion, y
// metadata de ultima modificacion.

import { useState, useEffect } from "react";
import {
    ToggleLeft,
    ToggleRight,
    Loader2,
    Store,
    ShoppingBag,
    User,
    Globe,
    Info,
    CheckCircle,
    Clock,
} from "lucide-react";
import { toast } from "@/store/toast";

interface FlagItem {
    id: string;
    key: string;
    label: string;
    description: string | null;
    scope: "MERCHANT" | "SELLER" | "BUYER" | "GLOBAL";
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastToggledAt: string | null;
    lastToggledBy: { id: string; name: string | null; email: string } | null;
}

const SCOPE_META: Record<
    string,
    { label: string; icon: React.ReactNode; color: string }
> = {
    MERCHANT: {
        label: "Comercios",
        icon: <Store className="w-4 h-4" />,
        color: "text-red-600 bg-red-50 border-red-200",
    },
    SELLER: {
        label: "Vendedores (Marketplace)",
        icon: <ShoppingBag className="w-4 h-4" />,
        color: "text-violet-600 bg-violet-50 border-violet-200",
    },
    BUYER: {
        label: "Compradores (Tienda)",
        icon: <User className="w-4 h-4" />,
        color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    GLOBAL: {
        label: "Plataforma",
        icon: <Globe className="w-4 h-4" />,
        color: "text-gray-600 bg-gray-50 border-gray-200",
    },
};

function formatRelativeDate(iso: string | null): string {
    if (!iso) return "nunca";
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60_000);
    if (diffMin < 1) return "hace instantes";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `hace ${diffHr} h`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `hace ${diffDays} días`;
    return d.toLocaleDateString("es-AR");
}

export default function FeatureFlagsPage() {
    const [flags, setFlags] = useState<FlagItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    async function fetchFlags() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/features");
            const data = await res.json();
            setFlags(data.flags || []);
        } catch {
            toast.error("Error al cargar feature flags");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchFlags();
    }, []);

    async function toggleFlag(flag: FlagItem) {
        setTogglingKey(flag.key);
        const newState = !flag.isActive;
        try {
            const res = await fetch(`/api/admin/features/${encodeURIComponent(flag.key)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: newState }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(`${flag.label}: ${newState ? "ACTIVADA" : "desactivada"}`);
                // Re-fetch para actualizar lastToggledAt/By.
                await fetchFlags();
            } else {
                toast.error(data.error || "Error al cambiar el flag");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setTogglingKey(null);
        }
    }

    // Agrupar por scope
    const flagsByScope = flags.reduce<Record<string, FlagItem[]>>((acc, f) => {
        if (!acc[f.scope]) acc[f.scope] = [];
        acc[f.scope].push(f);
        return acc;
    }, {});

    const scopeOrder: Array<keyof typeof SCOPE_META> = ["MERCHANT", "SELLER", "BUYER", "GLOBAL"];

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <ToggleRight className="w-6 h-6 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
                </div>
                <p className="text-sm text-gray-500">
                    Activá o desactivá funciones específicas de la plataforma sin necesidad de redeploy. Los cambios se propagan al instante.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : flags.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <Info className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-base font-semibold text-gray-900 mb-1">Sin feature flags configurados</p>
                    <p className="text-sm text-gray-500">
                        Corré <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs">npx tsx scripts/seed-feature-flags.ts</code> para crear los flags iniciales.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {scopeOrder.map((scope) => {
                        const items = flagsByScope[scope];
                        if (!items || items.length === 0) return null;
                        const meta = SCOPE_META[scope];
                        return (
                            <div key={scope}>
                                <div className={`inline-flex items-center gap-2 px-3 py-1 mb-3 rounded-full border text-xs font-semibold ${meta.color}`}>
                                    {meta.icon}
                                    {meta.label}
                                </div>
                                <div className="space-y-2">
                                    {items.map((flag) => {
                                        const isToggling = togglingKey === flag.key;
                                        return (
                                            <div
                                                key={flag.id}
                                                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                                            >
                                                <div className="p-4 flex items-start justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <h3 className="text-base font-bold text-gray-900">{flag.label}</h3>
                                                            <code className="text-[11px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                                                                {flag.key}
                                                            </code>
                                                            {flag.isActive ? (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 text-[11px] font-semibold rounded-full">
                                                                    <CheckCircle className="w-3 h-3" />
                                                                    Activo
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-full">
                                                                    Inactivo
                                                                </span>
                                                            )}
                                                        </div>
                                                        {flag.description && (
                                                            <p className="text-sm text-gray-600 leading-relaxed">{flag.description}</p>
                                                        )}
                                                        {flag.lastToggledAt && (
                                                            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                Última modificación: {formatRelativeDate(flag.lastToggledAt)}
                                                                {flag.lastToggledBy && (
                                                                    <span> · por {flag.lastToggledBy.name || flag.lastToggledBy.email}</span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleFlag(flag)}
                                                        disabled={isToggling}
                                                        aria-label={flag.isActive ? "Desactivar" : "Activar"}
                                                        className={`flex-shrink-0 transition-colors disabled:opacity-50 ${
                                                            flag.isActive ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-600"
                                                        }`}
                                                    >
                                                        {isToggling ? (
                                                            <Loader2 className="w-10 h-10 animate-spin" />
                                                        ) : flag.isActive ? (
                                                            <ToggleRight className="w-10 h-10" />
                                                        ) : (
                                                            <ToggleLeft className="w-10 h-10" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                <p className="text-xs text-blue-900 flex gap-2">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                        <strong>Cómo funciona:</strong> los flags afectan qué items aparecen en los menús de comercio/vendedor/comprador, qué páginas son accesibles, y qué features están habilitadas. Los cambios se propagan a la app en menos de 30 segundos.
                    </span>
                </p>
            </div>
        </div>
    );
}
