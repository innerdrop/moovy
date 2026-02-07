"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SpecialOffers() {
    return (
        <section className="py-1 px-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-gray-900">
                    Ofertas Especiales
                </h2>
                <Link
                    href="/productos"
                    className="text-gray-400 hover:text-[#e60012] transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </Link>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Card 1 - Hamburguesas */}
                <Link href="/productos?categoria=hamburguesas" className="group">
                    <div className="relative bg-gradient-to-br from-orange-400 via-orange-500 to-red-500 rounded-2xl overflow-hidden shadow-lg aspect-[3/4]">
                        {/* Badge */}
                        <span className="absolute top-3 left-3 bg-[#e60012] text-white text-[10px] px-2 py-0.5 rounded-full font-bold z-10">
                            Promo
                        </span>

                        {/* Content */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
                            <h3 className="text-lg font-bold text-white leading-tight">
                                Menú de<br />Hamburgesas<br />¡2x1!
                            </h3>
                            <p className="text-xs text-white/80 mt-1 mb-3">
                                Consigue 2 por el precio de 1. !Hoy solamente!
                            </p>
                            <span className="inline-flex items-center gap-1 text-white text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full w-fit">
                                Explorar ofertas
                                <ChevronRight className="w-3 h-3" />
                            </span>
                        </div>

                        {/* Burger Illustration */}
                        <div className="absolute top-2 right-0 w-24 h-24 opacity-90">
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
                    <div className="relative bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 rounded-2xl overflow-hidden shadow-lg aspect-[3/4]">
                        {/* Content at bottom */}
                        <div className="absolute inset-0 p-4 flex flex-col justify-end z-10">
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">
                                Promoion<br />Envesedos
                            </h3>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-600">
                                    Suger grattas
                                </span>
                                <span className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                                    <ChevronRight className="w-4 h-4 text-white" />
                                </span>
                            </div>
                        </div>

                        {/* Food Illustration */}
                        <div className="absolute top-2 right-2 left-2 h-28">
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
