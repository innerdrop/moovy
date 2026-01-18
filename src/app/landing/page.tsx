"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Bike, Store, ChevronRight, Instagram, Menu, X, MapPin, Home, Info, Star, Gift, Users, Award, ChevronDown, Compass, Hotel, Send, Map, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";

// --- Components ---

function FloatingStar({ delay, duration, left, top }: { delay: number, duration: number, left: string, top: string }) {
    return (
        <div
            className="absolute animate-float text-amber-400/60 pointer-events-none"
            style={{
                left,
                top,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
            }}
        >
            <Star className="w-4 h-4 fill-amber-400" />
        </div>
    );
}

// Expandable Card with subtle arrow indicator and dual actions
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
                className={`bg-gray-50 border border-gray-100 rounded-2xl p-5 transition-all duration-500 overflow-hidden relative cursor-pointer hover:shadow-md
                    ${isExpanded ? 'shadow-md' : ''}`}
            >
                <div className="flex items-start gap-4">
                    <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${accentColor}10` }}
                    >
                        <Icon className="w-6 h-6" style={{ color: accentColor }} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
                            <ChevronDown
                                className={`w-5 h-5 text-gray-400 transition-transform duration-300 md:hidden ${isExpanded ? 'rotate-180' : ''}`}
                            />
                        </div>
                        <p className={`text-gray-500 text-sm transition-all duration-300 ${isExpanded ? 'opacity-0 h-0' : 'mt-1'}`}>
                            {description}
                        </p>
                    </div>
                </div>

                <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-48 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                    <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                        {details}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={href}
                            className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-full bg-gray-900 text-white"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {registerText} <ChevronRight className="w-4 h-4" />
                        </Link>
                        {loginHref && (
                            <Link
                                href={loginHref}
                                className="inline-flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {loginText}
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}


function MobileMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col animate-fade-in">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                <span className="text-2xl font-bold text-[#e60012]" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-600" />
                </button>
            </div>

            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <nav className="space-y-1">
                    <Link href="/" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-semibold text-gray-900 border-b border-gray-50">
                        <Home className="w-5 h-5 text-[#e60012]" /> Inicio
                    </Link>
                    <Link href="/tienda" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-semibold text-gray-900 border-b border-gray-50">
                        <ShoppingBag className="w-5 h-5 text-[#e60012]" /> Tienda
                    </Link>
                    <Link href="/moover" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-semibold text-gray-900 border-b border-gray-50">
                        <Star className="w-5 h-5 text-amber-500" /> Programa MOOVER
                    </Link>
                    <div className="py-4 border-b border-gray-50">
                        <span className="flex items-center gap-4 text-lg font-semibold text-gray-900 mb-2">
                            <Compass className="w-5 h-5 text-teal-600" /> MOOVY X
                        </span>
                        <div className="pl-9 space-y-2">
                            <span className="block text-gray-400 text-sm">Próximamente</span>
                        </div>
                    </div>
                    <Link href="/nosotros" onClick={onClose} className="flex items-center gap-4 py-4 text-lg font-semibold text-gray-900 border-b border-gray-50">
                        <Info className="w-5 h-5 text-[#e60012]" /> Quiénes Somos
                    </Link>
                </nav>

                <div className="mt-auto pt-8 space-y-3">
                    <Link href="/login" onClick={onClose} className="block w-full py-3 text-center border-2 border-gray-200 rounded-xl font-bold text-gray-700">
                        Iniciar Sesión
                    </Link>
                    <Link href="/registro" onClick={onClose} className="block w-full py-3 text-center bg-[#e60012] rounded-xl font-bold text-white">
                        Crear Cuenta
                    </Link>
                </div>
            </div>
        </div>
    );
}

// Pre-registration form component
function PreRegistrationForm() {
    const [email, setEmail] = useState("");
    const [businessName, setBusinessName] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [showInfoTooltip, setShowInfoTooltip] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Open mailto link
        const subject = encodeURIComponent(`Pre-registro MOOVY X: ${businessName}`);
        const body = encodeURIComponent(`Hola,\n\nQuiero recibir información sobre MOOVY X.\n\nEstablecimiento: ${businessName}\nEmail: ${email}\n\nSaludos`);
        window.location.href = `mailto:somosmoovy@gmail.com?subject=${subject}&body=${body}`;
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 h-full flex flex-col justify-center">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-teal-600" />
                </div>
                <h4 className="font-bold text-gray-900 text-lg mb-2">¡Gracias por tu interés!</h4>
                <p className="text-gray-600 text-sm">Te contactaremos cuando MOOVY X esté disponible.</p>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 rounded-2xl p-5 sm:p-6 border border-gray-100 h-full">
            <h4 className="font-bold text-gray-900 text-lg mb-1">¿Tenés un hotel, alojamiento o empresa de turismo?</h4>
            <p className="text-gray-500 text-sm mb-4">Pre-registrate para recibir información del lanzamiento.</p>

            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Nombre del establecimiento"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 pr-10 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm bg-white"
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                        onBlur={() => setTimeout(() => setShowInfoTooltip(false), 200)}
                    >
                        <HelpCircle className="w-4 h-4" />
                    </button>
                    {showInfoTooltip && (
                        <div className="absolute right-0 top-full mt-1 bg-gray-900 text-white text-xs p-2 rounded-lg shadow-lg z-10 w-48">
                            Ej: Hotel Las Hayas, Tolkeyen Patagonia, Excursiones Fin del Mundo, etc.
                        </div>
                    )}
                </div>
                <input
                    type="email"
                    placeholder="Email de contacto"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all text-sm bg-white"
                />
                <button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                >
                    <Send className="w-4 h-4" /> Quiero información
                </button>
            </form>
        </div>
    );
}

export default function LandingPage() {
    const [heroLoaded, setHeroLoaded] = useState(false);
    const [showContent, setShowContent] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showMooverInfo, setShowMooverInfo] = useState(false);

    useEffect(() => {
        setTimeout(() => setHeroLoaded(true), 100);
        setTimeout(() => setShowContent(true), 400);
    }, []);

    return (
        <div className="min-h-screen bg-white font-sans text-gray-900 flex flex-col overflow-x-hidden">

            {/* --- Header --- */}
            <header className={`bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 transition-all duration-500 ${heroLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <div className="container mx-auto px-4 py-3 grid grid-cols-3 items-center">
                    <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#e60012]" />
                        <span className="hidden sm:inline">Ushuaia, TDF</span>
                        <span className="sm:hidden">Ushuaia</span>
                    </div>

                    <Link href="/" className="text-2xl sm:text-3xl font-bold text-[#e60012] tracking-tighter text-center" style={{ fontFamily: "'Junegull', sans-serif" }}>
                        MOOVY
                    </Link>

                    <div className="flex justify-end">
                        <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                            <Menu className="w-6 h-6 text-gray-900" />
                        </button>
                    </div>
                </div>
            </header>

            <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* --- Hero Section --- */}
            <section className="relative py-14 sm:py-16 bg-[#e60012] overflow-hidden">
                <div className="absolute inset-0 opacity-[0.05]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`
                }} />

                <div className={`relative z-10 text-center max-w-4xl mx-auto px-4 transition-all duration-1000 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    <h1
                        className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[0.95] mb-5 tracking-tight"
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                        Tu antojo<br />
                        <span className="font-black">manda.</span>
                    </h1>

                    <p className="text-white/90 text-base sm:text-lg font-medium max-w-md mx-auto mb-6 px-4">
                        Todo lo que Ushuaia tiene para ofrecer, en una sola app.
                    </p>

                    <Link
                        href="/tienda"
                        className="group inline-flex items-center gap-2 bg-white text-[#e60012] px-6 py-3 rounded-full font-bold text-base shadow-xl hover:scale-105 transition-all duration-300"
                    >
                        <span>Explorar Tienda</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 transition-opacity duration-1000 delay-700 ${showContent ? 'opacity-70' : 'opacity-0'}`}>
                    <ChevronDown className="w-6 h-6 text-white animate-bounce" />
                </div>
            </section>

            {/* --- TIENDA + MOOVER Unified Card Section --- */}
            <section className="py-10 sm:py-14 bg-white -mt-4 rounded-t-[2rem] relative z-20">
                <div className="container mx-auto px-4">
                    {/* Use max-w-5xl for wider desktop layout */}
                    <div className="max-w-5xl mx-auto">
                        {/* Single Unified Card */}
                        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 sm:p-8 relative overflow-hidden">
                            {/* Floating stars decoration - positioned on right side to avoid MOOVER star */}
                            <FloatingStar left="85%" top="5%" delay={0} duration={4} />
                            <FloatingStar left="92%" top="50%" delay={2} duration={3.5} />
                            <FloatingStar left="78%" top="75%" delay={1} duration={5} />
                            <FloatingStar left="70%" top="15%" delay={3} duration={4} />

                            <div className="relative z-10">
                                {/* Header */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="w-14 h-14 bg-gradient-to-br from-[#e60012] to-[#ff4444] rounded-xl flex items-center justify-center shadow-lg">
                                        <ShoppingBag className="w-7 h-7 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Tienda Online</h2>
                                        <p className="text-sm text-gray-500">Pedí y recibí en minutos</p>
                                    </div>
                                </div>

                                {/* Description */}
                                <p className="text-gray-600 mb-4 max-w-2xl">
                                    Explorá cientos de comercios locales, restaurantes y farmacias. Cada compra suma puntos que podés canjear por descuentos exclusivos.
                                </p>

                                {/* MOOVER Stylized */}
                                <div className="flex items-center gap-2 mb-4">
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                                    <span
                                        className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"
                                        style={{ fontFamily: "'Junegull', sans-serif" }}
                                    >
                                        MOOVER
                                    </span>
                                </div>

                                {/* MOOVER Benefits - Always visible on desktop, collapsible on mobile */}
                                <div className="mb-6">
                                    <button
                                        onClick={() => setShowMooverInfo(!showMooverInfo)}
                                        className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3 lg:hidden"
                                    >
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

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/tienda"
                                        className="inline-flex items-center justify-center gap-2 bg-[#e60012] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#cc000f] transition-colors"
                                    >
                                        Ir a la Tienda <ArrowRight className="w-4 h-4" />
                                    </Link>
                                    <Link
                                        href="/moover"
                                        className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-3 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
                                    >
                                        Más sobre MOOVER <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Divider --- */}
            <div className="container mx-auto px-4">
                <div className="border-t border-gray-100 max-w-5xl mx-auto" />
            </div>

            {/* --- Join the Community (Repartidores + Comercios) --- */}
            <section className="py-10 sm:py-14 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-6">
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Sumate a la comunidad</h2>
                            <p className="text-gray-500 text-sm">Crecemos juntos en el fin del mundo.</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <ExpandableCard
                                delay={100}
                                href="/riders/registro"
                                loginHref="/riders/login"
                                icon={Bike}
                                title="Repartidores"
                                description="Generá ingresos con libertad"
                                details="Manejá tus propios horarios, conocé la ciudad y ganá dinero por cada entrega. Tu moto o bici es tu herramienta de trabajo."
                                accentColor="#e60012"
                            />
                            <ExpandableCard
                                delay={200}
                                href="/socios/registro"
                                loginHref="/socios/login"
                                icon={Store}
                                title="Comercios"
                                description="Potenciá tus ventas hoy"
                                details="Sumate a la plataforma digital líder del fin del mundo. Llegá a nuevos clientes sin costos fijos de alta."
                                accentColor="#e60012"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Divider --- */}
            <div className="container mx-auto px-4">
                <div className="border-t border-gray-100 max-w-5xl mx-auto" />
            </div>

            {/* --- MOOVY X Section --- */}
            <section className="py-10 sm:py-14 bg-white">
                <div className="container mx-auto px-4">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-6 items-stretch">
                            {/* Left: Info Card */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 relative h-full">
                                {/* Floating "Próximamente" cloud */}
                                <div className="absolute -top-3 -right-2 sm:-right-3 animate-float-slow">
                                    <div className="bg-white px-3 py-1.5 rounded-full shadow-md border border-gray-100 relative">
                                        <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-white rounded-full shadow-sm" />
                                        <div className="absolute -top-1.5 left-2 w-2 h-2 bg-white rounded-full shadow-sm" />
                                        <div className="absolute -bottom-0.5 right-3 w-2 h-2 bg-white rounded-full shadow-sm" />
                                        <span className="relative z-10 text-teal-700 font-semibold text-xs">✨ Próximamente</span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <span
                                        className="text-2xl sm:text-3xl font-black tracking-tight"
                                        style={{ fontFamily: "'Junegull', sans-serif" }}
                                    >
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-sky-500 to-emerald-500">MOOVY</span>
                                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 ml-1">X</span>
                                    </span>
                                </div>

                                <h3 className="text-lg font-bold text-gray-900 mb-2">Experiencias turísticas</h3>
                                <p className="text-gray-600 text-sm mb-5">Explorá el Fin del Mundo. Excursiones, hoteles y servicios para turistas.</p>

                                <div className="flex gap-2">
                                    <div className="flex-1 text-center p-3 bg-white rounded-xl border border-gray-100">
                                        <Map className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                                        <span className="text-xs text-gray-700">Tours</span>
                                    </div>
                                    <div className="flex-1 text-center p-3 bg-white rounded-xl border border-gray-100">
                                        <Hotel className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                                        <span className="text-xs text-gray-700">Hoteles</span>
                                    </div>
                                    <div className="flex-1 text-center p-3 bg-white rounded-xl border border-gray-100">
                                        <Compass className="w-5 h-5 text-teal-600 mx-auto mb-1" />
                                        <span className="text-xs text-gray-700">Guías</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Pre-registration Form */}
                            <PreRegistrationForm />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- Branded Footer --- */}
            <footer className="relative bg-[#e60012] text-white pt-12 sm:pt-16 pb-6 sm:pb-8 overflow-hidden mt-auto">
                {/* Giant M Watermark */}
                <div className="absolute top-0 right-0 -mr-8 sm:-mr-16 -mt-8 sm:-mt-16 opacity-10 pointer-events-none">
                    <span className="text-[150px] sm:text-[250px] font-black leading-none select-none" style={{ fontFamily: "'Junegull', sans-serif" }}>M</span>
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12 max-w-5xl mx-auto">
                        <div className="col-span-2 md:col-span-1">
                            <span className="text-2xl sm:text-3xl font-bold block mb-4" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span>
                            <div className="flex gap-3">
                                <a href="#" className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-[#e60012] transition-all">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Explorar</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/tienda" className="text-white/80 hover:text-white transition-all">Tienda</Link></li>
                                <li><Link href="/moover" className="text-white/80 hover:text-white transition-all">MOOVER</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Comunidad</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/riders/registro" className="text-white/80 hover:text-white transition-all">Repartidores</Link></li>
                                <li><Link href="/socios/registro" className="text-white/80 hover:text-white transition-all">Comercios</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Legal</h4>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/terminos" className="text-white/80 hover:text-white transition-all">Términos</Link></li>
                                <li><Link href="/privacidad" className="text-white/80 hover:text-white transition-all">Privacidad</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-white/20 pt-4 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/60 max-w-5xl mx-auto">
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
            `}</style>
        </div>
    );
}
