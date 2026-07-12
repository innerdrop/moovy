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
import SupplySideCTA from "@/components/home/SupplySideCTA";
import Footer from "@/components/layout/Footer";
import HomeProductCard from "@/components/home/HomeProductCard";
import PromoBanner from "@/components/home/PromoBanner";
import PromosMundial from "@/components/home/PromosMundial";
import MooverBand from "@/components/home/MooverBand";
import HomeFeed from "@/components/home/HomeFeed";
import MerchantDiscoveryRow from "@/components/home/MerchantDiscoveryRow";
import NewMerchantsRow from "@/components/home/NewMerchantsRow";
import ExploraUshuaiaMap from "@/components/home/ExploraUshuaiaMap";
import AnimateIn from "@/components/ui/AnimateIn";
import { checkMerchantSchedule, getMerchantOpenViewModel } from "@/lib/merchant-schedule";

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
  // feat/portada-comercio: la portada (16:5) es la imagen ancha de las tarjetas;
  // el logo queda para las miniaturas cuadradas.
  banner: true,
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
      // fix/aprobacion-sin-logo (2026-04-27): además image (logo) no null para
      // que un merchant aprobado pero sin logo no se vea roto en la home.
      where: { isActive: true, approvalStatus: "APPROVED", image: { not: null } },
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
    // Rama feat/bloqueo-comercio-cerrado: NO filtramos por isOpen aquí porque
    // ese flag solo cubre pausa manual. El estado real (pausa + horario) se
    // calcula con getMerchantOpenViewModel después y se inyecta en merchant.
    // El producto se sigue mostrando aunque la tienda esté cerrada — el
    // botón "Agregar al carrito" queda deshabilitado y se ve badge "Cerrado".
    return await prisma.product.findMany({
      where: {
        isActive: true,
        isFeatured: true,
        stock: { gt: 0 },
        deletedAt: null,
        merchant: { isNot: null }, // featured sin merchantId (legacy/import) los excluimos
      },
      include: {
        categories: { include: { category: true } },
        images: true,
        merchant: {
          select: { id: true, name: true, isOpen: true, scheduleJson: true, slug: true },
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

/** Cupones activos y vigentes para la vitrina "Promos del Mundial". Fuente real
 *  (modelo Coupon). Excluye vencidos y agotados. Se oculta si no hay ninguno. */
async function getActiveCoupons() {
  try {
    const now = new Date();
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        OR: [{ validUntil: null }, { validUntil: { gt: now } }],
      },
      select: {
        id: true,
        code: true,
        description: true,
        discountType: true,
        discountValue: true,
        minOrderAmount: true,
        maxUses: true,
        usedCount: true,
        validUntil: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    // Excluir cupones agotados (maxUses alcanzado)
    return coupons.filter((c) => c.maxUses == null || c.usedCount < c.maxUses);
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
    activeCoupons,
  ] = await Promise.all([
    getHomeCategories(settings?.maxCategoriesHome ?? 8),
    getAllActiveMerchants(),
    getFeaturedProducts(),
    getRecentListings(),
    getHeroSlides(),
    getMostOrderedMerchantIds(),
    getActiveCoupons(),
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

  // Rama feat/bloqueo-comercio-cerrado: enriquecer cada featured product con
  // el viewModel del merchant (isCurrentlyOpen + nextOpenLabel) para que la
  // card sepa si habilitar el botón de agregar al carrito.
  const enrichedFeaturedProducts = featuredProducts.map((p) => {
    const vm = getMerchantOpenViewModel(p.merchant);
    return {
      ...p,
      merchant: p.merchant
        ? { ...p.merchant, isCurrentlyOpen: vm.isCurrentlyOpen, nextOpenLabel: vm.nextOpenLabel }
        : null,
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

      {/* ── 4. PROMO BANNER CAROUSEL (OPS configurable) ── */}
      {promoSlides.length > 0 && <PromoBanner slides={promoSlides} interval={5000} />}

      {/* ── 4b. PROMOS DEL MUNDIAL — cupones reales y vigentes (se oculta si no hay) ── */}
      {activeCoupons.length > 0 && (
        <AnimateIn animation="reveal">
          <PromosMundial coupons={activeCoupons as any} />
        </AnimateIn>
      )}

      {/* ── 6. PRODUCTOS — Lo más pedido (fondo crema + borde redondeado, como el diseño) ── */}
      <AnimateIn animation="reveal" delay={100}>
        <section className="py-8 lg:py-12 xl:py-14 bg-[#fdf9f3] rounded-t-[32px]">
          <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl lg:text-2xl font-black text-gray-900">
                Lo más pedido 🔥
              </h2>
              <Link
                href="/productos"
                className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <p className="text-[12.5px] text-gray-400 font-semibold mb-5">
              Los favoritos de Ushuaia esta semana
            </p>

            {enrichedFeaturedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4">
                {enrichedFeaturedProducts.map((product) => (
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

      {/* ── 6b. BANDA MOOVER — invita a crear cuenta (solo no logueados) ── */}
      <AnimateIn animation="reveal">
        <MooverBand />
      </AnimateIn>

      {/* ── 7. EXPLORÁ USHUAIA — mapa interactivo ── */}
      <AnimateIn animation="reveal">
        <ExploraUshuaiaMap merchants={enrichedMerchants as any} />
      </AnimateIn>

      {/* ── 7b. NUEVOS EN MOOVY — chips píldora (oculto si <2 o ya en otra fila) ── */}
      {newMerchants.length > 0 && (
        <AnimateIn animation="reveal">
          <NewMerchantsRow merchants={newMerchants as any} />
        </AnimateIn>
      )}

      {/* ── 8. MARKETPLACE — invitación compacta ── */}
      {recentListings.length > 0 && (
        <AnimateIn animation="reveal">
          <section
            className="py-7 lg:py-9"
            style={{ background: "linear-gradient(180deg, #f4f1fc 0%, #ece7fa 100%)" }}
          >
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-xl font-black tracking-tight" style={{ color: "#2e1065" }}>
                  Marketplace
                </h2>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center gap-1.5 bg-[#7C3AED] text-white text-xs font-bold px-3.5 py-2 rounded-full shadow-[0_4px_12px_rgba(124,58,237,0.3)] transition active:scale-95"
                >
                  Explorar <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <p className="text-[12.5px] font-semibold mb-4" style={{ color: "#7c6fa0" }}>
                Comprá y vendé entre vecinos de Ushuaia
              </p>

              {/* Listings — scroll horizontal */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
                {recentListings.slice(0, 6).map((listing) => (
                  <Link
                    key={listing.id}
                    href={`/marketplace/${listing.id}`}
                    className="flex-shrink-0 w-[150px] lg:w-[170px] snap-start block"
                  >
                    <div className="rounded-[18px] overflow-hidden bg-white shadow-[0_4px_14px_rgba(46,16,101,0.08)]">
                      <div className="aspect-square bg-gradient-to-br from-purple-50 to-violet-100 overflow-hidden">
                        {listing.images?.[0]?.url && (
                          <img
                            src={listing.images[0].url}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        )}
                      </div>
                      <div className="px-3 pt-2.5 pb-3">
                        <h3 className="text-[12.5px] font-extrabold text-gray-900 truncate">{listing.title}</h3>
                        <p className="mt-0.5 text-[15px] font-black text-[#7C3AED]">
                          ${listing.price.toLocaleString("es-AR")}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                {/* CTA final */}
                <Link
                  href="/marketplace"
                  className="flex-shrink-0 w-[150px] lg:w-[170px] snap-start flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-purple-200 bg-white/50 hover:bg-white transition min-h-[180px]"
                >
                  <ArrowRight className="w-6 h-6 text-[#7C3AED] mb-2" />
                  <span className="text-sm font-semibold text-[#7C3AED]">Ver todo</span>
                </Link>
              </div>
            </div>
          </section>
        </AnimateIn>
      )}

      {/* ── 8b. OPS Hero Banner + filas de discovery (extras fuera del diseño base) ── */}
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

      {/* TrustBar (fila de métodos de pago) removido: estaba duplicado con la fila
          de "Crecemos juntos". Queda una sola, y solo con MercadoPago. */}

      {/* ── 10. SUPPLY-SIDE CTAs ── */}
      <AnimateIn animation="reveal" delay={100}>
        <SupplySideCTA />
      </AnimateIn>

      {/* ── 11. FOOTER ── */}
      <Footer />
    </div>
  );
}