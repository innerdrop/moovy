"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Car, Store, Instagram, Menu, X, Home, Info, HelpCircle } from "lucide-react";
import { useState } from "react";

// --- Components ---

function SmartCard({ href, icon: Icon, title, description }: any) {
    return (
        <Link
            href={href}
            className="group relative bg-white rounded-2xl p-6 md:p-8 shadow-xl shadow-black/10 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col items-start text-left h-full border border-white/20"
        >
            <div className="flex items-center gap-4 mb-4">
                <div className="text-[#e60012] bg-red-50 p-3 rounded-xl group-hover:bg-[#e60012] group-hover:text-white transition-colors duration-300">
                    <Icon className="w-8 h-8" strokeWidth={2} />
                </div>
                <h3 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                    {title}
                </h3>
            </div>

            <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6 group-hover:text-gray-700 transition-colors">
                {description}
            </p>

            <div className="mt-auto flex items-center text-xs font-bold uppercase tracking-wider text-[#e60012]">
                <span className="group-hover:mr-2 transition-all">Ingresar</span>
                <ArrowRight className="w-4 h-4 ml-1" />
            </div>
        </Link>
    );
}

function MinimalFooter() {
    return (
        <footer className="w-full max-w-7xl mx-auto px-6 py-8 mt-auto">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-1 bg-white/20 rounded-full mb-4" />
                <div className="flex gap-8 text-[11px] uppercase font-bold tracking-[0.2em] text-white/60">
                    <Link href="/terminos" className="hover:text-white transition-colors">Términos</Link>
                    <Link href="/privacidad" className="hover:text-white transition-colors">Privacidad</Link>
                </div>
                <p className="text-white/40 text-[10px] tracking-wider font-medium">
                    © {new Date().getFullYear()} MOOVY™
                </p>
            </div>
        </footer>
    );
}

function MenuItem({ href, label, icon: Icon, onClick }: any) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex items-center gap-5 py-4 group"
        >
            <span className="text-gray-400 group-hover:text-white transition-colors">
                <Icon className="w-6 h-6" />
            </span>
            <span className="text-2xl font-bold text-white group-hover:pl-2 transition-all">{label}</span>
        </Link>
    );
}

export default function LandingPage() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#e60012] font-sans text-white flex flex-col selection:bg-white selection:text-[#e60012] overflow-x-hidden relative">

            {/* --- Background Gradient Mesh (Subtle) --- */}
            <div className="fixed inset-0 pointer-events-none opacity-30">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-600 rounded-full blur-[120px] mix-blend-multiply" />
            </div>

            {/* --- Header --- */}
            <header className="px-6 py-6 md:py-8 flex justify-between items-center max-w-7xl mx-auto w-full relative z-20">
                <span className="text-3xl font-black text-white tracking-tighter cursor-default select-none" style={{ fontFamily: "'Junegull', sans-serif" }}>
                    MOOVY
                </span>

                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="text-white hover:scale-110 transition-transform p-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10"
                >
                    <Menu className="w-6 h-6" />
                </button>
            </header>

            {/* --- Full Screen Menu Overlay --- */}
            <div className={`fixed inset-0 z-50 bg-[#e60012] flex flex-col transition-all duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                <div className="flex justify-between items-center px-6 py-6 md:py-8">
                    <span className="text-3xl font-black text-white tracking-tighter" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span>
                    <button onClick={() => setIsMenuOpen(false)} className="text-white hover:rotate-90 transition-transform duration-300 p-2 bg-white/10 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col justify-center items-center p-6 space-y-2">
                    <MenuItem href="/" label="Inicio" icon={Home} onClick={() => setIsMenuOpen(false)} />
                    <MenuItem href="/tienda" label="Tienda" icon={ShoppingBag} onClick={() => setIsMenuOpen(false)} />
                    <MenuItem href="/nosotros" label="Nosotros" icon={Info} onClick={() => setIsMenuOpen(false)} />
                    <MenuItem href="/ayuda" label="Ayuda" icon={HelpCircle} onClick={() => setIsMenuOpen(false)} />

                    <div className="h-8" />

                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-sm uppercase tracking-widest font-bold text-white/60 hover:text-white transition-colors border border-white/20 px-8 py-3 rounded-full hover:bg-white/10">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>

            {/* --- Main Content --- */}
            <main className="flex-grow flex flex-col items-center justify-center relative z-10 w-full max-w-7xl mx-auto px-4 py-8">

                {/* Hero Text */}
                <div className="text-center mb-12 md:mb-16 animate-fade-up">
                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.8] drop-shadow-sm mb-4">
                        TU ANTOJO<br />
                        <span className="text-white/90">
                            MANDA!
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl font-medium text-white/80 max-w-xl mx-auto">
                        La forma más rápida de pedir lo que quieras en Ushuaia.
                    </p>
                </div>

                {/* Smart Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 w-full max-w-5xl mx-auto animate-fade-up delay-150">

                    <SmartCard
                        href="/tienda"
                        icon={ShoppingBag}
                        title="TIENDA"
                        description="Explorá cientos de marcas y recibí tu pedido en minutos."
                    />

                    <SmartCard
                        href="/conductor/registro"
                        icon={Car}
                        title="CONDUCIR"
                        description="Manejá tus horarios y generá ganancias extra con tu vehículo."
                    />

                    <SmartCard
                        href="/comercio/registro"
                        icon={Store}
                        title="NEGOCIO"
                        description="Potenciá tus ventas sumando tu comercio a nuestra red."
                    />

                </div>

            </main>

            {/* --- Minimal Footer --- */}
            <MinimalFooter />
        </div>
    );
}
