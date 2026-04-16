"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Tag,
    Plus,
    Loader2,
    Eye,
    EyeOff,
    Edit,
    AlertCircle,
    Star,
    Gavel,
    Clock,
    Users,
} from "lucide-react";

interface Listing {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock: number;
    condition: string;
    isActive: boolean;
    categoryId: string | null;
    createdAt: string;
    images: { url: string; order: number }[];
    category: { id: string; name: string; slug: string } | null;
    // Auction fields
    listingType?: string | null;
    auctionStatus?: string | null;
    auctionEndsAt?: string | null;
    startingPrice?: number | null;
    currentBid?: number | null;
    totalBids?: number | null;
    auctionWinnerId?: string | null;
}

const auctionStatusConfig: Record<string, { text: string; color: string }> = {
    ACTIVE: { text: "En curso", color: "bg-violet-100 text-violet-700" },
    ENDED: { text: "Finalizada", color: "bg-amber-100 text-amber-700" },
    SOLD: { text: "Vendida", color: "bg-green-100 text-green-700" },
    NO_BIDS: { text: "Sin ofertas", color: "bg-gray-100 text-gray-600" },
    CANCELLED: { text: "Cancelada", color: "bg-red-100 text-red-700" },
};

function AuctionCountdown({ endsAt }: { endsAt: string }) {
    const [timeLeft, setTimeLeft] = useState("");

    useEffect(() => {
        function update() {
            const diff = new Date(endsAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft("Finalizada");
                return;
            }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
        }
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [endsAt]);

    return <span className="text-xs text-violet-600 font-mono">{timeLeft}</span>;
}

const conditionBadge: Record<string, { text: string; color: string }> = {
    NUEVO: { text: "Nuevo", color: "bg-green-100 text-green-700" },
    USADO: { text: "Usado", color: "bg-orange-100 text-orange-700" },
    REACONDICIONADO: { text: "Reacondi.", color: "bg-blue-100 text-blue-700" },
};

export default function VendedorListingsPage() {
    const [listings, setListings] = useState<Listing[]>([]);
    const [loading, setLoading] = useState(true);
    const [togglingId, setTogglingId] = useState<string | null>(null);

    useEffect(() => {
        loadListings();
    }, []);

    async function loadListings() {
        try {
            const res = await fetch("/api/seller/listings");
            if (res.ok) {
                const data = await res.json();
                setListings(data);
            }
        } catch (error) {
            console.error("Error loading listings:", error);
        } finally {
            setLoading(false);
        }
    }

    async function toggleActive(id: string) {
        setTogglingId(id);
        try {
            const res = await fetch(`/api/seller/listings/${id}`, {
                method: "DELETE",
            });
            if (res.ok) {
                const data = await res.json();
                setListings((prev) =>
                    prev.map((l) =>
                        l.id === id ? { ...l, isActive: data.isActive } : l
                    )
                );
            }
        } catch (error) {
            console.error("Error toggling listing:", error);
        } finally {
            setTogglingId(null);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Tag className="w-6 h-6 text-emerald-600" />
                        Mis Listings
                    </h1>
                    <p className="text-gray-500">Gestioná tus publicaciones</p>
                </div>
                <Link
                    href="/vendedor/listings/nuevo"
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition shadow-sm text-sm font-semibold"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Listing
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-sm text-green-800">Activas</p>
                    <p className="text-2xl font-bold text-green-900">
                        {listings.filter((l) => l.isActive).length}
                    </p>
                </div>
                {/* ISSUE-002: Stat de subastas oculta para lanzamiento — reactivar en Fase 2
                <div className="bg-violet-50 rounded-xl p-4 border border-violet-200">
                    <p className="text-sm text-violet-800">Subastas</p>
                    <p className="text-2xl font-bold text-violet-900">
                        {listings.filter((l) => l.listingType === "AUCTION" && l.auctionStatus === "ACTIVE").length}
                    </p>
                </div>
                */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">Inactivas</p>
                    <p className="text-2xl font-bold text-gray-900">
                        {listings.filter((l) => !l.isActive).length}
                    </p>
                </div>
            </div>

            {/* Listings List */}
            {listings.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                    <Tag className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium text-lg">No tenés listings publicadas</p>
                    <Link
                        href="/vendedor/listings/nuevo"
                        className="mt-4 inline-block text-emerald-600 font-bold hover:underline"
                    >
                        Publicar la primera
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {listings.map((listing) => {
                        const cond = conditionBadge[listing.condition] || {
                            text: listing.condition,
                            color: "bg-gray-100 text-gray-700",
                        };
                        // ISSUE-002: Subastas ocultas para lanzamiento
                        const isAuction = false; // listing.listingType === "AUCTION" — reactivar en Fase 2
                        const auctionStatus = null;
                        const displayPrice = listing.price;

                        return (
                            <div
                                key={listing.id}
                                className={`bg-white rounded-2xl shadow-sm border p-4 transition-all ${listing.isActive
                                        ? isAuction && listing.auctionStatus === "ACTIVE" ? "border-violet-200" : "border-gray-100"
                                        : "border-gray-200 opacity-60"
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    {/* Thumbnail */}
                                    <div className="relative w-16 h-16 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {listing.images?.[0]?.url ? (
                                            <img
                                                src={listing.images[0].url}
                                                alt={listing.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Tag className="w-6 h-6 text-gray-300" />
                                        )}
                                        {isAuction && (
                                            <div className="absolute top-0 left-0 bg-violet-600 rounded-br-lg p-0.5">
                                                <Gavel className="w-3 h-3 text-white" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-gray-900 truncate">
                                            {listing.title}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`font-bold ${isAuction ? "text-violet-600" : "text-emerald-600"}`}>
                                                ${displayPrice.toLocaleString("es-AR")}
                                            </span>
                                            {isAuction && listing.currentBid && (
                                                <span className="text-[10px] text-violet-500 font-medium">
                                                    oferta actual
                                                </span>
                                            )}
                                            {isAuction && !listing.currentBid && (
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    precio base
                                                </span>
                                            )}
                                            {auctionStatus && (
                                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${auctionStatus.color}`}>
                                                    {auctionStatus.text}
                                                </span>
                                            )}
                                            {!isAuction && (
                                                <span
                                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${cond.color}`}
                                                >
                                                    {cond.text}
                                                </span>
                                            )}
                                            {listing.category && (
                                                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {listing.category.name}
                                                </span>
                                            )}
                                            {!isAuction && (
                                                <span className="text-[10px] text-gray-400">
                                                    Stock: {listing.stock}
                                                </span>
                                            )}
                                        </div>
                                        {/* Auction extra info row */}
                                        {isAuction && listing.auctionStatus === "ACTIVE" && listing.auctionEndsAt && (
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Clock className="w-3 h-3" />
                                                    <AuctionCountdown endsAt={listing.auctionEndsAt} />
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Users className="w-3 h-3" />
                                                    <span>{listing.totalBids || 0} oferta{(listing.totalBids || 0) !== 1 ? "s" : ""}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {(!isAuction || listing.auctionStatus !== "ACTIVE") && (
                                            <Link
                                                href={`/vendedor/listings/${listing.id}`}
                                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Link>
                                        )}
                                        {(!isAuction || listing.auctionStatus !== "ACTIVE") && (
                                            <button
                                                onClick={() => toggleActive(listing.id)}
                                                disabled={togglingId === listing.id}
                                                className={`p-2 rounded-lg transition ${listing.isActive
                                                        ? "text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                                                        : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                                    }`}
                                            >
                                                {togglingId === listing.id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : listing.isActive ? (
                                                    <EyeOff className="w-4 h-4" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
                                        {isAuction && listing.auctionStatus === "ACTIVE" && (
                                            <Link
                                                href={`/marketplace/${listing.id}`}
                                                className="px-3 py-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition"
                                            >
                                                Ver subasta
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
