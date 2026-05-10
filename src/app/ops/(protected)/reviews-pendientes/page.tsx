// feat/propinas-y-ratings-post-entrega (2026-05-08): pagina OPS para revisar
// reseñas que cayeron en moderationStatus = "PENDING". Llegan acá por dos
// caminos:
//   1) la blacklist local en src/lib/moderation.ts matcheo el comentario al
//      crearse (gatillado por uno de los 3 endpoints rate-*);
//   2) la comunidad reporto el comentario >= 3 veces y el sistema lo bajo
//      automaticamente.
//
// El admin puede:
//   - APPROVED: el comentario era OK (falso positivo o reportes maliciosos).
//     Vuelve a publico, el comentario queda intacto.
//   - REJECTED: el comentario es inapropiado. Se borra el texto del comment,
//     pero el rating numerico se mantiene (cuenta en el avg igual que antes).
//
// Lista plana — un item por target en moderacion. Si un Order tiene 2 ratings
// en PENDING (raro pero posible), aparece dos veces en la lista.

"use client";

import { useState, useEffect } from "react";
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Loader2,
    Star,
    Flag,
    User,
    Truck,
    Store,
    ShoppingBag,
} from "lucide-react";
import { toast } from "@/store/toast";

interface ReviewItem {
    orderId: string;
    orderNumber: string;
    target: "DRIVER" | "MERCHANT" | "SELLER";
    rating: number | null;
    comment: string | null;
    moderationStatus: string;
    reportCount: number;
    authorName: string | null;
    authorEmail: string | null;
    entityName: string | null;
    reports: Array<{
        id: string;
        reason: string | null;
        reporterName: string | null;
        createdAt: string;
    }>;
}

export default function ReviewsPendientesPage() {
    const [items, setItems] = useState<ReviewItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState<string | null>(null);

    async function fetchItems() {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/review-moderation");
            const data = await res.json();
            setItems(data.items || []);
        } catch {
            toast.error("Error al cargar reseñas pendientes");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchItems();
    }, []);

    async function resolve(orderId: string, target: string, resolution: "APPROVED" | "REJECTED") {
        const key = `${orderId}-${target}`;
        setResolving(key);
        try {
            const res = await fetch("/api/admin/review-moderation", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, target, resolution }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message);
                // Sacar el item de la lista localmente sin re-fetch.
                setItems((prev) => prev.filter((i) => !(i.orderId === orderId && i.target === target)));
            } else {
                toast.error(data.error || "Error al resolver");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setResolving(null);
        }
    }

    const targetIcon = (t: string) => {
        if (t === "DRIVER") return <Truck className="w-4 h-4 text-green-600" />;
        if (t === "MERCHANT") return <Store className="w-4 h-4 text-red-600" />;
        return <ShoppingBag className="w-4 h-4 text-violet-600" />;
    };
    const targetLabel = (t: string) => {
        if (t === "DRIVER") return "Repartidor";
        if (t === "MERCHANT") return "Comercio";
        return "Vendedor";
    };

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
            <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                    <Shield className="w-6 h-6 text-amber-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Reseñas pendientes</h1>
                </div>
                <p className="text-sm text-gray-500">
                    Comentarios que la blacklist matcheó o que la comunidad reportó {">="} 3 veces.
                    El rating numérico ya está contando — solo decidís si publicar el comentario o eliminarlo.
                </p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-base font-semibold text-gray-900 mb-1">No hay reseñas pendientes</p>
                    <p className="text-sm text-gray-500">Cuando alguien reporte una reseña o una pase la blacklist, va a aparecer acá.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {items.map((item) => {
                        const key = `${item.orderId}-${item.target}`;
                        const isResolving = resolving === key;
                        return (
                            <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {/* Header */}
                                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        {targetIcon(item.target)}
                                        <span className="text-sm font-bold text-gray-900">{targetLabel(item.target)}</span>
                                        {item.entityName && (
                                            <span className="text-sm text-gray-600 truncate max-w-[200px]">— {item.entityName}</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span className="font-mono">#{item.orderNumber}</span>
                                        {item.reportCount > 0 && (
                                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                                                <Flag className="w-3 h-3" />
                                                {item.reportCount} report{item.reportCount === 1 ? "e" : "es"}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="p-4 space-y-3">
                                    <div className="flex items-center gap-2">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <Star
                                                key={n}
                                                className={`w-4 h-4 ${
                                                    item.rating && n <= item.rating
                                                        ? "text-yellow-400 fill-yellow-400"
                                                        : "text-gray-200"
                                                }`}
                                            />
                                        ))}
                                        <span className="ml-2 text-xs text-gray-500">
                                            <User className="inline w-3 h-3 mr-1" />
                                            {item.authorName || "anonimo"} · {item.authorEmail || ""}
                                        </span>
                                    </div>

                                    {/* Comentario reportado */}
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-xs font-semibold text-amber-900 mb-1">Comentario:</p>
                                        <p className="text-sm text-gray-800 italic">
                                            &ldquo;{item.comment || "(sin comentario)"}&rdquo;
                                        </p>
                                    </div>

                                    {/* Lista de reportes (si aplican) */}
                                    {item.reports.length > 0 && (
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs font-semibold text-gray-700 mb-2">
                                                Reportes de la comunidad ({item.reports.length}):
                                            </p>
                                            <ul className="space-y-1.5">
                                                {item.reports.map((r) => (
                                                    <li key={r.id} className="text-xs text-gray-600">
                                                        <span className="font-semibold">{r.reporterName || "Anónimo"}:</span>{" "}
                                                        {r.reason || <span className="italic text-gray-400">sin razón</span>}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => resolve(item.orderId, item.target, "APPROVED")}
                                        disabled={isResolving}
                                        className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                        Aprobar y publicar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => resolve(item.orderId, item.target, "REJECTED")}
                                        disabled={isResolving}
                                        className="flex-1 px-3 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                                    >
                                        {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                                        Rechazar y borrar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-2">
                <AlertTriangle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-900">
                    <strong>Recordá:</strong> el rating numérico (las estrellas) siempre cuenta en el promedio del comercio/seller/repartidor, sin importar si el comentario es aprobado o rechazado. Solo decidís sobre la visibilidad del texto del comentario.
                </p>
            </div>
        </div>
    );
}
