import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import { Star, Package, ArrowLeft, ShieldCheck, Clock, TrendingUp, Award } from "lucide-react";
import ListingCard from "@/components/store/ListingCard";

interface Props {
    params: Promise<{ id: string }>;
}

async function getSeller(id: string) {
    const seller = await prisma.sellerProfile.findUnique({
        where: { id },
        select: {
            id: true,
            displayName: true,
            bio: true,
            avatar: true,
            rating: true,
            totalSales: true,
            isVerified: true,
            createdAt: true,
            listings: {
                where: { isActive: true },
                include: {
                    images: { orderBy: { order: "asc" } },
                    category: { select: { id: true, name: true, slug: true } },
                    _count: { select: { orderItems: true, favorites: true } },
                },
                orderBy: { createdAt: "desc" },
            },
            user: {
                select: {
                    sellerAvailability: {
                        select: {
                            isOnline: true,
                            isPaused: true,
                            pauseEndsAt: true,
                            preparationMinutes: true,
                        },
                    },
                },
            },
        },
    });

    if (!seller) return null;

    // Flatten availability into each listing's seller field + add counts
    const { user, listings, ...sellerRest } = seller;
    const availability = user?.sellerAvailability || null;

    const flatListings = listings.map((listing: any) => {
        const { _count, ...listingRest } = listing;
        return {
            ...listingRest,
            seller: {
                id: sellerRest.id,
                displayName: sellerRest.displayName,
                rating: sellerRest.rating,
                avatar: sellerRest.avatar,
                isVerified: sellerRest.isVerified,
                availability,
            },
            soldCount: _count?.orderItems || 0,
            favCount: _count?.favorites || 0,
        };
    });

    return { ...sellerRest, availability, listings: flatListings };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const seller = await getSeller(id);
    if (!seller) return { title: "Vendedor no encontrado" };

    const name = seller.displayName || "Vendedor";
    return {
        title: `${name} — Marketplace MOOVY`,
        description: seller.bio || `Perfil de ${name} en el Marketplace de MOOVY. ${seller.totalSales} ventas realizadas.`,
        openGraph: {
            title: `${name} — Marketplace MOOVY`,
            description: seller.bio || `Perfil de ${name} en MOOVY`,
            ...(seller.avatar ? { images: [{ url: seller.avatar }] } : {}),
        },
    };
}

export default async function SellerProfilePage({ params }: Props) {
    const { id } = await params;
    const seller = await getSeller(id);

    if (!seller) notFound();

    const memberSince = new Date(seller.createdAt).toLocaleDateString("es-AR", {
        month: "long",
        year: "numeric",
    });

    const isOnline = seller.availability?.isOnline && !seller.availability?.isPaused;

    // Calculate trust metrics
    const totalFavs = seller.listings.reduce((sum: number, l: any) => sum + (l.favCount || 0), 0);

    return (
        <div className="mp-page min-h-screen">
            <div className="mx-auto max-w-6xl px-4 py-4 lg:py-6">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-xs text-purple-400 mb-4">
                    <Link href="/marketplace" className="hover:text-[#7C3AED] transition flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Marketplace
                    </Link>
                    <span className="text-purple-300">/</span>
                    <span className="text-gray-500">{seller.displayName || "Vendedor"}</span>
                </div>

                {/* ═══════ SELLER HERO CARD ═══════ */}
                <div className="mp-glass rounded-2xl border border-purple-100/60 p-5 sm:p-6 mb-6">
                    <div className="flex items-start gap-4 sm:gap-5">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                            {seller.avatar ? (
                                <img
                                    src={seller.avatar}
                                    alt={seller.displayName || "Vendedor"}
                                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-purple-100"
                                />
                            ) : (
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-purple-100 to-violet-200 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-purple-600">
                                        {(seller.displayName || "V").charAt(0).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            {/* Online indicator */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isOnline ? "bg-green-500 mp-pulse-dot" : "bg-gray-400"}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-lg sm:text-xl font-extrabold text-gray-900">
                                    {seller.displayName || "Vendedor"}
                                </h1>
                                {seller.isVerified && (
                                    <div className="flex items-center gap-1 bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">
                                        <ShieldCheck className="w-3.5 h-3.5" />
                                        <span className="text-[10px] font-bold">Verificado</span>
                                    </div>
                                )}
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${isOnline ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                                    {isOnline ? "En línea" : "No disponible"}
                                </span>
                            </div>

                            {seller.bio && (
                                <p className="text-gray-500 text-sm mt-1.5 max-w-lg leading-relaxed">{seller.bio}</p>
                            )}
                        </div>
                    </div>

                    {/* ═══════ STATS ROW ═══════ */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                        {seller.rating !== null && (
                            <div className="flex items-center gap-2.5 rounded-xl bg-white/60 border border-purple-50 px-3 py-2.5">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-extrabold text-gray-900">{seller.rating.toFixed(1)}</p>
                                    <p className="text-[10px] text-gray-400">Calificación</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-2.5 rounded-xl bg-white/60 border border-purple-50 px-3 py-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
                                <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-gray-900">{seller.totalSales}</p>
                                <p className="text-[10px] text-gray-400">Ventas</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 rounded-xl bg-white/60 border border-purple-50 px-3 py-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                                <Package className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-gray-900">{seller.listings.length}</p>
                                <p className="text-[10px] text-gray-400">Publicaciones</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5 rounded-xl bg-white/60 border border-purple-50 px-3 py-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                                <Clock className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-extrabold text-gray-900 capitalize">{memberSince}</p>
                                <p className="text-[10px] text-gray-400">Miembro desde</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════ LISTINGS ═══════ */}
                <div>
                    <h2 className="text-sm font-extrabold text-gray-800 mb-3 flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-100">
                            <Package className="h-3 w-3 text-[#7C3AED]" />
                        </span>
                        Publicaciones
                        <span className="text-xs font-medium text-purple-400">({seller.listings.length})</span>
                    </h2>

                    {seller.listings.length === 0 ? (
                        <div className="text-center py-16 mp-glass rounded-2xl border border-purple-100/60">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-50 mp-empty-float">
                                <Package className="w-8 h-8 text-purple-200" />
                            </div>
                            <p className="text-gray-500 font-medium text-sm">
                                Este vendedor no tiene publicaciones activas
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                            {seller.listings.map((listing: any, i: number) => (
                                <div key={listing.id} className={`mp-stagger mp-stagger-${(i % 12) + 1}`}>
                                    <ListingCard listing={listing} showAddButton variant="marketplace" />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
