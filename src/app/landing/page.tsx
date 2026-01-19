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

// ============================================
// AUSTRAL CANVAS - Viento Austral + Cruz del Sur
// ============================================
interface Particle {
    x: number;
    y: number;
    baseX: number;
    baseY: number;
    targetX: number;
    targetY: number;
    size: number;
    alpha: number;
    speed: number;
    isConstellationStar: boolean;
}

// Southern Cross constellation (normalized 0-1)
const SOUTHERN_CROSS = [
    { x: 0.5, y: 0.18 },   // Alpha Crucis (top)
    { x: 0.47, y: 0.28 },  // Beta
    { x: 0.53, y: 0.28 },  // Gamma
    { x: 0.5, y: 0.38 },   // Delta (bottom)
    { x: 0.56, y: 0.28 },  // Epsilon (side)
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function AustralCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scrollProgress, setScrollProgress] = useState(0);
    const mouseRef = useRef({ x: -1000, y: -1000 });
    const particlesRef = useRef<Particle[]>([]);
    const animationRef = useRef<number>(0);

    // Initialize particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Reinitialize particles with new dimensions
            particlesRef.current = Array.from({ length: 60 }, (_, i) => {
                const baseX = Math.random() * canvas.width;
                const baseY = Math.random() * canvas.height;
                const crossStar = SOUTHERN_CROSS[i % 5];
                return {
                    x: baseX,
                    y: baseY,
                    baseX,
                    baseY,
                    targetX: crossStar.x * canvas.width,
                    targetY: crossStar.y * canvas.height,
                    size: 1 + Math.random() * 1.5,
                    alpha: 0.15 + Math.random() * 0.4,
                    speed: 0.05 + Math.random() * 0.15,
                    isConstellationStar: i < 5,
                };
            });
        };

        resize();
        window.addEventListener('resize', resize);

        // Animation loop
        const animate = () => {
            if (!canvas || !ctx) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particlesRef.current.forEach((p) => {
                // Gentle floating movement
                p.y += p.speed * 0.5;
                p.x += Math.sin(Date.now() * 0.001 + p.baseX) * 0.1;

                // Wrap around when particle exits
                if (p.y > canvas.height + 10) {
                    p.y = -10;
                    p.x = Math.random() * canvas.width;
                }
                if (p.x > canvas.width + 10) p.x = -10;
                if (p.x < -10) p.x = canvas.width + 10;

                // Simple fade based on life cycle or static
                // ctx.globalAlpha = p.alpha; // Optional if we want blinking

                // Draw particle
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
                ctx.fill();
            });

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationRef.current);
            window.removeEventListener('resize', resize);
        };
    }, [scrollProgress]);

    // Scroll listener
    useEffect(() => {
        const handleScroll = () => {
            const heroHeight = window.innerHeight;
            setScrollProgress(Math.min(window.scrollY / heroHeight, 1));
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Mouse/touch listener
    useEffect(() => {
        const handleMove = (x: number, y: number) => {
            mouseRef.current = { x, y };
        };
        const handleMouse = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
        const handleTouch = (e: TouchEvent) => {
            if (e.touches.length > 0) {
                handleMove(e.touches[0].clientX, e.touches[0].clientY);
            }
        };

        window.addEventListener('mousemove', handleMouse, { passive: true });
        window.addEventListener('touchmove', handleTouch, { passive: true });

        return () => {
            window.removeEventListener('mousemove', handleMouse);
            window.removeEventListener('touchmove', handleTouch);
        };
    }, []);

    return (
        <>
            {/* Gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,#0A0A0B_0%,#000000_100%)]" />

            {/* Canvas particles */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: Math.max(0.2, 1 - scrollProgress * 0.8) }}
            />

            {/* Noise texture overlay */}
            <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />

            {/* Bottom fade gradient (scroll hint) */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0A0A0B] via-[#0A0A0B]/50 to-transparent pointer-events-none" />
        </>
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
                className={`group relative bg-[#111113] border border-white/[0.06] rounded-3xl p-8 transition-all duration-500 cursor-pointer
                    hover:bg-[#18181B] hover:border-white/[0.12] hover:-translate-y-1
                    ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            >
                {badge && (
                    <span className="absolute top-4 right-4 bg-white/10 text-white/70 text-xs font-medium px-3 py-1 rounded-full">
                        {badge}
                    </span>
                )}

                <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${accent}15` }}
                >
                    <div style={{ color: accent }}>{icon}</div>
                </div>

                <h3 className="text-white text-xl font-semibold mb-2 font-moovy tracking-wide">{title}</h3>
                <p className="text-[#A1A1AA] text-sm leading-relaxed">{description}</p>

                <div className="mt-6 flex items-center gap-2 text-white/50 group-hover:text-white/80 transition-colors">
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
                    ? "bg-[#0A0A0B]/85 backdrop-blur-xl border-b border-white/[0.06]"
                    : "bg-transparent"
                    }`}
            >
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-between h-[72px]">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/logo-moovy-white.png"
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
                                    className="text-[#A1A1AA] hover:text-white text-[15px] font-medium transition-colors relative group"
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
                                className="hidden md:inline-flex items-center gap-2 bg-[#e60012] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#c4000f] transition-colors"
                            >
                                Acceder
                                <ArrowRight className="w-4 h-4" />
                            </Link>

                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden p-2 text-white"
                            >
                                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-40 bg-[#0A0A0B] pt-[72px]">
                    <nav className="flex flex-col p-6 gap-4">
                        {navLinks.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="text-white text-xl font-medium py-3 border-b border-white/10"
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
// ============================================
// FLYING JITTER COMPONENT
// ============================================
function FlyingJitter({ children, speed = 0.5 }: { children: React.ReactNode, speed?: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const [offsetY, setOffsetY] = useState(0);
    const [opacity, setOpacity] = useState(1);
    const [jitter, setJitter] = useState({ x: 0, y: 0 });

    useEffect(() => {
        let frameId: number;

        const handleScroll = () => {
            const scrollY = window.scrollY;
            // Parallax fly up effect
            // Move up faster than scroll (1.0 = stick, >1.0 = fly up)
            const newOffset = -scrollY * speed;
            setOffsetY(newOffset);

            // Fade out as it flies up
            const fadeStart = 50;
            const fadeEnd = 400;
            if (scrollY > fadeStart) {
                const newOpacity = Math.max(0, 1 - (scrollY - fadeStart) / (fadeEnd - fadeStart));
                setOpacity(newOpacity);
            } else {
                setOpacity(1);
            }
        };

        const updateJitter = () => {
            const scrollY = window.scrollY;
            // "Tremble" increases as we scroll
            if (scrollY > 10) {
                // Intense trembling when scrolling (fly up phase)
                const intensity = Math.min(3, 0.5 + scrollY * 0.01);
                setJitter({
                    x: (Math.random() - 0.5) * intensity,
                    y: (Math.random() - 0.5) * intensity
                });
            } else {
                // Gentle breathing when top
                setJitter({
                    x: Math.sin(Date.now() * 0.002) * 2,
                    y: Math.cos(Date.now() * 0.002) * 2
                });
            }
            frameId = requestAnimationFrame(updateJitter);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        updateJitter();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            cancelAnimationFrame(frameId);
        };
    }, [speed]);

    return (
        <div
            ref={ref}
            style={{
                transform: `translate3d(${jitter.x}px, ${offsetY + jitter.y}px, 0)`,
                opacity,
                transition: 'opacity 0.1s linear',
                willChange: 'transform, opacity'
            }}
        >
            {children}
        </div>
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
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <AustralCanvas />

            <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
                <FlyingJitter speed={0.8}>
                    {/* H1 with letter animation */}
                    <h1 className="mb-6">
                        {"TODO".split("").map((letter, i) => (
                            <span
                                key={`todo-${i}`}
                                className={`inline-block font-moovy text-white text-5xl md:text-7xl lg:text-8xl tracking-wider transition-all duration-500
                                    ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                                style={{ transitionDelay: `${i * 50}ms` }}
                            >
                                {letter}
                            </span>
                        ))}
                        <br />
                        {"SE MUEVE".split("").map((letter, i) => (
                            <span
                                key={`se-mueve-${i}`}
                                className={`inline-block font-moovy text-white text-5xl md:text-7xl lg:text-8xl tracking-wider transition-all duration-500
                                    ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                                style={{ transitionDelay: `${(i + 5) * 50}ms` }}
                            >
                                {letter === " " ? "\u00A0" : letter}
                            </span>
                        ))}
                    </h1>

                    {/* Subtitle */}
                    <p
                        className={`text-[#A1A1AA] text-lg md:text-xl max-w-xl mx-auto mb-10 transition-all duration-700
                            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{ transitionDelay: "600ms" }}
                    >
                        El ecosistema que mueve al Fin del Mundo.
                    </p>

                    {/* CTAs */}
                    <div
                        className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-700
                            ${isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{ transitionDelay: "800ms" }}
                    >
                        <a
                            href="#ecosistema"
                            className="inline-flex items-center gap-2 bg-[#e60012] text-white font-semibold px-8 py-4 rounded-xl hover:bg-[#c4000f] transition-all hover:shadow-[0_0_30px_rgba(230,0,18,0.3)]"
                        >
                            Descubrí el ecosistema
                        </a>
                        <Link
                            href="/tienda"
                            className="inline-flex items-center gap-2 text-white/80 hover:text-white font-medium px-8 py-4 rounded-xl border border-white/20 hover:border-white/40 transition-all"
                        >
                            Ir a la tienda
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </FlyingJitter>
            </div>
        </section>
    );
}

// ============================================
// ECOSYSTEM SECTION
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

    const ecosystemData = [
        {
            title: "STORE",
            description: "Delivery de todo lo que necesitás. Comida, farmacia, comercios locales.",
            icon: <Star className="w-7 h-7" fill="currentColor" />,
            accent: "#e60012",
            href: "/tienda",
        },
        {
            title: "X",
            description: "Turismo y experiencias. Explorá el Fin del Mundo como nunca.",
            icon: <Globe className="w-7 h-7" />,
            accent: "#00D4AA",
            href: "/moovyx",
            badge: "Próximamente",
        },
        {
            title: "JOBS",
            description: "Oportunidades de trabajo. Repartidores, comercios, staff.",
            icon: <Zap className="w-7 h-7" />,
            accent: "#F59E0B",
            href: "#",
            badge: "Próximamente",
        },
        {
            title: "MOVER",
            description: "Puntos y beneficios. Cada compra suma, cada punto vale.",
            icon: <Star className="w-7 h-7" fill="currentColor" />,
            accent: "#e60012",
            href: "/puntos",
        },
    ];

    return (
        <section
            id="ecosistema"
            ref={ref}
            className="relative py-24 md:py-32 bg-gradient-to-b from-[#0A0A0B] to-[#0F0F14]"
        >
            <div className="max-w-7xl mx-auto px-6">
                {/* Section header */}
                <div
                    className={`text-center mb-16 transition-all duration-700
                        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                >
                    <h2 className="text-white text-3xl md:text-5xl font-bold mb-4">
                        Un ecosistema completo
                    </h2>
                    <p className="text-[#A1A1AA] text-lg max-w-xl mx-auto">
                        Cuatro pilares que mueven al Fin del Mundo.
                    </p>
                </div>

                {/* Cards grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {ecosystemData.map((item, index) => (
                        <EcosystemCard
                            key={item.title}
                            {...item}
                            delay={index * 100}
                        />
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
        <section ref={ref} className="py-24 md:py-32 bg-[#111113]">
            <div className="max-w-6xl mx-auto px-6">
                <h2
                    className={`text-white text-3xl md:text-4xl font-bold text-center mb-16 transition-all duration-700
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
                                <h3 className="text-white font-semibold text-lg mb-1">{benefit.title}</h3>
                                <p className="text-[#71717A] text-sm">{benefit.desc}</p>
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
        <section id="comercios" ref={ref} className="py-24 md:py-32 bg-[#0A0A0B]">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Text content */}
                    <div
                        className={`transition-all duration-700
                            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                    >
                        <h2 className="text-white text-3xl md:text-4xl font-bold mb-4">
                            Hacé crecer tu negocio
                        </h2>
                        <p className="text-[#A1A1AA] text-lg mb-8">
                            Sumá tu comercio al ecosistema más grande de Ushuaia.
                        </p>

                        <ul className="space-y-4 mb-8">
                            {bullets.map((bullet, index) => (
                                <li
                                    key={index}
                                    className={`flex items-center gap-3 text-[#A1A1AA] transition-all duration-500
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
                            className="inline-flex items-center gap-2 bg-[#e60012] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#c4000f] transition-all hover:shadow-[0_0_30px_rgba(230,0,18,0.3)]"
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
                        <div className="w-full h-80 rounded-3xl bg-gradient-to-br from-[#18181B] to-[#111113] border border-white/[0.06] flex items-center justify-center">
                            <div className="text-[#A1A1AA]/30 text-center">
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
        <section id="manifiesto" ref={ref} className="py-24 md:py-32 bg-[#111113]">
            <div className="max-w-3xl mx-auto px-6 text-center">
                {lines.map((line, index) => (
                    <p
                        key={index}
                        className={`text-[#A1A1AA] text-xl md:text-2xl font-medium mb-4 transition-all duration-700
                            ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                        style={{ transitionDelay: `${index * 200}ms` }}
                    >
                        {line}
                    </p>
                ))}
                <p
                    className={`text-white text-xl md:text-2xl font-medium transition-all duration-700
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
        <footer className="py-16 bg-[#050506] border-t border-white/[0.06]">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    {/* Logo */}
                    <div>
                        <Image
                            src="/logo-moovy-white.png"
                            alt="MOOVY"
                            width={100}
                            height={32}
                            className="h-8 w-auto mb-4"
                        />
                        <p className="text-[#71717A] text-sm">
                            El ecosistema que mueve al Fin del Mundo.
                        </p>
                    </div>

                    {/* Ecosistema */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Ecosistema</h4>
                        <ul className="space-y-2">
                            <li><Link href="/tienda" className="text-[#71717A] hover:text-white transition-colors text-sm">Store</Link></li>
                            <li><Link href="/moovyx" className="text-[#71717A] hover:text-white transition-colors text-sm">X</Link></li>
                            <li><span className="text-[#71717A]/50 text-sm">Jobs</span></li>
                            <li><Link href="/puntos" className="text-[#71717A] hover:text-white transition-colors text-sm">MOVER</Link></li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Legal</h4>
                        <ul className="space-y-2">
                            <li><Link href="/terminos" className="text-[#71717A] hover:text-white transition-colors text-sm">Términos</Link></li>
                            <li><Link href="/privacidad" className="text-[#71717A] hover:text-white transition-colors text-sm">Privacidad</Link></li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Contacto</h4>
                        <ul className="space-y-2">
                            <li className="text-[#71717A] text-sm">Ushuaia, TDF</li>
                            <li><a href="mailto:somosmoovy@gmail.com" className="text-[#71717A] hover:text-white transition-colors text-sm">somosmoovy@gmail.com</a></li>
                        </ul>
                        <div className="flex gap-4 mt-4">
                            <a href="https://instagram.com/somosmoovy" target="_blank" rel="noopener noreferrer" className="text-[#71717A] hover:text-white transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="https://wa.me/5492901234567" target="_blank" rel="noopener noreferrer" className="text-[#71717A] hover:text-white transition-colors">
                                <MessageCircle className="w-5 h-5" />
                            </a>
                        </div>
                    </div>
                </div>

                <div className="pt-8 border-t border-white/[0.06] text-center">
                    <p className="text-[#71717A] text-sm">
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
    // Scroll to top on mount/refresh
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="bg-[#0A0A0B] min-h-screen">
            <LandingHeader />
            <main>
                <HeroSection />
                <EcosystemSection />
                <WhySection />
                <BusinessSection />
                <ManifestoSection />
            </main>
            <LandingFooter />
        </div>
    );
}
