"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import UploadImage from "@/components/ui/UploadImage";
import { ChevronRight, ChevronLeft } from "lucide-react";

export interface PromoSlide {
    id: string;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    image?: string | null;
    ctaPosition?: string;
    enabled?: boolean;
    order?: number;
}

interface PromoBannerProps {
    /** New: array of slides for carousel mode */
    slides?: PromoSlide[];
    /** Auto-advance interval in ms (default 5000) */
    interval?: number;
    /** Legacy single-slide props (backward compat) */
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    image?: string | null;
    ctaPosition?: string;
}

// Map position string to Tailwind classes
const positionClasses: Record<string, string> = {
    "arriba-izquierda": "justify-start items-start",
    "arriba-centro": "justify-start items-center text-center",
    "arriba-derecha": "justify-start items-end text-right",
    "centro-izquierda": "justify-center items-start",
    "centro": "justify-center items-center text-center",
    "centro-derecha": "justify-center items-end text-right",
    "abajo-izquierda": "justify-end items-start",
    "abajo-centro": "justify-end items-center text-center",
    "abajo-derecha": "justify-end items-end text-right",
};

/** Single slide renderer (extracted for reuse) */
function SlideContent({ slide }: { slide: PromoSlide }) {
    const title = slide.title || "";
    const subtitle = slide.subtitle || "";
    const buttonText = slide.buttonText || "";
    const image = slide.image || null;
    const ctaPosition = slide.ctaPosition || "abajo-izquierda";

    const hasText = title.trim() || subtitle.trim() || buttonText.trim();
    const titleLines = title
        ? title.includes("\\n")
            ? title.split("\\n")
            : title.split("\n")
        : [];

    const posClass = positionClasses[ctaPosition] || positionClasses["abajo-izquierda"];
    const isCenter = ctaPosition === "arriba-centro" || ctaPosition === "centro" || ctaPosition === "abajo-centro";
    const isRight = ctaPosition.includes("derecha");

    if (image) {
        return (
            <>
                <div className="relative w-full aspect-[3/1]">
                    <UploadImage
                        src={image}
                        alt={title || "Promoción"}
                        fill
                        priority
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                        className="object-cover"
                    />
                </div>
                {hasText && (
                    <div className={`absolute inset-0 flex flex-col p-4 md:p-8 lg:p-10 z-10 ${posClass}`}>
                        <TextOverlay
                            titleLines={titleLines}
                            subtitle={subtitle}
                            buttonText={buttonText}
                            isCenter={isCenter}
                            isRight={isRight}
                        />
                    </div>
                )}
            </>
        );
    }

    // No image — decorative background
    return (
        <>
            <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 right-0 w-40 md:w-64 h-40 md:h-64 bg-orange-500 rounded-full blur-3xl -mr-20 md:-mr-32 -mt-20 md:-mt-32" />
                <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-red-500 rounded-full blur-3xl -ml-16 md:-ml-24 -mb-16 md:-mb-24" />
            </div>
            <div className={`flex flex-col p-6 md:p-10 lg:p-12 relative z-10 min-h-[180px] md:min-h-[220px] ${posClass}`}>
                <TextOverlay
                    titleLines={titleLines}
                    subtitle={subtitle}
                    buttonText={buttonText}
                    isCenter={isCenter}
                    isRight={isRight}
                    large
                />
            </div>
        </>
    );
}

function TextOverlay({
    titleLines,
    subtitle,
    buttonText,
    isCenter,
    isRight,
    large = false,
}: {
    titleLines: string[];
    subtitle: string;
    buttonText: string;
    isCenter: boolean;
    isRight: boolean;
    large?: boolean;
}) {
    return (
        <div className={`flex flex-col ${isCenter ? "items-center" : isRight ? "items-end" : "items-start"}`}>
            {titleLines.length > 0 && titleLines.some((l) => l.trim()) && (
                <h3
                    className={`${
                        large
                            ? "text-2xl md:text-4xl lg:text-5xl mb-2 md:mb-3"
                            : "text-xl md:text-3xl lg:text-4xl mb-1 md:mb-2"
                    } font-bold text-white leading-tight drop-shadow-lg`}
                >
                    {titleLines.map((line, i) => (
                        <span key={i}>
                            {line}
                            {i < titleLines.length - 1 && <br />}
                        </span>
                    ))}
                </h3>
            )}
            {subtitle.trim() && (
                <p
                    className={`${
                        large ? "text-sm md:text-lg mb-3 md:mb-5" : "text-xs md:text-base mb-2 md:mb-4"
                    } text-white/90 max-w-md drop-shadow-md`}
                >
                    {subtitle}
                </p>
            )}
            {buttonText.trim() && (
                <span
                    className={`inline-flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm text-white ${
                        large
                            ? "px-4 md:px-6 py-2 md:py-3 text-sm md:text-base"
                            : "px-3 md:px-5 py-1.5 md:py-2.5 text-xs md:text-sm"
                    } rounded-full font-medium border border-white/30 group-hover:bg-white/30 transition-all`}
                >
                    {buttonText}
                    <ChevronRight className={large ? "w-4 h-4 md:w-5 md:h-5" : "w-3.5 h-3.5 md:w-4 md:h-4"} />
                </span>
            )}
        </div>
    );
}

export default function PromoBanner({
    slides: slidesProp,
    interval = 5000,
    // Legacy props
    enabled = true,
    title = "",
    subtitle = "",
    buttonText = "",
    buttonLink = "/",
    image = null,
    ctaPosition = "abajo-izquierda",
}: PromoBannerProps) {
    // Build slides array: prefer slides prop, fallback to legacy single slide
    const slides: PromoSlide[] = (() => {
        if (slidesProp && slidesProp.length > 0) {
            return slidesProp.filter((s) => s.enabled !== false);
        }
        // Legacy mode: single slide from individual props
        if (!enabled) return [];
        const hasContent = (title?.trim() || subtitle?.trim() || buttonText?.trim() || image);
        if (!hasContent) return [];
        return [{ id: "legacy", title, subtitle, buttonText, buttonLink, image, ctaPosition, enabled: true }];
    })();

    const [current, setCurrent] = useState(0);
    const [isHovered, setIsHovered] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const touchStartX = useRef<number>(0);

    const slideCount = slides.length;

    const goTo = useCallback(
        (index: number) => {
            setCurrent(((index % slideCount) + slideCount) % slideCount);
        },
        [slideCount]
    );

    const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
    const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

    // Auto-advance
    useEffect(() => {
        if (slideCount <= 1 || isHovered) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(goNext, interval);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [slideCount, isHovered, goNext, interval]);

    // Touch swipe support
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const diff = touchStartX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goNext();
            else goPrev();
        }
    };

    if (slides.length === 0) return null;

    return (
        <section className="px-3 md:px-8 lg:px-16 py-3 md:py-6 max-w-7xl mx-auto">
            <div
                className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-xl"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {/* Slides */}
                <div className="relative w-full overflow-hidden">
                    <div
                        className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${current * 100}%)` }}
                    >
                        {slides.map((slide) => {
                            const href = slide.buttonLink?.trim() || "/";
                            return (
                                <Link
                                    key={slide.id}
                                    href={href}
                                    className="relative w-full flex-shrink-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 group cursor-pointer"
                                >
                                    <SlideContent slide={slide} />
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation arrows (only if >1 slide) */}
                {slideCount > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.preventDefault(); goPrev(); }}
                            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-1.5 md:p-2 rounded-full transition-all"
                            style={{ opacity: isHovered ? 1 : 0, transition: "opacity 0.2s" }}
                            aria-label="Slide anterior"
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); goNext(); }}
                            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white p-1.5 md:p-2 rounded-full transition-all"
                            style={{ opacity: isHovered ? 1 : 0, transition: "opacity 0.2s" }}
                            aria-label="Siguiente slide"
                        >
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </>
                )}

                {/* Dot indicators (only if >1 slide) */}
                {slideCount > 1 && (
                    <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 md:gap-2">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.preventDefault(); goTo(idx); }}
                                className={`rounded-full transition-all duration-300 ${
                                    idx === current
                                        ? "w-6 md:w-8 h-2 md:h-2.5 bg-white"
                                        : "w-2 md:w-2.5 h-2 md:h-2.5 bg-white/50 hover:bg-white/70"
                                }`}
                                aria-label={`Ir al slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
