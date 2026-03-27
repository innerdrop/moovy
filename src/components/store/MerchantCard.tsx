"use client";

import Link from "next/link";
import { Star, MapPin, Clock, BadgeCheck, Sparkles } from "lucide-react";
import { cleanEncoding } from "@/lib/utils/stringUtils";
import HeartButton from "@/components/ui/HeartButton";

interface MerchantCardProps {
    merchant: {
        id: string;
        slug: string;
        name: string;
        description: string | null;
        image: string | null;
        rating?: number | null;
        deliveryTimeMin: number;
        deliveryTimeMax: number;
        deliveryFee: number;
        address: string | null;
        isVerified?: boolean;
        isPremium?: boolean;
        premiumTier?: string | null;
        isOpen: boolean;
    };
}

export default function MerchantCard({ merchant }: MerchantCardProps) {
    // Premium badge styles based on tier
    const getPremiumBadge = () => {
        if (!merchant.isPremium) return null;

        const tier = merchant.premiumTier || "basic";
        const styles: Record<string, { bg: string; text: string; label: string }> = {
            platinum: { bg: "bg-gradient-to-r from-red-500 to-pink-500", text: "text-white", label: "⭐ Platino" },
            gold: { bg: "bg-gradient-to-r from-yellow-400 to-orange-500", text: "text-white", label: "🔥 Destacado" },
            basic: { bg: "bg-gradient-to-r from-blue-500 to-cyan-500", text: "text-white", label: "✨ Premium" }
        };
        const style = styles[tier] || styles.basic;

        return (
            <div className={`absolute top-3 left-3 ${style.bg} ${style.text} text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 animate-pulse`}>
                {style.label}
            </div>
        );
    };

    return (
        <Link href={`/tienda/${merchant.slug}`} className={`group block bg-white rounded-xl overflow-hidden shadow-sm hover-lift tap-bounce border ${merchant.isPremium ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'}`}>
            <div className="relative aspect-video bg-gray-100">
                {/* Image placeholder or real image */}
                {merchant.image ? (
                    <img src={merchant.image} alt={merchant.name} className="w-full h-full object-cover img-zoom" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <span className="text-4xl font-bold opacity-20">{cleanEncoding(merchant.name).charAt(0)}</span>
                    </div>
                )}

                {/* Status Badge (Open/Closed) */}
                <div className={`absolute top-3 right-3 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${merchant.isOpen
                    ? "bg-green-500/90 hover:bg-green-500"
                    : "bg-gray-500/90 hover:bg-gray-600"
                    }`}>
                    {merchant.isOpen ? "ABIERTO" : "CERRADO"}
                </div>

                {/* Premium Badge - Priority over Verified */}
                {merchant.isPremium ? (
                    getPremiumBadge()
                ) : merchant.isVerified && (
                    <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        Verificado
                    </div>
                )}

                {/* Favorite Heart */}
                <HeartButton type="merchant" itemId={merchant.id} className="absolute bottom-3 right-3" />
            </div>

            <div className="p-3">
                {/* Nombre + rating */}
                <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-[#e60012] transition truncate">
                            {cleanEncoding(merchant.name)}
                        </h3>
                        {merchant.isPremium ? (
                            <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        ) : merchant.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 flex-shrink-0">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>{merchant.rating ? merchant.rating.toFixed(1) : "Nuevo"}</span>
                    </div>
                </div>

                {/* Descripción */}
                <p className="text-gray-400 text-sm line-clamp-1 mb-2">
                    {cleanEncoding(merchant.description || "Sin descripción")}
                </p>

                {/* Info de delivery — dos filas limpias */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min
                        </span>
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[120px]">{cleanEncoding(merchant.address || "Ushuaia")}</span>
                        </span>
                    </div>
                    <span className="font-semibold flex-shrink-0">
                        {merchant.deliveryFee === 0 ? (
                            <span className="text-green-600">Envío gratis</span>
                        ) : (
                            <span className="text-gray-700">${merchant.deliveryFee}</span>
                        )}
                    </span>
                </div>
            </div>
        </Link>
    );
}
