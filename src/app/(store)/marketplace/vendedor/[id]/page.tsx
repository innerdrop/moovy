import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Metadata } from "next";
import Link from "next/link";
import { Star, Package, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
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

    // Flatten availability into each listing's seller field
    const { user, listings, ...sellerRest } = seller;
    const availability = user?.sellerAvailability || null;

    const flatListings = listings.map((listing: any) => ({
        ...listing,
        seller: {
            id: sellerRest.id,
            displayName: sellerRest.displayName,
            rating: sellerRest.rating,
            avatar: sellerRest.avatar,
            availability,
        },
    }));

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

    return (
        <div className="container mx-auto px-4 py-6 max-w-6xl">
            {/* Back */}
            <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7C3AED] transition mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver al Marketplace
            </Link>

            {/* Seller Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
                <div className="flex items-start gap-4 sm:gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        {seller.avatar ? (
                            <img
                                src={seller.avatar}
                                alt={seller.displayName || "Vendedor"}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover"
                            />
                        ) : (
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 text-3xl font-bold">
                                {(seller.displayName || "V").charAt(0).toUpperCase()}
                            </div>
                        )}
                        {/* Online indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${isOnline ? "bg-green-500" : "bg-gray-400"}`} />
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                {seller.displayName || "Vendedor"}
                            </h1>
                            {seller.isVerified && (
                                <ShieldCheck className="w-5 h-5 text-blue-500" />
                            )}
                        </div>

                        {seller.bio && (
                            <p className="text-gray-500 text-sm mt-1 max-w-lg">{seller.bio}</p>
                        )}

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                            {seller.rating !== null && (
                                <div className="flex items-center gap-1 text-yellow-600">
                                    <Star className="w-4 h-4 fill-yellow-400" />
                                    <span className="font-semibold">{seller.rating.toFixed(1)}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-1 text-gray-500">
                                <Package className="w-4 h-4" />
                                <span>{seller.totalSales} ventas</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-4 h-4" />
                                <span>Miembro desde {memberSince}</span>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isOnline ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {isOnline ? "En linea" : "No disponible"}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Listings */}
            <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Publicaciones ({seller.listings.length})
                </h2>

                {seller.listings.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                        <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">
                            Este vendedor no tiene publicaciones activas
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
                        {seller.listings.map((listing: any) => (
                            <ListingCard key={listing.id} listing={listing} showAddButton />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
