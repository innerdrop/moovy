"use client";

import { useState } from "react";
import { Star, X, Loader2, Check, User, Package } from "lucide-react";

interface RateDriverModalProps {
    orderId: string;
    orderNumber: string;
    driverName: string;
    driverDeliveries: number;
    onClose: () => void;
    onSuccess: () => void;
}

export default function RateDriverModal({
    orderId,
    orderNumber,
    driverName,
    driverDeliveries,
    onClose,
    onSuccess
}: RateDriverModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (rating === 0) {
            setError("Por favor selecciona una calificación");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch(`/api/orders/${orderId}/rate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rating, comment })
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 2000);
            } else {
                const data = await res.json();
                setError(data.error || "Error al enviar calificación");
            }
        } catch (err) {
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const ratingLabels = ["", "Malo", "Regular", "Bueno", "Muy bueno", "Excelente"];

    if (success) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">¡Gracias!</h3>
                    <p className="text-gray-600">Tu calificación ayuda a mejorar el servicio</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900">Califica tu entrega</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Driver Info */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <User className="w-7 h-7 text-green-600" />
                    </div>
                    <p className="font-semibold text-gray-900">{driverName}</p>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Package className="w-3 h-3" />
                        {driverDeliveries} entregas realizadas
                    </p>
                </div>

                {/* Star Rating */}
                <div className="text-center mb-4">
                    <p className="text-sm text-gray-600 mb-3">¿Cómo fue tu experiencia?</p>
                    <div className="flex justify-center gap-2 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="p-1 transition-transform hover:scale-110"
                            >
                                <Star
                                    className={`w-10 h-10 ${star <= (hoveredRating || rating)
                                            ? "text-yellow-400 fill-yellow-400"
                                            : "text-gray-300"
                                        }`}
                                />
                            </button>
                        ))}
                    </div>
                    <p className="text-sm font-medium text-gray-700 h-5">
                        {ratingLabels[hoveredRating || rating]}
                    </p>
                </div>

                {/* Comment */}
                <div className="mb-4">
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Cuéntanos más sobre tu experiencia (opcional)"
                        className="w-full p-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        rows={3}
                    />
                </div>

                {error && (
                    <p className="text-red-500 text-sm text-center mb-4">{error}</p>
                )}

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || rating === 0}
                    className="w-full py-3 bg-green-500 text-white rounded-xl font-medium hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <Star className="w-5 h-5" />
                            Enviar Calificación
                        </>
                    )}
                </button>

                <p className="text-xs text-gray-400 text-center mt-3">
                    Pedido #{orderNumber}
                </p>
            </div>
        </div>
    );
}
