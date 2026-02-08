// Tienda Page - Nuevo Diseño Estilo App
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import HeroSliderNew from "@/components/home/HeroSliderNew";
import CategoryGrid from "@/components/home/CategoryGrid";
import PromoBanner from "@/components/home/PromoBanner";
import SpecialOffers from "@/components/home/SpecialOffers";
import FavoritesCarousel from "@/components/home/FavoritesCarousel";

// Fetch functions
async function getCategories(limit: number = 10) {
    try {
        const categories = await prisma.category.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            take: limit,
        });
        return categories;
    } catch (error) {
        return [];
    }
}

async function getFeaturedMerchants() {
    try {
        const merchants = await prisma.merchant.findMany({
            where: { isActive: true },
            take: 8,
            orderBy: [
                { isOpen: 'desc' },
                { displayOrder: 'desc' },
                { isPremium: 'desc' },
                { name: 'asc' }
            ]
        });
        return merchants;
    } catch (error) {
        return [];
    }
}

async function getHeroSlides() {
    try {
        const slides = await prisma.heroSlide.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
        });
        return slides;
    } catch (error) {
        return [];
    }
}

async function getStoreSettings() {
    try {
        const settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
        });
        return settings;
    } catch (error) {
        return null;
    }
}

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

async function LiveStoreView() {
    const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } });
    const categories = await getCategories(settings?.maxCategoriesHome ?? 10);
    const merchants = await getFeaturedMerchants();
    const slides = await getHeroSlides();
    const slideInterval = (settings as any)?.heroSliderInterval ?? 5000;

    return (
        <div className="animate-fadeIn bg-white min-h-screen pb-24 md:pb-8 overflow-x-hidden">
            {/* Hero Slider */}
            <HeroSliderNew slides={slides} slideInterval={slideInterval} />

            {/* Categories Grid */}
            <CategoryGrid categories={categories} />

            {/* Promo Banner (Pizza & Pelis) */}
            <PromoBanner />

            {/* Special Offers */}
            <SpecialOffers />

            {/* Favorites of the Week */}
            <FavoritesCarousel merchants={merchants} />
        </div>
    );
}

export default async function TiendaPage() {
    const settings = await getStoreSettings();
    const isMaintenance = settings?.tiendaMaintenance ?? false;

    if (isMaintenance) {
        return <MaintenanceView />;
    }
    return <LiveStoreView />;
}
