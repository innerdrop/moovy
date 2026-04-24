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
import { ArrowRight, Store, Star, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import HeroBannerCarousel from "@/components/home/HeroBannerCarousel";
import TrustBar from "@/components/home/TrustBar";
import SupplySideCTA from "@/components/home/SupplySideCTA";
import ListingCard from "@/components/store/ListingCard";
import Footer from "@/components/layout/Footer";
import HomeProductCard from "@/components/home/HomeProductCard";
import PromoBanner from "@/components/home/PromoBanner";
import HomeFeed from "@/components/home/HomeFeed";
import MerchantDiscoveryRow from "@/components/home/MerchantDiscoveryRow";
import NewMerchantsRow from "@/components/home/NewMerchantsRow";
import CategoryGrid from "@/components/home/CategoryGrid";
import QuickAccessRow from "@/components/home/QuickAccessRow";
import ExploraUshuaiaMap from "@/components/home/ExploraUshuaiaMap";
import AnimateIn from "@/components/ui/AnimateIn";
import { checkMerchantSchedule } from "@/lib/merchant-schedule";

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
  scheduleJson: true,
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
      // Defense in depth: exigimos approvalStatus=APPROVED además de isActive
      // para que un merchant pendiente/rechazado nunca aparezca en la home.
      where: { isActive: true, approvalStatus: "APPROVED" },
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
  // Preserve order from topIds (most orders first)
  const byId = new Map(merchants.map((m) => [m.id, m]));
  return topIds
    .filter((id) => byId.has(id))
    .map((id) => byId.get(id)!)
    .slice(0, 10);
}

/**
 * ISSUE-036: regla de diversidad en filas de discovery.
 * Evita que el mismo merchant aparezca en 2+ secciones curadas (transmite
 * pobreza de oferta en launch week con pocos comercios).
 *
 * Prioridad: mostOrdered (señal más fuerte) → bestRated → newMerchants.
 * Cada fila excluye merchants ya tomados por filas anteriores.
 * Si una fila queda con <2 merchants, se oculta (devuelve []).
 * Si hay <3 merchants activos en total, se ocultan TODAS las filas curadas
 * (la fila principal "Abiertos ahora" sigue mostrando todo).
 */
function applyDiversityRule(
  enrichedMerchants: any[],
  topMerchantIds: string[]
): { mostOrdered: any[]; bestRated: any[]; newMerchants: any[] } {
  // Umbral de catálogo: <3 activos = launch-week mode, ocultar curadas
  if (enrichedMerchants.length < 3) {
    return { mostOrdered: [], bestRated: [], newMerchants: [] };
  }

  const taken = new Set<string>();

  // Pass 1: Los más pedidos (organic, scarcest signal)
  const rawMostOrdered = getMostOrdered(enrichedMerchants, topMerchantIds);
  const mostOrdered = rawMostOrdered.length >= 2 ? rawMostOrdered : [];
  mostOrdered.forEach((m) => taken.add(m.id));

  // Pass 2: Mejor calificados (excluyendo ya tomados)
  const rawBestRated = getBestRated(enrichedMerchants).filter(
    (m) => !taken.has(m.id)
  );
  const bestRated = rawBestRated.length >= 2 ? rawBestRated : [];
  bestRated.forEach((m) => taken.add(m.id));

  // Pass 3: Nuevos en MOOVY (excluyendo ya tomados)
  const rawNewMerchants = getNewMerchants(enrichedMerchants).filter(
    (m) => !taken.has(m.id)
  );
  const newMerchants = rawNewMerchants.length >= 2 ? rawNewMerchants : [];

  return { mostOrdered, bestRated, newMerchants };
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
  const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } }).catch(() => null);

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

  // Promo Banner settings (carousel mode with legacy fallback)
  const bannerEnabled = (settings as any)?.promoBannerEnabled ?? false;
  const promoSlides: import("@/components/home/PromoBanner").PromoSlide[] = (() => {
    if (!bannerEnabled) return [];
    // Try slides JSON first
    const slidesJson = (settings as any)?.promoSlidesJson;
    if (slidesJson) {
      try {
        const parsed = JSON.parse(slidesJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((s: any) => s.enabled !== false);
        }
      } catch {}
    }
    // Legacy fallback: single banner from individual fields
    const hasLegacy = (settings as any)?.promoBannerTitle || (settings as any)?.promoBannerImage;
    if (hasLegacy) {
      return [{
        id: "legacy",
        title: (settings as any)?.promoBannerTitle || "",
        subtitle: (settings as any)?.promoBannerSubtitle || "",
        buttonText: (settings as any)?.promoBannerButtonText || "",
        buttonLink: (settings as any)?.promoBannerButtonLink || "/",
        image: (settings as any)?.promoBannerImage || null,
        ctaPosition: (settings as any)?.promoBannerCtaPosition || "abajo-izquierda",
        enabled: true,
      }];
    }
    return [];
  })();

  // Enrich merchants with real-time schedule status
  // Combina pausa manual (isOpen) + horario configurado/default
  const enrichedMerchants = allMerchants.map((m) => {
    const scheduleResult = checkMerchantSchedule({
      isOpen: m.isOpen,
      scheduleJson: m.scheduleJson,
    });
    return {
      ...m,
      // Override isOpen with combined check (pausa + horario)
      isOpen: scheduleResult.isCurrentlyOpen,
      isPaused: !m.isOpen, // pausa manual original
      nextOpenTime: scheduleResult.nextOpenTime,
      nextOpenDay: scheduleResult.nextOpenDay,
    };
  });

  // ISSUE-036: regla de diversidad — merchants disjuntos entre filas curadas,
  // ocultar filas con <2 merchants, ocultar todo si hay <3 activos en total.
  const { mostOrdered, bestRated, newMerchants } = applyDiversityRule(
    enrichedMerchants,
    topMerchantIds
  );

  return (
    <div>
      {/* ── 1. HERO (red) + ABIERTOS AHORA (filterable by category pills) ── */}
      <HomeFeed
        merchants={enrichedMerchants as any}
        categories={categories as any}
      />

      {/* ── 1b. ACCESOS RÁPIDOS — Favoritos + Puntos MOOVER (ISSUE-012) ── */}
      <AnimateIn animation="reveal">
        <QuickAccessRow />
      </AnimateIn>

      {/* ── 2b. CATEGORÍAS DE PRODUCTOS ── */}
      <AnimateIn animation="reveal">
        <section className="py-5 lg:py-7 bg-white">
          <CategoryGrid categories={categories as any} />
        </section>
      </AnimateIn>

      {/* ── 4. PROMO BANNER CAROUSEL (OPS configurable) ── */}
      {promoSlides.length > 0 && <PromoBanner slides={promoSlides} interval={5000} />}

      {/* 3b. Nuevos en MOOVY — círculos con logo + borde animado */}
      {/* ISSUE-036: oculto si <2 o si ya aparecen en otra fila curada */}
      {newMerchants.length > 0 && (
        <AnimateIn animation="reveal">
          <NewMerchantsRow merchants={newMerchants as any} />
        </AnimateIn>
      )}

      {/* ── 5. OPS Hero Banner — intercalado entre filas de discovery ── */}
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

      {/* 3c. Los más pedidos */}
      {/* ISSUE-036: oculto si no hay data de pedidos DELIVERED suficiente */}
      {mostOrdered.length > 0 && (
        <AnimateIn animation="reveal">
          <MerchantDiscoveryRow
            title="Los más pedidos"
            icon={<TrendingUp className="w-4 h-4 text-orange-600" />}
            merchants={mostOrdered}
            viewAllHref="/tiendas?filter=populares"
            accentColor="bg-orange-500"
          />
        </AnimateIn>
      )}

      {/* 3d. Mejor calificados */}
      {/* ISSUE-036: oculto si <2 merchants con rating ≥3.5 fuera de otras filas */}
      {bestRated.length > 0 && (
        <AnimateIn animation="reveal">
          <MerchantDiscoveryRow
            title="Mejor calificados"
            icon={<Star className="w-4 h-4 text-yellow-600" />}
            merchants={bestRated}
            viewAllHref="/tiendas?filter=mejor-calificados"
            accentColor="bg-yellow-500"
          />
        </AnimateIn>
      )}

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
        <ExploraUshuaiaMap merchants={enrichedMerchants as any} />
      </AnimateIn>

      {/* ── 8. MARKETPLACE — invitación compacta ── */}
      {recentListings.length > 0 && (
        <AnimateIn animation="reveal">
          <section className="py-6 lg:py-8 bg-white">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
              {/* Compact marketplace banner */}
              <div className="relative overflow-hidden rounded-2xl mb-4">
                <div className="absolute inset-0 bg-gradient-to-r from-[#4C1D95] via-[#7C3AED] to-[#8B5CF6]" />
                <div className="relative z-10 px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                      <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Vendedores activos</span>
                    </div>
                    <h2 className="text-lg lg:text-xl font-black text-white leading-tight">
                      Marketplace
                    </h2>
                    <p className="text-xs text-white/60 mt-0.5">
                      Comprá y vendé entre vecinos
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href="/marketplace"
                      className="inline-flex items-center gap-1.5 bg-white text-[#7C3AED] text-sm font-bold px-4 py-2 rounded-xl hover:bg-white/90 transition shadow-lg shadow-black/10"
                    >
                      Explorar
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Single horizontal row of listings — scrollable */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {recentListings.slice(0, 6).map((listing) => (
                  <div key={listing.id} className="flex-shrink-0 w-[160px] lg:w-[180px] snap-start">
                    <ListingCard listing={listing} />
                  </div>
                ))}
                {/* CTA final card */}
                <Link
                  href="/marketplace"
                  className="flex-shrink-0 w-[160px] lg:w-[180px] snap-start flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/50 hover:bg-purple-50 transition min-h-[200px]"
                >
                  <ArrowRight className="w-6 h-6 text-[#7C3AED] mb-2" />
                  <span className="text-sm font-semibold text-[#7C3AED]">Ver todo</span>
                </Link>
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