
import Link from "next/link";
import { Star, MapPin, Clock, BadgeCheck, Sparkles } from "lucide-react";
import { cleanEncoding } from "@/lib/utils/stringUtils";

interface MerchantCardProps {
    merchant: {
        slug: string;
        name: string;
        description: string | null;
        image: string | null;
        rating?: number;
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
            platinum: { bg: "bg-gradient-to-r from-purple-500 to-pink-500", text: "text-white", label: "⭐ Platino" },
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
        <Link href={`/store/${merchant.slug}`} className={`group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition border ${merchant.isPremium ? 'border-yellow-300 ring-2 ring-yellow-200' : 'border-gray-100'}`}>
            <div className="relative aspect-video bg-gray-100">
                {/* Image placeholder or real image */}
                {merchant.image ? (
                    <img src={merchant.image} alt={merchant.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <span className="text-4xl font-bold opacity-20">{cleanEncoding(merchant.name).charAt(0)}</span>
                    </div>
                )}

                {/* Status Badge (Open/Closed) */}
                <div className={`absolute top-3 right-3 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${merchant.isOpen
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
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#e60012] transition line-clamp-1">
                            {cleanEncoding(merchant.name)}
                        </h3>
                        {merchant.isPremium ? (
                            <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        ) : merchant.isVerified && (
                            <BadgeCheck className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        )}
                    </div>
                    <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-xs font-semibold">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>4.8</span>
                    </div>
                </div>

                <p className="text-gray-500 text-sm line-clamp-2 mb-3 min-h-[40px]">
                    {cleanEncoding(merchant.description || "Sin descripción")}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{cleanEncoding(merchant.address || "Ushuaia")}</span>
                    </div>
                    <div className="ml-auto font-medium text-gray-900">
                        {merchant.deliveryFee === 0 ? (
                            <span className="text-green-600">Envío Gratis</span>
                        ) : (
                            `$${merchant.deliveryFee}`
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
