"use client";

// feat/resenas-publicas-tienda (2026-05-10): seccion de reseñas publicas
// que se incrusta en la pagina del comercio (/tienda/[slug]) y del seller
// marketplace (/marketplace/vendedor/[id]).
//
// Render:
//   - Header con avg grande + estrellas + total ("4.7 ★★★★★ · 23 reseñas")
//   - Distribucion de estrellas con barras de % (estilo Google/Amazon)
//   - Lista paginada de reseñas con boton "Reportar"
//   - Boton "Ver más" para cargar la siguiente pagina
//   - Estado vacio si total === 0
//
// El boton "Reportar" abre un modal pequeno con textarea opcional. Si el
// user no esta logueado, redirige a /login con returnTo (anti-spam — solo
// users logueados pueden reportar).

import { useState, useEffect, useCallback } from "react";
import { Star, Flag, Loader2, MessageSquareText } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReportReviewModal from "./ReportReviewModal";

interface ReviewItem {
    id: string;
    rating: number;
    comment: string | null;
    authorName: string;
    createdAt: string;
}

interface ReviewsApiResponse {
    items: ReviewItem[];
    total: number;
    avgRating: number;
    distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
    page: number;
    limit: number;
    hasMore: boolean;
}

interface ReviewsSectionProps {
    /** "merchant" o "seller" — define que endpoint pegamos. */
    entityType: "merchant" | "seller";
    /** id del Merchant o SellerProfile. */
    entityId: string;
    /** Nombre opcional para el reportar modal (titulo). */
    entityLabel?: string;
}

const PAGE_SIZE = 10;

function formatRelativeDate(iso: string): string {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return "hoy";
    if (diffDays === 1) return "ayer";
    if (diffDays < 7) return `hace ${diffDays} días`;
    if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} sem`;
    if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} meses`;
    return `hace ${Math.floor(diffDays / 365)} años`;
}

export default function ReviewsSection({ entityType, entityId, entityLabel }: ReviewsSectionProps) {
    const { data: session } = useSession();
    const router = useRouter();

    const [data, setData] = useState<ReviewsApiResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [allItems, setAllItems] = useState<ReviewItem[]>([]);
    const [reportTarget, setReportTarget] = useState<ReviewItem | null>(null);

    const fetchPage = useCallback(async (pageToFetch: number) => {
        const url = `/api/reviews/${entityType}/${entityId}?page=${pageToFetch}&limit=${PAGE_SIZE}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("fetch failed");
        return (await res.json()) as ReviewsApiResponse;
    }, [entityType, entityId]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setPage(1);
        fetchPage(1)
            .then((d) => {
                if (cancelled) return;
                setData(d);
                setAllItems(d.items);
            })
            .catch(() => {
                if (cancelled) return;
                setData({ items: [], total: 0, avgRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, page: 1, limit: PAGE_SIZE, hasMore: false });
                setAllItems([]);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [fetchPage]);

    const handleLoadMore = async () => {
        if (loadingMore || !data?.hasMore) return;
        setLoadingMore(true);
        try {
            const next = page + 1;
            const d = await fetchPage(next);
            setPage(next);
            // Deduplicacion por id por si el orden cambio entre paginas.
            setAllItems((prev) => {
                const seen = new Set(prev.map((i) => i.id));
                const fresh = d.items.filter((i) => !seen.has(i.id));
                return [...prev, ...fresh];
            });
            setData((prev) => prev ? { ...d, items: [...prev.items, ...d.items] } : d);
        } catch {
            // Silent — el boton sigue disponible para reintentar.
        } finally {
            setLoadingMore(false);
        }
    };

    const handleReportClick = (item: ReviewItem) => {
        if (!session?.user) {
            const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
            router.push(`/login?callbackUrl=${returnTo}`);
            return;
        }
        setReportTarget(item);
    };

    const handleReportSubmitted = (reportedId: string) => {
        // Optimistic remove: si el reporte gatillo PENDING (>= 3 reportes), el
        // backend ya bajo la review. No sabemos el count actual, asi que la
        // sacamos del view del que reporto (mejor UX que dejarla visible).
        setAllItems((prev) => prev.filter((i) => i.id !== reportedId));
        setReportTarget(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!data || data.total === 0) {
        return (
            <div className="py-12 text-center">
                <div className="w-14 h-14 bg-gray-50 rounded-full mx-auto flex items-center justify-center mb-3">
                    <MessageSquareText className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Todavía no hay reseñas</p>
                <p className="text-xs text-gray-500 mt-1">Sé el primero en compartir tu experiencia</p>
            </div>
        );
    }

    const maxBarCount = Math.max(
        data.distribution[5],
        data.distribution[4],
        data.distribution[3],
        data.distribution[2],
        data.distribution[1],
        1, // evitar division por 0
    );

    return (
        <div className="space-y-6">
            {/* Header con avg + distribucion */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 sm:gap-8 items-center bg-gray-50 rounded-2xl p-5 sm:p-6">
                {/* Avg gigante */}
                <div className="text-center sm:text-left">
                    <p className="text-5xl font-black text-gray-900 leading-none">{data.avgRating.toFixed(1)}</p>
                    <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                                key={n}
                                className={`w-4 h-4 ${
                                    n <= Math.round(data.avgRating)
                                        ? "text-yellow-400 fill-yellow-400"
                                        : "text-gray-200"
                                }`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-1.5">{data.total} reseña{data.total !== 1 ? "s" : ""}</p>
                </div>

                {/* Distribucion con barras */}
                <div className="space-y-1.5">
                    {[5, 4, 3, 2, 1].map((stars) => {
                        const count = data.distribution[stars as 1 | 2 | 3 | 4 | 5];
                        const pct = data.total > 0 ? (count / data.total) * 100 : 0;
                        const barPct = (count / maxBarCount) * 100;
                        return (
                            <div key={stars} className="flex items-center gap-2 text-xs">
                                <span className="w-3 text-right text-gray-600 font-medium">{stars}</span>
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                                <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full transition-all"
                                        style={{ width: `${barPct}%` }}
                                    />
                                </div>
                                <span className="w-10 text-right text-gray-500 tabular-nums">{Math.round(pct)}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Lista de reseñas */}
            <ul className="space-y-3">
                {allItems.map((item) => (
                    <li key={item.id} className="bg-white rounded-xl border border-gray-100 p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-1">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                            key={n}
                                            className={`w-3.5 h-3.5 ${
                                                n <= item.rating
                                                    ? "text-yellow-400 fill-yellow-400"
                                                    : "text-gray-200"
                                            }`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500">
                                    <span className="font-semibold text-gray-700">{item.authorName}</span>
                                    {" · "}
                                    {formatRelativeDate(item.createdAt)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleReportClick(item)}
                                className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                                aria-label="Reportar esta reseña"
                                title="Reportar esta reseña"
                            >
                                <Flag className="w-3 h-3" />
                                Reportar
                            </button>
                        </div>
                        {item.comment && (
                            <p className="text-sm text-gray-700 whitespace-pre-line">{item.comment}</p>
                        )}
                    </li>
                ))}
            </ul>

            {data.hasMore && (
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="px-5 py-2.5 text-sm font-semibold rounded-lg border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50 flex items-center gap-2"
                    >
                        {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                        {loadingMore ? "Cargando..." : "Ver más reseñas"}
                    </button>
                </div>
            )}

            {reportTarget && (
                <ReportReviewModal
                    review={reportTarget}
                    entityType={entityType}
                    entityLabel={entityLabel}
                    onClose={() => setReportTarget(null)}
                    onSubmitted={handleReportSubmitted}
                />
            )}
        </div>
    );
}
