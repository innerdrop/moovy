"use client";

import { useState, useEffect } from "react";
import { Star, Loader2, Sparkles } from "lucide-react";
import ReviewsList from "@/components/ui/ReviewsList";

export default function MerchantResenasPage() {
    const [merchantId, setMerchantId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMerchant() {
            try {
                // fix/panel-comercio-auditoria: /api/merchant/me es la pregunta chiquita.
                const res = await fetch("/api/merchant/me");
                if (res.ok) {
                    const data = await res.json();
                    if (data.id) setMerchantId(data.id);
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
        <div className="max-w-3xl mx-auto space-y-6 pb-16">
            {/* Hero */}
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100 rounded-3xl p-6 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-yellow-400/20 flex items-center justify-center flex-shrink-0">
                    <Star className="w-7 h-7 text-yellow-500 fill-yellow-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reseñas de clientes</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Lo que dicen tus clientes sobre tu comercio</p>
                </div>
            </div>

            {merchantId ? (
                <ReviewsList type="merchant" entityId={merchantId} />
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl py-12 text-center text-gray-400">
                    No se pudo cargar el comercio.
                </div>
            )}

            {/* Tip para conseguir más reseñas */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-3 shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">¿Cómo consigo más reseñas?</p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        Las reseñas aparecen cuando un cliente califica un pedido entregado. Fotos nítidas,
                        entregas rápidas y buena atención suben tu puntaje — y un mejor puntaje te trae más ventas.
                    </p>
                </div>
            </div>
        </div>
    );
}
