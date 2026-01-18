"use client";

// Hero Cards Slider - Carrusel de tarjetas promocionales
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Truck, Clock, ShoppingBag, Mountain } from "lucide-react";

// Tarjetas institucionales - TODO: Cargar desde admin
const PROMO_CARDS = [
    {
        id: 1,
        icon: Truck,
        title: "Delivery Rápido",
        subtitle: "Llevamos tu antojo donde estés",
        buttonText: "Ver más",
        buttonLink: "/contacto",
    },
    {
        id: 2,
        icon: Clock,
        title: "Siempre Disponible",
        subtitle: "Estamos para vos cuando nos necesites",
        buttonText: "Contactar",
        buttonLink: "/contacto",
    },
    {
        id: 3,
        icon: ShoppingBag,
        title: "Variedad Total",
        subtitle: "Todo lo que buscás en un solo lugar",
        buttonText: "Ver productos",
        buttonLink: "/productos",
    },
    {
        id: 4,
        icon: Mountain,
        title: "Orgullo Fueguino",
        subtitle: "Tienda online desde el fin del mundo",
        buttonText: "Conocenos",
        buttonLink: "/nosotros",
    },
];

export default function HeroSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);

    const extendedCards = [...PROMO_CARDS, { ...PROMO_CARDS[0], id: 'clone-start' }];

    const [isPaused, setIsPaused] = useState(false);

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

    useEffect(() => {
        if (isPaused) return;

        const timer = setInterval(() => {
            handleNext();
        }, 3500);

        return () => clearInterval(timer);
    }, [currentIndex, isPaused]);

    useEffect(() => {
        if (currentIndex === PROMO_CARDS.length) {
            const timeout = setTimeout(() => {
                setIsTransitioning(false);
                setCurrentIndex(0);
                scrollToCard(0, false);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        setIsTransitioning(true);
                    });
                });
            }, 350);
            return () => clearTimeout(timeout);
        } else {
            if (!isPaused) {
                scrollToCard(currentIndex, isTransitioning);
            }
        }
    }, [currentIndex, isTransitioning, isPaused]);

    const handlePrev = () => {
        if (currentIndex === 0) {
            setCurrentIndex(PROMO_CARDS.length - 1);
        } else {
            setCurrentIndex((prev) => prev - 1);
        }
    };

    const handleNext = () => {
        setCurrentIndex((prev) => prev + 1);
    };

    const handleTouchStart = () => setIsPaused(true);
    const handleTouchEnd = () => {
        setTimeout(() => setIsPaused(false), 3000);
    };

    const handleScroll = () => {
        if (!containerRef.current || !isPaused) return;

        const container = containerRef.current;
        const scrollCenter = container.scrollLeft + container.offsetWidth / 2;

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

        if (closestIndex !== currentIndex) {
            setCurrentIndex(closestIndex);
        }
    };

    return (
        <section className="py-3 sm:py-4">
            <div className="container mx-auto px-4">
                <div
                    className="relative"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    {/* Nav Arrows - Desktop */}
                    <button
                        onClick={handlePrev}
                        className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 shadow-lg rounded-full items-center justify-center text-gray-700 hover:text-[#e60012] hover:bg-white transition-all"
                        aria-label="Anterior"
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={handleNext}
                        className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 shadow-lg rounded-full items-center justify-center text-gray-700 hover:text-[#e60012] hover:bg-white transition-all"
                        aria-label="Siguiente"
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Scrollable Cards */}
                    <div
                        ref={containerRef}
                        onScroll={handleScroll}
                        className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2"
                    >
                        {extendedCards.map((card, index) => {
                            const IconComponent = card.icon;
                            const isActive = index === currentIndex || (currentIndex === PROMO_CARDS.length && index === 0);

                            return (
                                <div
                                    key={`${card.id}-${index}`}
                                    className={`flex-shrink-0 w-[310px] sm:w-[370px] md:w-[420px] snap-center transition-all duration-300 ${isActive ? 'scale-100 opacity-100' : 'scale-95 opacity-75'
                                        }`}
                                >
                                    {/* Solid Moovy Red Card */}
                                    <div className="bg-[#e60012] rounded-xl p-5 sm:p-6 text-white shadow-lg h-[180px] sm:h-[200px] flex flex-col relative overflow-hidden">
                                        {/* Background Pattern */}
                                        <div className="absolute inset-0 opacity-10">
                                            <div className="absolute -top-12 -right-12 w-40 h-40 bg-white rounded-full"></div>
                                            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white rounded-full"></div>
                                        </div>

                                        {/* Content */}
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4">
                                                <IconComponent className="w-7 h-7 sm:w-8 sm:h-8" />
                                            </div>

                                            <h3 className="text-xl sm:text-2xl font-bold mb-2">{card.title}</h3>
                                            <p className="text-white/85 text-sm sm:text-base mb-auto">{card.subtitle}</p>

                                            <Link
                                                href={card.buttonLink}
                                                className="inline-flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium transition-all mt-3 w-fit"
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
                                    ? 'w-6 h-2 bg-[#e60012]'
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

