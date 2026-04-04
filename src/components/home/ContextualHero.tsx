"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Clock, Sun, Sunrise, Sunset, Moon, ChevronRight } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MerchantPreview {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  category: string | null;
  isOpen: boolean;
  rating: number | null;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
}

interface HeroBackground {
  from: string;
  via?: string;
  to: string;
}

interface ContextualHeroProps {
  merchants: MerchantPreview[];
  /** Custom backgrounds from OPS — keyed by slot id (morning, lunch, etc.) */
  customBackgrounds?: Record<string, HeroBackground>;
}

// ─── Time-of-day configuration ──────────────────────────────────────────────

interface TimeSlot {
  id: string;
  greeting: string;
  subtitle: string;
  icon: typeof Sun;
  gradientFrom: string;
  gradientTo: string;
  gradientVia?: string;
  textColor: string;
  /** Category keywords to prioritize (partial match, case-insensitive) */
  priorityKeywords: string[];
}

const TIME_SLOTS: TimeSlot[] = [
  {
    id: "morning",
    greeting: "Buen día",
    subtitle: "¿Qué desayunamos?",
    icon: Sunrise,
    gradientFrom: "from-amber-100",
    gradientVia: "via-orange-50",
    gradientTo: "to-yellow-50",
    textColor: "text-amber-900",
    priorityKeywords: ["panadería", "panaderia", "café", "cafe", "cafetería", "cafeteria", "desayuno", "medialunas", "pastelería", "pasteleria"],
  },
  {
    id: "lunch",
    greeting: "¡Buen provecho!",
    subtitle: "¿Qué almorzamos hoy?",
    icon: Sun,
    gradientFrom: "from-red-50",
    gradientVia: "via-orange-50",
    gradientTo: "to-amber-50",
    textColor: "text-red-900",
    priorityKeywords: ["restaurante", "comida", "almuerzo", "empanadas", "pizza", "hamburguesa", "sushi", "parrilla", "minutas", "rotisería", "rotiseria"],
  },
  {
    id: "afternoon",
    greeting: "Buenas tardes",
    subtitle: "¿Se te antoja algo?",
    icon: Sun,
    gradientFrom: "from-sky-50",
    gradientVia: "via-blue-50",
    gradientTo: "to-indigo-50",
    textColor: "text-sky-900",
    priorityKeywords: ["café", "cafe", "cafetería", "cafeteria", "heladería", "heladeria", "panadería", "panaderia", "farmacia", "kiosco"],
  },
  {
    id: "dinner",
    greeting: "Buenas noches",
    subtitle: "¿Qué cenamos?",
    icon: Sunset,
    gradientFrom: "from-violet-100",
    gradientVia: "via-purple-50",
    gradientTo: "to-indigo-50",
    textColor: "text-violet-900",
    priorityKeywords: ["restaurante", "sushi", "pizza", "hamburguesa", "parrilla", "comida", "empanadas", "minutas", "rotisería", "rotiseria"],
  },
  {
    id: "night",
    greeting: "Buenas noches",
    subtitle: "¿Antojo nocturno?",
    icon: Moon,
    gradientFrom: "from-slate-800",
    gradientVia: "via-gray-900",
    gradientTo: "to-slate-900",
    textColor: "text-white",
    priorityKeywords: ["farmacia", "kiosco", "delivery", "24hs", "24 horas"],
  },
];

function getCurrentTimeSlot(): TimeSlot {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 11) return TIME_SLOTS[0];   // morning
  if (hour >= 11 && hour < 15) return TIME_SLOTS[1];   // lunch
  if (hour >= 15 && hour < 20) return TIME_SLOTS[2];   // afternoon
  if (hour >= 20 && hour < 23) return TIME_SLOTS[3];   // dinner
  return TIME_SLOTS[4];                                  // night
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function ContextualHero({ merchants, customBackgrounds }: ContextualHeroProps) {
  const [timeSlot, setTimeSlot] = useState<TimeSlot>(getCurrentTimeSlot);
  const [mounted, setMounted] = useState(false);

  // Update time slot on mount (client-side) and periodically
  useEffect(() => {
    setTimeSlot(getCurrentTimeSlot());
    setMounted(true);

    const interval = setInterval(() => {
      setTimeSlot(getCurrentTimeSlot());
    }, 60_000); // check every minute

    return () => clearInterval(interval);
  }, []);

  // Sort merchants: prioritize open ones matching the current time slot keywords
  const sortedMerchants = useMemo(() => {
    const keywords = timeSlot.priorityKeywords;

    const scored = merchants.map((m) => {
      let score = 0;
      // Open merchants get a big boost
      if (m.isOpen) score += 100;
      // Matching category gets a boost
      const cat = (m.category || "").toLowerCase();
      const name = (m.name || "").toLowerCase();
      for (const kw of keywords) {
        if (cat.includes(kw) || name.includes(kw)) {
          score += 50;
          break;
        }
      }
      // Higher rated merchants get a small boost
      if (m.rating) score += m.rating * 2;

      return { merchant: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.merchant).slice(0, 4);
  }, [merchants, timeSlot]);

  const Icon = timeSlot.icon;
  const isNight = timeSlot.id === "night";

  // Avoid hydration mismatch: render a neutral state until mounted
  if (!mounted) {
    return (
      <section className="relative overflow-hidden bg-gray-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 lg:py-12">
          <div className="h-32 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </section>
    );
  }

  // Use custom OPS background if available, otherwise fall back to Tailwind classes
  const customBg = customBackgrounds?.[timeSlot.id];
  const hasCustomBg = customBg && customBg.from && customBg.to;

  const sectionStyle = hasCustomBg
    ? {
        background: `linear-gradient(135deg, ${customBg.from}${customBg.via ? `, ${customBg.via}` : ""}, ${customBg.to})`,
      }
    : undefined;

  const sectionClassName = hasCustomBg
    ? "relative overflow-hidden transition-colors duration-1000"
    : `relative overflow-hidden bg-gradient-to-br ${timeSlot.gradientFrom} ${timeSlot.gradientVia || ""} ${timeSlot.gradientTo} transition-colors duration-1000`;

  return (
    <section
      className={sectionClassName}
      style={sectionStyle}
    >
      {/* Decorative blobs */}
      <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-16 bottom-0 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />

      <div className="relative container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl py-8 lg:py-12">
        {/* Greeting */}
        <div className="flex items-center gap-3 mb-2">
          <Icon className={`w-6 h-6 lg:w-7 lg:h-7 ${isNight ? "text-amber-400" : "text-amber-600"}`} />
          <h1 className={`text-2xl lg:text-4xl font-black tracking-tight ${timeSlot.textColor}`}>
            {timeSlot.greeting}
          </h1>
        </div>
        <p className={`text-lg lg:text-2xl font-semibold mb-6 lg:mb-8 ${isNight ? "text-gray-300" : "text-gray-600"}`}>
          {timeSlot.subtitle}
        </p>

        {/* Merchant suggestions for this moment */}
        {sortedMerchants.length > 0 && (
          <div className="flex gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 -mx-1 px-1">
            {sortedMerchants.map((m) => (
              <Link
                key={m.id}
                href={`/tienda/${m.slug}`}
                className="flex-shrink-0 snap-start group"
              >
                <div
                  className={`relative w-[160px] lg:w-[200px] rounded-2xl overflow-hidden shadow-lg transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-[0.98] ${
                    isNight ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"
                  }`}
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                    {m.image ? (
                      <img
                        src={m.image}
                        alt={m.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="eager"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <span className="text-3xl font-bold text-gray-300">
                          {m.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {/* Open/Closed indicator */}
                    <div
                      className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full shadow-sm ${
                        m.isOpen ? "bg-green-500" : "bg-gray-400"
                      }`}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-2.5">
                    <h3
                      className={`font-bold text-sm truncate ${
                        isNight ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {m.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Clock className={`w-3 h-3 ${isNight ? "text-gray-400" : "text-gray-400"}`} />
                      <span className={`text-xs ${isNight ? "text-gray-400" : "text-gray-500"}`}>
                        {m.deliveryTimeMin}-{m.deliveryTimeMax} min
                      </span>
                      {m.rating && (
                        <>
                          <span className={`text-xs ${isNight ? "text-gray-600" : "text-gray-300"}`}>·</span>
                          <span className="text-xs text-yellow-600 font-semibold">
                            ★ {m.rating.toFixed(1)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* "Ver todos" card */}
            <Link
              href="/tiendas"
              className="flex-shrink-0 snap-start"
            >
              <div
                className={`w-[120px] lg:w-[140px] h-full min-h-[180px] rounded-2xl flex flex-col items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
                  isNight
                    ? "bg-gray-800/50 border border-gray-700 text-gray-300 hover:bg-gray-800"
                    : "bg-white/60 border border-gray-200 text-gray-600 hover:bg-white"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isNight ? "bg-gray-700" : "bg-gray-100"
                }`}>
                  <ChevronRight className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Ver todos</span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
