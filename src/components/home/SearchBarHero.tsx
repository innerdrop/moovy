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
    color: "bg-red-100 text-red-700",
    icon: Tag,
  },
} as const;

export default function SearchBarHero() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Autocomplete logic
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
          `/api/search/autocomplete?q=${encodeURIComponent(q)}`
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setShowDropdown(true);
          setSelectedIdx(-1);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
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
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((p) => (p < suggestions.length - 1 ? p + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((p) => (p > 0 ? p - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      )
        setShowDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <section className="relative bg-transparent mt-2 z-20">
      <div className="container mx-auto px-4 md:px-6 lg:px-8 pb-4 pt-0">
        {/* Search bar - centered, overlapping banner */}
        <div
          ref={dropdownRef}
          className="relative mx-auto max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="relative">
            <div className="absolute -inset-1 bg-white/60 rounded-2xl blur" />
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-black/10">
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
                className="flex-1 min-w-0 px-3 py-4 text-base text-gray-900 placeholder:text-gray-400 outline-none bg-transparent font-medium"
                autoComplete="off"
              />
              {query.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="p-1.5 mr-0.5 text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                  aria-label="Limpiar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {query.length >= 2 && (
                <button
                  type="submit"
                  className="bg-[#e60012] text-white px-4 sm:px-5 py-2.5 mr-1.5 rounded-xl text-sm sm:text-base font-bold hover:bg-[#cc000f] transition-colors flex-shrink-0 whitespace-nowrap"
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
                      idx === selectedIdx ? "bg-gray-50" : "hover:bg-gray-50"
                    } ${idx > 0 ? "border-t border-gray-50" : ""}`}
                  >
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
                    <div className="flex-1 min-w-0">
                      <div className="text-base font-semibold text-gray-900 truncate">
                        {s.label}
                      </div>
                      {s.extra && (
                        <div className="text-sm text-gray-500 truncate">
                          {s.extra}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {s.price != null && (
                        <span className="text-base font-bold text-gray-900">
                          ${s.price.toLocaleString("es-AR")}
                        </span>
                      )}
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${config.color}`}
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
                      `/buscar?q=${encodeURIComponent(query.trim())}`
                    );
                    setShowDropdown(false);
                  }}
                  className="w-full px-4 py-3 text-center text-base font-semibold text-[#e60012] hover:bg-red-50 transition-colors"
                >
                  Ver todos los resultados
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  </section>
  );
}