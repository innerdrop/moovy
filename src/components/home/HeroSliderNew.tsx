"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface Slide {
    id: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    gradient: string;
    image: string | null;
}

interface HeroSliderNewProps {
    slides?: Slide[];
    slideInterval?: number; // milliseconds
}

// SVG Illustration of delivery person on scooter
function DeliveryIllustration() {
    return (
        <svg viewBox="0 0 200 150" className="w-full h-full" fill="none">
            {/* Road/Ground */}
            <ellipse cx="100" cy="140" rx="90" ry="8" fill="rgba(255,255,255,0.2)" />

            {/* Scooter Body */}
            <path d="M60 100 Q70 85 90 85 L120 85 Q135 85 140 100 L145 110 L55 110 Z" fill="#e60012" />
            <rect x="65" y="105" width="75" height="8" rx="3" fill="#cc0010" />

            {/* Wheels */}
            <circle cx="75" cy="118" r="12" fill="#333" stroke="#666" strokeWidth="3" />
            <circle cx="75" cy="118" r="5" fill="#999" />
            <circle cx="130" cy="118" r="12" fill="#333" stroke="#666" strokeWidth="3" />
            <circle cx="130" cy="118" r="5" fill="#999" />

            {/* Handlebar */}
            <rect x="135" y="78" width="4" height="25" rx="2" fill="#666" />
            <rect x="130" y="75" width="15" height="5" rx="2" fill="#333" />

            {/* Delivery Person Body */}
            <ellipse cx="95" cy="55" rx="12" ry="14" fill="#ffcc99" /> {/* Head */}
            <path d="M85 50 Q95 42 105 50" fill="#333" /> {/* Hair */}
            <circle cx="91" cy="55" r="2" fill="#333" /> {/* Eye */}
            <circle cx="99" cy="55" r="2" fill="#333" /> {/* Eye */}
            <path d="M93 60 Q95 62 97 60" stroke="#333" strokeWidth="1.5" fill="none" /> {/* Smile */}

            {/* Helmet */}
            <path d="M80 48 Q95 35 110 48 L108 52 Q95 45 82 52 Z" fill="#e60012" />

            {/* Body/Jacket */}
            <path d="M82 68 L75 95 L115 95 L108 68 Q95 72 82 68" fill="#e60012" />
            <rect x="88" y="75" width="14" height="18" rx="2" fill="#ffcc99" /> {/* Hands area */}

            {/* Delivery Box */}
            <rect x="45" y="65" width="30" height="25" rx="3" fill="#ff6b35" />
            <rect x="48" y="68" width="24" height="6" rx="1" fill="#fff" opacity="0.8" />
            <text x="60" y="73" fontSize="5" fill="#333" textAnchor="middle" fontWeight="bold">moovy</text>
            <rect x="48" y="78" width="24" height="10" rx="1" fill="#fff" opacity="0.3" />

            {/* Motion Lines */}
            <path d="M35 95 L20 95" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" />
            <path d="M35 100 L15 100" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <path d="M35 105 L25 105" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />

            {/* Speed particles */}
            <circle cx="30" cy="85" r="2" fill="rgba(255,255,255,0.5)" />
            <circle cx="25" cy="110" r="1.5" fill="rgba(255,255,255,0.4)" />
            <circle cx="20" cy="92" r="1" fill="rgba(255,255,255,0.3)" />
        </svg>
    );
}

export default function HeroSliderNew({ slides: propSlides, slideInterval = 5000 }: HeroSliderNewProps) {
    // Only show slides from database - no defaults
    const slides = propSlides || [];

    // Don't render anything if no slides
    if (slides.length === 0) {
        return null;
    }

    const [current, setCurrent] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance for triggering navigation (in px)
    const minSwipeDistance = 50;

    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    };

    // Touch handlers
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        } else if (isRightSwipe) {
            prevSlide();
        }
    };

    // Auto-slide with configurable interval
    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, slideInterval);
        return () => clearInterval(timer);
    }, [slides.length, slideInterval]);

    const slide = slides[current];
    if (!slide) return null;

    return (
        <div className="w-full pt-3 pb-2 md:py-6 max-w-[1600px] mx-auto">
            <div
                className={`relative mx-2 md:mx-4 lg:mx-6 ${!slide.image ? `bg-gradient-to-r ${slide.gradient}` : ''} rounded-2xl md:rounded-3xl overflow-hidden shadow-lg transition-all duration-500`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Background Image - covers entire slide */}
                {slide.image && (
                    <div className="absolute inset-0">
                        <Image
                            src={slide.image}
                            alt={slide.title}
                            fill
                            className="object-cover"
                            priority
                        />
                        {/* Overlay for text readability */}
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                    </div>
                )}

                <div className="relative flex items-center min-h-[220px] md:min-h-[320px] lg:min-h-[400px]">
                    {/* Text Content */}
                    <div className="flex-1 p-6 md:p-10 lg:p-12 z-10">
                        <h2 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-4 leading-tight drop-shadow-lg">
                            {slide.title}
                        </h2>
                        <p className="text-white/90 text-sm md:text-lg lg:text-xl mb-4 md:mb-6 max-w-md drop-shadow">
                            {slide.subtitle}
                        </p>
                        <Link
                            href={slide.buttonLink}
                            className="inline-flex items-center gap-1 md:gap-2 bg-white text-[#e60012] px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {slide.buttonText}
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                    </div>

                    {/* Illustration only when no image */}
                    {!slide.image && (
                        <div className="w-40 h-32 md:w-64 md:h-48 lg:w-80 lg:h-60 -mr-2 md:mr-4 flex items-center justify-center">
                            <DeliveryIllustration />
                        </div>
                    )}
                </div>

                {/* Decorative Elements - only show when no image */}
                {!slide.image && (
                    <>
                        <div className="absolute top-0 right-0 w-32 md:w-48 h-32 md:h-48 bg-white/10 rounded-full -mr-16 md:-mr-24 -mt-16 md:-mt-24" />
                        <div className="absolute bottom-0 left-0 w-20 md:w-32 h-20 md:h-32 bg-white/5 rounded-full -ml-10 md:-ml-16 -mb-10 md:-mb-16" />
                    </>
                )}
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 md:gap-2 mt-2 md:mt-4">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-all ${idx === current
                            ? "bg-[#e60012] w-5 md:w-8"
                            : "bg-gray-300 hover:bg-gray-400"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
