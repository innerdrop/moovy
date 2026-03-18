"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Store, ShoppingBag, Tag, X } from "lucide-react";
import Image from "next/image";

interface Suggestion {
    type: "comercio" | "tienda" | "marketplace";
    id: string;
    label: string;
    image: string | null;
    href: string;
    extra: string | null;
    price?: number;
}

interface HeroStaticProps {
    totalDelivered?: number;
    activeMerchants?: number;
}

const TYPE_CONFIG = {
    comercio: { label: "Comercio", color: "bg-blue-100 text-blue-700", icon: Store },
    tienda: { label: "Tienda", color: "bg-emerald-100 text-emerald-700", icon: ShoppingBag },
    marketplace: { label: "Marketplace", color: "bg-red-100 text-red-700", icon: Tag },
} as const;

/* =============================================
   WAVE CLIP — SVG inline con curvas bezier suaves.
   Se renderiza como <svg> oculto y se referencia
   con clip-path: url(#hero-wave-clip).
   ============================================= */
function WaveClipDef() {
    return (
        <svg width="0" height="0" className="absolute">
            <defs>
                <clipPath id="hero-wave-clip" clipPathUnits="objectBoundingBox">
                    <path d="M0,0 L1,0 L1,0.82 C0.85,0.92 0.7,0.84 0.55,0.9 C0.4,0.96 0.25,0.88 0.1,0.95 C0.05,0.97 0.02,0.95 0,0.93 Z" />
                </clipPath>
            </defs>
        </svg>
    );
}

export default function HeroStatic({ totalDelivered = 0, activeMerchants = 0 }: HeroStaticProps) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIdx, setSelectedIdx] = useState(-1);
    const router = useRouter();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // === Autocomplete logic (sin cambios) ===
    const fetchSuggestions = useCallback((q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 1) { setSuggestions([]); setShowDropdown(false); return; }
        setLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.suggestions || []);
                    setShowDropdown(true);
                    setSelectedIdx(-1);
                }
            } catch { /* silent */ } finally { setLoading(false); }
        }, 300);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        fetchSuggestions(e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedIdx >= 0 && suggestions[selectedIdx]) {
            router.push(suggestions[selectedIdx].href);
            setShowDropdown(false);
            return;
        }
        if (query.trim().length >= 2) {
            router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
            setShowDropdown(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showDropdown || suggestions.length === 0) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((p) => (p < suggestions.length - 1 ? p + 1 : 0)); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((p) => (p > 0 ? p - 1 : suggestions.length - 1)); }
        else if (e.key === "Escape") { setShowDropdown(false); }
    };

    const handleSelect = (s: Suggestion) => { router.push(s.href); setQuery(s.label); setShowDropdown(false); };
    const handleClear = () => { setQuery(""); setSuggestions([]); setShowDropdown(false); inputRef.current?.focus(); };

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setShowDropdown(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => { return () => { if (debounceRef.current) clearTimeout(debounceRef.current); }; }, []);

    // === RENDER ===
    return (
        <section className="relative overflow-visible">
            {/* SVG clip-path definition (hidden, referenced by url) */}
            <WaveClipDef />

            {/* ── FONDO VIOLETA CON CLIP-PATH ONDAS SUAVES ── */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: "linear-gradient(135deg, #a3000c 0%, #cc000f 25%, #e60012 50%, #ff1a2e 75%, #ff4d5e 100%)",
                    clipPath: "url(#hero-wave-clip)",
                }}
            />

            {/* ── CONTENIDO ── */}
            <div className="relative z-10 container mx-auto px-4 pt-4 pb-16 md:pt-8 md:pb-20 lg:pt-12 lg:pb-24">
                <div className="lg:flex lg:items-center lg:justify-between">
                    <div className="max-w-2xl mx-auto lg:mx-0">

                        {/* Headline — tamaño reducido */}
                        <h1 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-4xl leading-[1.1] tracking-tight mb-1.5">
                            <span className="font-bold">Todo </span>
                            <span className="font-black" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}>Ushuaia</span>
                            <span className="font-bold"> en</span>
                            <br />
                            <span className="font-black" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}>tu puerta.</span>
                        </h1>

                        {/* Accent line */}
                        <div
                            className="h-1 rounded-full mb-3 w-16"
                            style={{
                                background: "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,200,100,0.7), rgba(255,255,255,0.3))",
                                animation: "hero-accent-line 3s ease-in-out infinite",
                            }}
                        />

                        <p className="text-white/90 text-xs sm:text-sm md:text-base font-semibold mb-4 max-w-[240px] sm:max-w-xs md:max-w-sm lg:max-w-md">
                            Pedidos de comercios locales en minutos
                        </p>

                        {/* ── SEARCH BAR + PERSONA + AUTOCOMPLETE ──
                             La persona se posiciona relativa al search bar
                             para que sus manos "agarren" la caja de búsqueda.
                        */}
                        <div ref={dropdownRef} className="relative max-w-md z-20" data-hero-search>
                            {/* Persona — detrás del search bar, manos sobre la caja */}
                            <div
                                className="absolute pointer-events-none select-none"
                                style={{
                                    /* Centrar persona sobre el search bar */
                                    bottom: "0px",
                                    right: "-30px",
                                    zIndex: 1,
                                }}
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src="/hero-person.png"
                                    alt="Persona usando MOOVY"
                                    className="h-[150px] sm:h-[180px] md:h-[210px] lg:h-[250px] w-auto object-contain"
                                    style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.3))" }}
                                />
                            </div>

                            <form onSubmit={handleSubmit} className="relative" style={{ zIndex: 2 }}>
                                <div className="absolute -inset-1 bg-white/20 rounded-3xl blur-lg" />
                                <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/25">
                                    <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={query}
                                        onChange={handleChange}
                                        onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                                        onKeyDown={handleKeyDown}
                                        placeholder="¿Qué querés pedir?"
                                        className="flex-1 min-w-0 px-3 py-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent font-medium"
                                        autoComplete="off"
                                    />
                                    {query.length > 0 && (
                                        <button type="button" onClick={handleClear} className="p-1.5 mr-0.5 text-gray-400 hover:text-gray-600 transition flex-shrink-0">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    {query.length >= 2 && (
                                        <button type="submit" className="bg-[#e60012] text-white px-3 sm:px-5 py-2 sm:py-2.5 mr-1.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#cc000f] transition-colors flex-shrink-0 whitespace-nowrap">
                                            Buscar
                                        </button>
                                    )}
                                </div>
                            </form>

                            {/* Autocomplete dropdown */}
                            {showDropdown && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden max-h-80 overflow-y-auto z-50">
                                    {loading && suggestions.length === 0 && (
                                        <div className="px-4 py-3 text-sm text-gray-400 text-center">Buscando...</div>
                                    )}
                                    {!loading && suggestions.length === 0 && query.length >= 1 && (
                                        <div className="px-4 py-3 text-sm text-gray-400 text-center">No se encontraron resultados</div>
                                    )}
                                    {suggestions.map((s, idx) => {
                                        const config = TYPE_CONFIG[s.type];
                                        const Icon = config.icon;
                                        return (
                                            <button
                                                key={`${s.type}-${s.id}`}
                                                type="button"
                                                onClick={() => handleSelect(s)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${idx === selectedIdx ? "bg-gray-50" : "hover:bg-gray-50"} ${idx > 0 ? "border-t border-gray-50" : ""}`}
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                                    {s.image ? (
                                                        <Image src={s.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <Icon className="w-5 h-5 text-gray-400" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-gray-900 truncate">{s.label}</div>
                                                    {s.extra && <div className="text-xs text-gray-500 truncate">{s.extra}</div>}
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    {s.price != null && (
                                                        <span className="text-sm font-bold text-gray-900">${s.price.toLocaleString("es-AR")}</span>
                                                    )}
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color}`}>{config.label}</span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                    {suggestions.length > 0 && query.length >= 2 && (
                                        <button
                                            type="button"
                                            onClick={() => { router.push(`/buscar?q=${encodeURIComponent(query.trim())}`); setShowDropdown(false); }}
                                            className="w-full px-4 py-3 text-center text-sm font-semibold text-[#e60012] hover:bg-red-50 transition-colors border-t border-gray-100"
                                        >
                                            Ver todos los resultados
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Desktop stats */}
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
                </div>
            </div>
        </section>
    );
}
