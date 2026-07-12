"use client";

import { useState, useEffect } from "react";
import { Sun } from "lucide-react";

// feat/rediseno-home: "Promos del Mundial" — vitrina de cupones REALES y vigentes,
// con el formato del diseño: tarjetas apiladas que rotan solas + grid "Más promos".
// Fuente de verdad: modelo Coupon (activos + no vencidos + no agotados). La sección
// se oculta desde page.tsx cuando no hay cupones. Sin data falsa: si dice "20%", ese
// cupón existe y se aplica en el checkout. Animaciones livianas (sun-spin, sin confeti).

interface CouponCard {
    id: string;
    code: string;
    description: string | null;
    discountType: string; // PERCENTAGE | FIXED_AMOUNT | FREE_DELIVERY
    discountValue: number;
    minOrderAmount: number | null;
    validUntil: string | Date | null;
}

interface PromosMundialProps {
    coupons: CouponCard[];
}

function formatDiscount(c: CouponCard): string {
    if (c.discountType === "FREE_DELIVERY") return "Envío gratis";
    if (c.discountType === "FIXED_AMOUNT") return `$${Math.round(c.discountValue).toLocaleString("es-AR")}`;
    return `${Math.round(c.discountValue)}% OFF`;
}

function formatUntil(v: string | Date | null): string | null {
    if (!v) return null;
    const d = new Date(v);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

// Temas argentinos para las tarjetas apiladas (celeste / blanco-borde / sol)
const CARD_THEMES = [
    {
        bg: "linear-gradient(135deg, #8FC1E8, #74ACDF)", border: "none", blob: "rgba(255,255,255,0.28)",
        badgeBg: "#F6B40E", badgeFg: "#5c3c00", titleColor: "#ffffff", subColor: "rgba(255,255,255,0.9)",
        ctaBg: "#ffffff", ctaFg: "#1E3A5F",
    },
    {
        bg: "#ffffff", border: "2px solid #74ACDF", blob: "rgba(116,172,223,0.18)",
        badgeBg: "#74ACDF", badgeFg: "#ffffff", titleColor: "#16365c", subColor: "#74ACDF",
        ctaBg: "#16365c", ctaFg: "#ffffff",
    },
    {
        bg: "linear-gradient(135deg, #F6B40E, #E09B00)", border: "none", blob: "rgba(255,255,255,0.25)",
        badgeBg: "#16365c", badgeFg: "#ffffff", titleColor: "#3d2900", subColor: "rgba(61,41,0,0.7)",
        ctaBg: "#16365c", ctaFg: "#ffffff",
    },
];

const STACK_STYLES = [
    { transform: "translateY(0) scale(1)", opacity: 1, zIndex: 3 },
    { transform: "translateY(16px) scale(0.94)", opacity: 0.75, zIndex: 2 },
    { transform: "translateY(30px) scale(0.88)", opacity: 0.45, zIndex: 1 },
];

export default function PromosMundial({ coupons }: PromosMundialProps) {
    const [idx, setIdx] = useState(0);
    const [copied, setCopied] = useState<string | null>(null);

    const stacked = coupons.slice(0, 3);
    const extras = coupons.slice(3, 7);
    const n = stacked.length;

    // Rotación automática solo si hay más de una tarjeta
    useEffect(() => {
        if (n <= 1) return;
        const t = setInterval(() => setIdx((s) => (s + 1) % n), 3500);
        return () => clearInterval(t);
    }, [n]);

    if (!coupons || coupons.length === 0) return null;

    const copy = async (code: string) => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(code);
            setTimeout(() => setCopied((prev) => (prev === code ? null : prev)), 1800);
        } catch {
            /* clipboard no disponible — no rompe nada */
        }
    };

    return (
        <section className="px-4">
            <div
                className="relative overflow-hidden rounded-[30px] container mx-auto max-w-3xl lg:max-w-4xl px-4 sm:px-6 py-6"
                style={{
                    background: "linear-gradient(180deg, #F4FAFF 0%, #E3F1FC 55%, #D3E9FA 100%)",
                    borderTop: "3px solid #74ACDF",
                    borderBottom: "3px solid #74ACDF",
                }}
            >
                {/* Halos decorativos */}
                <div className="absolute -left-16 -top-20 w-60 h-60 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(116,172,223,0.28), transparent 70%)" }} />
                <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(246,180,14,0.30), transparent 70%)" }} />

                {/* Header */}
                <div className="relative flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                        <span
                            className="flex items-center justify-center w-[34px] h-[34px] rounded-full animate-[spin_14s_linear_infinite]"
                            style={{ background: "#F6B40E", boxShadow: "0 0 18px rgba(246,180,14,0.8)" }}
                        >
                            <Sun className="w-[18px] h-[18px]" style={{ color: "#8a5a00" }} fill="#8a5a00" />
                        </span>
                        <div>
                            <h2 className="text-[19px] font-black leading-tight" style={{ color: "#1E3A5F" }}>
                                Promos del Mundial
                            </h2>
                            <p className="text-[11px] font-black uppercase tracking-[0.08em]" style={{ color: "#4E8FCC" }}>
                                Vamos Argentina
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stack rotativo */}
                <div className="relative mb-3" style={{ height: 168 }}>
                    {stacked.map((c, i) => {
                        const rel = (i - idx + n) % n;
                        const st = STACK_STYLES[rel] ?? STACK_STYLES[0];
                        const th = CARD_THEMES[i % CARD_THEMES.length];
                        const until = formatUntil(c.validUntil);
                        const isTop = rel === 0;
                        return (
                            <div
                                key={c.id}
                                className="absolute left-0 right-0 top-0 rounded-[20px] overflow-hidden box-border px-[18px] py-4"
                                style={{
                                    height: 140,
                                    background: th.bg,
                                    border: th.border,
                                    boxShadow: "0 10px 24px rgba(22,54,92,0.18)",
                                    transform: st.transform,
                                    opacity: st.opacity,
                                    zIndex: st.zIndex,
                                    transition: "transform 0.65s cubic-bezier(0.22,1,0.36,1), opacity 0.65s ease",
                                }}
                            >
                                <div className="absolute -right-4 -bottom-4 w-[90px] h-[90px] rounded-full pointer-events-none" style={{ background: th.blob }} />
                                <div className="relative flex flex-col h-full justify-between">
                                    <div>
                                        <span
                                            className="inline-block text-[11px] font-black px-2.5 py-1 rounded-full tracking-[0.04em]"
                                            style={{ background: th.badgeBg, color: th.badgeFg }}
                                        >
                                            {formatDiscount(c)}
                                        </span>
                                        <h3 className="mt-2 mb-0.5 text-[17px] font-black leading-snug line-clamp-1" style={{ color: th.titleColor }}>
                                            {c.description || "Cupón de descuento"}
                                        </h3>
                                        <p className="m-0 text-[12px] font-bold" style={{ color: th.subColor }}>
                                            Código {c.code}{until ? ` · hasta ${until}` : ""}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => isTop && copy(c.code)}
                                        className="self-start text-[12px] font-black px-3.5 py-[7px] rounded-full transition active:scale-95"
                                        style={{ background: th.ctaBg, color: th.ctaFg }}
                                        tabIndex={isTop ? 0 : -1}
                                    >
                                        {copied === c.code ? "¡Copiado!" : "Copiar código"}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Dots */}
                {n > 1 && (
                    <div className="relative flex justify-center gap-1.5">
                        {stacked.map((_, i) => (
                            <span
                                key={i}
                                className="h-1.5 rounded-full transition-all duration-400"
                                style={{
                                    width: i === idx ? 18 : 6,
                                    background: i === idx ? "#1E3A5F" : "rgba(30,58,95,0.3)",
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* Más promos de la fecha */}
                {extras.length > 0 && (
                    <div className="relative mt-5">
                        <p className="mb-2.5 text-[12px] font-black uppercase tracking-[0.08em]" style={{ color: "#4E8FCC" }}>
                            Más promos de la fecha
                        </p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {extras.map((c) => (
                                <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => copy(c.code)}
                                    className="text-left bg-white rounded-2xl px-3.5 py-3 transition active:scale-[0.98]"
                                    style={{ border: "1.5px solid rgba(116,172,223,0.5)", boxShadow: "0 4px 12px rgba(22,54,92,0.08)" }}
                                >
                                    <span
                                        className="inline-block text-[10px] font-black px-2 py-[3px] rounded-full tracking-[0.03em]"
                                        style={{ background: "#F6B40E", color: "#5c3c00" }}
                                    >
                                        {formatDiscount(c)}
                                    </span>
                                    <h4 className="mt-1.5 mb-0.5 text-[13.5px] font-black leading-tight line-clamp-1" style={{ color: "#1E3A5F" }}>
                                        {c.description || "Cupón"}
                                    </h4>
                                    <p className="m-0 text-[11px] font-bold" style={{ color: "#74ACDF" }}>
                                        {copied === c.code ? "¡Copiado!" : `Código ${c.code}`}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
