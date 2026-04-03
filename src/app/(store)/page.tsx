// Home Page - Página de Inicio (v3 — Contextual Hero + Discovery Rows + Map)
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "MOOVY — Todo Ushuaia en tu puerta",
  description:
    "Pedí de comercios locales, comprá en el marketplace y recibí en minutos. Delivery en Ushuaia.",
};

import Link from "next/link";
import { ArrowRight, Store, Sparkles, Star, TrendingUp, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import HeroBannerCarousel from "@/components/home/HeroBannerCarousel";
import SearchBarHero from "@/components/home/SearchBarHero";
import CategoryGrid from "@/components/home/CategoryGrid";
import TrustBar from "@/components/home/TrustBar";
import SupplySideCTA from "@/components/home/SupplySideCTA";
import ListingCard from "@/components/store/ListingCard";
import Footer from "@/components/layout/Footer";
import HomeProductCard from "@/components/home/HomeProductCard";
import PromoBanner from "@/components/home/PromoBanner";
import ContextualHero from "@/components/home/ContextualHero";
import MerchantDiscoveryRow from "@/components/home/MerchantDiscoveryRow";
import ExploraUshuaiaMap from "@/components/home/ExploraUshuaiaMap";
import AnimateIn from "@/components/ui/AnimateIn";

// Configuration
const IS_MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === "true";

// ============================================
// MERCHANT SELECT — shared fields for discovery
// ============================================

const MERCHANT_DISCOVERY_SELECT = {
  id: true,
  slug: true,
  name: true,
  description: true,
  image: true,
  category: true,
  isOpen: true,
  rating: true,
  deliveryTimeMin: true,
  deliveryTimeMax: true,
  deliveryFee: true,
  isPremium: true,
  latitude: true,
  longitude: true,
  createdAt: true,
} as const;

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

/** Home categories from curated HomeCategorySlot (admin-managed, independent of B2B packages) */
async function getHomeCategories(limit: number = 8) {
  try {
    const slots = await prisma.homeCategorySlot.findMany({
      where: { isActive: true },
      include: { category: true },
      orderBy: { order: "asc" },
      take: limit,
    });

    // Merge slot overrides with category data
    return slots.map((slot) => ({
      id: slot.category.id,
      name: slot.label || slot.category.name,
      slug: slot.category.slug,
      image: slot.image || slot.category.image,
      icon: slot.icon || slot.category.icon,
      description: slot.category.description,
      scope: slot.category.scope,
      order: slot.order,
      isActive: true,
    }));
  } catch {
    // Fallback: if HomeCategorySlot table doesn't exist yet, use legacy query
    try {
      return await prisma.category.findMany({
        where: { isActive: true, scope: { in: ["STORE", "BOTH"] } },
        orderBy: { order: "asc" },
        take: limit,
      });
    } catch {
      return [];
    }
  }
}

/** All active merchants for hero + discovery rows + map (single query, split client-side) */
async function getAllActiveMerchants() {
  try {
    return await prisma.merchant.findMany({
      where: { isActive: true },
      select: MERCHANT_DISCOVERY_SELECT,
      orderBy: [
        { isOpen: "desc" },
        { isPremium: "desc" },
        { rating: "desc" },
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
        merchant: {
          select: { id: true, name: true, isOpen: true, slug: true },
        },
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

/** Top merchants by order count (most popular) */
async function getMostOrderedMerchantIds(): Promise<string[]> {
  try {
    const results = await prisma.order.groupBy({
      by: ["merchantId"],
      where: {
        status: "DELIVERED",
        deletedAt: null,
        merchantId: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });
    return results
      .filter((r) => r.merchantId !== null)
      .map((r) => r.merchantId as string);
  } catch {
    return [];
  }
}

// ============================================
// DISCOVERY ROW HELPERS
// ============================================

function getOpenNow(merchants: any[]) {
  return merchants.filter((m) => m.isOpen).slice(0, 10);
}

function getNewMerchants(merchants: any[]) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return merchants
    .filter((m) => new Date(m.createdAt) > thirtyDaysAgo)
    .slice(0, 10);
}

function getBestRated(merchants: any[]) {
  return merchants
    .filter((m) => m.rating && m.rating >= 3.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 10);
}

function getMostOrdered(merchants: any[], topIds: string[]) {
  if (topIds.length === 0) return [];
  const idSet = new Set(topIds);
  // Preserve order from topIds (most orders first)
  const byId = new Map(merchants.map((m) => [m.id, m]));
  return topIds
    .filter((id) => byId.has(id))
    .map((id) => byId.get(id)!)
    .slice(0, 10);
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
        Estamos actualizando nuestra plataforma para brindarte una mejor
        experiencia de compra.
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

export default async function LiveStoreView() {
  const settings = await prisma.storeSettings
    .findUnique({ where: { id: "settings" } })
    .catch(() => null);

  const [
    categories,
    allMerchants,
    featuredProducts,
    recentListings,
    slides,
    topMerchantIds,
  ] = await Promise.all([
    getHomeCategories(settings?.maxCategoriesHome ?? 8),
    getAllActiveMerchants(),
    getFeaturedProducts(),
    getRecentListings(),
    getHeroSlides(),
    getMostOrderedMerchantIds(),
  ]);

  // Hero Banner OPS settings
  const slideInterval = settings?.heroSliderInterval ?? 5000;
  const sliderEnabled = (settings as any)?.heroSliderEnabled ?? true;
  const sliderShowArrows = (settings as any)?.heroSliderShowArrows ?? true;
  const hasOpsSlides = sliderEnabled && slides.length > 0;

  // Promo Banner settings
  const bannerEnabled = (settings as any)?.promoBannerEnabled ?? false;
  const bannerProps = bannerEnabled
    ? {
        enabled: true,
        title: (settings as any)?.promoBannerTitle || undefined,
        subtitle: (settings as any)?.promoBannerSubtitle || undefined,
        buttonText: (settings as any)?.promoBannerButtonText || undefined,
        buttonLink: (settings as any)?.promoBannerButtonLink || undefined,
        image: (settings as any)?.promoBannerImage || null,
        ctaPosition:
          (settings as any)?.promoBannerCtaPosition || "abajo-izquierda",
      }
    : null;

  // Build discovery rows from the single allMerchants query
  const openNow = getOpenNow(allMerchants);
  const newMerchants = getNewMerchants(allMerchants);
  const bestRated = getBestRated(allMerchants);
  const mostOrdered = getMostOrdered(allMerchants, topMerchantIds);

  return (
    <div>
      {/* ── 1. CONTEXTUAL HERO — changes by time of day ── */}
      <ContextualHero merchants={allMerchants as any} />

      {/* ── 2. SEARCH BAR ── */}
      <SearchBarHero />

      {/* ── 3. CATEGORÍAS — above the fold, no animation delay ── */}
      <section className="relative py-5 lg:py-8 bg-white">
        <CategoryGrid categories={categories} />
      </section>

      {/* ── 4. PROMO BANNER (OPS configurable) ── */}
      {bannerProps && <PromoBanner {...bannerProps} />}

      {/* ── 5. DISCOVERY ROWS (Concepto C — Netflix-style) ── */}

      {/* 5a. Abiertos ahora */}
      <AnimateIn animation="reveal">
        <MerchantDiscoveryRow
          title="Abiertos ahora"
          icon={<Clock className="w-4 h-4 text-green-600" />}
          merchants={openNow}
          viewAllHref="/tiendas?filter=abiertos"
          accentColor="bg-green-500"
        />
      </AnimateIn>

      {/* 5b. OPS Hero Banner — intercalado entre filas como publicidad */}
      {hasOpsSlides && (
        <div className="py-2 lg:py-4">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
            <div className="rounded-2xl overflow-hidden shadow-md">
              <HeroBannerCarousel
                slides={slides as any}
                slideInterval={slideInterval}
                showArrows={sliderShowArrows}
              />
            </div>
          </div>
        </div>
      )}

      {/* 5c. Nuevos en MOOVY */}
      <AnimateIn animation="reveal">
        <MerchantDiscoveryRow
          title="Nuevos en MOOVY"
          icon={<Sparkles className="w-4 h-4 text-purple-600" />}
          merchants={newMerchants}
          viewAllHref="/tiendas?filter=nuevos"
          accentColor="bg-purple-500"
        />
      </AnimateIn>

      {/* 5d. Los más pedidos */}
      <AnimateIn animation="reveal">
        <MerchantDiscoveryRow
          title="Los más pedidos"
          icon={<TrendingUp className="w-4 h-4 text-orange-600" />}
          merchants={mostOrdered}
          viewAllHref="/tiendas?filter=populares"
          accentColor="bg-orange-500"
        />
      </AnimateIn>

      {/* 5e. Mejor calificados */}
      <AnimateIn animation="reveal">
        <MerchantDiscoveryRow
          title="Mejor calificados"
          icon={<Star className="w-4 h-4 text-yellow-600" />}
          merchants={bestRated}
          viewAllHref="/tiendas?filter=mejor-calificados"
          accentColor="bg-yellow-500"
        />
      </AnimateIn>

      {/* ── 6. PRODUCTOS — Lo más pedido ── */}
      <AnimateIn animation="reveal" delay={100}>
        <section className="py-8 lg:py-12 xl:py-14 bg-white">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl lg:text-2xl font-black text-gray-900">
                Lo más pedido
              </h2>
              <Link
                href="/productos"
                className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {featuredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
                {featuredProducts.map((product) => (
                  <HomeProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="font-medium text-gray-600">
                  Estamos preparando ofertas increíbles para vos
                </p>
                <p className="text-sm mt-1">Volvé pronto</p>
              </div>
            )}
          </div>
        </section>
      </AnimateIn>

      {/* ── 7. EXPLORÁ USHUAIA — mapa interactivo ── */}
      <AnimateIn animation="reveal">
        <ExploraUshuaiaMap merchants={allMerchants as any} />
      </AnimateIn>

      {/* ── 8. MARKETPLACE ── */}
      {recentListings.length > 0 && (
        <AnimateIn animation="reveal-scale">
          <section className="py-8 lg:py-12 xl:py-14 bg-white">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
              {/* Marketplace hero banner — immersive gradient */}
              <div className="relative overflow-hidden rounded-3xl mb-6">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#4C1D95] via-[#7C3AED] to-[#8B5CF6]" />
                {/* Decorative orbs */}
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-purple-400/20 blur-2xl" />
                <div className="absolute -left-10 bottom-0 w-32 h-32 rounded-full bg-fuchsia-400/15 blur-2xl" />

                <div className="relative z-10 px-5 py-6 lg:px-10 lg:py-8 lg:flex lg:items-center lg:justify-between">
                  <div className="lg:max-w-md">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-white/70 uppercase tracking-widest mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Vendedores activos en Ushuaia
                    </span>
                    <h2 className="text-2xl lg:text-3xl font-black text-white mb-1.5 leading-tight">
                      Marketplace
                    </h2>
                    <p className="text-sm text-white/70 mb-4 leading-relaxed">
                      Comprá y vendé productos entre vecinos. Publicar es gratis.
                    </p>
                    <div className="flex items-center gap-3">
                      <Link
                        href="/marketplace"
                        className="inline-flex items-center gap-1.5 bg-white text-[#7C3AED] text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-white/90 transition shadow-lg shadow-black/10"
                      >
                        Explorar
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                      <Link
                        href="/vendedor/registro"
                        className="inline-flex items-center gap-1.5 bg-white/15 text-white text-sm font-semibold px-4 py-2.5 rounded-xl border border-white/20 hover:bg-white/25 transition"
                      >
                        Quiero vender
                      </Link>
                    </div>
                  </div>

                  {/* Right: mini preview cards stacked (desktop only) */}
                  <div className="hidden lg:flex flex-col gap-2 w-56">
                    {recentListings.slice(0, 2).map((listing) => (
                      <Link
                        key={listing.id}
                        href={`/marketplace/${listing.id}`}
                        className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10 hover:bg-white/20 transition"
                      >
                        {listing.images[0]?.url && (
                          <img
                            src={listing.images[0].url}
                            alt=""
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {listing.title}
                          </p>
                          <p className="text-xs font-bold text-purple-200">
                            ${listing.price.toLocaleString("es-AR")}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 lg:gap-4">
                {recentListings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            </div>
          </section>
        </AnimateIn>
      )}

      {/* ── 9. TRUST BAR ── */}
      <AnimateIn animation="reveal" delay={50}>
        <TrustBar />
      </AnimateIn>

      {/* ── 10. SUPPLY-SIDE CTAs ── */}
      <AnimateIn animation="reveal" delay={100}>
        <SupplySideCTA />
      </AnimateIn>

      {/* ── 11. FOOTER ── */}
      <Footer />
    </div>
  );
}