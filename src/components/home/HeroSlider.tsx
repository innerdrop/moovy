"use client";

// Hero Cards Slider - Carrusel de tarjetas promocionales
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Truck, Clock, ShieldCheck, Sparkles, ShoppingBag } from "lucide-react";

// Tarjetas con información del negocio y promos
// TODO: Estas tarjetas deberán cargarse desde la base de datos (admin panel)
// Tarjetas con información del negocio y promos (FASE 1 - INSTITUCIONAL)
const PROMO_CARDS = [
    {
        id: 1,
        icon: Truck,
        title: "Delivery 24hs",
        subtitle: "Llevamos lo que necesites, a cualquier hora",
        buttonText: "Ver Ubicación",
        buttonLink: "/contacto",
        bgGradient: "from-turquoise to-cyan-600",
    },
    {
        id: 3,
        icon: Clock,
        title: "Siempre Abierto",
        subtitle: "Estamos para vos las 24 horas del día",
        buttonText: "Contactar",
        buttonLink: "/contacto",
        bgGradient: "from-purple-500 to-violet-600",
    },
    {
        id: 5,
        icon: ShoppingBag,
        title: "Variedad Total",
        subtitle: "Kiosco, Almacén, Limpieza y mucho más",
        buttonText: "Ver Info",
        buttonLink: "/contacto",
        bgGradient: "from-amber-500 to-orange-600",
    },
];

export default function HeroSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    // Clone the first card and append it to the end for infinite loop effect
    const extendedCards = [...PROMO_CARDS, { ...PROMO_CARDS[0], id: 'clone-start' }];

    const [isPaused, setIsPaused] = useState(false); // Pause auto-scroll on interaction

    // Function to scroll to a specific card
    const scrollToCard = (index: number, smooth = true) => {
        if (containerRef.current) {
            const cards = containerRef.current.children;
            if (cards[index]) {
                const card = cards[index] as HTMLElement;
                const containerWidth = containerRef.current.offsetWidth;
                const cardWidth = card.offsetWidth;
                const scrollPosition = card.offsetLeft - (containerWidth - cardWidth) / 2;

                containerRef.current.scrollTo({
                    left: scrollPosition,
                    behavior: smooth ? 'smooth' : 'instant'
                });
            }
        }
    };

    // Auto-scroll effect
    useEffect(() => {
        if (isPaused) return; // Don't auto-scroll if user is interacting

        const timer = setInterval(() => {
            handleNext();
        }, 3500);

        return () => clearInterval(timer);
    }, [currentIndex, isPaused]);

    // Handle Infinite Loop Reset
    useEffect(() => {
        if (currentIndex === PROMO_CARDS.length) {
            // We just scrolled to the clone. Wait for animation to finish, then jump to real 0.
            const timeout = setTimeout(() => {
                setIsTransitioning(false); // Disable transition visuals
                setCurrentIndex(0); // Updates index state
                scrollToCard(0, false); // Instant jump

                // Re-enable transitions after a tiny delay
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setIsTransitioning(true);
                    });
                });
            }, 350); // Slightly longer than CSS transition to be safe
            return () => clearTimeout(timeout);
        } else {
            // Only auto-scroll if NOT paused (user not swiping)
            if (!isPaused) {
                scrollToCard(currentIndex, isTransitioning);
            }
        }
    }, [currentIndex, isTransitioning, isPaused]);

    const handlePrev = () => {
        if (currentIndex === 0) {
            // If at start, jump to end (not clone, but last real item) - simpler logic for now: just wrap
            // For a perfect bi-directional loop we'd need clones at both ends, but user asked for "finish last -> continue first"
            setCurrentIndex(PROMO_CARDS.length - 1);
        } else {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleNext = () => {
        setCurrentIndex((prev) => prev + 1);
    };

    // Touch/Scroll Handlers
    const handleTouchStart = () => setIsPaused(true);
    const handleTouchEnd = () => {
        // Resume auto-scroll after a delay
        setTimeout(() => setIsPaused(false), 3000);
    };

    // Calculate active slide on scroll
    const handleScroll = () => {
        if (!containerRef.current || !isPaused) return;

        const container = containerRef.current;
        const scrollCenter = container.scrollLeft + container.offsetWidth / 2;

        // Find which card is closest to center
        const cards = Array.from(container.children) as HTMLElement[];
        let closestIndex = 0;
        let minDistance = Infinity;

        cards.forEach((card, index) => {
            const cardCenter = card.offsetLeft + card.offsetWidth / 2;
            const distance = Math.abs(cardCenter - scrollCenter);
            if (distance < minDistance) {
                minDistance = distance;
                closestIndex = index;
            }
        });

        // Update index without triggering scroll (since we are creating the scroll)
        if (closestIndex !== currentIndex) {
            setCurrentIndex(closestIndex);
        }
    };

    return (
        <section className="py-3 sm:py-4">
            <div className="container mx-auto px-4">
                {/* Cards Container */}
                <div
                    className="relative"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Nav Arrows - Desktop Only */}
                    <button
                        onClick={handlePrev}
                        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 shadow-lg rounded-full items-center justify-center text-navy hover:text-turquoise hover:bg-white transition-all"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 shadow-lg rounded-full items-center justify-center text-navy hover:text-turquoise hover:bg-white transition-all"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Scrollable Cards */}
                    <div
                        ref={containerRef}
                        onScroll={handleScroll}
                        className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2" // Restored overflow-x-auto
                    >
                        {extendedCards.map((card, index) => {
                            const IconComponent = card.icon;
                            // Determine active state visually
                            // If we are at the clone (index === length), it should look active like index 0
                            const isActive = index === currentIndex || (currentIndex === PROMO_CARDS.length && index === 0);

                            return (
                                <div
                                    key={`${card.id}-${index}`}
                                    className={`flex-shrink-0 w-[310px] sm:w-[370px] md:w-[420px] snap-center transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-75'
                                        }`}
                                >
                                    <div className={`bg-gradient-to-br ${card.bgGradient} rounded-xl p-5 sm:p-6 text-white shadow-lg h-[180px] sm:h-[200px] flex flex-col relative overflow-hidden transform transition-transform`}>
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white rounded-full"></div>
                                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white rounded-full"></div>
                                        </div>

                                        {/* Content */}
                                        <div className="relative z-10 flex flex-col h-full">
                                            {/* Icon */}
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />
                                            </div>

                                            {/* Text */}
                                            <h3 className="text-xl sm:text-2xl font-bold mb-2">{card.title}</h3>
                                            <p className="text-white/85 text-sm sm:text-base mb-auto">{card.subtitle}</p>

                                            {/* Button */}
                                            <Link
                                                href={card.buttonLink}
                                                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium transition-all mt-3 w-fit"
                                            >
                                                {card.buttonText}
                                                <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-1">
                        {PROMO_CARDS.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`transition-all duration-300 rounded-full ${index === (currentIndex % PROMO_CARDS.length)
                                    ? 'w-6 h-2 bg-turquoise'
                                    : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
                                    }`}
                                aria-label={`Ir a tarjeta ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
