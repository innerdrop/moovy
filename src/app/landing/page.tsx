"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import {
    ArrowRight,
    Menu,
    X,
    Zap,
    Mountain,
    Star,
    Smartphone,
    Globe,
    ChevronRight,
    Instagram,
    MessageCircle,
} from "lucide-react";
import MaintenancePage from "@/components/MaintenancePage";

// ============================================
// AURORA CANVAS - Light Theme
// ============================================
function AuroraCanvas() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient background - Light */}
            <div className="absolute inset-0 bg-[#FFFFFF]" />

            {/* Animated aurora lines - Adjusted for light theme */}
            <svg className="absolute inset-0 w-full h-full opacity-60" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <linearGradient id="auroraGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#e60012" stopOpacity="0" />
                        <stop offset="50%" stopColor="#e60012" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#00D4AA" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="auroraGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00D4AA" stopOpacity="0" />
                        <stop offset="50%" stopColor="#00D4AA" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#e60012" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Flowing lines */}
                <path
                    d="M-100,400 Q300,300 600,400 T1300,350"
                    fill="none"
                    stroke="url(#auroraGradient1)"
                    strokeWidth="2"
                    className="animate-aurora-flow-1"
                />
                <path
                    d="M-100,450 Q400,350 700,450 T1400,400"
                    fill="none"
                    stroke="url(#auroraGradient2)"
                    strokeWidth="1.5"
                    className="animate-aurora-flow-2"
                />
                <path
                    d="M-100,500 Q250,420 550,500 T1300,480"
                    fill="none"
                    stroke="url(#auroraGradient1)"
                    strokeWidth="1"
                    className="animate-aurora-flow-3"
                />
            </svg>

            {/* Floating particles - Dark for contrast */}
            {[
                { left: 5, top: 10, delay: 0, duration: 7 },
                { left: 15, top: 80, delay: 2, duration: 8 },
                { left: 25, top: 30, delay: 1, duration: 6 },
                { left: 35, top: 60, delay: 3, duration: 9 },
                { left: 45, top: 20, delay: 0.5, duration: 7 },
                { left: 55, top: 70, delay: 2.5, duration: 8 },
                { left: 65, top: 40, delay: 1.5, duration: 6 },
                { left: 75, top: 90, delay: 4, duration: 9 },
                { left: 85, top: 15, delay: 0.8, duration: 7 },
                { left: 95, top: 55, delay: 3.5, duration: 8 },
                { left: 10, top: 45, delay: 1.2, duration: 6 },
                { left: 20, top: 85, delay: 2.8, duration: 9 },
                { left: 30, top: 25, delay: 0.3, duration: 7 },
                { left: 40, top: 75, delay: 4.5, duration: 8 },
                { left: 50, top: 35, delay: 1.8, duration: 6 },
                { left: 60, top: 95, delay: 3.2, duration: 9 },
                { left: 70, top: 5, delay: 0.6, duration: 7 },
                { left: 80, top: 65, delay: 2.2, duration: 8 },
                { left: 90, top: 50, delay: 1.6, duration: 6 },
                { left: 98, top: 88, delay: 4.2, duration: 9 },
            ].map((particle, i) => (
                <div
                    key={i}
                    className="absolute w-1 h-1 rounded-full bg-gray-900/10 animate-particle-float"
                    style={{
                        left: `${particle.left}%`,
                        top: `${particle.top}%`,
                        animationDelay: `${particle.delay}s`,
                        animationDuration: `${particle.duration}s`,
                    }}
                />
            ))}

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
        </div>
    );
}

// ============================================
// ECOSYSTEM CARD
// ============================================
interface EcosystemCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    accent: string;
    href: string;
    badge?: string;
    delay: number;
}

function EcosystemCard({ title, description, icon, accent, href, badge, delay }: EcosystemCardProps) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setTimeout(() => setIsVisible(true), delay);
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [delay]);

    return (
        <Link href={href}>
            <div
                ref={ref}
                className={`group relative bg-white border border-gray-100 rounded-3xl p-8 transition-all duration-500 cursor-pointer
                    hover:bg-gray-50 hover:border-gray-200 hover:shadow-lg hover:-translate-y-1
                    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
                {badge && (
                    <span className="absolute top-4 right-4 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                        {badge}
                    </span>
                )}

                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${accent}10` }}
                >
                    <div style={{ color: accent }}>{icon}</div>
                </div>

                <h3 className="text-gray-900 text-xl font-semibold mb-2 font-moovy tracking-wide">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>

                <div className="mt-6 flex items-center gap-2 text-gray-400 group-hover:text-gray-900 transition-colors">
                    <span className="text-sm font-medium">Explorar</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
            </div>
        </Link>
    );
}

// ============================================
// LANDING HEADER
// ============================================
function LandingHeader() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const navLinks = [
        { label: "Ecosistema", href: "#ecosistema" },
        { label: "Comercios", href: "#comercios" },
        { label: "Nosotros", href: "#manifiesto" },
    ];

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                    ? "bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm"
                    : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-[72px]">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/logo-moovy.png"
                                alt="MOOVY"
                                width={120}
                                height={40}
                                className="h-8 w-auto"
                            />
                        </Link>

                        {/* Desktop Nav */}
                        <nav className="hidden md:flex items-center gap-8">
                            {navLinks.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    className="text-gray-500 hover:text-gray-900 text-[15px] font-medium transition-colors relative group"
                                >
                                    {link.label}
                                    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#e60012] transition-all group-hover:w-full" />
                                </a>
                            ))}
                        </nav>

                        {/* CTA */}
                        <div className="flex items-center gap-4">
                            <Link
                                href="/login"
                                className="hidden md:inline-flex items-center gap-2 bg-[#e60012] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#c4000f] transition-colors shadow-sm hover:shadow-md"
                            >
                                Acceder
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 text-gray-900"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-white pt-[72px]">
                    <nav className="flex flex-col p-6 gap-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-gray-900 text-xl font-medium py-3 border-b border-gray-100"
                            >
                                {link.label}
                            </a>
                        ))}
                        <Link
                            href="/login"
                            className="mt-4 flex items-center justify-center gap-2 bg-[#e60012] text-white font-semibold py-4 rounded-xl"
                        >
                            Acceder
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </nav>
                </div>
            )}
        </>
    );
}

// ============================================
// HERO SECTION
// ============================================
function HeroSection() {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
            <AuroraCanvas />

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                {/* Main Title: TODO SE MUEVE */}
                <h1 className="mb-8">
                    <span
                        className={`inline-block font-moovy text-gray-900 text-5xl md:text-7xl lg:text-8xl tracking-wider transition-all duration-500
                            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{ transitionDelay: "0ms" }}
                    >
                        TODO SE{" "}
                    </span>
                    {/* MUEVE with Apple-style shimmer */}
                    <span className="relative inline-block">
                        <span
                            className={`font-moovy text-5xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#e60012] via-[#ff4d5a] to-[#e60012] animate-shimmer bg-[length:200%_100%] transition-all duration-500
                                ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                            style={{ transitionDelay: "200ms" }}
                        >
                            MUEVE
                        </span>
                        {/* Subtle glow */}
                        <span className="absolute inset-0 font-moovy text-5xl md:text-7xl lg:text-8xl font-bold text-[#e60012] blur-xl opacity-20 animate-pulse">
                            MUEVE
                        </span>
                    </span>
                </h1>

                {/* Subtitle */}
                <div
                    className={`max-w-2xl mx-auto mb-10 transition-all duration-700
                        ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    style={{ transitionDelay: "400ms" }}
                >
                    <p className="text-gray-600 text-lg md:text-xl leading-relaxed">
                        Nacimos en el Fin del Mundo.<br />
                        Movemos personas, productos y posibilidades.<br />
                        <span className="text-gray-900 font-medium">Todo se mueve. Vos también.</span>
                    </p>
                </div>

                {/* CTA */}
                <div
                    className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700
                        ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    style={{ transitionDelay: "600ms" }}
                >
                    <a
                        href="#ecosistema"
                        className="inline-flex items-center gap-2 bg-[#e60012] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#c4000f] transition-all hover:shadow-[0_0_30px_rgba(230,0,18,0.3)] shadow-lg"
                    >
                        Descubrí el ecosistema
                    </a>
                    <Link
                        href="/tienda"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium px-8 py-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all"
                    >
                        Ir a la tienda
                        <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <div className="w-6 h-10 rounded-full border-2 border-gray-300 flex items-start justify-center p-2">
                    <div className="w-1 h-2 bg-gray-400 rounded-full animate-pulse" />
                </div>
            </div>
        </section>
    );
}

// ============================================
// ECOSYSTEM SECTION - Three Main Services
// ============================================
function EcosystemSection() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const services = [
        {
            title: "MOOVY Tienda",
            subtitle: "Delivery Express",
            description: "Todo lo que necesitás, en minutos. Comida, farmacia, supermercado y comercios locales.",
            color: "#e60012",
            href: "/tienda",
            icon: "🛒",
            cta: "Pedir ahora",
        },
        {
            title: "MOOVY Jobs",
            subtitle: "Oportunidades",
            description: "Sumate al equipo. Repartidores, comercios y más oportunidades de trabajo.",
            color: "#2563eb",
            href: "https://jobs.somosmoovy.com",
            icon: "💼",
            cta: "Ver ofertas",
            badge: "Nuevo",
        },
        {
            title: "MOOVY X",
            subtitle: "Experiencias",
            description: "Turismo y aventuras en el Fin del Mundo. Próximamente.",
            color: "#00D4AA",
            href: "/moovyx",
            icon: "🌎",
            cta: "Próximamente",
            disabled: true,
        },
    ];

    return (
        <section
            id="ecosistema"
            ref={ref}
            className="relative py-24 md:py-32 bg-gray-50"
        >
            <div className="max-w-7xl mx-auto px-6">
                {/* Section header */}
                <div
                    className={`text-center mb-16 transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <h2 className="text-gray-900 text-3xl md:text-5xl font-bold mb-4">
                        Tres mundos, una sola app
                    </h2>
                    <p className="text-gray-500 text-lg max-w-xl mx-auto">
                        El ecosistema que mueve al Fin del Mundo.
                    </p>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {services.map((service, index) => (
                        <div
                            key={service.title}
                            className={`group relative bg-white rounded-3xl overflow-hidden border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2
                                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            {/* Badge */}
                            {service.badge && (
                                <span
                                    className="absolute top-4 right-4 text-white text-xs font-bold px-3 py-1 rounded-full z-10"
                                    style={{ backgroundColor: service.color }}
                                >
                                    {service.badge}
                                </span>
                            )}

                            {/* Color bar */}
                            <div
                                className="h-2 w-full"
                                style={{ backgroundColor: service.color }}
                            />

                            {/* Content */}
                            <div className="p-8">
                                {/* Icon */}
                                <div className="text-5xl mb-6">{service.icon}</div>

                                {/* Title */}
                                <h3
                                    className="text-2xl font-bold mb-1"
                                    style={{ color: service.color }}
                                >
                                    {service.title}
                                </h3>
                                <p className="text-gray-400 text-sm font-medium mb-4">
                                    {service.subtitle}
                                </p>

                                {/* Description */}
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    {service.description}
                                </p>

                                {/* CTA Button */}
                                {service.disabled ? (
                                    <span className="inline-flex items-center gap-2 text-gray-400 font-medium cursor-not-allowed">
                                        {service.cta}
                                    </span>
                                ) : (
                                    <Link
                                        href={service.href}
                                        className="inline-flex items-center gap-2 font-semibold transition-all group-hover:gap-3"
                                        style={{ color: service.color }}
                                    >
                                        {service.cta}
                                        <ArrowRight className="w-4 h-4" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================
// WHY MOOVY SECTION
// ============================================
function WhySection() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const benefits = [
        { icon: <Zap className="w-5 h-5" />, title: "Entrega ultra rápida", desc: "Porque tu tiempo importa." },
        { icon: <Mountain className="w-5 h-5" />, title: "100% local", desc: "Apoyá comercios de Ushuaia." },
        { icon: <Star className="w-5 h-5" />, title: "Puntos en cada compra", desc: "Programa MOVER integrado." },
        { icon: <Smartphone className="w-5 h-5" />, title: "Todo en una app", desc: "Pedí, seguí, recibí." },
        { icon: <Globe className="w-5 h-5" />, title: "Más que delivery", desc: "Un ecosistema completo." },
    ];

    return (
        <section ref={ref} className="py-24 md:py-32 bg-white">
            <div className="max-w-6xl mx-auto px-6">
                <h2
                    className={`text-gray-900 text-3xl md:text-4xl font-bold text-center mb-16 transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    Por qué elegir MOOVY
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((benefit, index) => (
                        <div
                            key={benefit.title}
                            className={`flex items-start gap-4 transition-all duration-500
                                ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                            style={{ transitionDelay: `${index * 100}ms` }}
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#e60012]/10 flex items-center justify-center flex-shrink-0 text-[#e60012]">
                                {benefit.icon}
                            </div>
                            <div>
                                <h3 className="text-gray-900 font-semibold text-lg mb-1">{benefit.title}</h3>
                                <p className="text-gray-500 text-sm">{benefit.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ============================================
// BUSINESS SECTION
// ============================================
function BusinessSection() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const bullets = [
        "Sin comisiones ocultas — Transparencia total.",
        "Panel de control propio — Gestioná pedidos en tiempo real.",
        "Visibilidad garantizada — Miles de usuarios activos.",
        "Soporte local — Estamos acá, en Ushuaia.",
    ];

    return (
        <section id="comercios" ref={ref} className="py-24 md:py-32 bg-gray-50">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Text content */}
                    <div
                        className={`transition-all duration-700
                            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        <h2 className="text-gray-900 text-3xl md:text-4xl font-bold mb-4">
                            Hacé crecer tu negocio
                        </h2>
                        <p className="text-gray-500 text-lg mb-8">
                            Sumá tu comercio al ecosistema más grande de Ushuaia.
                        </p>

                        <ul className="space-y-4 mb-8">
                            {bullets.map((bullet, index) => (
                                <li
                                    key={index}
                                    className={`flex items-center gap-3 text-gray-500 transition-all duration-500
                                        ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`}
                                    style={{ transitionDelay: `${(index + 1) * 100}ms` }}
                                >
                                    <ChevronRight className="w-5 h-5 text-[#e60012]" />
                                    {bullet}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/comercio/registro"
                            className="inline-flex items-center gap-2 bg-[#e60012] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#c4000f] transition-all hover:shadow-[0_0_30px_rgba(230,0,18,0.2)] shadow-sm"
                        >
                            Sumate como comercio
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Visual placeholder */}
                    <div
                        className={`hidden lg:flex items-center justify-center transition-all duration-700 delay-300
                            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        <div className="w-full h-80 rounded-3xl bg-white border border-gray-100 shadow-xl flex items-center justify-center">
                            <div className="text-gray-300 text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[#e60012]/10 flex items-center justify-center">
                                    <Star className="w-10 h-10 text-[#e60012]/50" />
                                </div>
                                <p className="text-sm">Panel de comercio</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

// ============================================
// MANIFESTO SECTION
// ============================================
function ManifestoSection() {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) setIsVisible(true);
            },
            { threshold: 0.3 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const lines = [
        "Nacimos en el Fin del Mundo.",
        "Movemos personas, productos y posibilidades.",
    ];

    return (
        <section id="manifiesto" ref={ref} className="py-24 md:py-32 bg-white">
            <div className="max-w-3xl mx-auto px-6 text-center">
                {lines.map((line, index) => (
                    <p
                        key={index}
                        className={`text-gray-500 text-xl md:text-2xl font-medium mb-4 transition-all duration-700
                            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{ transitionDelay: `${index * 200}ms` }}
                    >
                        {line}
                    </p>
                ))}
                <p
                    className={`text-gray-900 text-xl md:text-2xl font-medium transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                    style={{ transitionDelay: "400ms" }}
                >
                    <span className="text-[#e60012]">Todo se mueve.</span> Y vos también.
                </p>
            </div>
        </section>
    );
}

// ============================================
// FOOTER
// ============================================
function LandingFooter() {
    return (
        <footer className="py-16 bg-gray-50 border-t border-gray-100">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Logo */}
                    <div>
                        <Image
                            src="/logo-moovy.png"
                            alt="MOOVY"
                            width={100}
                            height={32}
                            className="h-8 w-auto mb-4"
                        />
                        <p className="text-gray-500 text-sm">
                            El ecosistema que mueve al Fin del Mundo.
                        </p>
                    </div>

                    {/* Ecosistema */}
                    <div>
                        <h4 className="text-gray-900 font-semibold mb-4">Ecosistema</h4>
                        <ul className="space-y-2">
                            <li><Link href="/tienda" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Store</Link></li>
                            <li><Link href="/moovyx" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">X</Link></li>
                            <li><span className="text-gray-300 text-sm">Jobs</span></li>
                            <li><Link href="/puntos" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">MOVER</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-gray-900 font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link href="/terminos" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Términos</Link></li>
                            <li><Link href="/privacidad" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Privacidad</Link></li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <h4 className="text-gray-900 font-semibold mb-4">Contacto</h4>
                        <ul className="space-y-2">
                            <li className="text-gray-500 text-sm">Ushuaia, TDF</li>
                            <li><a href="mailto:somosmoovy@gmail.com" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">somosmoovy@gmail.com</a></li>
                        </ul>
                        <div className="flex gap-4 mt-4">
                            <a href="https://instagram.com/somosmoovy" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://wa.me/5492901234567" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-900 transition-colors">
                                <MessageCircle className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 text-center">
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} MOOVY™ · Ushuaia, Tierra del Fuego · Hecho con ❤️ en el Fin del Mundo
                    </p>
                </div>
            </div>
        </footer>
    );
}

// ============================================
// MAIN PAGE
// ============================================
export default function PremiumLandingPage() {
    const [isMaintenanceMode, setIsMaintenanceMode] = useState<boolean | null>(null);
    const [maintenanceMessage, setMaintenanceMessage] = useState("");

    // Check maintenance mode on mount
    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const res = await fetch("/api/maintenance");
                const data = await res.json();
                setIsMaintenanceMode(data.isMaintenanceMode);
                setMaintenanceMessage(data.maintenanceMessage);
            } catch {
                setIsMaintenanceMode(false);
            }
        };
        checkMaintenance();
    }, []);

    // Scroll to top on mount/refresh
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Loading state
    if (isMaintenanceMode === null) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#e60012]"></div>
            </div>
        );
    }

    // Maintenance mode
    if (isMaintenanceMode) {
        return <MaintenancePage message={maintenanceMessage} />;
    }

    return (
        <div className="bg-white min-h-screen">
            <LandingHeader />
            <main>
                <HeroSection />
                <EcosystemSection />
                <BusinessSection />
                <ManifestoSection />
            </main>
            <LandingFooter />
        </div>
    );
}
