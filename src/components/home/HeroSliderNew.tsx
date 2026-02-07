"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Slide {
    id: number;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonLink: string;
    gradient: string;
}

const slides: Slide[] = [
    {
        id: 1,
        title: "Delivery Rápido",
        subtitle: "Llevamos tu antojo donde estés",
        buttonText: "Explora ahora",
        buttonLink: "/productos",
        gradient: "from-[#e60012] via-[#ff2a3a] to-[#ff6b6b]"
    },
    {
        id: 2,
        title: "Ofertas del Día",
        subtitle: "Descuentos exclusivos para vos",
        buttonText: "Ver ofertas",
        buttonLink: "/productos?ofertas=true",
        gradient: "from-[#ff6b35] via-[#ff8c42] to-[#ffba69]"
    },
    {
        id: 3,
        title: "Kioscos 24hs",
        subtitle: "Tu antojo a cualquier hora",
        buttonText: "Pedir ahora",
        buttonLink: "/productos",
        gradient: "from-[#e60012] via-[#c70010] to-[#a5000d]"
    }
];

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
            <text x="52" y="86" fontSize="6" fill="#fff" fontWeight="bold">MOOVY</text>

            {/* Location Pin */}
            <g transform="translate(155, 50)">
                <path d="M15 0 C6.7 0 0 6.7 0 15 C0 26 15 35 15 35 C15 35 30 26 30 15 C30 6.7 23.3 0 15 0z" fill="#e60012" />
                <circle cx="15" cy="14" r="7" fill="#fff" />
                <circle cx="15" cy="14" r="3" fill="#e60012" />
            </g>

            {/* Dust/Motion Lines */}
            <path d="M40 125 L25 123" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round" />
            <path d="M35 130 L20 129" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
            <path d="M42 120 L30 118" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );
}

export default function HeroSliderNew() {
    const [current, setCurrent] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    // Minimum swipe distance (in px)
    const minSwipeDistance = 50;

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || (!touchEnd && touchEnd !== 0)) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        }
        if (isRightSwipe) {
            prevSlide();
        }
    };

    const nextSlide = () => {
        setCurrent((prev) => (prev + 1) % slides.length);
    };

    const prevSlide = () => {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const slide = slides[current];

    return (
        <div className="w-full pt-2 pb-1">
            <div
                className={`relative mx-3 bg-gradient-to-r ${slide.gradient} rounded-2xl overflow-hidden shadow-lg transition-all duration-500`}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="flex items-center min-h-[200px]">
                    {/* Text Content */}
                    <div className="flex-1 p-6 z-10">
                        <h2 className="text-white text-2xl font-bold mb-2 leading-tight">
                            {slide.title}
                        </h2>
                        <p className="text-white/80 text-sm mb-4">
                            {slide.subtitle}
                        </p>
                        <Link
                            href={slide.buttonLink}
                            className="inline-flex items-center gap-1 bg-white text-[#e60012] px-4 py-2 rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
                            onClick={(e) => e.stopPropagation()} // Prevent swiping when clicking button
                        >
                            {slide.buttonText}
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>

                    {/* Illustration */}
                    <div className="w-40 h-32 -mr-2">
                        <DeliveryIllustration />
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full -ml-10 -mb-10" />
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-1.5 mt-2">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrent(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === current
                            ? "bg-[#e60012] w-5"
                            : "bg-gray-300"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}
