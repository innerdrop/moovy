import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

interface PromoBannerProps {
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
    "arriba-izquierda": "items-start justify-start",
    "arriba-centro": "items-start justify-center text-center",
    "arriba-derecha": "items-start justify-end text-right",
    "centro-izquierda": "items-center justify-start",
    "centro": "items-center justify-center text-center",
    "centro-derecha": "items-center justify-end text-right",
    "abajo-izquierda": "items-end justify-start",
    "abajo-centro": "items-end justify-center text-center",
    "abajo-derecha": "items-end justify-end text-right",
};

export default function PromoBanner({
    enabled = true,
    title = "",
    subtitle = "",
    buttonText = "",
    buttonLink = "/",
    image = null,
    ctaPosition = "abajo-izquierda",
}: PromoBannerProps) {
    // Don't render if disabled
    if (!enabled) return null;

    // If no image and no text content, don't render
    const hasText = title.trim() || subtitle.trim() || buttonText.trim();
    if (!image && !hasText) return null;

    // Parse title for line breaks (handles both real newlines and escaped \\n)
    const titleLines = title
        ? title.includes("\\n")
            ? title.split("\\n")
            : title.split("\n")
        : [];

    const posClass = positionClasses[ctaPosition] || positionClasses["abajo-izquierda"];
    const isCenter = ctaPosition.includes("centro") && !ctaPosition.includes("izquierda") && !ctaPosition.includes("derecha");
    const isRight = ctaPosition.includes("derecha");

    return (
        <section className="px-3 md:px-8 lg:px-16 py-3 md:py-6 max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
                {/* Background Image — original colors, no overlay */}
                {image && (
                    <div className="absolute inset-0">
                        <Image
                            src={image}
                            alt={title || "Promoción"}
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>
                )}

                {/* Background Pattern (only if no image) */}
                {!image && (
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-40 md:w-64 h-40 md:h-64 bg-orange-500 rounded-full blur-3xl -mr-20 md:-mr-32 -mt-20 md:-mt-32" />
                        <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-red-500 rounded-full blur-3xl -ml-16 md:-ml-24 -mb-16 md:-mb-24" />
                    </div>
                )}

                {/* Content — positioned according to ctaPosition */}
                {hasText ? (
                    <div className={`flex flex-col p-6 md:p-10 lg:p-12 relative z-10 min-h-[180px] md:min-h-[220px] ${posClass}`}>
                        <div className={`${isCenter ? "items-center" : isRight ? "items-end" : "items-start"} flex flex-col`}>
                            {(titleLines.length > 0 && titleLines.some(l => l.trim())) && (
                                <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2 md:mb-3 drop-shadow-lg">
                                    {titleLines.map((line, i) => (
                                        <span key={i}>
                                            {line}
                                            {i < titleLines.length - 1 && <br />}
                                        </span>
                                    ))}
                                </h3>
                            )}
                            {subtitle.trim() && (
                                <p className="text-sm md:text-lg text-white/90 mb-3 md:mb-5 max-w-md drop-shadow-md">
                                    {subtitle}
                                </p>
                            )}
                            {buttonText.trim() && (
                                <Link
                                    href={buttonLink || "/"}
                                    className="inline-flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-medium border border-white/30 hover:bg-white/30 transition-all"
                                >
                                    {buttonText}
                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                </Link>
                            )}
                        </div>
                    </div>
                ) : (
                    /* Image only — no text overlay, just maintain aspect ratio */
                    <div className="relative w-full aspect-[3/1] md:aspect-[4/1]" />
                )}
            </div>
        </section>
    );
}
