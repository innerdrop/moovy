import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Star, Clock, MapPin } from "lucide-react";
import { cleanEncoding } from "@/lib/utils/stringUtils";
import HeartButton from "@/components/ui/HeartButton";

// Fetch premium merchants ordered by tier (Platino → Destacado → Premium/Basic)
async function getDestacados() {
  try {
    return await prisma.merchant.findMany({
      where: {
        isActive: true,
        isPremium: true,
        premiumTier: { not: null },
      },
      orderBy: [
        { displayOrder: "desc" },
        { rating: "desc" },
      ],
      take: 6,
    });
  } catch {
    return [];
  }
}

// Helper function to get tier styles
function getTierStyles(tier: string | null) {
  const tierMap: Record<string, {
    badge: string;
    badgeGrad: string;
    badgeText: string;
    ringColor: string;
    shadowColor: string;
    icon: string;
  }> = {
    platino: {
      badge: "⭐",
      badgeGrad: "from-amber-500 to-yellow-500",
      badgeText: "Platino",
      ringColor: "ring-yellow-400/60",
      shadowColor: "shadow-yellow-400/20",
      icon: "✨",
    },
    destacado: {
      badge: "🔥",
      badgeGrad: "from-orange-500 to-red-500",
      badgeText: "Destacado",
      ringColor: "ring-orange-400/50",
      shadowColor: "shadow-orange-400/15",
      icon: "⭐",
    },
    basic: {
      badge: "✨",
      badgeGrad: "from-blue-500 to-cyan-500",
      badgeText: "Premium",
      ringColor: "ring-blue-400/40",
      shadowColor: "shadow-blue-400/10",
      icon: "💎",
    },
  };

  return tierMap[tier || "basic"] || tierMap.basic;
}

export default async function DestacadosSection() {
  const merchants = await getDestacados();

  // Don't render if no premium merchants
  if (merchants.length === 0) {
    return null;
  }

  return (
    <section className="py-6 lg:py-10 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        {/* Section header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h2 className="text-xl lg:text-2xl font-black text-gray-900">
              Destacados
            </h2>
          </div>
          <Link
            href="/tiendas?filter=destacados"
            className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile: horizontal scroll */}
        <div
          className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 lg:hidden"
          style={{ scrollbarWidth: "none" }}
        >
          {merchants.map((merchant) => {
            const tierStyles = getTierStyles(merchant.premiumTier);
            return (
              <div key={merchant.id} className="flex-shrink-0 w-[260px] snap-start">
                <DestacadoCard merchant={merchant} tierStyles={tierStyles} />
              </div>
            );
          })}
        </div>

        {/* Desktop: grid */}
        <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {merchants.map((merchant) => {
            const tierStyles = getTierStyles(merchant.premiumTier);
            return (
              <DestacadoCard
                key={merchant.id}
                merchant={merchant}
                tierStyles={tierStyles}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DestacadoCard({
  merchant,
  tierStyles,
}: {
  merchant: any;
  tierStyles: ReturnType<typeof getTierStyles>;
}) {
  return (
    <Link
      href={`/tienda/${merchant.slug}`}
      className={`group block bg-white rounded-xl overflow-hidden shadow-md hover:shadow-lg tap-bounce border-2 transition-all duration-200 ring-2 ${tierStyles.ringColor} ${tierStyles.shadowColor}`}
    >
      {/* Image container with status badge */}
      <div className="relative aspect-video bg-gray-100 overflow-hidden">
        {merchant.image ? (
          <img
            src={merchant.image}
            alt={merchant.name}
            className="w-full h-full object-cover img-zoom group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
            <span className="text-5xl font-bold opacity-20">
              {cleanEncoding(merchant.name).charAt(0)}
            </span>
          </div>
        )}

        {/* Tier Badge - top left */}
        <div
          className={`absolute top-3 left-3 bg-gradient-to-r ${tierStyles.badgeGrad} text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5`}
        >
          <span>{tierStyles.badge}</span>
          <span>{tierStyles.badgeText}</span>
        </div>

        {/* Status Badge - top right */}
        <div
          className={`absolute top-3 right-3 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg backdrop-blur-md transition-all duration-300 ${
            merchant.isOpen
              ? "bg-green-500/90 hover:bg-green-500"
              : "bg-gray-500/90 hover:bg-gray-600"
          }`}
        >
          {merchant.isOpen ? "ABIERTO" : "CERRADO"}
        </div>

        {/* Favorite Heart - bottom right */}
        <HeartButton
          type="merchant"
          itemId={merchant.id}
          className="absolute bottom-3 right-3"
        />
      </div>

      {/* Content */}
      <div className="p-3">
        {/* Nombre + rating */}
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="font-bold text-gray-900 text-base group-hover:text-[#e60012] transition truncate">
            {cleanEncoding(merchant.name)}
          </h3>
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 flex-shrink-0">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span>{merchant.rating ? merchant.rating.toFixed(1) : "Nuevo"}</span>
          </div>
        </div>

        {/* Descripción */}
        <p className="text-gray-500 text-sm line-clamp-1 mb-2">
          {cleanEncoding(merchant.description || "Sin descripción")}
        </p>

        {/* Delivery info */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min
            </span>
          </div>
          <span className="font-semibold flex-shrink-0">
            {merchant.deliveryFee === 0 ? (
              <span className="text-green-600 font-semibold">Gratis</span>
            ) : (
              <span className="text-gray-700">${merchant.deliveryFee}</span>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
