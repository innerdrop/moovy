"use client";

import Link from "next/link";
import { ChevronRight, Star, Clock } from "lucide-react";
import { cleanEncoding } from "@/lib/utils/stringUtils";
import HeartButton from "@/components/ui/HeartButton";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MerchantPreview {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image: string | null;
  isOpen: boolean;
  rating: number | null;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryFee: number;
  isPremium?: boolean;
  createdAt?: string | Date;
}

interface MerchantDiscoveryRowProps {
  title: string;
  icon?: React.ReactNode;
  merchants: MerchantPreview[];
  viewAllHref?: string;
  /** Visual accent color for the row title indicator */
  accentColor?: string;
  /** Show empty state or just hide the row */
  showEmpty?: boolean;
  emptyText?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function MerchantDiscoveryRow({
  title,
  icon,
  merchants,
  viewAllHref,
  accentColor = "bg-[#e60012]",
  showEmpty = false,
  emptyText = "No hay comercios en esta categoría todavía",
}: MerchantDiscoveryRowProps) {
  // Don't render if empty and not explicitly showing empty state
  if (merchants.length === 0 && !showEmpty) {
    return null;
  }

  return (
    <section className="py-4 lg:py-6">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
        {/* Row header */}
        <div className="flex items-center justify-between mb-3 lg:mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-1 h-5 rounded-full ${accentColor}`} />
            {icon}
            <h2 className="text-lg lg:text-xl font-black text-gray-900">
              {title}
            </h2>
          </div>
          {viewAllHref && merchants.length > 0 && (
            <Link
              href={viewAllHref}
              className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1"
            >
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        {/* Content */}
        {merchants.length > 0 ? (
          <div
            className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1"
            style={{ scrollbarWidth: "none" }}
          >
            {merchants.map((merchant) => (
              <DiscoveryCard key={merchant.id} merchant={merchant} />
            ))}
          </div>
        ) : (
          showEmpty && (
            <div className="py-6 text-center">
              <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500 font-medium">{emptyText}</p>
            </div>
          )
        )}
      </div>
    </section>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

function DiscoveryCard({ merchant }: { merchant: MerchantPreview }) {
  return (
    <Link
      href={`/tienda/${merchant.slug}`}
      className={`flex-shrink-0 snap-start group w-[220px] lg:w-[260px] ${
        !merchant.isOpen ? "opacity-70" : ""
      }`}
    >
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-200 group-hover:shadow-md group-hover:scale-[1.02] group-active:scale-[0.98]">
        {/* Image */}
        <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
          {merchant.image ? (
            <img
              src={merchant.image}
              alt={cleanEncoding(merchant.name)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <span className="text-3xl font-bold text-gray-300">
                {cleanEncoding(merchant.name).charAt(0)}
              </span>
            </div>
          )}

          {/* Status */}
          {!merchant.isOpen && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-xs font-bold bg-black/60 px-2.5 py-1 rounded-full">
                Cerrado
              </span>
            </div>
          )}

          {/* Heart */}
          <HeartButton
            type="merchant"
            itemId={merchant.id}
            className="absolute bottom-2 right-2"
          />
        </div>

        {/* Info */}
        <div className="p-3">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <h3 className="font-bold text-sm text-gray-900 truncate group-hover:text-[#e60012] transition">
              {cleanEncoding(merchant.name)}
            </h3>
            {merchant.rating ? (
              <div className="flex items-center gap-0.5 text-xs font-semibold text-gray-600 flex-shrink-0">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                {merchant.rating.toFixed(1)}
              </div>
            ) : (
              <span className="text-[10px] text-gray-400 flex-shrink-0">Nuevo</span>
            )}
          </div>

          {merchant.description && (
            <p className="text-gray-400 text-xs line-clamp-1 mb-1.5">
              {cleanEncoding(merchant.description)}
            </p>
          )}

          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {merchant.deliveryTimeMin}-{merchant.deliveryTimeMax} min
            </span>
            <span className="font-semibold ml-auto">
              {merchant.deliveryFee === 0 ? (
                <span className="text-green-600">Envío gratis</span>
              ) : (
                <span className="text-gray-700">${merchant.deliveryFee}</span>
              )}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
