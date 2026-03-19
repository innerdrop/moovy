// Home Page - Página de Inicio (Nueva Landing v2)
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "MOOVY — Todo Ushuaia en tu puerta",
  description:
    "Pedí de comercios locales, comprá en el marketplace y recibí en minutos. Delivery en Ushuaia.",
};

import Link from "next/link";
import { ArrowRight, Store } from "lucide-react";
import { prisma } from "@/lib/prisma";
import HeroStatic from "@/components/home/HeroStatic";
import HeroSliderNew from "@/components/home/HeroSliderNew";
import SocialProofBar from "@/components/home/SocialProofBar";
// HowItWorks removed — replaced by banner slot
import CategoryGrid from "@/components/home/CategoryGrid";
import TrustBar from "@/components/home/TrustBar";
import SupplySideCTA from "@/components/home/SupplySideCTA";
import MerchantCard from "@/components/store/MerchantCard";
import ListingCard from "@/components/store/ListingCard";
import Footer from "@/components/layout/Footer";
import HomeProductCard from "@/components/home/HomeProductCard";
import PromoBanner from "@/components/home/PromoBanner";
import AnimateIn from "@/components/ui/AnimateIn";

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
      where: { isActive: true, scope: { in: ["STORE", "BOTH"] } },
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

async function getOpenMerchantCount() {
  try {
    return await prisma.merchant.count({
      where: { isActive: true, isOpen: true },
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

async function getHeroConfig() {
  try {
    const configs = await prisma.moovyConfig.findMany({
      where: { key: { startsWith: "hero_" } },
    });
    const result: Record<string, string> = {};
    for (const c of configs) result[c.key] = c.value;
    return Object.keys(result).length > 0 ? result : undefined;
  } catch {
    return undefined;
  }
}

async function LiveStoreView() {
  const settings = await prisma.storeSettings
    .findUnique({ where: { id: "settings" } })
    .catch(() => null);

  const [
    categories,
    merchants,
    featuredProducts,
    recentListings,
    slides,
    totalDelivered,
    activeMerchants,
    openMerchants,
    heroConfig,
  ] = await Promise.all([
    getCategories(settings?.maxCategoriesHome ?? 8),
    getMerchants(),
    getFeaturedProducts(),
    getRecentListings(),
    getHeroSlides(),
    getTotalDelivered(),
    getActiveMerchantCount(),
    getOpenMerchantCount(),
    getHeroConfig(),
  ]);

  const slideInterval = settings?.heroSliderInterval ?? 5000;
  const sliderEnabled = (settings as any)?.heroSliderEnabled ?? true;

  // Banner /Tienda settings
  const bannerEnabled = (settings as any)?.promoBannerEnabled ?? false;
  const bannerProps = bannerEnabled ? {
    enabled: true,
    title: (settings as any)?.promoBannerTitle || undefined,
    subtitle: (settings as any)?.promoBannerSubtitle || undefined,
    buttonText: (settings as any)?.promoBannerButtonText || undefined,
    buttonLink: (settings as any)?.promoBannerButtonLink || undefined,
    image: (settings as any)?.promoBannerImage || null,
  } : null;

  return (
    <div>
      {/* 1. Hero Estático con buscador — config dinámica desde OPS */}
      <HeroStatic
        totalDelivered={totalDelivered}
        config={heroConfig as any}
        activeMerchants={activeMerchants}
      />

      {/* 2. Categorías — sin título, protagonistas (no reveal — above the fold) */}
      <section className="relative py-5 bg-white">
        <CategoryGrid categories={categories} />
      </section>

      {/* 4. Banner Publicitario OPS (posición premium — monetizable) */}
      {sliderEnabled && slides.length > 0 && (
        <HeroSliderNew slides={slides} slideInterval={slideInterval} />
      )}

      {/* 5. Banner Promocional configurable desde OPS */}
      {bannerProps && <PromoBanner {...bannerProps} />}

      {/* 6. Comercios en Ushuaia */}
      <AnimateIn animation="reveal">
      <section className="py-6 lg:py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl lg:text-2xl font-black text-gray-900">
              Comercios en Ushuaia
            </h2>
            <Link
              href="/tiendas"
              className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {merchants.length > 0 ? (
            <>
              {/* Mobile: horizontal scroll like mockup */}
              <div
                className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 pl-4 pr-4 lg:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {merchants.map((merchant) => (
                  <div
                    key={merchant.id}
                    className="flex-shrink-0 w-[260px] snap-start"
                  >
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
              <p className="font-semibold text-gray-600">
                Estamos sumando comercios cada día
              </p>
              <p className="text-sm mt-1">Pronto vas a encontrar tu favorito</p>
              <Link
                href="/comercio/registro"
                className="inline-block mt-4 text-sm font-semibold text-[#e60012] hover:underline"
              >
                ¿Tenés un comercio? Sumate a MOOVY &rarr;
              </Link>
            </div>
          )}
        </div>
      </section>
      </AnimateIn>

      {/* 7. Productos — Lo más pedido */}
      <AnimateIn animation="reveal" delay={100}>
      <section className="py-8 lg:py-10 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4">
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
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

      {/* 8. Marketplace */}
      {recentListings.length > 0 && (
        <AnimateIn animation="reveal-scale">
        <section className="py-8 lg:py-10 bg-gray-50 border-t border-gray-100">
          <div className="container mx-auto px-4">
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
                        <img src={listing.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{listing.title}</p>
                        <p className="text-xs font-bold text-purple-200">${listing.price.toLocaleString("es-AR")}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-4">
              {recentListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </div>
        </section>
        </AnimateIn>
      )}

      {/* 9. Trust Bar */}
      <AnimateIn animation="reveal" delay={50}>
        <TrustBar />
      </AnimateIn>

      {/* 10. Supply Side CTAs */}
      <AnimateIn animation="reveal-scale" delay={100}>
        <SupplySideCTA />
      </AnimateIn>

      {/* Footer */}
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
