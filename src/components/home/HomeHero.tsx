"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingBag, Bell, User, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import { useCartStore } from "@/store/cart";

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
    isLoggedIn?: boolean;
    userName?: string;
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

export default function HomeHero({
    categories,
    selectedCategory,
    onCategoryChange,
    isLoggedIn = false,
    userName,
}: HomeHeroProps) {
    const openSearch = () => window.dispatchEvent(new Event("moovy:open-search"));
    const [timeSlot, setTimeSlot] = useState<TimeSlot>(getCurrentTimeSlot);
    const [mounted, setMounted] = useState(false);
    const openCart = useCartStore((s) => s.openCart);
    const items = useCartStore((s) => s.items);
    const cartCount = items.length;

    const firstName = userName?.split(" ")[0] || "";

    useEffect(() => {
        setTimeSlot(getCurrentTimeSlot());
        setMounted(true);
        const interval = setInterval(() => setTimeSlot(getCurrentTimeSlot()), 60_000);
        return () => clearInterval(interval);
    }, []);

    const Icon = timeSlot.icon;

    if (!mounted) {
        return (
            <section className="bg-[#e60012]" style={{ paddingTop: "env(safe-area-inset-top)" }}>
                <div className="h-[220px] animate-pulse" />
            </section>
        );
    }

    return (
        <section className="bg-[#e60012] relative overflow-hidden" style={{ paddingTop: "env(safe-area-inset-top)" }}>
            {/* Decorative blobs */}
            <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
            <div className="absolute -left-16 bottom-0 w-48 h-48 rounded-full bg-black/5 blur-3xl pointer-events-none" />

            <div className="relative">
                {/* ── Top bar: avatar/location — logo — bell + cart ── */}
                <div className="lg:hidden flex items-center justify-between h-14 px-4">
                    {/* Left */}
                    <div className="flex items-center gap-2">
                        {isLoggedIn && firstName ? (
                            <Link href="/mi-perfil" className="flex items-center gap-1.5">
                                <div className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-white/20 text-white">
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                            </Link>
                        ) : (
                            <Link href="/ingresar" className="p-1.5 text-white/80">
                                <User className="w-5 h-5" />
                            </Link>
                        )}
                    </div>

                    {/* Center: White logo */}
                    <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
                        <Image
                            src="/logo-moovy-white.svg"
                            alt="MOOVY"
                            width={280}
                            height={90}
                            className="h-6 w-auto"
                            priority
                        />
                    </Link>

                    {/* Right: bell + cart */}
                    <div className="flex items-center gap-0.5">
                        {isLoggedIn && (
                            <Link href="/mis-pedidos" className="relative p-2 text-white/80 hover:text-white transition">
                                <Bell className="w-5 h-5" />
                            </Link>
                        )}
                        <button onClick={() => openCart()} className="relative p-2 text-white/80 hover:text-white transition">
                            <ShoppingBag className="w-5 h-5" />
                            {cartCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] text-[10px] rounded-full flex items-center justify-center font-bold bg-white text-[#e60012] shadow-sm">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* ── Greeting ── */}
                <div className="px-5 pt-2 pb-1 lg:pt-6 lg:pb-2 lg:max-w-7xl lg:mx-auto lg:px-8">
                    <p className="text-white/70 text-sm font-medium flex items-center gap-1.5">
                        <Icon className="w-4 h-4" />
                        {timeSlot.greeting}
                    </p>
                    <h1 className="text-white text-xl lg:text-3xl font-black mt-0.5">
                        {timeSlot.subtitle}
                    </h1>
                </div>

                {/* ── Search bar ── */}
                <div className="px-5 pt-3 pb-2 lg:max-w-7xl lg:mx-auto lg:px-8">
                    <button
                        type="button"
                        onClick={openSearch}
                        className="w-full lg:max-w-xl flex items-center gap-3 px-4 py-3 bg-white rounded-2xl text-left shadow-lg shadow-black/10 transition active:scale-[0.98]"
                    >
                        <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="text-sm text-gray-400 font-medium">Buscá productos, locales...</span>
                    </button>
                </div>

                {/* ── Category pills ── */}
                {categories.length > 0 && (
                    <div className="px-5 pt-2 pb-4 lg:pb-5 lg:max-w-7xl lg:mx-auto lg:px-8">
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                            {categories.map((cat) => {
                                const isActive = selectedCategory === cat.slug;
                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => onCategoryChange(isActive ? null : cat.slug)}
                                        className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
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
