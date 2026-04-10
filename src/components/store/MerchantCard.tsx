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
        /** Info de próxima apertura cuando está cerrado (ej: "Hoy", "Mañana", "Lunes") */
        nextOpenDay?: string | null;
        /** Hora de próxima apertura (ej: "09:00") */
        nextOpenTime?: string | null;
        /** true si está pausado manualmente (vs cerrado por horario) */
        isPaused?: boolean;
    };
    variant?: "default" | "compact";
}

export default function MerchantCard({ merchant, variant = "default" }: MerchantCardProps) {
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
            <div className={`absolute top-1 left-1 ${style.bg} ${style.text} text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg flex items-center gap-0.5`}>
                {style.label}
            </div>
        );
    };

    // ─── Compact variant: horizontal card for mobile ─────────────────────
    if (variant === "compact") {
        return (
            <Link
                href={`/tienda/${merchant.slug}`}
                className={`group flex items-center gap-3 bg-white rounded-xl p-2.5 shadow-sm border transition-all tap-bounce ${
                    merchant.isPremium ? "border-yellow-300 ring-1 ring-yellow-200" : "border-gray-100"
                } ${!merchant.isOpen ? "opacity-60" : ""}`}
            >
                {/* Image thumbnail */}
                <div className="relative w-[72px] h-[72px] rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {merchant.image ? (
                        <img src={merchant.image} alt={merchant.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                            <span className="text-2xl font-bold opacity-20">{cleanEncoding(merchant.name).charAt(0)}</span>
                        </div>
                    )}
                    {!merchant.isOpen && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white text-[9px] font-bold">
                                {merchant.isPaused ? "Pausado" : merchant.nextOpenTime ? `Abre ${merchant.nextOpenTime}` : "Cerrado"}
                            </span>
                        </div>
                    )}
                    {merchant.isPremium && getPremiumBadge()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-[#e60012] transition">
                            {cleanEncoding(merchant.name)}
                        </h3>
                        {merchant.isPremium ? (
                            <Sparkles className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                        ) : merchant.isVerified && (
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        )}
                        <div className="flex items-center gap-0.5 text-[11px] font-semibold text-gray-500 ml-auto flex-shrink-0">
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            <span>{merchant.rating ? merchant.rating.toFixed(1) : "Nuevo"}</span>
                        </div>
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-1 mb-1">
                        {cleanEncoding(merchant.description || "Sin descripción")}
                    </p>
                    <div className="flex items-center gap-2.5 text-[11px] text-gray-500">
                        <span className="flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {merchant.deliveryTimeMin}-{merchant.deliveryTimeMax}min
                        </span>
                        <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate max-w-[90px]">{cleanEncoding(merchant.address || "Ushuaia")}</span>
                        </span>
                        <span className="font-semibold ml-auto flex-shrink-0">
                            {merchant.deliveryFee === 0 ? (
                                <span className="text-green-600">Gratis</span>
                            ) : (
                                <span className="text-gray-700">${merchant.deliveryFee}</span>
                            )}
                        </span>
                    </div>
                </div>
            </Link>
        );
    }

    // ─── Default variant: vertical card for desktop ──────────────────────
    return (
        <Link href={`/tienda/${merchant.slug}`} className={`group block bg-white rounded-xl overflow-hidden shadow-sm hover-lift tap-bounce border ${merchant.isPremium ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'} ${!merchant.isOpen ? 'opacity-75' : ''}`}>
            <div className="relative aspect-video bg-gray-100">
                {/* Image placeholder or real image */}
                {merchant.image ? (
                    <img src={merchant.image} alt={merchant.name} className="w-full h-full object-cover img-zoom" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <span className="text-4xl font-bold opacity-20">{cleanEncoding(merchant.name).charAt(0)}</span>
                    </div>
                )}

                {/* Closed overlay — shows reason and next open time */}
                {!merchant.isOpen && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center z-10 gap-1">
                        <span className="text-white text-sm font-bold bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                            {merchant.isPaused ? "Cerrado temporalmente" : "Cerrado"}
                        </span>
                        {!merchant.isPaused && merchant.nextOpenTime && (
                            <span className="text-white/80 text-xs font-medium">
                                Abre {merchant.nextOpenDay === "Hoy" ? "hoy" : merchant.nextOpenDay} a las {merchant.nextOpenTime}
                            </span>
                        )}
                    </div>
                )}

                {/* Premium Badge — paid placement, deserves visibility */}
                {merchant.isPremium && getPremiumBadge()}

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
