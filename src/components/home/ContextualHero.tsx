"use client";

import { useState, useEffect, useMemo } from "react";
import SmartImage from "@/components/ui/SmartImage";
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
  /**
   * Dos frases por franja, que se alternan solas cada 8 segundos.
   *
   * feat/barras-flotantes-y-copy · regla #46 (Moovy NO es una app de comida).
   * Los saludos ("Buen día", "Buenas noches") se quedan: nunca fueron el
   * problema. Lo que se sacó son las frases que daban por sentado que el vecino
   * viene a comer. Ahora conviven las dos cosas: una frase abierta a cualquier
   * rubro y otra más específica del momento.
   */
  subtitles: readonly [string, string];
  icon: typeof Sun;
  gradientFrom: string;
  gradientTo: string;
  gradientVia?: string;
  textColor: string;
}

const TIME_SLOTS: TimeSlot[] = [
  {
    id: "morning",
    greeting: "Buen día",
    subtitles: ["¿Qué necesitás hoy?", "¿Arrancamos con algo?"],
    icon: Sunrise,
    gradientFrom: "from-amber-100",
    gradientVia: "via-orange-50",
    gradientTo: "to-yellow-50",
    textColor: "text-amber-900",
  },
  {
    id: "lunch",
    greeting: "¡Buen provecho!",
    subtitles: ["¿Qué buscás para hoy?", "Pedilo ahora, llega en un rato"],
    icon: Sun,
    gradientFrom: "from-red-50",
    gradientVia: "via-orange-50",
    gradientTo: "to-amber-50",
    textColor: "text-red-900",
  },
  {
    id: "afternoon",
    greeting: "Buenas tardes",
    subtitles: ["¿Se te antoja algo?", "¿Te falta algo para hoy?"],
    icon: Sun,
    gradientFrom: "from-sky-50",
    gradientVia: "via-blue-50",
    gradientTo: "to-indigo-50",
    textColor: "text-sky-900",
  },
  {
    id: "dinner",
    greeting: "Buenas noches",
    subtitles: ["¿Qué cenamos?", "¿Qué te gustaría comer esta noche?"],
    icon: Sunset,
    gradientFrom: "from-violet-100",
    gradientVia: "via-purple-50",
    gradientTo: "to-indigo-50",
    textColor: "text-violet-900",
  },
  {
    id: "night",
    greeting: "Buenas noches",
    subtitles: ["Lo que esté abierto, te lo llevamos", "A esta hora, lo que haya"],
    icon: Moon,
    gradientFrom: "from-slate-800",
    gradientVia: "via-gray-900",
    gradientTo: "to-slate-900",
    textColor: "text-white",
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

  // Frase visible dentro de la franja: 0 o 1. Arranca SIEMPRE en 0 para que el
  // servidor y el cliente pinten lo mismo; la rotación empieza recién acá.
  const [frase, setFrase] = useState(0);
  const [fraseVisible, setFraseVisible] = useState(true);

  // Update time slot on mount (client-side) and periodically
  useEffect(() => {
    setTimeSlot(getCurrentTimeSlot());
    setMounted(true);

    const interval = setInterval(() => {
      setTimeSlot(getCurrentTimeSlot());
    }, 60_000); // check every minute

    return () => clearInterval(interval);
  }, []);

  // Rotación de la frase: se apaga, cambia, se prende.
  // Solo opacidad — nada de transform ni de fill:forwards (regla #12: dejaba el
  // texto borroso en pantallas de DPI fraccional, que son casi todos los Android
  // de gama media). Con "reducir movimiento" activado la clase
  // motion-reduce:transition-none hace que el cambio sea instantáneo.
  useEffect(() => {
    // Al cambiar de franja horaria, volver a la primera frase.
    setFrase(0);
    setFraseVisible(true);
  }, [timeSlot.id]);

  useEffect(() => {
    let apagar: ReturnType<typeof setTimeout>;

    const ciclo = setInterval(() => {
      setFraseVisible(false);
      apagar = setTimeout(() => {
        setFrase((f) => (f === 0 ? 1 : 0));
        setFraseVisible(true);
      }, 300); // igual que la duración de la transición
    }, 8_000);

    return () => {
      clearInterval(ciclo);
      clearTimeout(apagar);
    };
  }, []);

  // Orden de los comercios sugeridos.
  //
  // ANTES: cada franja horaria tenía una lista de palabras gastronómicas
  // ("pizza", "sushi", "parrilla", "rotisería"...) y el que coincidía subía 50
  // puntos. Una ferretería no tiene ninguna de esas palabras, así que quedaba
  // última a cualquier hora del día — en una app que vende de todo (regla #46).
  //
  // AHORA: abiertos primero, después mejor puntuados, después los que llegan
  // más rápido. Sin ningún rubro escrito a mano. Es más justo y no hay listas
  // que mantener.
  const sortedMerchants = useMemo(() => {
    const scored = merchants.map((m) => {
      let score = 0;
      if (m.isOpen) score += 100;
      if (m.rating) score += m.rating * 4;
      // menos demora = un poco más arriba (máximo ~10 puntos)
      score += Math.max(0, 10 - m.deliveryTimeMin / 10);
      return { merchant: m, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.merchant).slice(0, 4);
  }, [merchants]);

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
        {/* min-h fija: sin esto, una frase de dos líneas empuja los comercios
            hacia abajo cada 8 segundos y la pantalla "salta". */}
        <p
          aria-live="polite"
          className={`text-lg lg:text-2xl font-semibold mb-6 lg:mb-8 min-h-[1.75rem] lg:min-h-[2.25rem] transition-opacity duration-300 motion-reduce:transition-none ${fraseVisible ? "opacity-100" : "opacity-0"
            } ${isNight ? "text-gray-300" : "text-gray-600"}`}
        >
          {timeSlot.subtitles[frase]}
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
                      <SmartImage
                        src={m.image}
                        alt={m.name}
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 80vw, 320px"
                        priority
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
