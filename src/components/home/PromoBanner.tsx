"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PromoBanner() {
    return (
        <section className="px-3 md:px-8 lg:px-16 py-3 md:py-6 max-w-7xl mx-auto">
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl md:rounded-3xl overflow-hidden shadow-xl">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 w-40 md:w-64 h-40 md:h-64 bg-orange-500 rounded-full blur-3xl -mr-20 md:-mr-32 -mt-20 md:-mt-32" />
                    <div className="absolute bottom-0 left-0 w-32 md:w-48 h-32 md:h-48 bg-red-500 rounded-full blur-3xl -ml-16 md:-ml-24 -mb-16 md:-mb-24" />
                </div>

                <div className="flex items-center p-6 md:p-10 lg:p-12 relative z-10">
                    {/* Text Content */}
                    <div className="flex-1">
                        <span className="text-[11px] md:text-xs text-gray-400 font-medium flex items-center gap-1 mb-2 md:mb-3">
                            Publicidad
                            <ChevronRight className="w-3 h-3" />
                        </span>
                        <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-2 md:mb-4">
                            Noches de<br />Pizza & Pelis
                        </h3>
                        <p className="text-sm md:text-lg text-gray-400 mb-4 md:mb-6 max-w-md">
                            2x1 en locales seleccionados de 20hs a 23hs.
                        </p>
                        <Link
                            href="/productos?categoria=pizzas"
                            className="inline-flex items-center gap-1 md:gap-2 bg-white/10 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-full text-sm md:text-base font-medium border border-white/20 hover:bg-white/20 transition-all"
                        >
                            Ver locales
                            <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                        </Link>
                    </div>

                    {/* Pizza Illustration */}
                    <div className="w-32 h-28 md:w-48 md:h-40 lg:w-56 lg:h-48 flex-shrink-0">
                        <svg viewBox="0 0 120 100" className="w-full h-full">
                            {/* Pizza box */}
                            <rect x="20" y="40" width="80" height="50" rx="4" fill="#8B4513" />
                            <rect x="25" y="45" width="70" height="40" rx="2" fill="#D2691E" />

                            {/* Pizza */}
                            <ellipse cx="60" cy="55" rx="28" ry="8" fill="#FFD700" />
                            <ellipse cx="60" cy="52" rx="26" ry="6" fill="#FF6347" />
                            <circle cx="50" cy="52" r="4" fill="#8B0000" />
                            <circle cx="65" cy="50" r="3" fill="#8B0000" />
                            <circle cx="58" cy="54" r="3" fill="#228B22" />
                            <circle cx="72" cy="53" r="4" fill="#8B0000" />

                            {/* Popcorn bucket */}
                            <g transform="translate(85, 25)">
                                <path d="M0 15 L3 40 L27 40 L30 15 Z" fill="#e60012" />
                                <path d="M-2 15 L32 15 L30 10 L0 10 Z" fill="#cc0010" />
                                <circle cx="8" cy="8" r="5" fill="#FFF8DC" />
                                <circle cx="16" cy="5" r="5" fill="#FFFACD" />
                                <circle cx="24" cy="8" r="5" fill="#FFF8DC" />
                                <circle cx="12" cy="2" r="4" fill="#FFF8DC" />
                                <circle cx="20" cy="0" r="4" fill="#FFFACD" />
                            </g>

                            {/* Drink cup */}
                            <g transform="translate(5, 50)">
                                <path d="M0 0 L3 30 L17 30 L20 0 Z" fill="#e60012" />
                                <ellipse cx="10" cy="0" rx="10" ry="3" fill="#cc0010" />
                                <rect x="4" y="8" width="12" height="4" fill="#fff" opacity="0.3" />
                                <rect x="8" y="-8" width="4" height="10" fill="#4A90D9" rx="2" />
                            </g>
                        </svg>
                    </div>
                </div>
            </div>
        </section>
    );
}
