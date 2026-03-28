"use client";

import { useState, useEffect, useCallback } from "react";
import { Gavel, Clock, Users, TrendingUp, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/store/toast";

interface AuctionBidPanelProps {
    listingId: string;
    startingPrice: number;
    currentBid: number | null;
    bidIncrement: number;
    auctionEndsAt: string;
    auctionStatus: string;
    totalBids: number;
    currentBidderId: string | null;
    auctionWinnerId: string | null;
    userId?: string; // Current user ID (null if not logged in)
    sellerUserId: string; // Seller's user ID
}

interface BidEntry {
    id: string;
    amount: number;
    createdAt: string;
    bidder: {
        id: string;
        displayName: string;
        avatar: string | null;
    };
}

function useCountdown(endsAt: string) {
    const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, expired: false });

    useEffect(() => {
        function update() {
            const diff = new Date(endsAt).getTime() - Date.now();
            if (diff <= 0) {
                setTimeLeft({ h: 0, m: 0, s: 0, expired: true });
                return;
            }
            setTimeLeft({
                h: Math.floor(diff / 3600000),
                m: Math.floor((diff % 3600000) / 60000),
                s: Math.floor((diff % 60000) / 1000),
                expired: false,
            });
        }
        update();
        const interval = setInterval(update, 1000);
        return () => clearInterval(interval);
    }, [endsAt]);

    return timeLeft;
}

export default function AuctionBidPanel({
    listingId,
    startingPrice,
    currentBid: initialCurrentBid,
    bidIncrement,
    auctionEndsAt: initialEndsAt,
    auctionStatus,
    totalBids: initialTotalBids,
    currentBidderId: initialBidderId,
    auctionWinnerId,
    userId,
    sellerUserId,
}: AuctionBidPanelProps) {
    const [currentBid, setCurrentBid] = useState(initialCurrentBid);
    const [totalBids, setTotalBids] = useState(initialTotalBids);
    const [currentBidderId, setCurrentBidderId] = useState(initialBidderId);
    const [endsAt, setEndsAt] = useState(initialEndsAt);
    const [bidAmount, setBidAmount] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [bids, setBids] = useState<BidEntry[]>([]);
    const [loadingBids, setLoadingBids] = useState(false);

    const countdown = useCountdown(endsAt);
    const isActive = auctionStatus === "ACTIVE" && !countdown.expired;
    const isEnded = auctionStatus === "ENDED" || auctionStatus === "SOLD" || countdown.expired;
    const isWinner = userId && (auctionWinnerId === userId || (isEnded && currentBidderId === userId));
    const isSeller = userId === sellerUserId;
    const isHighestBidder = userId && currentBidderId === userId;

    const minBid = currentBid
        ? currentBid + bidIncrement
        : startingPrice;

    // Set default bid amount
    useEffect(() => {
        if (!bidAmount) {
            setBidAmount(String(minBid));
        }
    }, [minBid]);

    const quickBids = [
        minBid,
        minBid + bidIncrement,
        minBid + bidIncrement * 2,
    ];

    const fetchBids = useCallback(async () => {
        setLoadingBids(true);
        try {
            const res = await fetch(`/api/listings/${listingId}/bids`);
            const data = await res.json();
            if (data.bids) {
                setBids(data.bids);
                if (data.currentBid) setCurrentBid(data.currentBid);
                if (data.totalBids !== undefined) setTotalBids(data.totalBids);
                if (data.auctionEndsAt) setEndsAt(data.auctionEndsAt);
            }
        } catch {
            // Silent fail
        } finally {
            setLoadingBids(false);
        }
    }, [listingId]);

    // Poll for bid updates every 5 seconds when active
    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(fetchBids, 5000);
        return () => clearInterval(interval);
    }, [isActive, fetchBids]);

    async function handleBid() {
        if (!userId) {
            toast.error("Tenés que iniciar sesión para ofertar");
            return;
        }

        const amount = parseFloat(bidAmount);
        if (isNaN(amount) || amount < minBid) {
            toast.error(`La oferta mínima es $${minBid.toLocaleString("es-AR")}`);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(`/api/listings/${listingId}/bid`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "¡Oferta registrada!");
                setCurrentBid(data.currentBid);
                setCurrentBidderId(userId);
                setTotalBids((prev) => prev + 1);
                if (data.newEndsAt) setEndsAt(data.newEndsAt);
                setBidAmount("");
                // Refresh bid list
                if (showHistory) fetchBids();
            } else {
                toast.error(data.error || "Error al ofertar");
            }
        } catch {
            toast.error("Error de conexión");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="bg-white rounded-2xl border border-violet-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-violet-600 to-purple-700 px-5 py-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                    <Gavel className="w-5 h-5" />
                    <h3 className="font-bold text-lg">Subasta</h3>
                </div>

                {/* Countdown */}
                {isActive ? (
                    <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-violet-200" />
                        <div className="flex gap-2">
                            {[
                                { val: countdown.h, label: "h" },
                                { val: countdown.m, label: "m" },
                                { val: countdown.s, label: "s" },
                            ].map((unit) => (
                                <div key={unit.label} className="bg-white/20 rounded-lg px-2.5 py-1 text-center min-w-[3rem]">
                                    <span className="text-xl font-black">{String(unit.val).padStart(2, "0")}</span>
                                    <span className="text-xs ml-0.5 text-violet-200">{unit.label}</span>
                                </div>
                            ))}
                        </div>
                        {countdown.m === 0 && countdown.h === 0 && (
                            <span className="text-xs text-red-300 font-bold animate-pulse ml-auto">
                                Últimos segundos
                            </span>
                        )}
                    </div>
                ) : (
                    <p className="text-violet-200 text-sm font-medium">
                        {auctionStatus === "NO_BIDS" ? "Finalizó sin ofertas" : "Subasta finalizada"}
                    </p>
                )}
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
                {/* Current price */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-gray-500 font-medium">
                            {currentBid ? "Oferta actual" : "Precio base"}
                        </p>
                        <p className="text-3xl font-black text-violet-700">
                            ${(currentBid || startingPrice).toLocaleString("es-AR")}
                        </p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                            <Users className="w-3.5 h-3.5" />
                            <span>{totalBids} oferta{totalBids !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500 text-xs mt-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Incremento: ${bidIncrement.toLocaleString("es-AR")}</span>
                        </div>
                    </div>
                </div>

                {/* Status messages */}
                {isHighestBidder && isActive && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-medium">
                        Tenés la oferta más alta. Si nadie te supera, ¡ganás!
                    </div>
                )}

                {isWinner && isEnded && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700 font-semibold">
                        ¡Ganaste la subasta! Completá el pago para recibir tu producto.
                    </div>
                )}

                {isSeller && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-blue-700">
                        Es tu subasta. No podés ofertar en tus propias publicaciones.
                    </div>
                )}

                {/* Bid input — only show if active and not seller */}
                {isActive && !isSeller && (
                    <div className="space-y-3">
                        {/* Quick bid buttons */}
                        <div className="grid grid-cols-3 gap-2">
                            {quickBids.map((amount) => (
                                <button
                                    key={amount}
                                    type="button"
                                    onClick={() => setBidAmount(String(amount))}
                                    className={`py-2 px-3 rounded-xl text-sm font-bold border-2 transition ${
                                        bidAmount === String(amount)
                                            ? "border-violet-500 bg-violet-50 text-violet-700"
                                            : "border-gray-200 text-gray-600 hover:border-violet-300"
                                    }`}
                                >
                                    ${amount.toLocaleString("es-AR")}
                                </button>
                            ))}
                        </div>

                        {/* Custom amount input */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                <input
                                    type="number"
                                    value={bidAmount}
                                    onChange={(e) => setBidAmount(e.target.value)}
                                    className="w-full pl-8 pr-4 py-3 border-2 border-gray-200 rounded-xl text-lg font-bold focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition"
                                    placeholder={String(minBid)}
                                    min={minBid}
                                    step={bidIncrement}
                                />
                            </div>
                            <button
                                onClick={handleBid}
                                disabled={submitting || isHighestBidder}
                                className="px-6 py-3 bg-violet-600 text-white font-bold rounded-xl hover:bg-violet-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-violet-200"
                            >
                                {submitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <Gavel className="w-5 h-5" />
                                )}
                                Ofertar
                            </button>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            Oferta mínima: ${minBid.toLocaleString("es-AR")}
                        </p>
                    </div>
                )}

                {/* Bid history toggle */}
                <button
                    onClick={() => {
                        setShowHistory(!showHistory);
                        if (!showHistory && bids.length === 0) fetchBids();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm text-violet-600 hover:text-violet-700 font-medium transition"
                >
                    {showHistory ? (
                        <>
                            <ChevronUp className="w-4 h-4" />
                            Ocultar historial
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4" />
                            Ver historial de ofertas ({totalBids})
                        </>
                    )}
                </button>

                {/* Bid list */}
                {showHistory && (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {loadingBids ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                            </div>
                        ) : bids.length === 0 ? (
                            <p className="text-center text-sm text-gray-400 py-4">
                                Todavía no hay ofertas. ¡Sé el primero!
                            </p>
                        ) : (
                            bids.map((bid, i) => (
                                <div
                                    key={bid.id}
                                    className={`flex items-center justify-between p-3 rounded-xl ${
                                        i === 0 ? "bg-violet-50 border border-violet-200" : "bg-gray-50"
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {bid.bidder.avatar ? (
                                            <img src={bid.bidder.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-violet-200 flex items-center justify-center">
                                                <span className="text-xs font-bold text-violet-700">
                                                    {bid.bidder.displayName.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {bid.bidder.displayName}
                                                {i === 0 && (
                                                    <span className="ml-1.5 text-[10px] bg-violet-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                                                        Líder
                                                    </span>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(bid.createdAt).toLocaleString("es-AR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className={`font-bold ${i === 0 ? "text-violet-700 text-lg" : "text-gray-700"}`}>
                                        ${bid.amount.toLocaleString("es-AR")}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
