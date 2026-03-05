import Link from "next/link";
import { Star, Tag } from "lucide-react";

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        price: number;
        condition: string;
        images: { url: string; order: number }[];
        seller: {
            displayName: string | null;
            rating: number | null;
            avatar: string | null;
        };
        category?: { name: string } | null;
    };
}

const conditionBadge: Record<string, { text: string; bg: string }> = {
    NUEVO: { text: "Nuevo", bg: "bg-green-100 text-green-700" },
    USADO: { text: "Usado", bg: "bg-orange-100 text-orange-700" },
    REACONDICIONADO: { text: "Reacondi.", bg: "bg-blue-100 text-blue-700" },
};

export default function ListingCard({ listing }: ListingCardProps) {
    const cond = conditionBadge[listing.condition] || {
        text: listing.condition,
        bg: "bg-gray-100 text-gray-700",
    };

    return (
        <Link
            href={`/marketplace/${listing.id}`}
            className="card overflow-hidden group bg-white border border-gray-100 rounded-xl block h-full flex flex-col relative"
        >
            {/* Image */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
                {listing.images?.[0]?.url ? (
                    <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
                        <Tag className="w-10 h-10 opacity-20" />
                    </div>
                )}

                {/* Condition Badge */}
                <span
                    className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${cond.bg}`}
                >
                    {cond.text}
                </span>
            </div>

            {/* Info */}
            <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-800 text-sm group-hover:text-[#e60012] transition line-clamp-2 mb-1">
                    {listing.title}
                </h3>

                {/* Seller info */}
                <div className="flex items-center gap-1.5 mb-auto">
                    {listing.seller?.avatar ? (
                        <img
                            src={listing.seller.avatar}
                            alt=""
                            className="w-4 h-4 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-gray-500">
                                {listing.seller?.displayName?.charAt(0) || "V"}
                            </span>
                        </div>
                    )}
                    <span className="text-xs text-gray-500 truncate">
                        {listing.seller?.displayName || "Vendedor"}
                    </span>
                    {listing.seller?.rating && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                            <Star className="w-3 h-3 fill-current" />
                            {listing.seller.rating.toFixed(1)}
                        </span>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between mt-3">
                    <p className="text-lg font-bold text-[#e60012]">
                        ${listing.price.toLocaleString("es-AR")}
                    </p>
                </div>
            </div>
        </Link>
    );
}
