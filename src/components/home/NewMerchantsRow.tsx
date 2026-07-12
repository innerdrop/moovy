"use client";

import Link from "next/link";
import { cleanEncoding } from "@/lib/utils/stringUtils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MerchantPreview {
    id: string;
    slug: string;
    name: string;
    image: string | null;
    isOpen: boolean;
    category?: string | null;
}

interface NewMerchantsRowProps {
    merchants: MerchantPreview[];
    viewAllHref?: string;
}

// feat/rediseno-home: "Nuevos en MOOVY" como chips-píldora (avatar + nombre +
// "NUEVO · categoría"), reemplaza los círculos con anillo animado.

export default function NewMerchantsRow({
    merchants,
    viewAllHref = "/tiendas?filter=nuevos",
}: NewMerchantsRowProps) {
    if (merchants.length === 0) return null;

    return (
        <section className="py-6 lg:py-8">
            <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
                {/* Row header */}
                <div className="flex items-center justify-between mb-3.5">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        Nuevos en MOOVY ✨
                    </h2>
                    <Link
                        href={viewAllHref}
                        className="text-[#e60012] text-sm font-bold hover:underline"
                    >
                        Ver todos
                    </Link>
                </div>

                {/* Pill chips — horizontal scroll */}
                <div
                    className="flex gap-3.5 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1"
                    style={{ scrollbarWidth: "none" }}
                >
                    {merchants.map((m) => (
                        <MerchantPill key={m.id} merchant={m} />
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Pill chip ──────────────────────────────────────────────────────────────

function MerchantPill({ merchant }: { merchant: MerchantPreview }) {
    const name = cleanEncoding(merchant.name);
    const initial = name.charAt(0).toUpperCase();
    const category = merchant.category ? cleanEncoding(merchant.category) : "Comercio";

    return (
        <Link
            href={`/tienda/${merchant.slug}`}
            className="flex-shrink-0 flex items-center gap-2.5 bg-white rounded-full py-2 pl-2 pr-4 shadow-[0_3px_12px_rgba(30,10,5,0.07)] transition-transform active:scale-[0.98]"
        >
            <div className="relative w-11 h-11 rounded-full overflow-hidden bg-rose-50 border-2 border-[#ffe4e6] flex items-center justify-center flex-shrink-0">
                {merchant.image ? (
                    <img src={merchant.image} alt={name} className="w-full h-full object-cover" loading="lazy" />
                ) : (
                    <span className="text-base font-black text-[#e60012]/70">{initial}</span>
                )}
                {merchant.isOpen && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                )}
            </div>
            <div className="pr-1">
                <p className="text-[13px] font-black text-gray-900 whitespace-nowrap leading-tight">{name}</p>
                <p className="text-[10.5px] font-extrabold text-[#e60012] whitespace-nowrap">
                    NUEVO · {category}
                </p>
            </div>
        </Link>
    );
}
