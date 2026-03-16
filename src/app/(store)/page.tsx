// Home Page - Página de Inicio (Nueva Landing v2)
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
    title: "MOOVY — Todo Ushuaia en tu puerta",
    description: "Pedí de comercios locales, comprá en el marketplace y recibí en minutos. Delivery en Ushuaia.",
};

import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import HeroStatic from "@/components/home/HeroStatic";
import HeroSliderNew from "@/components/home/HeroSliderNew";
import SocialProofBar from "@/components/home/SocialProofBar";
import HowItWorks from "@/components/home/HowItWorks";
import TrustBar from "@/components/home/TrustBar";
import SupplySideCTA from "@/components/home/SupplySideCTA";
import MerchantCard from "@/components/store/MerchantCard";
import ListingCard from "@/components/store/ListingCard";
import Footer from "@/components/layout/Footer";
import HomeProductCard from "@/components/home/HomeProductCard";

// Configuration
const IS_MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";

// ============================================
// DATA FETCHING
// ============================================

async function getHeroSlides() {
    try {
        return await prisma.heroSlide.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        });
    } catch {
        return [];
    }
}

async function getCategories(limit: number = 8) {
    try {
        return await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            take: limit,
        });
    } catch {
        return [];
    }
}

async function getMerchants() {
    try {
        return await prisma.merchant.findMany({
            where: { isActive: true },
            take: 8,
            orderBy: [
                { isOpen: "desc" },
                { displayOrder: "desc" },
                { isPremium: "desc" },
                { name: "asc" },
            ],
        });
    } catch {
        return [];
    }
}

async function getFeaturedProducts() {
    try {
        return await prisma.product.findMany({
            where: {
                isActive: true,
                isFeatured: true,
                stock: { gt: 0 },
                merchant: { isOpen: true },
            },
            include: {
                categories: { include: { category: true } },
                images: true,
                merchant: { select: { id: true, name: true, isOpen: true, slug: true } },
            },
            take: 8,
        });
    } catch {
        return [];
    }
}

async function getRecentListings() {
    try {
        return await prisma.listing.findMany({
            where: { isActive: true },
            include: {
                seller: { select: { displayName: true, rating: true, avatar: true } },
                images: { orderBy: { order: "asc" }, take: 1 },
                category: { select: { id: true, name: true, slug: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 6,
        });
    } catch {
        return [];
    }
}

async function getTotalDelivered() {
    try {
        return await prisma.order.count({
            where: { status: "DELIVERED", deletedAt: null },
        });
    } catch {
        return 0;
    }
}

async function getActiveMerchantCount() {
    try {
        return await prisma.merchant.count({
            where: { isActive: true },
        });
    } catch {
        return 0;
    }
}

// ============================================
// MAINTENANCE VIEW
// ============================================

function MaintenanceView() {
    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-24 h-24 bg-[#e60012] rounded-full flex items-center justify-center mb-8 shadow-xl animate-pulse">
                <Store className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-4 tracking-tight">
                VOLVEMOS <span className="text-[#e60012]">PRONTO</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-lg mx-auto mb-10">
                Estamos actualizando nuestra plataforma para brindarte una mejor experiencia de compra.
            </p>
            <div className="w-16 h-1 bg-[#e60012] rounded-full opacity-50" />
            <p className="mt-8 text-sm text-gray-400 font-medium">
                Moovy &copy; {new Date().getFullYear()}
            </p>
        </div>
    );
}

// ============================================
// MAIN STORE VIEW
// ============================================

async function LiveStoreView() {
    const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } }).catch(() => null);

    const [categories, merchants, featuredProducts, recentListings, slides, totalDelivered, activeMerchants] =
        await Promise.all([
            getCategories(settings?.maxCategoriesHome ?? 8),
            getMerchants(),
            getFeaturedProducts(),
            getRecentListings(),
            getHeroSlides(),
            getTotalDelivered(),
            getActiveMerchantCount(),
        ]);

    const slideInterval = settings?.heroSliderInterval ?? 5000;
    const sliderEnabled = (settings as any)?.heroSliderEnabled ?? true;

    return (
        <div className="animate-fadeIn">

            {/* 1. Hero Estático con buscador */}
            <HeroStatic totalDelivered={totalDelivered} activeMerchants={activeMerchants} />

            {/* 2. Social Proof */}
            <SocialProofBar totalDelivered={totalDelivered} activeMerchants={activeMerchants} />

            {/* 3. Slider Promocional (solo si hay slides Y está habilitado desde OPS) */}
            {sliderEnabled && slides.length > 0 && (
                <HeroSliderNew slides={slides} slideInterval={slideInterval} />
            )}

            {/* 4. Cómo Funciona */}
            <HowItWorks />

            {/* 5. Categorías — con imágenes propias */}
            <section className="py-4 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-lg lg:text-2xl font-extrabold text-gray-900 mb-4">
                        ¿Qué querés pedir?
                    </h2>

                    <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap" style={{ scrollbarWidth: "none" }}>
                        {categories.map((cat) => (
                            <Link
                                key={cat.id}
                                href={`/productos?categoria=${cat.slug}`}
                                className="flex-shrink-0 snap-start group"
                            >
                                <div className="w-[72px] lg:w-20 flex flex-col items-center gap-2">
                                    <div className="w-14 h-14 lg:w-[60px] lg:h-[60px] rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-100 group-hover:border-[#e60012]/40 group-hover:shadow-lg transition-all duration-300 group-hover:scale-110">
                                        {cat.image ? (
                                            <img
                                                src={cat.image}
                                                alt={cat.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#e60012] to-[#ff4444] flex items-center justify-center">
                                                <Store className="w-6 h-6 text-white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[11px] font-semibold text-gray-600 group-hover:text-[#e60012] transition-colors text-center truncate w-full">
                                        {cat.name}
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Comercios en Ushuaia */}
            <section className="py-6 lg:py-8 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg lg:text-2xl font-extrabold text-gray-900">
                            Comercios en Ushuaia
                        </h2>
                        <Link href="/productos" className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {merchants.length > 0 ? (
                        <>
                            {/* Mobile: horizontal scroll like mockup */}
                            <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-4 px-4 lg:hidden" style={{ scrollbarWidth: "none" }}>
                                {merchants.map((merchant) => (
                                    <div key={merchant.id} className="flex-shrink-0 w-[260px] snap-start">
                                        <MerchantCard merchant={merchant} />
                                    </div>
                                ))}
                            </div>
                            {/* Desktop: grid */}
                            <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                                {merchants.map((merchant) => (
                                    <MerchantCard key={merchant.id} merchant={merchant} />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            <Store className="w-16 h-16 mx-auto mb-3 opacity-20" />
                            <p className="font-semibold text-gray-600">Estamos sumando comercios cada día</p>
                            <p className="text-sm mt-1">Pronto vas a encontrar tu favorito</p>
                            <Link href="/comercio/registro" className="inline-block mt-4 text-sm font-semibold text-[#e60012] hover:underline">
                                ¿Tenés un comercio? Sumate a MOOVY &rarr;
                            </Link>
                        </div>
                    )}
                </div>
            </section>

            {/* 7. Productos — Lo más pedido */}
            <section className="py-8 lg:py-10 bg-white border-t border-gray-100">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-lg lg:text-2xl font-extrabold text-gray-900">
                            Lo más pedido
                        </h2>
                        <Link href="/productos" className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1">
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {featuredProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                            {featuredProducts.map((product) => (
                                <HomeProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-400">
                            <p className="font-medium text-gray-600">Estamos preparando ofertas increíbles para vos</p>
                            <p className="text-sm mt-1">Volvé pronto</p>
                        </div>
                    )}
                </div>
            </section>

            {/* 8. Marketplace */}
            {recentListings.length > 0 && (
                <section className="py-8 lg:py-10 bg-gray-50 border-t border-gray-100">
                    <div className="container mx-auto px-4">
                        {/* Marketplace intro card — desktop: side layout */}
                        <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-100 rounded-2xl p-5 mb-6 lg:flex lg:items-center lg:justify-between lg:p-8">
                            <div className="lg:max-w-lg">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] flex items-center justify-center">
                                        <Store className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-extrabold text-gray-900">Marketplace</h2>
                                        <p className="text-xs font-semibold text-[#7C3AED]">Comprá y vendé entre vecinos</p>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 mb-3 lg:mb-4">
                                    Productos nuevos y usados de vendedores de Ushuaia. Publicar es gratis.
                                </p>
                                <Link
                                    href="/marketplace"
                                    className="inline-flex items-center gap-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                                >
                                    Explorar Marketplace
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                            <div className="hidden lg:flex w-48 h-28 bg-purple-100/60 rounded-2xl items-center justify-center">
                                <span className="text-purple-300 text-xs font-semibold">Ilustración</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-4">
                            {recentListings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* 9. Trust Bar */}
            <TrustBar />

            {/* 10. Supply Side CTAs */}
            <SupplySideCTA />

            {/* 11. Footer */}
            <Footer />
        </div>
    );
}

// ============================================
// PAGE EXPORT
// ============================================

export default function HomePage() {
    if (IS_MAINTENANCE_MODE) {
        return <MaintenanceView />;
    }
    return <LiveStoreView />;
}
