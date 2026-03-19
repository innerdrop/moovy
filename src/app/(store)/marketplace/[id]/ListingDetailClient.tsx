"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Star,
    Tag,
    ShoppingCart,
    Share2,
    ShieldCheck,
    Plus,
    Check,
    ChevronLeft,
    ChevronRight,
    Heart,
    Package,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import HeartButton from "@/components/ui/HeartButton";
import ListingCard from "@/components/store/ListingCard";

interface ListingImage {
    url: string;
    order: number;
}

interface SellerInfo {
    id: string;
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    rating: number | null;
    totalSales: number;
    isVerified?: boolean;
    createdAt?: string;
}

interface ListingDetail {
    id: string;
    title: string;
    description: string | null;
    price: number;
    stock: number;
    condition: string;
    sellerId: string;
    images: ListingImage[];
    seller: SellerInfo;
    category: { id: string; name: string; slug: string } | null;
}

interface RelatedListing {
    id: string;
    title: string;
    price: number;
    condition: string;
    images: ListingImage[];
    seller: {
        id: string;
        displayName: string | null;
        rating: number | null;
        avatar: string | null;
    };
    category?: { name: string } | null;
}

interface Props {
    listing: ListingDetail;
    relatedListings: RelatedListing[];
    appUrl: string;
}

const conditionConfig: Record<string, { text: string; cssClass: string }> = {
    NUEVO: { text: "Nuevo", cssClass: "mp-badge-nuevo" },
    USADO: { text: "Usado", cssClass: "mp-badge-usado" },
    REACONDICIONADO: { text: "Reacondicionado", cssClass: "mp-badge-reacondicionado" },
};

export default function ListingDetailClient({ listing, relatedListings, appUrl }: Props) {
    const addItem = useCartStore((s) => s.addItem);
    const [added, setAdded] = useState(false);
    const [currentImg, setCurrentImg] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const galleryRef = useRef<HTMLDivElement>(null);

    const cond = conditionConfig[listing.condition] || { text: listing.condition, cssClass: "mp-badge-usado" };
    const sellerName = listing.seller.displayName || "Vendedor";
    const isLowStock = listing.stock > 0 && listing.stock <= 3;
    const memberSince = listing.seller.createdAt
        ? new Date(listing.seller.createdAt).toLocaleDateString("es-AR", { month: "long", year: "numeric" })
        : null;

    function handleAddToCart() {
        addItem({
            productId: listing.id,
            name: listing.title,
            price: listing.price,
            quantity: 1,
            image: listing.images?.[0]?.url || undefined,
            sellerId: listing.sellerId,
            sellerName: listing.seller?.displayName || undefined,
            type: "listing",
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    function handleShare() {
        const text = `${listing.title} — $${listing.price.toLocaleString("es-AR")}`;
        const url = `${appUrl}/marketplace/${listing.id}`;

        if (navigator.share) {
            navigator.share({ title: listing.title, text, url }).catch(() => {});
        } else {
            window.open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, "_blank");
        }
    }

    // Swipe handlers
    function onTouchStart(e: React.TouchEvent) {
        setTouchStart(e.touches[0].clientX);
    }
    function onTouchEnd(e: React.TouchEvent) {
        const diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentImg < listing.images.length - 1) setCurrentImg(currentImg + 1);
            if (diff < 0 && currentImg > 0) setCurrentImg(currentImg - 1);
        }
    }

    return (
        <div className="mp-page min-h-screen">
            <div className="mx-auto max-w-5xl px-4 py-4 lg:py-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-purple-400 mb-4">
                    <Link href="/marketplace" className="hover:text-[#7C3AED] transition flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Marketplace
                    </Link>
                    {listing.category && (
                        <>
                            <span className="text-purple-300">/</span>
                            <Link href={`/marketplace?categoryId=${listing.category.id}`} className="hover:text-[#7C3AED] transition">
                                {listing.category.name}
                            </Link>
                        </>
                    )}
                    <span className="text-purple-300">/</span>
                    <span className="text-gray-500 truncate max-w-[200px]">{listing.title}</span>
                </div>

                <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">
                    {/* ═══════ GALLERY ═══════ */}
                    <div className="space-y-2.5">
                        {/* Main Image with swipe */}
                        <div
                            ref={galleryRef}
                            className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-purple-50 to-violet-50"
                            onTouchStart={onTouchStart}
                            onTouchEnd={onTouchEnd}
                        >
                            {listing.images.length > 0 ? (
                                <img
                                    src={listing.images[currentImg]?.url}
                                    alt={listing.title}
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Tag className="w-20 h-20 text-purple-200" />
                                </div>
                            )}

                            {/* Badges sobre la imagen */}
                            <span className={`absolute top-3 left-3 ${cond.cssClass}`}>
                                {cond.text}
                            </span>
                            <HeartButton type="listing" itemId={listing.id} className="absolute top-3 right-3" />

                            {/* Navigation arrows */}
                            {listing.images.length > 1 && (
                                <>
                                    {currentImg > 0 && (
                                        <button
                                            onClick={() => setCurrentImg(currentImg - 1)}
                                            className="absolute left-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition hover:bg-white active:scale-90"
                                        >
                                            <ChevronLeft className="h-4 w-4 text-gray-700" />
                                        </button>
                                    )}
                                    {currentImg < listing.images.length - 1 && (
                                        <button
                                            onClick={() => setCurrentImg(currentImg + 1)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition hover:bg-white active:scale-90"
                                        >
                                            <ChevronRight className="h-4 w-4 text-gray-700" />
                                        </button>
                                    )}
                                    {/* Dot indicators */}
                                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                                        {listing.images.map((_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentImg(i)}
                                                className={`h-1.5 rounded-full transition-all duration-200 ${
                                                    i === currentImg ? "w-5 bg-[#7C3AED]" : "w-1.5 bg-white/60"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {listing.images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                {listing.images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentImg(i)}
                                        className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                                            i === currentImg
                                                ? "border-[#7C3AED] ring-2 ring-purple-200 shadow-md"
                                                : "border-purple-100 opacity-60 hover:opacity-100"
                                        }`}
                                    >
                                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ═══════ DETAILS ═══════ */}
                    <div className="flex flex-col gap-4">
                        {/* Category chip */}
                        {listing.category && (
                            <Link
                                href={`/marketplace?categoryId=${listing.category.id}`}
                                className="inline-flex w-fit items-center gap-1 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full hover:bg-purple-100 transition"
                            >
                                {listing.category.name}
                            </Link>
                        )}

                        {/* Title */}
                        <h1 className="text-xl lg:text-2xl font-extrabold text-gray-900 leading-tight">
                            {listing.title}
                        </h1>

                        {/* Price + Share */}
                        <div className="flex items-center justify-between">
                            <p className="mp-gradient-text text-3xl font-extrabold">
                                ${listing.price.toLocaleString("es-AR")}
                            </p>
                            <button
                                onClick={handleShare}
                                className="flex items-center gap-1.5 rounded-xl border border-purple-200/50 px-3 py-1.5 text-xs font-medium text-purple-500 transition hover:bg-purple-50 active:scale-95"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                                Compartir
                            </button>
                        </div>

                        {/* Stock + condition row */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={cond.cssClass}>{cond.text}</span>
                            <span className="text-xs text-gray-500">
                                Stock: <strong className="text-gray-800">{listing.stock}</strong>
                            </span>
                            {isLowStock && (
                                <span className="flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                                    <AlertTriangle className="w-3 h-3" />
                                    Últimas unidades
                                </span>
                            )}
                        </div>

                        {/* Add to Cart button */}
                        <button
                            onClick={handleAddToCart}
                            disabled={listing.stock === 0}
                            className={`w-full rounded-2xl py-3.5 text-sm font-bold transition-all duration-200 shadow-lg active:scale-[0.98] ${
                                added
                                    ? "bg-green-500 text-white shadow-green-300/30"
                                    : listing.stock === 0
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                                        : "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-purple-500/25 hover:shadow-purple-500/40"
                            }`}
                        >
                            {added ? (
                                <span className="flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Agregado al carrito</span>
                            ) : listing.stock === 0 ? (
                                "Sin stock"
                            ) : (
                                <span className="flex items-center justify-center gap-2"><ShoppingCart className="w-5 h-5" /> Agregar al carrito</span>
                            )}
                        </button>

                        {/* Trust signals */}
                        <div className="flex items-center gap-4 text-[11px] text-gray-400">
                            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Compra protegida</span>
                            <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-purple-400" /> Envío en Ushuaia</span>
                        </div>

                        {/* Description */}
                        {listing.description && (
                            <div className="rounded-2xl border border-purple-100/50 bg-white/70 p-4">
                                <h2 className="font-bold text-gray-800 text-sm mb-2">Descripción</h2>
                                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                    {listing.description}
                                </p>
                            </div>
                        )}

                        {/* Seller Card */}
                        <Link
                            href={`/marketplace/vendedor/${listing.seller.id}`}
                            className="mp-glass rounded-2xl p-4 border border-purple-100/60 transition hover:border-purple-200 hover:shadow-md hover:shadow-purple-500/5 group"
                        >
                            <div className="flex items-center gap-3">
                                {listing.seller.avatar ? (
                                    <img
                                        src={listing.seller.avatar}
                                        alt=""
                                        className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-100"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                                        <span className="text-lg font-bold text-purple-600">
                                            {sellerName.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-[#7C3AED] transition">
                                            {sellerName}
                                        </p>
                                        {listing.seller.isVerified && (
                                            <ShieldCheck className="w-4 h-4 text-violet-600 flex-shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                        {listing.seller.rating && (
                                            <span className="flex items-center gap-0.5 text-amber-600">
                                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                {listing.seller.rating.toFixed(1)}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-0.5">
                                            <ShoppingCart className="w-3 h-3" />
                                            {listing.seller.totalSales} ventas
                                        </span>
                                        {memberSince && (
                                            <span className="hidden sm:flex items-center gap-0.5">
                                                <Clock className="w-3 h-3" />
                                                {memberSince}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-purple-300 group-hover:text-[#7C3AED] transition flex-shrink-0" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* ═══════ MÁS DE ESTE VENDEDOR ═══════ */}
                {relatedListings.length > 0 && (
                    <section className="mt-10 mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-extrabold text-gray-800 flex items-center gap-2">
                                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100">
                                    <Package className="h-3 w-3 text-[#7C3AED]" />
                                </span>
                                Más de {sellerName}
                            </h2>
                            <Link
                                href={`/marketplace/vendedor/${listing.seller.id}`}
                                className="text-xs font-semibold text-[#7C3AED] flex items-center gap-1 hover:gap-2 transition-all"
                            >
                                Ver todo <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4">
                            {relatedListings.map((item, i) => (
                                <div key={item.id} className={`mp-stagger mp-stagger-${i + 1}`}>
                                    <ListingCard listing={item} showAddButton variant="marketplace" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
