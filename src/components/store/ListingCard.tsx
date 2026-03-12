"use client";

import Link from "next/link";
import { Star, Tag, Plus, Check } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";
import HeartButton from "@/components/ui/HeartButton";

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        price: number;
        condition: string;
        images: { url: string; order: number }[];
        sellerId?: string;
        seller: {
            id?: string;
            displayName: string | null;
            rating: number | null;
            avatar: string | null;
        };
        category?: { name: string } | null;
    };
    showAddButton?: boolean;
}

const conditionBadge: Record<string, { text: string; bg: string }> = {
    NUEVO: { text: "Nuevo", bg: "bg-green-100 text-green-700" },
    USADO: { text: "Usado", bg: "bg-orange-100 text-orange-700" },
    REACONDICIONADO: { text: "Reacondi.", bg: "bg-blue-100 text-blue-700" },
};

export default function ListingCard({ listing, showAddButton = false }: ListingCardProps) {
    const addItem = useCartStore((s) => s.addItem);
    const [added, setAdded] = useState(false);

    const cond = conditionBadge[listing.condition] || {
        text: listing.condition,
        bg: "bg-gray-100 text-gray-700",
    };

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const sellerId = listing.sellerId || listing.seller?.id;

        addItem({
            productId: listing.id,
            name: listing.title,
            price: listing.price,
            quantity: 1,
            image: listing.images?.[0]?.url || undefined,
            sellerId,
            sellerName: listing.seller?.displayName || undefined,
            type: "listing",
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 1500);
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

                <HeartButton type="listing" itemId={listing.id} className="absolute top-2 right-2" />
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

                {/* Price + Add to cart */}
                <div className="flex items-center justify-between mt-3">
                    <p className="text-lg font-bold text-[#e60012]">
                        ${listing.price.toLocaleString("es-AR")}
                    </p>
                    {showAddButton && (
                        <button
                            onClick={handleAddToCart}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition shadow-sm ${
                                added
                                    ? "bg-green-500 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-[#e60012] hover:text-white"
                            }`}
                        >
                            {added ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                    )}
                </div>
            </div>
        </Link>
    );
}
