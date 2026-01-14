
import Link from "next/link";
import { Star, MapPin, Clock } from "lucide-react";

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
    };
}

export default function MerchantCard({ merchant }: MerchantCardProps) {
    return (
        <Link href={`/store/${merchant.slug}`} className="group block bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition border border-gray-100">
            <div className="relative aspect-video bg-gray-100">
                {/* Image placeholder or real image */}
                {merchant.image ? (
                    <img src={merchant.image} alt={merchant.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        <span className="text-4xl font-bold opacity-20">{merchant.name.charAt(0)}</span>
                    </div>
                )}

                {/* Status Badge (Open/Closed) - For now hardcoded or passed prop */}
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                    ABIERTO
                </div>
            </div>

            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#e60012] transition line-clamp-1">
                        {merchant.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-gray-50 px-1.5 py-0.5 rounded text-xs font-semibold">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span>4.8</span>
                    </div>
                </div>

                <p className="text-gray-500 text-sm line-clamp-2 mb-3 min-h-[40px]">
                    {merchant.description || "Sin descripción"}
                </p>

                <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[100px]">{merchant.address || "Ushuaia"}</span>
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
