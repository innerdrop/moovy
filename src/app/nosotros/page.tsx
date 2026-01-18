"use client";

import Link from "next/link";
import { ArrowLeft, Instagram, Menu, X, Check, MapPin, Clock, Truck } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

// --- Components ---

function MinimalFooter() {
    return (
        <footer className="w-full max-w-7xl mx-auto px-6 py-6 border-t border-white/20 mt-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">

                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                    <p className="text-white/60 text-xs text-center md:text-left">
                        © {new Date().getFullYear()} MOOVY™.
                    </p>
                    <div className="flex gap-6 text-[10px] uppercase font-bold tracking-widest text-white/80">
                        <Link href="/terminos" className="hover:text-white hover:underline">Términos</Link>
                        <Link href="/privacidad" className="hover:text-white hover:underline">Privacidad</Link>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                        <Instagram className="w-4 h-4" /> Instagram
                    </a>
                </div>
            </div>
        </footer>
    );
}

export default function AboutPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#e60012] font-sans text-white flex flex-col selection:bg-white selection:text-[#e60012] overflow-x-hidden">

            {/* --- Header --- */}
            <header className="px-6 py-5 md:py-6 flex justify-between items-center max-w-7xl mx-auto w-full relative z-20 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Link href="/" className="text-2xl font-bold text-white tracking-tighter" style={{ fontFamily: "'Junegull', sans-serif" }}>
                        MOOVY
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/90">
                    <Link href="/" className="hover:text-white transition-colors hover:underline decoration-2 underline-offset-4">Inicio</Link>
                    <Link href="/tienda" className="hover:text-white transition-colors hover:underline decoration-2 underline-offset-4">Tienda</Link>
                    <Link href="/ayuda" className="hover:text-white transition-colors hover:underline decoration-2 underline-offset-4">Ayuda</Link>
                    <Link href="/login" className="hover:text-white transition-colors font-bold">Ingresar</Link>
                </nav>

                <Link href="/" className="md:hidden text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
            </header>

            {/* --- Main Content --- */}
            <main className="flex-grow flex flex-col items-center px-4 md:px-6 w-full max-w-7xl mx-auto py-12 md:py-20">

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">

                    {/* Text Section */}
                    <div className="animate-fade-up order-2 lg:order-1">
                        <span className="text-amber-300 font-bold uppercase tracking-widest text-xs mb-4 block">
                            Nuestra Historia
                        </span>
                        <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight leading-none">
                            Conectando el Fin del Mundo.
                        </h1>

                        <div className="space-y-6 text-white/90 text-lg font-medium leading-relaxed">
                            <p>
                                Nacimos en Ushuaia con una misión simple: <span className="text-white font-bold">conectar a nuestra comunidad.</span> Entendemos que vivir en el extremo sur requiere soluciones logísticas ágiles, confiables y cercanas.
                            </p>
                            <p>
                                MOOVY no es solo una app de delivery. Somos una plataforma que empodera a los comercios locales, brinda oportunidades a repartidores independientes y hace la vida más fácil a cada vecino.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
                            <div className="bg-white/10 rounded-xl p-5 border border-white/5 hover:bg-white/20 transition-colors">
                                <Truck className="w-8 h-8 text-amber-300 mb-3" />
                                <h3 className="font-bold text-xl mb-1">Rápido</h3>
                                <p className="text-sm text-white/70">Entregas en minutos, optimizadas con tecnología.</p>
                            </div>
                            <div className="bg-white/10 rounded-xl p-5 border border-white/5 hover:bg-white/20 transition-colors">
                                <MapPin className="w-8 h-8 text-amber-300 mb-3" />
                                <h3 className="font-bold text-xl mb-1">Local</h3>
                                <p className="text-sm text-white/70">100% Fueguinos. Conocemos cada calle de Ushuaia.</p>
                            </div>
                        </div>

                        <div className="mt-10 pt-10 border-t border-white/20">
                            <Link href="/registro" className="inline-flex items-center gap-2 font-bold hover:gap-4 transition-all">
                                Unite a la revolución <ArrowLeft className="w-5 h-5 rotate-180" />
                            </Link>
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="relative order-1 lg:order-2 animate-fade-in group">
                        <div className="absolute inset-0 bg-amber-400 rounded-[3rem] rotate-3 opacity-20 blur-xl group-hover:rotate-6 transition-transform duration-500"></div>
                        <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/30 border-4 border-white/20">
                            <Image
                                src="/images/about-hero.png"
                                alt="Equipo MOOVY en Ushuaia"
                                width={800}
                                height={800}
                                className="w-full h-auto object-cover hover:scale-105 transition-transform duration-700"
                            />

                            {/* Floating Quote Card */}
                            <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/50 md:max-w-xs ml-auto">
                                <p className="text-gray-800 text-sm font-bold italic mb-3">
                                    "Queremos que cada pedido sea una experiencia, no solo un envío."
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-[#e60012] rounded-full flex items-center justify-center text-white font-black text-xs">M</div>
                                    <div>
                                        <p className="text-xs font-black text-[#e60012] uppercase tracking-wider">Equipo Moovy</p>
                                        <p className="text-[10px] text-gray-500">Ushuaia, TDF</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

            </main>

            {/* --- Minimal Footer --- */}
            <MinimalFooter />
        </div>
    );
}
