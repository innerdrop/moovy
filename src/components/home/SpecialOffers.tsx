"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SpecialOffers() {
    return (
        <section className="py-3 md:py-6 px-3 md:px-8 lg:px-16 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3 md:mb-6">
                <h2 className="text-xl md:text-3xl font-bold text-gray-900">
                    Ofertas Especiales
                </h2>
                <Link
                    href="/productos"
                    className="text-gray-400 hover:text-[#e60012] transition-colors flex items-center gap-1 md:text-lg"
                >
                    <span className="hidden md:inline">Ver todas</span>
                    <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6">
                {/* Card 1 - Hamburguesas */}
                <Link href="/productos?categoria=hamburguesas" className="group">
                    <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg aspect-[3/4] md:aspect-[4/3]">
                        {/* Badge */}
                        <span className="absolute top-3 md:top-5 left-3 md:left-5 bg-[#e60012] text-white text-[10px] md:text-sm px-2 md:px-3 py-0.5 md:py-1 rounded-full font-bold z-10">
                            Promo
                        </span>

                        {/* Content */}
                        <div className="absolute inset-0 p-4 md:p-6 lg:p-8 flex flex-col justify-end z-10">
                            <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-white leading-tight">
                                Menú de<br />Hamburgesas<br />¡2x1!
                            </h3>
                            <p className="text-xs md:text-sm lg:text-base text-white/80 mt-1 md:mt-2 mb-3 md:mb-4">
                                Consigue 2 por el precio de 1. !Hoy solamente!
                            </p>
                            <span className="inline-flex items-center gap-1 md:gap-2 text-white text-xs md:text-sm font-medium bg-white/20 backdrop-blur-sm px-3 md:px-4 py-1.5 md:py-2 rounded-full w-fit">
                                Explorar ofertas
                                <ChevronRight className="w-3 h-3 md:w-4 md:h-4" />
                            </span>
                        </div>

                        {/* Burger Illustration */}
                        <div className="absolute top-2 md:top-4 right-0 md:right-4 w-24 h-24 md:w-40 md:h-40 lg:w-48 lg:h-48 opacity-90">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                                {/* Top bun */}
                                <ellipse cx="50" cy="25" rx="35" ry="18" fill="#D4A574" />
                                <ellipse cx="50" cy="22" rx="32" ry="14" fill="#E5B887" />
                                {/* Sesame seeds */}
                                <ellipse cx="35" cy="18" rx="3" ry="2" fill="#FFF8DC" />
                                <ellipse cx="50" cy="15" rx="3" ry="2" fill="#FFF8DC" />
                                <ellipse cx="65" cy="18" rx="3" ry="2" fill="#FFF8DC" />
                                {/* Lettuce */}
                                <path d="M15 40 Q30 35 50 38 Q70 35 85 40 Q80 48 50 45 Q20 48 15 40" fill="#228B22" />
                                {/* Cheese */}
                                <path d="M18 45 L82 45 L80 55 L20 55 Z" fill="#FFD700" />
                                {/* Patty */}
                                <ellipse cx="50" cy="60" rx="35" ry="10" fill="#8B4513" />
                                {/* Bottom bun */}
                                <ellipse cx="50" cy="75" rx="35" ry="12" fill="#D4A574" />
                            </svg>
                        </div>

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                </Link>

                {/* Card 2 - Envesados */}
                <Link href="/productos" className="group">
                    <div className="relative bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 rounded-2xl md:rounded-3xl overflow-hidden shadow-lg aspect-[3/4] md:aspect-[4/3]">
                        {/* Content at bottom */}
                        <div className="absolute inset-0 p-4 md:p-6 lg:p-8 flex flex-col justify-end z-10">
                            <h3 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                                Promoción<br />Envasados
                            </h3>
                            <div className="flex items-center justify-between mt-2 md:mt-4">
                                <span className="text-xs md:text-sm text-gray-600">
                                    Super gratis
                                </span>
                                <span className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-full flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
                                </span>
                            </div>
                        </div>

                        {/* Food Illustration */}
                        <div className="absolute top-2 md:top-6 right-2 md:right-6 left-2 md:left-6 h-28 md:h-36 lg:h-44">
                            <svg viewBox="0 0 140 80" className="w-full h-full">
                                {/* Burger */}
                                <g transform="translate(0, 10)">
                                    <ellipse cx="40" cy="20" rx="28" ry="12" fill="#D4A574" />
                                    <ellipse cx="40" cy="17" rx="25" ry="9" fill="#E5B887" />
                                    <path d="M12 30 Q25 26 40 28 Q55 26 68 30 Q65 36 40 34 Q15 36 12 30" fill="#228B22" />
                                    <ellipse cx="40" cy="38" rx="28" ry="8" fill="#8B4513" />
                                    <ellipse cx="40" cy="48" rx="28" ry="10" fill="#D4A574" />
                                </g>
                                {/* Fries */}
                                <g transform="translate(75, 5)">
                                    <rect x="5" y="25" width="50" height="40" rx="3" fill="#e60012" />
                                    <rect x="10" y="0" width="6" height="35" rx="2" fill="#FFD700" />
                                    <rect x="18" y="5" width="6" height="30" rx="2" fill="#FFD700" />
                                    <rect x="26" y="2" width="6" height="33" rx="2" fill="#FFD700" />
                                    <rect x="34" y="8" width="6" height="27" rx="2" fill="#FFD700" />
                                    <rect x="42" y="4" width="6" height="31" rx="2" fill="#FFD700" />
                                </g>
                            </svg>
                        </div>
                    </div>
                </Link>
            </div>
        </section>
    );
}
