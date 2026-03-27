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
// In flex-col: justify-* = vertical axis, items-* = horizontal axis
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

export default function PromoBanner({
    enabled = true,
    title = "",
    subtitle = "",
    buttonText = "",
    buttonLink = "/",
    image = null,
    ctaPosition = "abajo-izquierda",
}: PromoBannerProps) {
    if (!enabled) return null;

    const hasText = title.trim() || subtitle.trim() || buttonText.trim();
    if (!image && !hasText) return null;

    const titleLines = title
        ? title.includes("\\n")
            ? title.split("\\n")
            : title.split("\n")
        : [];

    const posClass = positionClasses[ctaPosition] || positionClasses["abajo-izquierda"];
    const isCenter = ctaPosition === "arriba-centro" || ctaPosition === "centro" || ctaPosition === "abajo-centro";
    const isRight = ctaPosition.includes("derecha");

    const href = buttonLink?.trim() || "/";

    return (
        <section className="px-3 md:px-8 lg:px-16 py-3 md:py-6 max-w-7xl mx-auto">
            <Link href={href} className="block relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl group cursor-pointer hover:shadow-2xl transition-shadow">
                {/* When image exists, fixed aspect ratio container + object-cover */}
                {/* Standard: 1200x400px (3:1). Design the image at that size */}
                {image ? (
                    <>
                        <div className="relative w-full aspect-[3/1]">
                            <Image
                                src={image}
                                alt={title || "Promoción"}
                                fill
                                priority
                                sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
                                className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                            />
                        </div>
                        {/* Text overlay — absolute on top of the image */}
                        {hasText && (
                            <div className={`absolute inset-0 flex flex-col p-4 md:p-8 lg:p-10 z-10 ${posClass}`}>
                                <div className={`flex flex-col ${isCenter ? "items-center" : isRight ? "items-end" : "items-start"}`}>
                                    {titleLines.length > 0 && titleLines.some(l => l.trim()) && (
                                        <h3 className="text-xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-1 md:mb-2 drop-shadow-lg">
                                            {titleLines.map((line, i) => (
                                                <span key={i}>
                                                    {line}
                                                    {i < titleLines.length - 1 && <br />}
                                                </span>
                                            ))}
                                        </h3>
                                    )}
                                    {subtitle.trim() && (
                                        <p className="text-xs md:text-base text-white/90 mb-2 md:mb-4 max-w-md drop-shadow-md">
                                            {subtitle}
                                        </p>
                                    )}
                                    {buttonText.trim() && (
                                        <span className="inline-flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm text-white px-3 md:px-5 py-1.5 md:py-2.5 rounded-full text-xs md:text-sm font-medium border border-white/30 group-hover:bg-white/30 transition-all">
                                            {buttonText}
                                            <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* No image — decorative background */}
                        <div className="absolute inset-0 opacity-20">
                            <div className="absolute top-0 right-0 w-40 md:w-64 h-40 md:h-64 bg-orange-500 rounded-full blur-3xl -mr-20 md:-mr-32 -mt-20 md:-mt-32" />
                            <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-red-500 rounded-full blur-3xl -ml-16 md:-ml-24 -mb-16 md:-mb-24" />
                        </div>
                        <div className={`flex flex-col p-6 md:p-10 lg:p-12 relative z-10 min-h-[180px] md:min-h-[220px] ${posClass}`}>
                            <div className={`flex flex-col ${isCenter ? "items-center" : isRight ? "items-end" : "items-start"}`}>
                                {titleLines.length > 0 && titleLines.some(l => l.trim()) && (
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
                                    <span className="inline-flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-medium border border-white/30 group-hover:bg-white/30 transition-all">
                                        {buttonText}
                                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                    </span>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </Link>
        </section>
    );
}
