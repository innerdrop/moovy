"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  imageDesktop?: string | null;
  imageMobile?: string | null;
  image?: string | null; // legacy fallback
}

interface HeroBannerCarouselProps {
  slides: Slide[];
  slideInterval?: number; // milliseconds
}

export default function HeroBannerCarousel({
  slides,
  slideInterval = 5000,
}: HeroBannerCarouselProps) {
  // Don't render if no slides or no images
  const validSlides = slides.filter(
    (s) => s.imageDesktop || s.imageMobile || s.image
  );

  if (validSlides.length === 0) {
    return null;
  }

  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % validSlides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) =>
      prev - 1 < 0 ? validSlides.length - 1 : prev - 1
    );
  };

  const goToSlide = (idx: number) => {
    setCurrent(idx);
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

  // Auto-advance only if multiple slides
  useEffect(() => {
    if (validSlides.length <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, slideInterval);

    return () => clearInterval(timer);
  }, [validSlides.length, slideInterval]);

  const slide = validSlides[current];
  if (!slide) return null;

  // Determine if we should show navigation controls
  const showControls = validSlides.length > 1;

  return (
    <div
      className="relative w-full overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Image determines its own height — no fixed aspect ratio */}
      <div className="relative w-full">
        {validSlides.map((s, idx) => {
          const isFirst = idx === 0;
          return (
            <div
              key={s.id}
              className={isFirst ? "relative w-full" : "absolute inset-0 w-full h-full"}
              style={{
                opacity: idx === current ? 1 : 0,
                pointerEvents: idx === current ? "auto" : "none",
                transition: "opacity 500ms ease-in-out",
              }}
            >
              <Link
                href={s.buttonLink}
                className="block w-full"
                aria-label={s.title}
              >
                <picture className="block w-full">
                  {s.imageDesktop && (
                    <source
                      media="(min-width: 1024px)"
                      srcSet={s.imageDesktop}
                    />
                  )}
                  {s.imageMobile && (
                    <source
                      media="(max-width: 639px)"
                      srcSet={s.imageMobile}
                    />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.imageMobile || s.imageDesktop || s.image || ""}
                    alt={s.title}
                    className="w-full block"
                    loading={idx === 0 ? "eager" : "lazy"}
                  />
                </picture>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Navigation controls - only show if multiple slides */}
      {showControls && (
        <>
          {/* Previous button */}
          <button
            onClick={prevSlide}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Next button */}
          <button
            onClick={nextSlide}
            className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
            aria-label="Siguiente slide"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 md:bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {validSlides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(idx)}
                className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all ${
                  idx === current
                    ? "bg-white w-6 md:w-8"
                    : "bg-white/50 hover:bg-white/75"
                }`}
                aria-label={`Ir a slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}