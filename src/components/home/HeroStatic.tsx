"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin } from "lucide-react";

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
        <section className="relative bg-gradient-to-br from-[#e60012] via-[#ff2233] to-[#cc0010] overflow-hidden">
            {/* Dot pattern overlay */}
            <div
                className="absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='2'/%3E%3Ccircle cx='13' cy='13' r='2'/%3E%3C/g%3E%3C/svg%3E")`,
                }}
            />

            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />

            <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 lg:py-16">
                <div className="lg:flex lg:items-center lg:justify-between">
                    <div className="max-w-2xl mx-auto lg:mx-0">
                        {/* Location chip */}
                        <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                            <MapPin className="w-3 h-3" />
                            Ushuaia, Tierra del Fuego
                        </div>

                        {/* Headline */}
                        <h1 className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight mb-2">
                            Todo Ushuaia en tu puerta
                        </h1>
                        <p className="text-white/85 text-base sm:text-lg font-medium mb-6 max-w-lg">
                            Pedidos de comercios locales en minutos
                        </p>

                        {/* Search bar */}
                        <form onSubmit={handleSubmit} className="relative max-w-md">
                            <div className="flex items-center bg-white rounded-[14px] shadow-lg shadow-black/15 overflow-hidden">
                                <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="¿Qué querés pedir?"
                                    className="flex-1 px-3 py-3.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent font-medium"
                                />
                                {query.length >= 2 && (
                                    <button
                                        type="submit"
                                        className="bg-[#e60012] text-white px-4 py-2 mr-1.5 rounded-lg text-sm font-semibold hover:bg-[#cc000f] transition-colors"
                                    >
                                        Buscar
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Desktop stats row — integrated in hero */}
                        {(totalDelivered > 0 || activeMerchants > 0) && (
                            <div className="hidden lg:flex items-center gap-8 mt-8">
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
