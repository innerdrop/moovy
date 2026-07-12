"use client";

import { useState, useEffect } from "react";
import { Search, Sunrise, Sun, Sunset, Moon } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface Category {
    id: string;
    name: string;
    slug: string;
    icon?: string | null;
    image?: string | null;
}

interface HomeHeroProps {
    categories: Category[];
    selectedCategory: string | null;
    onCategoryChange: (slug: string | null) => void;
}

// ─── Time-of-day config ─────────────────────────────────────────────────────

interface TimeSlot {
    greeting: string;
    subtitle: string;
    icon: typeof Sun;
}

const TIME_SLOTS: TimeSlot[] = [
    { greeting: "Buen día",        subtitle: "¿Qué desayunamos?",    icon: Sunrise },
    { greeting: "¡Buen provecho!", subtitle: "¿Qué almorzamos hoy?", icon: Sun },
    { greeting: "Buenas tardes",   subtitle: "¿Se te antoja algo?",  icon: Sun },
    { greeting: "Buenas noches",   subtitle: "¿Qué cenamos?",        icon: Sunset },
    { greeting: "Buenas noches",   subtitle: "¿Antojo nocturno?",    icon: Moon },
];

function getCurrentTimeSlot(): TimeSlot {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return TIME_SLOTS[0];
    if (hour >= 11 && hour < 15) return TIME_SLOTS[1];
    if (hour >= 15 && hour < 20) return TIME_SLOTS[2];
    if (hour >= 20 && hour < 23) return TIME_SLOTS[3];
    return TIME_SLOTS[4];
}

// ─── Component ──────────────────────────────────────────────────────────────
// El hero es la MISMA tarjeta roja que la barra del logo del header (mismo rojo,
// sin sombra ni línea entre medio → se ve como una sola). Es sticky: al scrollear,
// la pregunta + subtítulo + categorías se desvanecen y colapsan, y queda pineado
// solo el buscador bajo la barra del logo (opción 2a del diseño).

export default function HomeHero({
    categories,
    selectedCategory,
    onCategoryChange,
}: HomeHeroProps) {
    const [timeSlot, setTimeSlot] = useState<TimeSlot>(getCurrentTimeSlot);
    const [mounted, setMounted] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const openSearch = () => window.dispatchEvent(new Event("moovy:open-search"));

    useEffect(() => {
        setTimeSlot(getCurrentTimeSlot());
        setMounted(true);
        const interval = setInterval(() => setTimeSlot(getCurrentTimeSlot()), 60_000);
        return () => clearInterval(interval);
    }, []);

    // Colapso de la pregunta al scrollear (fade + shrink, in-place).
    useEffect(() => {
        const onScroll = () => setCollapsed(window.scrollY > 24);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    if (!mounted) {
        return (
            <section className="bg-[#e60012] rounded-b-[28px]">
                <div className="h-[170px]" />
            </section>
        );
    }

    return (
        <section className="sticky top-12 z-30 -mt-2 lg:relative lg:top-auto lg:mt-0 lg:z-auto overflow-hidden rounded-b-[28px] bg-[#e60012] shadow-[0_8px_24px_rgba(120,0,10,0.25)]">
            {/* Blobs decorativos */}
            <div className="absolute -right-12 -top-16 w-56 h-56 rounded-full bg-white/[0.08] blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-8 w-40 h-40 rounded-full bg-black/10 blur-3xl pointer-events-none" />

            <div className="relative px-5 pt-4 pb-4 lg:max-w-7xl lg:mx-auto lg:px-8">
                {/* Pregunta + subtítulo — se desvanecen y colapsan al scrollear */}
                <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{
                        maxHeight: collapsed ? 0 : 78,
                        opacity: collapsed ? 0 : 1,
                        marginBottom: collapsed ? 0 : 14,
                        transform: collapsed ? "translateY(-8px)" : "translateY(0)",
                    }}
                >
                    <h1 className="text-white text-2xl lg:text-3xl font-black tracking-tight leading-tight mb-1">
                        {timeSlot.subtitle}
                    </h1>
                    <p className="text-white/80 text-sm font-semibold">
                        Tu comercio favorito te lo lleva a casa.
                    </p>
                </div>

                {/* Buscador — queda pineado (mobile). En desktop la búsqueda vive en el header. */}
                <button
                    type="button"
                    onClick={openSearch}
                    className="w-full lg:hidden flex items-center gap-3 px-4 py-3.5 bg-white rounded-[18px] text-left shadow-[0_12px_28px_rgba(120,0,10,0.35)] transition active:scale-[0.98]"
                >
                    <Search className="w-5 h-5 text-[#e60012] flex-shrink-0" strokeWidth={2.2} />
                    <span className="text-[15px] text-gray-500 font-semibold">Buscá pizzas, farmacia, kiosco…</span>
                </button>

                {/* Category pills — se desvanecen junto con la pregunta */}
                {categories.length > 0 && (
                    <div
                        className="overflow-hidden transition-all duration-300 ease-out"
                        style={{
                            maxHeight: collapsed ? 0 : 52,
                            opacity: collapsed ? 0 : 1,
                            marginTop: collapsed ? 0 : 12,
                        }}
                    >
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                            {categories.map((cat) => {
                                const isActive = selectedCategory === cat.slug;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => onCategoryChange(isActive ? null : cat.slug)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                                            isActive
                                                ? "bg-white text-[#e60012] shadow-md"
                                                : "bg-white/15 text-white hover:bg-white/25"
                                        }`}
                                    >
                                        {cat.image && (
                                            <img src={cat.image} alt="" className="w-5 h-5 rounded-full object-cover" />
                                        )}
                                        {cat.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
