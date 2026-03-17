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
  comercio: {
    label: "Comercio",
    color: "bg-blue-100 text-blue-700",
    icon: Store,
  },
  tienda: {
    label: "Tienda",
    color: "bg-emerald-100 text-emerald-700",
    icon: ShoppingBag,
  },
  marketplace: {
    label: "Marketplace",
    color: "bg-purple-100 text-purple-700",
    icon: Tag,
  },
} as const;

export default function HeroStatic({
  totalDelivered = 0,
  activeMerchants = 0,
}: HeroStaticProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced fetch
  const fetchSuggestions = useCallback((q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 1) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search/autocomplete?q=${encodeURIComponent(q)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowDropdown(true);
          setSelectedIdx(-1);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    fetchSuggestions(val);
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
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    }
  };

  const handleSelect = (s: Suggestion) => {
    router.push(s.href);
    setQuery(s.label);
    setShowDropdown(false);
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    inputRef.current?.focus();
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <section className="relative" style={{ zIndex: 10 }}>
      {/* Background + decorative layers (overflow hidden to clip floating shapes) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{
          background:
            "linear-gradient(135deg, #b80000 0%, #d50000 25%, #e60012 50%, #ff1a2e 75%, #ff3d4d 100%)",
        }}
      >
        {/* === LAYER 1: Deep ambient glow === */}
        <div
          className="absolute inset-0"
          style={{
            background: `
                            radial-gradient(ellipse 120% 80% at 0% 100%, rgba(255,255,255,0.14) 0%, transparent 50%),
                            radial-gradient(ellipse 80% 60% at 100% 0%, rgba(255,120,0,0.06) 0%, transparent 50%),
                            radial-gradient(circle at 50% 50%, rgba(0,0,0,0.08) 0%, transparent 70%)
                        `,
          }}
        />
        {/* === LAYER 2: Diagonal light beam === */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            background:
              "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.6) 45%, rgba(255,255,255,0.3) 55%, transparent 70%)",
          }}
        />
        {/* === LAYER 3: Organic floating shapes === */}
        <div
          className="absolute -top-20 -right-20 w-80 h-80 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)",
            animation: "hero-float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-10 -left-16 w-56 h-56 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,200,100,0.06) 0%, transparent 70%)",
            animation: "hero-float 10s ease-in-out infinite 2s",
          }}
        />
        <div
          className="absolute top-1/3 right-8 w-24 h-24 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
            animation: "hero-float 6s ease-in-out infinite 1s",
          }}
        />
        {/* === LAYER 4: Subtle noise texture === */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />
      </div>

      {/* === WAVE: outside overflow-hidden so it renders cleanly === */}
      <div
        className="absolute left-0 right-0 bottom-0 pointer-events-none"
        style={{ zIndex: 5, lineHeight: 0 }}
      >
        {/* Semi-transparent wave */}
        <svg
          viewBox="0 0 1440 100"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block absolute bottom-0"
          preserveAspectRatio="none"
          style={{ height: "55px" }}
        >
          <path
            d="M0 45C180 85 360 15 540 50C720 85 900 20 1080 55C1260 90 1380 35 1440 60V100H0Z"
            fill="rgba(255,255,255,0.4)"
          />
        </svg>
        {/* Solid white wave — covers bottom completely */}
        <svg
          viewBox="0 0 1440 100"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full block relative"
          preserveAspectRatio="none"
          style={{ height: "50px" }}
        >
          <path
            d="M0 55C200 95 440 10 720 60C1000 110 1240 25 1440 70V100H0Z"
            fill="#ffffff"
          />
        </svg>
        {/* White bar to guarantee no red line leaks at the very bottom */}
        <div className="h-1 bg-white w-full" />
      </div>

      {/* === CONTENT (outside overflow-hidden so dropdown is visible) === */}
      <div
        className="relative container mx-auto px-4 pt-8 pb-16 md:pt-12 md:pb-20 lg:pt-16 lg:pb-24"
        style={{ zIndex: 20 }}
      >
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="max-w-2xl mx-auto lg:mx-0">
            {/* Headline */}
            <h1 className="text-white text-[32px] sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight mb-3">
              <span className="font-bold">Todo </span>
              <span
                className="font-black"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}
              >
                Ushuaia
              </span>
              <span className="font-bold"> en</span>
              <br />
              <span
                className="font-black"
                style={{ textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}
              >
                tu puerta.
              </span>
            </h1>

            {/* Animated accent line */}
            <div
              className="h-1 rounded-full mb-5 w-20"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,200,100,0.7), rgba(255,255,255,0.3))",
                animation: "hero-accent-line 3s ease-in-out infinite",
              }}
            />

            <p className="text-white/90 text-base sm:text-lg md:text-xl font-semibold mb-7 max-w-lg">
              Pedidos de comercios locales en minutos
            </p>

            {/* === SEARCH BAR WITH AUTOCOMPLETE === */}
            <div
              ref={dropdownRef}
              className="relative max-w-md"
              style={{ zIndex: 30 }}
            >
              {/* Person image — behind the search bar, "holding" it */}
              <div
                className="absolute -top-[150px] sm:-top-[180px] md:-top-[210px] lg:-top-[250px] -right-[30px] sm:-right-[40px] md:-right-[20px] lg:-right-[60px] pointer-events-none select-none"
                style={{ zIndex: 1 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/hero-person.png"
                  alt="Persona usando MOOVY"
                  className="h-[255px] sm:h-[330px] md:h-[380px] lg:h-[460px] w-auto object-contain"
                  style={{
                    filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.25))",
                  }}
                />
              </div>
              <form onSubmit={handleSubmit}>
                {/* Glow */}
                <div className="absolute -inset-1 bg-white/20 rounded-3xl blur-lg" />
                <div className="relative flex items-center bg-white rounded-2xl shadow-2xl shadow-black/25">
                  <Search className="w-5 h-5 text-gray-400 ml-4 flex-shrink-0" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={handleChange}
                    onFocus={() =>
                      suggestions.length > 0 && setShowDropdown(true)
                    }
                    onKeyDown={handleKeyDown}
                    placeholder="¿Qué querés pedir?"
                    className="flex-1 min-w-0 px-3 py-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent font-medium"
                    autoComplete="off"
                  />
                  {query.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="p-1.5 mr-0.5 text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  {query.length >= 2 && (
                    <button
                      type="submit"
                      className="bg-[#e60012] text-white px-3 sm:px-5 py-2 sm:py-2.5 mr-1.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#cc000f] transition-colors flex-shrink-0 whitespace-nowrap"
                    >
                      Buscar
                    </button>
                  )}
                </div>
              </form>

              {/* Autocomplete dropdown */}
              {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl shadow-black/15 border border-gray-100 overflow-hidden max-h-80 overflow-y-auto z-50">
                  {loading && suggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                      Buscando...
                    </div>
                  )}
                  {!loading &&
                    suggestions.length === 0 &&
                    query.length >= 1 && (
                      <div className="px-4 py-3 text-sm text-gray-400 text-center">
                        No se encontraron resultados
                      </div>
                    )}
                  {suggestions.map((s, idx) => {
                    const config = TYPE_CONFIG[s.type];
                    const Icon = config.icon;
                    return (
                      <button
                        key={`${s.type}-${s.id}`}
                        type="button"
                        onClick={() => handleSelect(s)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          idx === selectedIdx
                            ? "bg-gray-50"
                            : "hover:bg-gray-50"
                        } ${idx > 0 ? "border-t border-gray-50" : ""}`}
                      >
                        {/* Thumbnail */}
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {s.image ? (
                            <Image
                              src={s.image}
                              alt=""
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {s.label}
                          </div>
                          {s.extra && (
                            <div className="text-xs text-gray-500 truncate">
                              {s.extra}
                            </div>
                          )}
                        </div>
                        {/* Type badge + price */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {s.price != null && (
                            <span className="text-sm font-bold text-gray-900">
                              ${s.price.toLocaleString("es-AR")}
                            </span>
                          )}
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${config.color}`}
                          >
                            {config.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {suggestions.length > 0 && query.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        router.push(
                          `/buscar?q=${encodeURIComponent(query.trim())}`,
                        );
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 text-center text-sm font-semibold text-[#e60012] hover:bg-red-50 transition-colors border-t border-gray-100"
                    >
                      Ver todos los resultados
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Desktop stats row */}
            {(totalDelivered > 0 || activeMerchants > 0) && (
              <div className="hidden lg:flex items-center gap-8 mt-10">
                {totalDelivered > 0 && (
                  <div className="text-center text-white">
                    <div className="text-3xl font-black">
                      +{totalDelivered.toLocaleString("es-AR")}
                    </div>
                    <div className="text-[11px] font-medium opacity-70">
                      pedidos entregados
                    </div>
                  </div>
                )}
                {activeMerchants > 0 && (
                  <div className="text-center text-white">
                    <div className="text-3xl font-black">{activeMerchants}</div>
                    <div className="text-[11px] font-medium opacity-70">
                      comercios activos
                    </div>
                  </div>
                )}
                <div className="text-center text-white">
                  <div className="text-3xl font-black">4.8</div>
                  <div className="text-[11px] font-medium opacity-70">
                    satisfacción promedio
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
