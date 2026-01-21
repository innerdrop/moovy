"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Car, Store, Instagram, Facebook, Twitter, Menu, X } from "lucide-react";
import { useState } from "react";

// --- Components ---

function CompactCard({ href, icon: Icon, title, description, badge, featured = false }: any) {
    return (
        <Link
            href={href}
            className={`
                group rounded-3xl p-8 transition-all duration-300 flex flex-col h-full relative overflow-hidden
                ${featured
                    ? 'bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] scale-105 md:scale-110 z-10 border-4 border-amber-400'
                    : 'bg-white/95 shadow-xl shadow-black/10 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1'
                }
            `}
        >
            <div className="flex justify-between items-start mb-6">
                <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                    ${featured ? 'bg-[#e60012] text-white' : 'bg-red-50 text-[#e60012] group-hover:bg-[#e60012] group-hover:text-white'}
                `}>
                    <Icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                {badge && (
                    <span className="px-3 py-1 bg-amber-400 text-black text-xs font-black rounded-full uppercase tracking-wider shadow-sm">
                        {badge}
                    </span>
                )}
            </div>

            <h3 className={`text-2xl font-black mb-3 transition-colors ${featured ? 'text-[#e60012]' : 'text-gray-900 group-hover:text-[#e60012]'}`}>
                {title}
            </h3>

            <p className="text-gray-500 leading-relaxed mb-8 flex-grow font-medium">
                {description}
            </p>

            <div className={`
                flex items-center text-sm font-bold mt-auto transition-colors
                ${featured ? 'text-[#e60012]' : 'text-gray-400 group-hover:text-[#e60012]'}
            `}>
                {featured ? 'Ir a la Tienda' : 'Ver más'}
                <ArrowRight className={`w-5 h-5 ml-2 transition-transform ${featured ? 'translate-x-1' : 'group-hover:translate-x-1'}`} />
            </div>
        </Link>
    );
}

function MinimalFooter() {
    return (
        <footer className="w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/20 mt-auto">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                    <p className="text-white/60 text-xs text-center md:text-left">
                        © {new Date().getFullYear()} Moovy App.
                    </p>
                    <div className="flex gap-6 text-xs font-medium text-white/80">
                        <Link href="/terminos" className="hover:text-white hover:underline">Términos y Condiciones</Link>
                        <Link href="/privacidad" className="hover:text-white hover:underline">Política de Privacidad</Link>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <a href="#" className="text-white/60 hover:text-white transition-colors"><Instagram className="w-5 h-5" /></a>
                    <a href="#" className="text-white/60 hover:text-white transition-colors"><Facebook className="w-5 h-5" /></a>
                    <a href="#" className="text-white/60 hover:text-white transition-colors"><Twitter className="w-5 h-5" /></a>
                </div>
            </div>
        </footer>
    );
}

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#e60012] font-sans text-white flex flex-col selection:bg-white selection:text-[#e60012] overflow-x-hidden">

            {/* --- Header --- */}
            <header className="px-6 py-6 md:py-8 flex justify-between items-center max-w-7xl mx-auto w-full relative z-20">
                <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold text-white tracking-tighter" style={{ fontFamily: "'Junegull', sans-serif" }}>
                        MOOVY
                    </span>
                </div>

                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/90">
                    <Link href="/nosotros" className="hover:text-white transition-colors">Nosotros</Link>
                    <Link href="/ayuda" className="hover:text-white transition-colors">Ayuda</Link>
                    <Link href="/login" className="hover:text-white transition-colors font-bold">Ingresar</Link>
                    <Link href="/registro" className="bg-white text-[#e60012] px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-gray-50 transition-all hover:-translate-y-0.5">
                        Crear Cuenta
                    </Link>
                </nav>

                <button onClick={() => setIsMenuOpen(true)} className="md:hidden text-white">
                    <Menu className="w-8 h-8" />
                </button>
            </header>

            {/* --- Mobile Menu --- */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 bg-[#e60012] flex flex-col p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-12">
                        <span className="text-3xl font-bold text-white" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span>
                        <button onClick={() => setIsMenuOpen(false)}><X className="w-8 h-8 text-white" /></button>
                    </div>
                    <div className="flex flex-col gap-6 text-2xl font-bold text-white">
                        <Link href="/tienda" onClick={() => setIsMenuOpen(false)}>Tienda</Link>
                        <Link href="/nosotros" onClick={() => setIsMenuOpen(false)}>Nosotros</Link>
                        <Link href="/login" onClick={() => setIsMenuOpen(false)}>Ingresar</Link>
                    </div>
                </div>
            )}

            {/* --- Main Content --- */}
            <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-6 w-full max-w-7xl mx-auto py-12 md:py-16">

                <div className="text-center mb-16 md:mb-24 max-w-3xl animate-fade-up px-4">
                    <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight leading-[0.9]">
                        Tu ciudad, <br className="md:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-400 drop-shadow-sm">
                            en tus manos.
                        </span>
                    </h1>
                    <p className="text-white/90 text-lg md:text-2xl font-medium leading-relaxed">
                        Delivery, logística y crecimiento. <br className="hidden md:block" /> Todo en una sola plataforma.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 w-full items-stretch px-2 md:px-8">

                    {/* --- CLIENT (Featured) --- */}
                    <div className="md:-mt-8 md:mb-8 animate-fade-up delay-100 order-1 md:order-2">
                        <CompactCard
                            href="/tienda"
                            icon={ShoppingBag}
                            title="Clientes"
                            description="Entrá a la tienda y pedí lo que quieras. Supermercados, restaurantes y kioscos con envío inmediato."
                            badge="RECOMENDADO"
                            featured={true}
                        />
                    </div>

                    {/* --- DRIVER --- */}
                    <div className="animate-fade-up delay-200 order-2 md:order-1">
                        <CompactCard
                            href="/conductor/registro"
                            icon={Car}
                            title="Conductores"
                            description="Conectá envíos con tu vehículo y generá ganancias extra manejando tus propios horarios."
                        />
                    </div>

                    {/* --- MERCHANT --- */}
                    <div className="animate-fade-up delay-300 order-3 md:order-3">
                        <CompactCard
                            href="/comercio/registro"
                            icon={Store}
                            title="Comercios"
                            description="Sumá tu negocio a nuestra red y vendé online sin complicaciones técnicas."
                        />
                    </div>

                </div>

            </main>

            {/* --- Minimal Footer --- */}
            <MinimalFooter />
        </div>
    );
}
