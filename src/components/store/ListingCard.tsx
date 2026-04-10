"use client";

import Link from "next/link";
import { Star, Tag, Plus, Check, ShieldCheck, AlertTriangle, Gavel } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState, useEffect } from "react";
import HeartButton from "@/components/ui/HeartButton";

interface SellerAvailability {
    isOnline: boolean;
    isPaused: boolean;
    pauseEndsAt: string | null;
    preparationMinutes: number;
}

interface ListingCardProps {
    listing: {
        id: string;
        title: string;
        price: number;
        stock?: number;
        condition: string;
        images: { url: string; order: number }[];
        sellerId?: string;
        seller: {
            id?: string;
            displayName: string | null;
            rating: number | null;
            avatar: string | null;
            isVerified?: boolean;
            availability?: SellerAvailability | null;
        };
        category?: { name: string } | null;
        soldCount?: number;
        favCount?: number;
        // Campos de subasta
        listingType?: string | null;
        auctionStatus?: string | null;
        auctionEndsAt?: string | Date | null;
        currentBid?: number | null;
        startingPrice?: number | null;
        totalBids?: number | null;
    };
    showAddButton?: boolean;
    /** "marketplace" applies purple accent; default keeps red */
    variant?: "default" | "marketplace";
}

/** Hook para countdown en subastas */
function useCountdown(endsAt?: string | Date | null) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        if (!endsAt) return;
        function update() {
            const diff = new Date(endsAt!).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft("Finalizada");
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            if (h > 0) setTimeLeft(`${h}h ${m}m`);
            else if (m > 0) setTimeLeft(`${m}m ${s}s`);
            else setTimeLeft(`${s}s`);
        }
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [endsAt]);

    return timeLeft;
}

/* ── Default condition badges (store variant) ── */
const conditionBadge: Record<string, { text: string; bg: string }> = {
    NUEVO: { text: "Nuevo", bg: "bg-green-100 text-green-700" },
    USADO: { text: "Usado", bg: "bg-orange-100 text-orange-700" },
    REACONDICIONADO: { text: "Reacondi.", bg: "bg-blue-100 text-blue-700" },
};

/* ── Marketplace condition badges (violet glass) ── */
const mpConditionBadge: Record<string, string> = {
    NUEVO: "mp-badge-nuevo",
    USADO: "mp-badge-usado",
    REACONDICIONADO: "mp-badge-reacondicionado",
};

const conditionLabel: Record<string, string> = {
    NUEVO: "Nuevo",
    USADO: "Usado",
    REACONDICIONADO: "Reacondi.",
};

function getAvailabilityBadge(availability?: SellerAvailability | null) {
    if (!availability) return null;

    if (availability.isOnline && !availability.isPaused) {
        return {
            text: `Abierto · ~${availability.preparationMinutes} min`,
            dot: "bg-green-500",
            bg: "bg-green-50 text-green-700",
        };
    }

    if (availability.isOnline && availability.isPaused && availability.pauseEndsAt) {
        const remaining = Math.max(0, Math.round((new Date(availability.pauseEndsAt).getTime() - Date.now()) / 60000));
        return {
            text: remaining > 0 ? `Vuelve en ${remaining} min` : "Volviendo...",
            dot: "bg-amber-500",
            bg: "bg-amber-50 text-amber-700",
        };
    }

    return {
        text: "Cerrado",
        dot: "bg-red-400",
        bg: "bg-gray-50 text-gray-500",
    };
}

export default function ListingCard({ listing, showAddButton = false, variant = "default" }: ListingCardProps) {
    const addItem = useCartStore((s) => s.addItem);
    const [added, setAdded] = useState(false);
    const [cartPop, setCartPop] = useState(false);
    const isMp = variant === "marketplace";

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
        setCartPop(true);
        setTimeout(() => setCartPop(false), 350);
        setTimeout(() => setAdded(false), 1500);
    };

    /* ════════════════════════════════════════════════
       MARKETPLACE VARIANT — Violet Premium Card
       ════════════════════════════════════════════════ */
    const isAuction = listing.listingType === "AUCTION";
    const auctionActive = isAuction && listing.auctionStatus === "ACTIVE";
    const countdown = useCountdown(auctionActive ? listing.auctionEndsAt : null);
    const displayPrice = isAuction
        ? (listing.currentBid || listing.startingPrice || listing.price)
        : listing.price;

    if (isMp) {
        const mpBadgeClass = mpConditionBadge[listing.condition] || "mp-badge-usado";
        const mpBadgeLabel = conditionLabel[listing.condition] || listing.condition;
        const isLowStock = !isAuction && listing.stock !== undefined && listing.stock > 0 && listing.stock <= 3;
        const hasSold = !isAuction && (listing.soldCount || 0) > 0;

        return (
            <Link
                href={`/marketplace/${listing.id}`}
                className="mp-card-glow block h-full"
            >
                <div className="mp-glass rounded-2xl overflow-hidden h-full flex flex-col border border-purple-100/60">
                    {/* ── Image Section ── */}
                    <div className="aspect-square bg-gradient-to-br from-purple-50 to-violet-50 relative overflow-hidden group">
                        {listing.images?.[0]?.url ? (
                            <img
                                src={listing.images[0].url}
                                alt={listing.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Tag className="w-10 h-10 text-purple-200" />
                            </div>
                        )}

                        {/* Gradient overlay bottom */}
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />

                        {/* Condition / Auction Badge */}
                        {isAuction ? (
                            <span className="absolute top-2 left-2 flex items-center gap-1 bg-violet-600 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-lg">
                                <Gavel className="w-3 h-3" />
                                SUBASTA
                            </span>
                        ) : (
                            <span className={`absolute top-2 left-2 ${mpBadgeClass}`}>
                                {mpBadgeLabel}
                            </span>
                        )}

                        {/* Heart */}
                        <HeartButton type="listing" itemId={listing.id} className="absolute top-2 right-2" />

                        {/* Bottom overlays: verified + low stock */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                            {listing.seller?.isVerified ? (
                                <div className="flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 shadow-sm">
                                    <ShieldCheck className="w-3 h-3 text-violet-600" />
                                    <span className="text-[11px] font-bold text-violet-700">Verificado</span>
                                </div>
                            ) : <div />}
                            {isLowStock && (
                                <div className="flex items-center gap-0.5 bg-orange-500/90 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-sm">
                                    <AlertTriangle className="w-2.5 h-2.5 text-white" />
                                    <span className="text-[11px] font-bold text-white">Últimas {listing.stock}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Info Section ── */}
                    <div className="p-3 flex-1 flex flex-col gap-1">
                        {/* Title */}
                        <h3 className="font-semibold text-gray-800 text-base line-clamp-2 leading-snug group-hover:text-violet-700 transition-colors">
                            {listing.title}
                        </h3>

                        {/* Seller row */}
                        <div
                            className="flex items-center gap-1.5 transition cursor-pointer group/seller"
                            onClick={(e) => {
                                if (listing.seller?.id) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    window.location.href = `/marketplace/vendedor/${listing.seller.id}`;
                                }
                            }}
                        >
                            {listing.seller?.avatar ? (
                                <img
                                    src={listing.seller.avatar}
                                    alt=""
                                    className="w-4.5 h-4.5 rounded-full object-cover ring-1 ring-purple-200"
                                />
                            ) : (
                                <div className="w-4.5 h-4.5 rounded-full bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                                    <span className="text-[8px] font-bold text-purple-600">
                                        {listing.seller?.displayName?.charAt(0) || "V"}
                                    </span>
                                </div>
                            )}
                            <span className="text-xs text-gray-500 truncate group-hover/seller:text-violet-600 transition-colors">
                                {listing.seller?.displayName || "Vendedor"}
                            </span>
                            {listing.seller?.rating && (
                                <span className="flex items-center gap-0.5 text-xs text-amber-600 ml-auto">
                                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    {listing.seller.rating.toFixed(1)}
                                </span>
                            )}
                        </div>

                        {/* Social proof / Auction info */}
                        {isAuction && auctionActive ? (
                            <div className="flex items-center gap-2 text-xs">
                                <span className="text-violet-600 font-semibold">
                                    {(listing.totalBids || 0)} oferta{(listing.totalBids || 0) !== 1 ? "s" : ""}
                                </span>
                                <span className="text-red-500 font-bold animate-pulse">
                                    {countdown}
                                </span>
                            </div>
                        ) : hasSold ? (
                            <span className="text-xs text-purple-400 font-medium">
                                {listing.soldCount} vendido{(listing.soldCount || 0) > 1 ? "s" : ""}
                            </span>
                        ) : null}

                        {/* Spacer */}
                        <div className="flex-1" />

                        {/* Price + Add to cart */}
                        <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-purple-50">
                            <div>
                                {isAuction && (
                                    <p className="text-[10px] text-gray-400 font-medium -mb-0.5">
                                        {listing.currentBid ? "Oferta actual" : "Precio base"}
                                    </p>
                                )}
                                <p className="mp-gradient-text text-lg font-extrabold tracking-tight">
                                    ${displayPrice.toLocaleString("es-AR")}
                                </p>
                            </div>
                            {showAddButton && !isAuction && (
                                <button
                                    onClick={handleAddToCart}
                                    className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm ${cartPop ? "mp-cart-pop" : ""} ${
                                        added
                                            ? "bg-green-500 text-white shadow-green-200"
                                            : "bg-gradient-to-br from-purple-50 to-violet-100 text-[#7C3AED] border border-purple-200/60 hover:from-[#7C3AED] hover:to-[#6D28D9] hover:text-white hover:border-transparent hover:shadow-purple-300/40 hover:shadow-md active:scale-90"
                                    }`}
                                >
                                    {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                                </button>
                            )}
                            {isAuction && auctionActive && (
                                <span className="flex items-center gap-1 bg-violet-100 text-violet-700 text-xs font-bold px-2.5 py-1.5 rounded-xl">
                                    <Gavel className="w-3 h-3" />
                                    Ofertar
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        );
    }

    /* ════════════════════════════════════════════════
       DEFAULT VARIANT — Store (red accent, unchanged)
       ════════════════════════════════════════════════ */
    return (
        <Link
            href={`/marketplace/${listing.id}`}
            className="card overflow-hidden group bg-white border border-gray-100 rounded-xl block h-full flex flex-col relative transition-all duration-200"
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
                    className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full shadow-sm ${cond.bg}`}
                >
                    {cond.text}
                </span>

                <HeartButton type="listing" itemId={listing.id} className="absolute top-2 right-2" />
            </div>

            {/* Info */}
            <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-semibold text-gray-800 text-base transition line-clamp-2 mb-1 group-hover:text-[#e60012]">
                    {listing.title}
                </h3>

                {/* Seller info */}
                <div
                    className="flex items-center gap-1.5 hover:text-emerald-600 transition cursor-pointer"
                    onClick={(e) => {
                        if (listing.seller?.id) {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = `/marketplace/vendedor/${listing.seller.id}`;
                        }
                    }}
                >
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
                    <span className="text-sm text-gray-500 truncate group-hover/seller:text-emerald-600">
                        {listing.seller?.displayName || "Vendedor"}
                    </span>
                    {listing.seller?.isVerified && (
                        <ShieldCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    )}
                    {listing.seller?.rating && (
                        <span className="flex items-center gap-0.5 text-xs text-amber-600">
                            <Star className="w-3 h-3 fill-current" />
                            {listing.seller.rating.toFixed(1)}
                        </span>
                    )}
                </div>

                {/* Availability badge */}
                {(() => {
                    const badge = getAvailabilityBadge(listing.seller?.availability);
                    if (!badge) return null;
                    return (
                        <div className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-full w-fit mb-auto ${badge.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.text}
                        </div>
                    );
                })()}

                {/* Price + Add to cart */}
                <div className="flex items-center justify-between mt-3">
                    <p className="text-xl font-bold text-[#e60012]">
                        ${listing.price.toLocaleString("es-AR")}
                    </p>
                    {showAddButton && (
                        <button
                            onClick={handleAddToCart}
                            className={`w-8 h-8 flex items-center justify-center rounded-full transition shadow-sm ${cartPop ? "mp-cart-pop" : ""} ${
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
