"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

interface HeroStaticProps {
    totalDelivered?: number;
    activeMerchants?: number;
}

export default function HeroStatic({ totalDelivered = 0, activeMerchants = 0 }: HeroStaticProps) {
    const [query, setQuery] = useState("");
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim().length >= 2) {
            router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <section className="relative bg-gradient-to-br from-[#d50000] via-[#e60012] to-[#ff1a2e] overflow-hidden">
            {/* Animated gradient glow */}
            <div
                className="absolute inset-0"
                style={{
                    background: "radial-gradient(ellipse 80% 60% at 20% 80%, rgba(255,255,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(255,180,0,0.08) 0%, transparent 50%)",
                }}
            />

            {/* Dot pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='2'/%3E%3Ccircle cx='13' cy='13' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* Decorative blurred shapes */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-400/10 rounded-full -ml-20 -mb-20 blur-3xl" />
            <div className="absolute top-1/2 right-10 w-32 h-32 bg-yellow-300/8 rounded-full blur-2xl hidden lg:block" />

            <div className="relative z-10 container mx-auto px-4 py-10 md:py-14 lg:py-20">
                <div className="lg:flex lg:items-center lg:justify-between">
                    <div className="max-w-2xl mx-auto lg:mx-0">
                        {/* Headline */}
                        <h1 className="text-white text-[32px] sm:text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-3 drop-shadow-sm">
                            Todo Ushuaia en tu<br />
                            <span className="text-white">puerta.</span>
                        </h1>
                        <p className="text-white/90 text-base sm:text-lg md:text-xl font-bold mb-7 max-w-lg drop-shadow-sm">
                            Pedidos de comercios locales en minutos
                        </p>

                        {/* Search bar */}
                        <form onSubmit={handleSubmit} className="relative max-w-md">
                            <div className="flex items-center bg-white rounded-2xl shadow-xl shadow-black/20 overflow-hidden ring-1 ring-white/20">
                                <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="¿Qué querés pedir?"
                                    className="flex-1 px-3 py-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent font-medium"
                                />
                                {query.length >= 2 && (
                                    <button
                                        type="submit"
                                        className="bg-[#e60012] text-white px-5 py-2.5 mr-1.5 rounded-xl text-sm font-bold hover:bg-[#cc000f] transition-colors"
                                    >
                                        Buscar
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Desktop stats row — integrated in hero */}
                        {(totalDelivered > 0 || activeMerchants > 0) && (
                            <div className="hidden lg:flex items-center gap-8 mt-10">
                                {totalDelivered > 0 && (
                                    <div className="text-center text-white">
                                        <div className="text-3xl font-black">+{totalDelivered.toLocaleString("es-AR")}</div>
                                        <div className="text-[11px] font-medium opacity-70">pedidos entregados</div>
                                    </div>
                                )}
                                {activeMerchants > 0 && (
                                    <div className="text-center text-white">
                                        <div className="text-3xl font-black">{activeMerchants}</div>
                                        <div className="text-[11px] font-medium opacity-70">comercios activos</div>
                                    </div>
                                )}
                                <div className="text-center text-white">
                                    <div className="text-3xl font-black">4.8</div>
                                    <div className="text-[11px] font-medium opacity-70">satisfacción promedio</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Desktop: visual placeholder */}
                    <div className="hidden lg:flex w-80 h-48 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl items-center justify-center flex-shrink-0">
                        <span className="text-white/50 text-sm font-semibold">Ilustración / Foto Ushuaia</span>
                    </div>
                </div>
            </div>
        </section>
    );
}
