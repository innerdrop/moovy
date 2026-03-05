import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Star, Tag, User, ShoppingCart, MessageCircle } from "lucide-react";

export default async function MarketplaceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
            seller: {
                select: {
                    id: true,
                    displayName: true,
                    bio: true,
                    avatar: true,
                    rating: true,
                    totalSales: true,
                },
            },
            images: { orderBy: { order: "asc" } },
            category: { select: { id: true, name: true, slug: true } },
        },
    });

    if (!listing || !listing.isActive) {
        notFound();
    }

    const conditionLabel: Record<string, { text: string; color: string }> = {
        NUEVO: { text: "Nuevo", color: "bg-green-100 text-green-700" },
        USADO: { text: "Usado", color: "bg-orange-100 text-orange-700" },
        REACONDICIONADO: { text: "Reacondicionado", color: "bg-blue-100 text-blue-700" },
    };

    const cond = conditionLabel[listing.condition] || {
        text: listing.condition,
        color: "bg-gray-100 text-gray-700",
    };

    return (
        <div className="container mx-auto px-4 py-6 max-w-4xl">
            {/* Back */}
            <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#e60012] transition mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                Volver al Marketplace
            </Link>

            <div className="grid lg:grid-cols-2 gap-8">
                {/* Image Gallery */}
                <div className="space-y-3">
                    {/* Main Image */}
                    <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
                        {listing.images?.[0]?.url ? (
                            <img
                                src={listing.images[0].url}
                                alt={listing.title}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <Tag className="w-20 h-20 text-gray-200" />
                            </div>
                        )}
                        <span
                            className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-sm ${cond.color}`}
                        >
                            {cond.text}
                        </span>
                    </div>

                    {/* Thumbnails */}
                    {listing.images.length > 1 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            {listing.images.map((img, i) => (
                                <div
                                    key={i}
                                    className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 border-gray-200"
                                >
                                    <img
                                        src={img.url}
                                        alt={`${listing.title} ${i + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                    {/* Category */}
                    {listing.category && (
                        <Link
                            href={`/marketplace?categoryId=${listing.category.id}`}
                            className="inline-block text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full hover:bg-gray-200 transition"
                        >
                            {listing.category.name}
                        </Link>
                    )}

                    {/* Title & Price */}
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                            {listing.title}
                        </h1>
                        <p className="text-3xl font-bold text-[#e60012]">
                            ${listing.price.toLocaleString("es-AR")}
                        </p>
                    </div>

                    {/* Stock */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            Stock: <strong className="text-gray-900">{listing.stock}</strong>
                        </span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cond.color}`}>
                            {cond.text}
                        </span>
                    </div>

                    {/* Description */}
                    {listing.description && (
                        <div>
                            <h2 className="font-bold text-gray-900 mb-2">Descripción</h2>
                            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                                {listing.description}
                            </p>
                        </div>
                    )}

                    {/* Seller Info Card */}
                    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            Vendedor
                        </h3>
                        <div className="flex items-center gap-4">
                            {listing.seller.avatar ? (
                                <img
                                    src={listing.seller.avatar}
                                    alt=""
                                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                                />
                            ) : (
                                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-white shadow-sm">
                                    <span className="text-xl font-bold text-emerald-700">
                                        {listing.seller.displayName?.charAt(0) || "V"}
                                    </span>
                                </div>
                            )}
                            <div>
                                <p className="font-bold text-gray-900">
                                    {listing.seller.displayName || "Vendedor"}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                    {listing.seller.rating && (
                                        <span className="flex items-center gap-1 text-amber-600">
                                            <Star className="w-4 h-4 fill-current" />
                                            {listing.seller.rating.toFixed(1)}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <ShoppingCart className="w-4 h-4" />
                                        {listing.seller.totalSales} ventas
                                    </span>
                                </div>
                                {listing.seller.bio && (
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                        {listing.seller.bio}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Contact Button */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <MessageCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                            <div>
                                <p className="font-bold text-amber-900 text-sm">
                                    ¿Te interesa este producto?
                                </p>
                                <p className="text-xs text-amber-700">
                                    La compra directa estará disponible próximamente. Por ahora, contactá al vendedor a través de la plataforma.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
