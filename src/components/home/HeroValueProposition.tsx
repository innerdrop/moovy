"use client";

/**
 * HeroValueProposition — Banner explicativo para visitantes NO logueados.
 *
 * Rama: feat/landing-headline-tienda (2026-05-19).
 *
 * Contexto: cuando un visitante nuevo llega a `somosmoovy.com` por primera
 * vez (boca a boca + WhatsApp + Instagram) la home pública le muestra
 * directamente la tienda contextual ("Buenas tardes / ¿Se te antoja algo?")
 * pero NO explica qué es MOOVY en los primeros 200px. Esa decisión está
 * bien para usuarios recurrentes (estandar de industria: PedidosYa/Rappi/
 * Glovo todos hacen tienda directa) — pero para un mercado nuevo como
 * Ushuaia donde la app es desconocida, hacen falta 2-3 líneas de propuesta
 * de valor visibles arriba sin sacar al usuario de la tienda.
 *
 * Comportamiento:
 *   - status "unauthenticated"  → muestra banner con headline + CTAs
 *   - status "loading"          → renderiza null (evita flash)
 *   - status "authenticated"    → renderiza null (recurrentes ven tienda
 *                                  limpia, como antes)
 *
 * Decisiones de diseño:
 *   - Gradient rojo MOOVY (#a3000c → #e60012) para coherencia de marca con
 *     el HomeHero que viene inmediatamente debajo (mismo fondo rojo).
 *   - Headline con amber-300 en la segunda línea para contraste/jerarquía
 *     visual sin romper la paleta.
 *   - Mini-strip de trust signals (zona, pago, instantáneo) abajo de los
 *     CTAs — la psicología de Ushuaia pide "¿quién está detrás?" y eso se
 *     responde mejor con señales concretas que con texto largo.
 *   - "Ver comercios" usa anchor link a #abiertos-ahora (no scroll de JS)
 *     para que funcione sin JS y sin redirect.
 *   - "Crear mi cuenta" lleva a /empezar (página de onboarding existente).
 *
 * NO se reemplaza el HomeHero contextual — se ANEXA encima. Los usuarios
 * recurrentes (la mayoría del tráfico post-launch) no ven este banner y
 * tienen exactamente la misma experiencia que antes.
 */

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Zap } from "lucide-react";

export default function HeroValueProposition() {
    const { status } = useSession();

    // Solo mostramos a no-logueados. Loading/authenticated no renderizan
    // para evitar flash y mantener limpia la experiencia recurrente.
    if (status !== "unauthenticated") return null;

    return (
        <section
            aria-label="Propuesta de valor de MOOVY"
            className="bg-gradient-to-br from-[#a3000c] via-[#c2000f] to-[#e60012] relative overflow-hidden"
        >
            {/* Decorative blobs (no interactivos) */}
            <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 bottom-0 w-40 h-40 rounded-full bg-amber-300/10 blur-3xl pointer-events-none" />

            <div className="relative container mx-auto px-5 py-8 lg:py-12 lg:px-8 max-w-7xl">
                {/* Headline + sub-headline */}
                <h2 className="text-white text-2xl lg:text-4xl font-black leading-tight tracking-tight mb-2 lg:mb-3">
                    Pedí en Ushuaia.
                    <span className="block text-amber-300">Tu comercio favorito te lo lleva.</span>
                </h2>
                <p className="text-white/85 text-sm lg:text-base font-medium mb-5 lg:mb-7 max-w-xl">
                    Repartidores locales, pago seguro, vos elegís cómo y cuándo recibir.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap gap-3">
                    <Link
                        href="/empezar"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white text-[#e60012] font-bold text-sm lg:text-base shadow-lg shadow-black/10 transition active:scale-[0.97] hover:bg-white/95"
                    >
                        <Zap className="w-4 h-4" aria-hidden="true" />
                        Crear mi cuenta
                    </Link>
                    <a
                        href="#abiertos-ahora"
                        className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/15 text-white font-semibold text-sm lg:text-base border border-white/25 backdrop-blur-sm transition active:scale-[0.97] hover:bg-white/25"
                    >
                        Ver comercios →
                    </a>
                </div>

            </div>
        </section>
    );
}
