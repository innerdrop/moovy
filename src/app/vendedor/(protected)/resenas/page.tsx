"use client";

import { useState, useEffect } from "react";
import { Star, Loader2 } from "lucide-react";
import ReviewsList from "@/components/ui/ReviewsList";

export default function SellerResenasPage() {
    const [sellerId, setSellerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSeller() {
            try {
                const res = await fetch("/api/seller/availability");
                if (res.ok) {
                    const data = await res.json();
                    if (data.sellerId) {
                        setSellerId(data.sellerId);
                    }
                }
            } catch (error) {
                console.error("Error:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchSeller();
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
                    Reseñas de Compradores
                </h1>
                <p className="text-gray-500">Mirá lo que dicen tus compradores sobre vos</p>
            </div>

            {sellerId ? (
                <ReviewsList type="seller" entityId={sellerId} />
            ) : (
                <p className="text-gray-400 text-center py-8">No se pudo cargar el perfil de vendedor</p>
            )}
        </div>
    );
}
