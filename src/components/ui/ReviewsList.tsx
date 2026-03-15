"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Loader2 } from "lucide-react";

interface Review {
    id: string;
    orderNumber: string;
    rating: number;
    comment: string | null;
    date: string;
    userName: string;
}

interface ReviewsListProps {
    type: "merchant" | "seller" | "driver";
    entityId: string;
}

export default function ReviewsList({ type, entityId }: ReviewsListProps) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchReviews() {
            try {
                const res = await fetch(`/api/reviews?type=${type}&id=${entityId}`);
                if (res.ok) {
                    setReviews(await res.json());
                }
            } catch (error) {
                console.error("Error fetching reviews:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchReviews();
    }, [type, entityId]);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No hay reseñas todavía</p>
            </div>
        );
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900">{avgRating.toFixed(1)}</p>
                    <div className="flex gap-0.5 justify-center mt-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                                key={s}
                                className={`w-4 h-4 ${s <= Math.round(avgRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                            />
                        ))}
                    </div>
                </div>
                <div className="text-sm text-gray-500">
                    <p className="font-medium text-gray-700">{reviews.length} reseñas</p>
                    {[5, 4, 3, 2, 1].map((star) => {
                        const count = reviews.filter((r) => r.rating === star).length;
                        const pct = (count / reviews.length) * 100;
                        return (
                            <div key={star} className="flex items-center gap-2">
                                <span className="w-3 text-xs">{star}</span>
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-400 rounded-full"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <span className="w-6 text-xs text-gray-400">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Individual reviews */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-white rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">
                                    {review.userName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{review.userName}</p>
                                    <p className="text-xs text-gray-400">Pedido #{review.orderNumber}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            className={`w-3.5 h-3.5 ${s <= review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {new Date(review.date).toLocaleDateString("es-AR")}
                                </p>
                            </div>
                        </div>
                        {review.comment && (
                            <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
