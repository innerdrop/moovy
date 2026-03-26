"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Store, Search } from "lucide-react";
import MerchantCard from "@/components/store/MerchantCard";
import ProductCard from "@/components/store/ProductCard";
import ListingCard from "@/components/store/ListingCard";
import { useFavoritesStore } from "@/store/favorites";

type TabType = "merchants" | "products" | "listings";

interface FavoritesData {
    merchants: any[];
    products: any[];
    listings: any[];
}

export default function FavoritosPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<TabType>("merchants");
    const [data, setData] = useState<FavoritesData>({ merchants: [], products: [], listings: [] });
    const [loading, setLoading] = useState(true);
    const { loadFavorites } = useFavoritesStore();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
            return;
        }
        if (status === "authenticated") {
            fetchFavorites();
        }
    }, [status]);

    const fetchFavorites = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/favorites");
            if (res.ok) {
                const json = await res.json();
                setData({
                    merchants: json.merchants || [],
                    products: json.products || [],
                    listings: json.listings || [],
                });
            }
        } catch {
            // Silent fail
        } finally {
            setLoading(false);
        }
        // Also sync store
        loadFavorites();
    };

    const tabs: { key: TabType; label: string; count: number }[] = [
        { key: "merchants", label: "Comercios", count: data.merchants.length },
        { key: "products", label: "Productos", count: data.products.length },
        { key: "listings", label: "Marketplace", count: data.listings.length },
    ];

    const totalFavorites = data.merchants.length + data.products.length + data.listings.length;

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-white border-b border-gray-100 px-4 lg:px-6 xl:px-8 py-4 lg:py-6 sticky top-0 z-10">
                <div className="max-w-md mx-auto lg:max-w-7xl flex items-center gap-3">
                    <Link href="/mi-perfil" className="p-2 -ml-2 rounded-full hover:bg-gray-100">
                        <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="font-bold text-lg text-gray-900">Favoritos</h1>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-100 sticky top-[60px] lg:top-[76px] z-10">
                <div className="max-w-md mx-auto lg:max-w-7xl flex px-4 lg:px-6 xl:px-8">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 py-3 text-sm font-medium text-center transition-colors relative ${
                                activeTab === tab.key
                                    ? "text-[#e60012]"
                                    : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
                                    activeTab === tab.key
                                        ? "bg-red-50 text-[#e60012]"
                                        : "bg-gray-100 text-gray-500"
                                }`}>
                                    {tab.count}
                                </span>
                            )}
                            {activeTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#e60012]" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-md mx-auto lg:max-w-7xl px-4 lg:px-6 xl:px-8 py-4 lg:py-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-[#e60012] rounded-full animate-spin" />
                        <p className="text-gray-400 text-sm mt-3">Cargando favoritos...</p>
                    </div>
                ) : totalFavorites === 0 ? (
                    /* Empty state global */
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart className="w-10 h-10 text-pink-400" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Todavia no tenes favoritos</h2>
                        <p className="text-gray-500 mb-8">
                            Toca el corazon en los productos y comercios que te gusten para guardarlos aca.
                        </p>
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 bg-[#e60012] text-white px-6 py-3 rounded-xl font-medium hover:bg-red-700 transition"
                        >
                            <Search className="w-4 h-4" />
                            Explorar
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Merchants Tab */}
                        {activeTab === "merchants" && (
                            data.merchants.length > 0 ? (
                                <div className="space-y-4">
                                    {data.merchants.map((m: any) => (
                                        <MerchantCard key={m.id} merchant={m} />
                                    ))}
                                </div>
                            ) : (
                                <EmptyTab label="comercios" />
                            )
                        )}

                        {/* Products Tab */}
                        {activeTab === "products" && (
                            data.products.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                                    {data.products.map((p: any) => (
                                        <ProductCard
                                            key={p.id}
                                            product={{
                                                id: p.id,
                                                slug: p.slug,
                                                name: p.name,
                                                price: p.price,
                                                description: null,
                                                image: p.images?.[0]?.url || null,
                                                isFeatured: p.isFeatured,
                                                merchantId: p.merchantId,
                                                merchant: p.merchant,
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyTab label="productos" />
                            )
                        )}

                        {/* Listings Tab */}
                        {activeTab === "listings" && (
                            data.listings.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                                    {data.listings.map((l: any) => (
                                        <ListingCard
                                            key={l.id}
                                            listing={{
                                                id: l.id,
                                                title: l.title,
                                                price: l.price,
                                                condition: l.condition,
                                                images: l.images || [],
                                                sellerId: l.sellerId,
                                                seller: l.seller || { displayName: null, rating: null, avatar: null },
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <EmptyTab label="publicaciones" />
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

function EmptyTab({ label }: { label: string }) {
    return (
        <div className="text-center py-12">
            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-300" />
            </div>
            <p className="text-gray-500 text-sm">
                No tenes {label} en favoritos
            </p>
        </div>
    );
}
