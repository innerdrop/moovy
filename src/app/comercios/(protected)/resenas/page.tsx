"use client";

import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import ReviewsList from "@/components/ui/ReviewsList";

export default function MerchantResenasPage() {
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMerchant() {
            try {
                const res = await fetch("/api/merchant/earnings");
                if (res.ok) {
                    const data = await res.json();
                    if (data.summary) {
                        setMerchantId(data.summary.merchantId);
                    }
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchMerchant();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-[#e60012]" />
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-400" />
                    Reseñas de Clientes
                </h1>
                <p className="text-gray-500">Mirá lo que dicen tus clientes sobre tu comercio</p>
            </div>

            {merchantId ? (
                <ReviewsList type="merchant" entityId={merchantId} />
            ) : (
                <p className="text-gray-400 text-center py-8">No se pudo cargar el comercio</p>
            )}
        </div>
    );
}
