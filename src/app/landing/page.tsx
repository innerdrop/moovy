"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ArrowLeft, ShoppingBag, Briefcase, Compass, Star, ChevronDown, MapPin, Menu, X, Home, Info, Instagram, Gift, Users, Award, ChevronRight, Bike, Store, Hotel, Map, Send, HelpCircle } from "lucide-react";
import { useEffect, useState, useRef, useCallback } from "react";

// ============================================
// TYPES & CONFIGURATION
// ============================================
interface SlideConfig {
    id: string;
    color: string;
    secondaryColor?: string;
    title: string;
    subtitle: string;
    description: string;
    cta: string;
    href: string;
    icon: React.ReactNode;
    badge?: string;
    logo?: string;
}

const slidesConfig: SlideConfig[] = [
    {
        id: "tienda",
        color: "#e60012",
        title: "Tu antojo",
        subtitle: "manda.",
        description: "Todo lo que Ushuaia tiene para ofrecer, en una sola app.",
        cta: "Explorar Tienda",
        href: "/tienda",
        icon: <ShoppingBag className="w-8 h-8" />,
    },
    {
        id: "jobs",
        color: "#003a9b",
        secondaryColor: "#f26101",
        title: "Tu trabajo",
        subtitle: "te espera.",
        description: "Oportunidades laborales en el fin del mundo.",
        cta: "Ver Empleos",
        href: "https://jobs.somosmoovy.com",
        icon: <Briefcase className="w-8 h-8" />,
        badge: "Nuevo",
        logo: "/logo-jobs-v2.png",
    },
    {
        id: "x",
        color: "#00D4AA",
        title: "Tu aventura",
        subtitle: "comienza.",
        description: "Turismo y experiencias únicas en Ushuaia.",
        cta: "Próximamente",
        href: "/moovyx",
        icon: <Compass className="w-8 h-8" />,
        badge: "Próximamente",
    },
];

// ============================================
// FLOATING STAR COMPONENT
// ============================================
function FloatingStar({ delay, duration, left, top }: { delay: number; duration: number; left: string; top: string }) {
    return (
        <div
            className="absolute animate-float text-amber-400/60 pointer-events-none"
            style={{ left, top, animationDelay: `${delay}s`, animationDuration: `${duration}s` }}
        >
            <Star className="w-4 h-4 fill-amber-400" />
        </div>
    );
}

// ============================================
// MOBILE MENU
// ============================================
function MobileMenu({ isOpen, onClose, accentColor }: { isOpen: boolean; onClose: () => void; accentColor: string }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <span className="text-2xl font-bold" style={{ color: accentColor, fontFamily: "'Junegull', sans-serif" }}>MOOVY</span>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <nav className="space-y-1">
                    <Link href="/" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-medium text-gray-900 border-b border-gray-50">
                        <Home className="w-5 h-5" style={{ color: accentColor }} /> Inicio
                    </Link>
                    <Link href="/tienda" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-medium text-gray-900 border-b border-gray-50">
                        <ShoppingBag className="w-5 h-5 text-[#e60012]" /> Tienda
                    </Link>
                    <Link href="https://jobs.somosmoovy.com" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-medium text-gray-900 border-b border-gray-50">
                        <Briefcase className="w-5 h-5 text-[#2563eb]" /> Jobs
                        <span className="ml-auto text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Nuevo</span>
                    </Link>
                    <Link href="/moovyx" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-medium text-gray-900 border-b border-gray-50">
                        <Compass className="w-5 h-5 text-[#00D4AA]" /> MOOVY X
                        <span className="ml-auto text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">Próximamente</span>
                    </Link>
                    <Link href="/nosotros" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-medium text-gray-900 border-b border-gray-50">
                        <Info className="w-5 h-5" style={{ color: accentColor }} /> Quiénes Somos
                    </Link>
                </nav>

                <div className="mt-auto pt-8 space-y-3">
                    <Link href="/login" onClick={onClose} className="block w-full py-3 text-center border-2 border-gray-200 rounded-xl font-bold text-gray-700">
                        Iniciar Sesión
                    </Link>
                    <Link
                        href="/registro"
                        onClick={onClose}
                        className="block w-full py-3 text-center rounded-xl font-bold text-white"
                        style={{ backgroundColor: accentColor }}
                    >
                        Crear Cuenta
                    </Link>
                </div>
            </div>
        </div>
    );
}

// ============================================
// SLIDE DOTS NAVIGATION
// ============================================
function SlideDots({ total, current, onSelect, colors }: { total: number; current: number; onSelect: (i: number) => void; colors: string[] }) {
    return (
        <div className="fixed right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col gap-3">
            {Array.from({ length: total }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => onSelect(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-300 border-2 ${i === current ? "scale-125" : "opacity-50 hover:opacity-100"
                        }`}
                    style={{
                        backgroundColor: i === current ? colors[i] : "transparent",
                        borderColor: colors[i],
                    }}
                    aria-label={`Ir a slide ${i + 1}`}
                />
            ))}
        </div>
    );
}

// ============================================
// SLIDE ARROWS
// ============================================
function SlideArrows({ onPrev, onNext, currentColor, hasPrev, hasNext }: { onPrev: () => void; onNext: () => void; currentColor: string; hasPrev: boolean; hasNext: boolean }) {
    return (
        <>
            {hasPrev && (
                <button
                    onClick={onPrev}
                    className="fixed left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-all"
                    aria-label="Slide anterior"
                >
                    <ArrowLeft className="w-5 h-5 text-white" />
                </button>
            )}
            {hasNext && (
                <button
                    onClick={onNext}
                    className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center hover:bg-white/60 transition-all"
                    aria-label="Siguiente slide"
                >
                    <ArrowRight className="w-5 h-5 text-white" />
                </button>
            )}
        </>
    );
}

// ============================================
// SINGLE HERO SLIDE
// ============================================
function HeroSlide({ slide, isActive }: { slide: SlideConfig; isActive: boolean }) {
    return (
        <div
            className={`min-w-full h-screen flex flex-col transition-opacity duration-500 ${isActive ? "opacity-100" : "opacity-50"}`}
            style={{ backgroundColor: slide.color }}
        >
            {/* Pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* Content */}
            <div className="flex-1 flex items-center justify-center relative z-10 px-6">
                <div className="text-center max-w-2xl">
                    {/* Badge */}
                    {slide.badge && (
                        <span className="inline-block bg-white/20 text-white text-xs font-bold px-4 py-1.5 rounded-full mb-6 backdrop-blur-sm">
                            {slide.badge}
                        </span>
                    )}

                    {/* Title */}
                    <h1
                        className="text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold leading-[0.95] mb-6 tracking-tight"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        {slide.title}
                        <br />
                        <span className="font-black">{slide.subtitle}</span>
                    </h1>

                    {/* Description */}
                    <p className="text-white/90 text-lg sm:text-xl font-medium max-w-md mx-auto mb-8">
                        {slide.description}
                    </p>

                    {/* CTA */}
                    <Link
                        href={slide.href}
                        className="group inline-flex items-center gap-2 bg-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:scale-105 transition-all duration-300"
                        style={{ color: slide.color }}
                    >
                        <span>{slide.cta}</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70 animate-bounce">
                <ChevronDown className="w-6 h-6" />
            </div>
        </div>
    );
}

// ============================================
// EXPANDABLE CARD (for community section)
// ============================================
function ExpandableCard({ href, loginHref, icon: Icon, title, description, details, delay, accentColor = "#e60012", registerText = "Registrarme", loginText = "Ya tengo cuenta" }: any) {
    const [isVisible, setIsVisible] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    const handleToggle = (e: React.MouseEvent) => {
        if (window.innerWidth < 768) {
            e.preventDefault();
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div
                onClick={handleToggle}
                className={`bg-gray-50 border border-gray-100 rounded-2xl p-5 transition-all duration-500 overflow-hidden relative cursor-pointer hover:shadow-md ${isExpanded ? 'shadow-md' : ''}`}
            >
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}10` }}>
                        <Icon className="w-6 h-6" style={{ color: accentColor }} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 md:hidden ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                        <p className={`text-gray-500 text-sm transition-all duration-300 ${isExpanded ? 'opacity-0 h-0' : 'mt-1'}`}>{description}</p>
                    </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">{details}</p>
                    <div className="flex flex-wrap gap-2">
                        <Link href={href} className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white" onClick={(e) => e.stopPropagation()}>
                            {registerText} <ChevronRight className="w-4 h-4" />
                        </Link>
                        {loginHref && (
                            <Link href={loginHref} className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100" onClick={(e) => e.stopPropagation()}>
                                {loginText}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// MAIN LANDING PAGE
// ============================================
export default function LandingPage() {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showMooverInfo, setShowMooverInfo] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const touchStartX = useRef(0);
    const touchEndX = useRef(0);

    const currentColor = slidesConfig[currentSlide].color;

    // Handle wheel for horizontal scroll
    const handleWheel = useCallback((e: WheelEvent) => {
        // Only handle in hero section
        if (window.scrollY > window.innerHeight * 0.5) return;

        if (isScrolling) return;

        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;

        if (Math.abs(delta) < 30) return;

        setIsScrolling(true);

        if (delta > 0 && currentSlide < slidesConfig.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else if (delta < 0 && currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }

        setTimeout(() => setIsScrolling(false), 800);
    }, [currentSlide, isScrolling]);

    // Handle touch for swipe
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        touchEndX.current = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX.current;

        if (Math.abs(diff) > 50) {
            if (diff > 0 && currentSlide < slidesConfig.length - 1) {
                setCurrentSlide(prev => prev + 1);
            } else if (diff < 0 && currentSlide > 0) {
                setCurrentSlide(prev => prev - 1);
            }
        }
    };

    useEffect(() => {
        window.addEventListener("wheel", handleWheel, { passive: true });
        return () => window.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    const goToSlide = (index: number) => setCurrentSlide(index);
    const goPrev = () => currentSlide > 0 && setCurrentSlide(prev => prev - 1);
    const goNext = () => currentSlide < slidesConfig.length - 1 && setCurrentSlide(prev => prev + 1);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 overflow-x-hidden">
            {/* Header */}
            <header
                className="fixed top-0 left-0 right-0 z-40 transition-all duration-500"
                style={{ backgroundColor: `${currentColor}ee` }}
            >
                <div className="container mx-auto px-4 py-3 grid grid-cols-3 items-center">
                    <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ushuaia, TDF</span>
                        <span className="sm:hidden">Ushuaia</span>
                    </div>

                    <Link href="/" className="flex justify-center">
                        {slidesConfig[currentSlide].logo ? (
                            <Image
                                src={slidesConfig[currentSlide].logo!}
                                alt="MOOVY Jobs"
                                width={120}
                                height={40}
                                className="h-8 w-auto object-contain"
                            />
                        ) : (
                            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tighter" style={{ fontFamily: "'Junegull', sans-serif" }}>
                                MOOVY
                            </span>
                        )}
                    </Link>

                    <div className="flex justify-end">
                        <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <Menu className="w-6 h-6 text-white" />
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} accentColor={currentColor} />

            {/* Hero Slider Section */}
            <section
                ref={containerRef}
                className="relative h-screen overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="flex h-full transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slidesConfig.map((slide, index) => (
                        <HeroSlide key={slide.id} slide={slide} isActive={index === currentSlide} />
                    ))}
                </div>

                {/* Navigation */}
                <SlideArrows
                    onPrev={goPrev}
                    onNext={goNext}
                    currentColor={currentColor}
                    hasPrev={currentSlide > 0}
                    hasNext={currentSlide < slidesConfig.length - 1}
                />
            </section>

            {/* Content Section Below Slider - Dynamic based on slide */}
            <section className="py-12 sm:py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* TIENDA CONTENT */}
                        {currentSlide === 0 && (
                            <>
                                {/* Tienda + MOOVER Card */}
                                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8 relative overflow-hidden mb-8">
                                    <FloatingStar left="85%" top="5%" delay={0} duration={4} />
                                    <FloatingStar left="92%" top="50%" delay={2} duration={3.5} />
                                    <FloatingStar left="78%" top="75%" delay={1} duration={5} />

                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-[#e60012] to-[#ff4444] rounded-xl flex items-center justify-center shadow-lg">
                                                <ShoppingBag className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Tienda Online</h2>
                                                <p className="text-sm text-gray-500">Pedí y recibí en minutos</p>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 mb-4 max-w-2xl">
                                            Explorá cientos de comercios locales, restaurantes y farmacias. Cada compra suma puntos que podés canjear por descuentos exclusivos.
                                        </p>

                                        <div className="flex items-center gap-3 mb-4">
                                            <Star className="w-7 h-7 text-amber-500 fill-amber-400" />
                                            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500" style={{ fontFamily: "'Junegull', sans-serif" }}>
                                                MOOVER
                                            </span>
                                        </div>

                                        <div className="mb-6">
                                            <button onClick={() => setShowMooverInfo(!showMooverInfo)} className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3 lg:hidden">
                                                <span>Ver beneficios MOOVER</span>
                                                <ChevronDown className={`w-4 h-4 transition-transform ${showMooverInfo ? 'rotate-180' : ''}`} />
                                            </button>

                                            <div className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-3 transition-all duration-500 ${showMooverInfo ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0 overflow-hidden lg:max-h-none lg:opacity-100'}`}>
                                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                    <Gift className="w-5 h-5 text-amber-500 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700">Puntos por cada compra</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                    <Award className="w-5 h-5 text-orange-500 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700">Niveles VIP con más beneficios</span>
                                                </div>
                                                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                    <Users className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                                                    <span className="text-sm text-gray-700">Referidos: ganan los dos</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Link href="/tienda" className="inline-flex items-center justify-center gap-2 bg-[#e60012] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#cc000f] transition-colors">
                                                Ir a la Tienda <ArrowRight className="w-4 h-4" />
                                            </Link>
                                            <Link href="/moover" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors">
                                                Más sobre MOOVER <ChevronRight className="w-4 h-4" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>

                                {/* Community Section - Tienda */}
                                <div className="text-center mb-6">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Sumate a la comunidad</h2>
                                    <p className="text-gray-500 text-sm">Crecemos juntos en el fin del mundo.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                    {/* Repartidores - Próximamente */}
                                    <div className="bg-gray-100 border border-gray-200 rounded-2xl p-5 relative opacity-70">
                                        <div className="absolute -top-2 -right-2">
                                            <span className="bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                                                Próximamente
                                            </span>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-200">
                                                <Bike className="w-6 h-6 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-500 text-lg">Repartidores</h3>
                                                <p className="text-gray-400 text-sm mt-1">Generá ingresos con libertad</p>
                                            </div>
                                        </div>
                                    </div>
                                    <ExpandableCard
                                        delay={200}
                                        href="/socios/registro"
                                        loginHref="/socios/login"
                                        icon={Store}
                                        title="Comercios"
                                        description="Potenciá tus ventas hoy"
                                        details="Sumate a la plataforma digital líder del fin del mundo. Llegá a nuevos clientes."
                                        accentColor="#e60012"
                                    />
                                </div>
                            </>
                        )}

                        {/* JOBS CONTENT */}
                        {currentSlide === 1 && (
                            <>
                                <div className="grid md:grid-cols-2 gap-6 mb-8">
                                    {/* Buscás Empleo */}
                                    <div className="bg-[#003a9b]/5 border border-[#003a9b]/20 rounded-2xl p-6 sm:p-8">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-[#003a9b] to-[#0052cc] rounded-xl flex items-center justify-center shadow-lg">
                                                <Users className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Buscás Empleo</h2>
                                                <p className="text-sm text-gray-500">Encontrá tu oportunidad</p>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 mb-6">
                                            Explorá ofertas laborales en Ushuaia. Repartidor, staff, atención al cliente y más.
                                        </p>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                <Bike className="w-5 h-5 text-[#f26101] flex-shrink-0" />
                                                <span className="text-sm text-gray-700">Repartidor / Delivery</span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                <Store className="w-5 h-5 text-[#f26101] flex-shrink-0" />
                                                <span className="text-sm text-gray-700">Staff / Atención</span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                <Briefcase className="w-5 h-5 text-[#f26101] flex-shrink-0" />
                                                <span className="text-sm text-gray-700">Administrativo</span>
                                            </div>
                                        </div>

                                        <Link
                                            href="https://jobs.somosmoovy.com"
                                            className="inline-flex items-center justify-center gap-2 bg-[#f26101] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#e05500] transition-colors w-full"
                                        >
                                            Ver Empleos <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    {/* Tenés Ofertas */}
                                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 bg-gradient-to-br from-gray-700 to-gray-900 rounded-xl flex items-center justify-center shadow-lg">
                                                <Store className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Tenés Ofertas</h2>
                                                <p className="text-sm text-gray-500">Publicá y encontrá talento</p>
                                            </div>
                                        </div>

                                        <p className="text-gray-600 mb-6">
                                            ¿Tenés una empresa? Publicá tus ofertas laborales y encontrá el personal ideal.
                                        </p>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                <Gift className="w-5 h-5 text-[#003a9b] flex-shrink-0" />
                                                <span className="text-sm text-gray-700">Publicación gratuita</span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                <Award className="w-5 h-5 text-[#003a9b] flex-shrink-0" />
                                                <span className="text-sm text-gray-700">Gestión de candidatos</span>
                                            </div>
                                            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-100">
                                                <Users className="w-5 h-5 text-[#003a9b] flex-shrink-0" />
                                                <span className="text-sm text-gray-700">Alcance local</span>
                                            </div>
                                        </div>

                                        <Link
                                            href="https://jobs.somosmoovy.com/empresas"
                                            className="inline-flex items-center justify-center gap-2 bg-[#003a9b] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#002d7a] transition-colors w-full"
                                        >
                                            Publicar Oferta <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* MOOVY X CONTENT */}
                        {currentSlide === 2 && (
                            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 border border-teal-100 rounded-2xl p-6 sm:p-8 text-center">
                                <div className="mb-4">
                                    <span className="text-3xl sm:text-4xl font-black tracking-tight" style={{ fontFamily: "'Junegull', sans-serif" }}>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-sky-500 to-emerald-500">MOOVY</span>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 ml-1">X</span>
                                    </span>
                                </div>
                                <span className="inline-block bg-teal-100 text-teal-700 text-xs font-bold px-4 py-1.5 rounded-full mb-4">
                                    Próximamente
                                </span>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Experiencias turísticas</h2>
                                <p className="text-gray-600 max-w-lg mx-auto">
                                    Explorá el Fin del Mundo. Excursiones, hoteles, tours y servicios para turistas. Muy pronto en MOOVY.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative bg-gray-900 text-white pt-12 sm:pt-16 pb-6 sm:pb-8 overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 sm:-mr-16 -mt-8 sm:-mt-16 opacity-5 pointer-events-none">
                    <span className="text-[150px] sm:text-[250px] font-black leading-none select-none" style={{ fontFamily: "'Junegull', sans-serif" }}>M</span>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12 max-w-5xl mx-auto">
                        <div className="col-span-2 md:col-span-1">
                            <span className="text-2xl sm:text-3xl font-bold block mb-4" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span>
                            <div className="flex gap-3">
                                <a href="https://instagram.com/somosmoovy" target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#e60012] transition-all">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Explorar</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/tienda" className="text-white/60 hover:text-white transition-all">Tienda</Link></li>
                                <li><Link href="/moover" className="text-white/60 hover:text-white transition-all">MOOVER</Link></li>
                                <li><Link href="https://jobs.somosmoovy.com" className="text-white/60 hover:text-white transition-all">Jobs</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Comunidad</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/riders/registro" className="text-white/60 hover:text-white transition-all">Repartidores</Link></li>
                                <li><Link href="/socios/registro" className="text-white/60 hover:text-white transition-all">Comercios</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/terminos" className="text-white/60 hover:text-white transition-all">Términos</Link></li>
                                <li><Link href="/privacidad" className="text-white/60 hover:text-white transition-all">Privacidad</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/10 pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/40 max-w-5xl mx-auto">
                        <p>© {new Date().getFullYear()} <span style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span><sup style={{ fontFamily: "'Poppins', sans-serif", fontSize: '8px' }}>™</sup>. Hecho en el Fin del Mundo.</p>
                        <p>Ushuaia, Tierra del Fuego</p>
                    </div>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateY(-100px) rotate(45deg); opacity: 0; }
                }
                .animate-float {
                    animation-name: float;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
                @keyframes float-slow {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-6px); }
                }
                .animate-float-slow {
                    animation: float-slow 3s ease-in-out infinite;
                }
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
