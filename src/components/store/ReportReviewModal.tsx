"use client";

// feat/resenas-publicas-tienda (2026-05-10): modal compacto para reportar
// una reseña publica. Se abre desde ReviewsSection.tsx cuando el user clickea
// el boton "Reportar" en una reseña.
//
// Flujo:
//   1. Modal muestra preview de la reseña reportada (rating + comment).
//   2. Textarea opcional para que el reporter escriba la razon (max 200 chars).
//   3. Envia POST a /api/reviews/report con { orderId, target, reason }.
//   4. Backend: incrementa reportCount, si llega a REPORT_THRESHOLD (3) baja
//      el comment a moderationStatus = PENDING y lo oculta del publico.
//   5. UI: mensaje de exito + onSubmitted callback que la lista pueda quitar
//      el item del view (UX optimista — incluso si no se gatillo el threshold,
//      ya reportaste y no tiene sentido seguir viendolo).

import { useState } from "react";
import { Star, X, Loader2, Flag, AlertCircle, Check } from "lucide-react";

interface ReviewItem {
    id: string;
    rating: number;
    comment: string | null;
    authorName: string;
    createdAt: string;
}

interface ReportReviewModalProps {
    review: ReviewItem;
    entityType: "merchant" | "seller";
    entityLabel?: string;
    onClose: () => void;
    onSubmitted: (reportedId: string) => void;
}

const REASON_MAX = 200;

export default function ReportReviewModal({
    review,
    entityType,
    entityLabel,
    onClose,
    onSubmitted,
}: ReportReviewModalProps) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    async function handleSubmit() {
        setError(null);
        setSubmitting(true);
        const target = entityType === "merchant" ? "MERCHANT" : "SELLER";
        try {
            const res = await fetch("/api/reviews/report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    orderId: review.id,
                    target,
                    reason: reason.trim() || null,
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "No pudimos procesar tu reporte");
                setSubmitting(false);
                return;
            }
            setSuccess(true);
            setTimeout(() => {
                onSubmitted(review.id);
            }, 1500);
        } catch {
            setError("Error de conexión. Reintentá en un momento.");
            setSubmitting(false);
        }
    }

    if (success) {
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-7 h-7 text-green-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">Gracias por reportar</h3>
                    <p className="text-sm text-gray-600">
                        Si más usuarios reportan esta reseña, el equipo de Moovy va a revisarla.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-red-600" />
                        <h2 className="text-base font-bold text-gray-900">Reportar reseña</h2>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Cerrar"
                        className="p-1.5 hover:bg-gray-100 rounded-full transition disabled:opacity-50"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-5 py-4 space-y-4">
                    <p className="text-xs text-gray-500">
                        Tu reporte llega al equipo de Moovy. Si la reseña recibe varios reportes, se oculta automáticamente hasta que la revisemos.
                    </p>

                    {/* Preview de la reseña reportada */}
                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-1 mb-1.5">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <Star
                                    key={n}
                                    className={`w-3 h-3 ${
                                        n <= review.rating
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300"
                                    }`}
                                />
                            ))}
                            <span className="ml-1.5 text-[11px] text-gray-500">de {review.authorName}</span>
                        </div>
                        {review.comment ? (
                            <p className="text-xs text-gray-700 italic line-clamp-4">
                                &ldquo;{review.comment}&rdquo;
                            </p>
                        ) : (
                            <p className="text-xs text-gray-400 italic">(Sin comentario escrito)</p>
                        )}
                    </div>

                    {/* Razon opcional */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            ¿Por qué reportás? <span className="text-gray-400 font-normal">(opcional)</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value.slice(0, REASON_MAX))}
                            disabled={submitting}
                            placeholder="Ej: lenguaje ofensivo, información falsa, spam..."
                            rows={3}
                            maxLength={REASON_MAX}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 disabled:bg-gray-50 resize-none"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 text-right">
                            {reason.length} / {REASON_MAX}
                        </p>
                    </div>

                    {error && (
                        <div className="flex gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <p>{error}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center gap-2 flex-shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 px-4 py-2 text-sm font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
                        {submitting ? "Enviando..." : "Enviar reporte"}
                    </button>
                </div>
            </div>
        </div>
    );
}
