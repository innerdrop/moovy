"use client";

import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { cleanEncoding } from "@/lib/utils/stringUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MerchantPreview {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    isOpen: boolean;
}

interface NewMerchantsRowProps {
    merchants: MerchantPreview[];
    viewAllHref?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function NewMerchantsRow({
    merchants,
    viewAllHref = "/tiendas?filter=nuevos",
}: NewMerchantsRowProps) {
    if (merchants.length === 0) return null;

    return (
        <section className="py-5 lg:py-7">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
                {/* Row header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-1 h-5 rounded-full bg-purple-500" />
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <h2 className="text-lg lg:text-xl font-black text-gray-900">
                            Nuevos en MOOVY
                        </h2>
                    </div>
                    <Link
                        href={viewAllHref}
                        className="text-[#e60012] text-sm font-semibold hover:underline flex items-center gap-1"
                    >
                        Ver todos <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>

                {/* Circular logos — horizontal scroll */}
                <div
                    className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
                    style={{ scrollbarWidth: "none" }}
                >
                    {merchants.map((m) => (
                        <MerchantCircle key={m.id} merchant={m} />
                    ))}
                </div>
            </div>

            {/* Subtle glow animation */}
            <style>{`
                @keyframes soft-glow {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(230, 0, 18, 0.0); }
                    50% { box-shadow: 0 0 8px 2px rgba(230, 0, 18, 0.2); }
                }
                .new-merchant-ring {
                    animation: soft-glow 2.5s ease-in-out infinite;
                }
            `}</style>
        </section>
    );
}

// ─── Circular merchant logo ────────────────────────────────────────────────

function MerchantCircle({ merchant }: { merchant: MerchantPreview }) {
    const name = cleanEncoding(merchant.name);
    const initial = name.charAt(0).toUpperCase();

    return (
        <Link
            href={`/tienda/${merchant.slug}`}
            className="flex-shrink-0 flex flex-col items-center gap-2 w-[76px] lg:w-[88px] group"
        >
            {/* Ring container */}
            <div className="relative">
                <div className="new-merchant-ring w-[68px] h-[68px] lg:w-[80px] lg:h-[80px] rounded-full border-2 border-[#e60012]/30 p-[3px] group-hover:border-[#e60012]/60 transition-colors duration-300">
                    {/* Logo image */}
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 group-hover:scale-105 transition-transform duration-200">
                        {merchant.image ? (
                            <img
                                src={merchant.image}
                                alt={name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <span className="text-xl lg:text-2xl font-black text-[#e60012]/60">
                                    {initial}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* "NUEVO" badge */}
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black tracking-wider text-white bg-[#e60012] px-2 py-0.5 rounded-full shadow-sm">
                    NUEVO
                </span>

                {/* Open indicator */}
                {merchant.isOpen && (
                    <div className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                )}
            </div>

            {/* Name */}
            <span className="text-[11px] lg:text-xs font-bold text-gray-700 text-center leading-tight truncate w-full">
                {name}
            </span>
        </Link>
    );
}
