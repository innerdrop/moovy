"use client";

// App Header Component - Professional delivery app style header
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, MapPin, Package, X, ChevronRight, Bell, Search, Loader2, Store, Tag, ArrowLeft } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useRouter, usePathname } from "next/navigation";
import UploadImage from "@/components/ui/UploadImage";

interface AppHeaderProps {
    isLoggedIn?: boolean;
    cartCount?: number;
    userName?: string;
}

interface ActiveOrder {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
}

export default function AppHeader({
    isLoggedIn = false,
    cartCount = 0,
    userName,
}: AppHeaderProps) {
    const openCart = useCartStore((state) => state.openCart);
    const items = useCartStore((state) => state.items);
    const actualCartCount = cartCount || items.length;

    const router = useRouter();
    const pathname = usePathname();
    const isMarketplace = pathname?.startsWith("/marketplace");
    const isHomepage = pathname === "/";
    const isBuscar = pathname === "/buscar";

    const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
    const [showOrderPopup, setShowOrderPopup] = useState(false);

    // Search state — uses autocomplete API like SearchBarHero
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [suggestions, setSuggestions] = useState<Array<{
        type: "comercio" | "tienda" | "marketplace";
        id: string;
        label: string;
        image: string | null;
        href: string;
        extra: string | null;
        price?: number;
    }>>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const firstName = userName?.split(" ")[0] || "";

    const headerSearchRef = useRef<HTMLInputElement>(null);

    // Listen for custom event from HomeHero search button
    useEffect(() => {
        const handler = () => setShowMobileSearch(true);
        window.addEventListener("moovy:open-search", handler);
        return () => window.removeEventListener("moovy:open-search", handler);
    }, []);

    // On homepage: show compact search bar when hero search scrolls out of view
    const [heroSearchVisible, setHeroSearchVisible] = useState(true);
    useEffect(() => {
        if (!isHomepage) return;
        const handler = (e: Event) => {
            const visible = (e as CustomEvent).detail?.visible ?? true;
            setHeroSearchVisible(visible);
        };
        window.addEventListener("moovy:hero-search-visibility", handler);
        return () => window.removeEventListener("moovy:hero-search-visibility", handler);
    }, [isHomepage]);

    // On non-homepage pages: show subtle search bar only after user scrolls down
    const [hasScrolled, setHasScrolled] = useState(false);
    useEffect(() => {
        if (isHomepage || isMarketplace || isBuscar) return;
        setHasScrolled(false);
        const onScroll = () => setHasScrolled(window.scrollY > 30);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [isHomepage, isMarketplace, isBuscar, pathname]);

    // Fetch active orders
    useEffect(() => {
        if (!isLoggedIn) return;

        const checkActiveOrders = async () => {
            try {
                const res = await fetch("/api/orders/active");
                if (res.ok) {
                    const data = await res.json();
                    setActiveOrder(data.order || null);
                }
            } catch (error) {
                console.error("Error checking active orders:", error);
            }
        };

        checkActiveOrders();
        // Poll every 30 seconds
        const interval = setInterval(checkActiveOrders, 30000);
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const hasActiveOrder = activeOrder !== null;

    // Search: fetch autocomplete suggestions with debounce
    const fetchSuggestions = (q: string) => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.length < 1) {
            setSuggestions([]);
            setShowResults(false);
            return;
        }
        setSearchLoading(true);
        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(q)}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.suggestions || []);
                    setShowResults(true);
                }
            } catch { /* silent */ }
            finally { setSearchLoading(false); }
        }, 300);
    };

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, []);

    const handleSearchInputChange = (value: string) => {
        setSearchQuery(value);
        fetchSuggestions(value);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim().length >= 2) {
            const q = searchQuery.trim();
            // Navigate first, then close overlay without clearing query
            // (the /buscar page reads from URL params, not from this state)
            router.push(`/buscar?q=${encodeURIComponent(q)}`);
            setShowResults(false);
            setShowMobileSearch(false);
            setSuggestions([]);
            setSearchQuery("");
        }
    };

    const closeSearch = () => {
        setShowResults(false);
        setShowMobileSearch(false);
        setSearchQuery("");
        setSuggestions([]);
    };

    // Navigate to specific result, then close overlay
    const navigateAndClose = (href: string) => {
        router.push(href);
        // Small delay so router.push fires before overlay unmounts
        setTimeout(() => closeSearch(), 100);
    };

    // Close search overlay on route change — but only if we're not navigating TO /buscar
    // (avoids race condition where closeSearch interferes with the navigation)
    const prevPathRef = useRef(pathname);
    useEffect(() => {
        if (prevPathRef.current !== pathname) {
            // Only auto-close if the overlay is open and we navigated away
            if (showMobileSearch || showResults) {
                setShowResults(false);
                setShowMobileSearch(false);
                setSuggestions([]);
                setSearchQuery("");
            }
            prevPathRef.current = pathname;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pathname]);

    // Click outside to close search results
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: "Pendiente",
            CONFIRMED: "Confirmado",
            PREPARING: "Preparando",
            READY: "Listo",
            IN_DELIVERY: "En camino",
            DELIVERED: "Entregado",
            CANCELLED: "Cancelado"
        };
        return labels[status] || status;
    };

    return (
        <>
            <header
                className="fixed top-0 left-0 right-0 z-50 overflow-visible bg-white shadow-sm"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                {/* Accent line — red or violet on marketplace */}
                <div className={`h-1 bg-gradient-to-r ${isMarketplace ? "from-[#7C3AED] via-[#8B5CF6] to-[#7C3AED]" : "from-[#e60012] via-[#ff1a2e] to-[#e60012]"}`} />

                {/* Mobile Header - Single clean row */}
                <div className="lg:hidden flex items-center justify-between h-14 px-4">
                    {/* Left: Location or Greeting */}
                    <div className="flex items-center gap-2">
                        {isLoggedIn && firstName ? (
                            <Link href="/mi-perfil" className="flex items-center gap-1.5">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white ${isMarketplace ? "bg-[#7C3AED]" : "bg-[#e60012]"}`}>
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold hidden xs:inline text-gray-900">{firstName}</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-1 text-gray-600">
                                <MapPin className={`w-4 h-4 ${isMarketplace ? "text-[#7C3AED]" : "text-[#e60012]"}`} />
                                <span className="text-sm font-medium">Ushuaia</span>
                            </div>
                        )}
                    </div>

                    {/* Center: Logo — switches to purple on marketplace */}
                    <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
                        <Image
                            src={isMarketplace ? "/logo-moovy-purple.svg" : "/logo-moovy.svg"}
                            alt="Moovy"
                            width={280}
                            height={90}
                            className="h-6 w-auto"
                            priority
                        />
                    </Link>

                    {/* Right: Orders + Cart */}
                    <div className="flex items-center gap-0.5">
                        {isLoggedIn && (
                            <Link
                                href="/mis-pedidos"
                                className="relative p-2 text-gray-600 hover:text-[#e60012] transition"
                            >
                                <Bell className="w-5 h-5" />
                            </Link>
                        )}

                        <button
                            onClick={() => openCart()}
                            className="relative p-2 text-gray-600 hover:text-[#e60012] transition"
                        >
                            <ShoppingBag className="w-6 h-6" />
                            {actualCartCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] text-xs rounded-full flex items-center justify-center font-bold shadow-sm bg-[#e60012] text-white">
                                    {actualCartCount > 99 ? "99+" : actualCartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile: compact search bar — style varies by context */}
                {/* Homepage (after scroll): red bg, prominent */}
                {isHomepage && !heroSearchVisible && (
                    <div className="lg:hidden px-4 pb-3 pt-1.5" style={{ backgroundColor: "#e60012" }}>
                        <button
                            type="button"
                            onClick={() => setShowMobileSearch(true)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white rounded-2xl text-left shadow-lg shadow-black/10 transition active:scale-[0.98]"
                        >
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-400 font-medium truncate">¿Qué querés pedir?</span>
                        </button>
                    </div>
                )}
                {/* Other pages (except marketplace/buscar/homepage): subtle gray bar, only after scroll */}
                {!isHomepage && !isMarketplace && !isBuscar && hasScrolled && (
                    <div className="lg:hidden px-4 pb-2 pt-1.5 bg-white border-b border-gray-100">
                        <button
                            type="button"
                            onClick={() => setShowMobileSearch(true)}
                            className="w-full flex items-center gap-3 px-3.5 py-2 bg-gray-100 rounded-xl text-left transition active:scale-[0.98]"
                        >
                            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm text-gray-400 font-medium truncate">Buscar...</span>
                        </button>
                    </div>
                )}

                {/* Desktop Header */}
                <div className="hidden lg:flex items-center justify-between h-16 px-6 max-w-7xl mx-auto">
                    {/* Left: Logo + Location/User */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <Link href="/" className="flex-shrink-0">
                            <Image
                                src={isMarketplace ? "/logo-moovy-purple.svg" : "/logo-moovy.svg"}
                                alt="Moovy"
                                width={280}
                                height={90}
                                className="h-7 w-auto"
                                priority
                            />
                        </Link>
                        {isLoggedIn && firstName ? (
                            <Link href="/mi-perfil" className="flex items-center gap-2 hover:opacity-80 transition">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${isMarketplace ? "bg-[#7C3AED]" : "bg-[#e60012]"}`}>
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{firstName}</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                                <MapPin className={`w-3.5 h-3.5 ${isMarketplace ? "text-[#7C3AED]" : "text-[#e60012]"}`} />
                                Ushuaia
                            </div>
                        )}
                    </div>

                    {/* Center: Search Bar */}
                    <div ref={searchRef} className="flex-1 max-w-xl mx-6 relative">
                        <form onSubmit={handleSearchSubmit} className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearchInputChange(e.target.value)}
                                onFocus={() => { if (suggestions.length > 0) setShowResults(true); }}
                                placeholder="Buscar productos, comercios..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] transition placeholder:text-gray-400"
                            />
                            {searchLoading && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                            )}
                        </form>

                        {/* Desktop Search Results Dropdown */}
                        {showResults && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-[60]">
                                <div className="max-h-80 overflow-y-auto">
                                    {(() => {
                                        const comercios = suggestions.filter(s => s.type === "comercio");
                                        const productos = suggestions.filter(s => s.type === "tienda");
                                        const marketplace = suggestions.filter(s => s.type === "marketplace");
                                        return (
                                            <>
                                                {comercios.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comercios</div>
                                                        {comercios.map(s => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => navigateAndClose(s.href)}
                                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                    {s.image ? (
                                                                        <UploadImage src={s.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Store className="w-5 h-5 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-base font-semibold text-gray-900 truncate">{s.label}</p>
                                                                    {s.extra && <p className="text-xs text-gray-500">{s.extra}</p>}
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {productos.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</div>
                                                        {productos.map(s => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => navigateAndClose(s.href)}
                                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                    {s.image ? (
                                                                        <UploadImage src={s.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Package className="w-5 h-5 text-gray-300" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-base font-semibold text-gray-900 truncate">{s.label}</p>
                                                                    <p className="text-base font-bold text-[#e60012]">{s.price != null ? `$${s.price.toLocaleString("es-AR")}` : ""}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                                {marketplace.length > 0 && (
                                                    <>
                                                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marketplace</div>
                                                        {marketplace.map(s => (
                                                            <button
                                                                key={s.id}
                                                                type="button"
                                                                onClick={() => navigateAndClose(s.href)}
                                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-left"
                                                            >
                                                                <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                    {s.image ? (
                                                                        <UploadImage src={s.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <Tag className="w-5 h-5 text-gray-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-base font-semibold text-gray-900 truncate">{s.label}</p>
                                                                    <p className="text-base font-bold text-[#7C3AED]">{s.price != null ? `$${s.price.toLocaleString("es-AR")}` : ""}</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                                {searchQuery.trim().length >= 2 && (
                                    <button
                                        type="button"
                                        onClick={() => navigateAndClose(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)}
                                        className="w-full px-4 py-3 text-center text-sm font-semibold text-[#e60012] bg-gray-50 hover:bg-gray-100 transition border-t border-gray-100"
                                    >
                                        Ver todos los resultados
                                    </button>
                                )}
                            </div>
                        )}
                        {showResults && suggestions.length === 0 && !searchLoading && searchQuery.length >= 1 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-[60]">
                                <div className="p-6 text-center">
                                    <p className="text-sm text-gray-500">No se encontraron resultados</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {isLoggedIn && (
                            <Link
                                href="/mis-pedidos"
                                className="relative p-2 text-gray-600 hover:text-[#e60012] transition rounded-full hover:bg-gray-50"
                            >
                                <Bell className="w-5 h-5" />
                            </Link>
                        )}

                        {/* Cart Button */}
                        <button
                            onClick={() => openCart()}
                            className="relative flex items-center gap-2 bg-[#e60012] hover:bg-[#cc000f] text-white px-4 py-2.5 rounded-full font-medium transition shadow-md hover:shadow-lg"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span className="text-sm">Carrito</span>
                            {actualCartCount > 0 && (
                                <span className="bg-white text-[#e60012] text-xs font-bold px-2 py-0.5 rounded-full">
                                    {actualCartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Desktop Secondary Navigation */}
                <div className="hidden lg:block border-t border-gray-100 bg-white">
                    <div className="max-w-7xl mx-auto px-6">
                        <nav className="flex items-center gap-1 h-11">
                            {[
                                { href: "/", label: "Inicio" },
                                { href: "/tiendas", label: "Comercios" },
                                { href: "/marketplace", label: "Marketplace" },
                                { href: "/puntos", label: "MOOVER" },
                                { href: "/nosotros", label: "Nosotros" },
                                { href: "/comisiones", label: "Tarifas" },
                            ].map((link) => {
                                const isLinkActive = link.href === "/"
                                    ? pathname === "/"
                                    : pathname?.startsWith(link.href);
                                const isMP = link.href === "/marketplace";
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                            isLinkActive
                                                ? isMP
                                                    ? "bg-[#7C3AED]/10 text-[#7C3AED]"
                                                    : "bg-[#e60012]/10 text-[#e60012]"
                                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                );
                            })}
                            <div className="flex-1" />
                            {isLoggedIn && (
                                <Link
                                    href="/mis-pedidos"
                                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                                        pathname?.startsWith("/mis-pedidos")
                                            ? "bg-[#e60012]/10 text-[#e60012]"
                                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                    }`}
                                >
                                    Mis Pedidos
                                </Link>
                            )}
                        </nav>
                    </div>
                </div>
            </header>

            {/* Mobile Search Overlay */}
            {showMobileSearch && (
                <div className="fixed inset-0 z-[60] bg-white lg:hidden">
                    <div className="flex items-center gap-2 h-14 px-2 border-b border-gray-100" style={{ marginTop: 'env(safe-area-inset-top)' }}>
                        {/* Back arrow — closes overlay */}
                        <button onClick={closeSearch} className="p-2 text-gray-500 hover:text-gray-700 flex-shrink-0">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => handleSearchInputChange(e.target.value)}
                                placeholder="Buscar productos, comercios..."
                                className="w-full pl-10 pr-9 py-2.5 bg-gray-100 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 transition placeholder:text-gray-400"
                            />
                            {/* X inside input — clears text only */}
                            {searchQuery.length > 0 && !searchLoading && (
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(""); setSuggestions([]); setShowResults(false); }}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            {searchLoading && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                            )}
                        </form>
                    </div>

                    {/* Mobile Search Results */}
                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px - env(safe-area-inset-top))' }}>
                        {suggestions.length > 0 ? (
                            <>
                                {(() => {
                                    const comercios = suggestions.filter(s => s.type === "comercio");
                                    const productos = suggestions.filter(s => s.type === "tienda");
                                    const marketplace = suggestions.filter(s => s.type === "marketplace");
                                    return (
                                        <>
                                            {comercios.length > 0 && (
                                                <>
                                                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comercios</div>
                                                    {comercios.map(s => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => navigateAndClose(s.href)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 text-left"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                {s.image ? (
                                                                    <UploadImage src={s.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Store className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">{s.label}</p>
                                                                {s.extra && <p className="text-xs text-gray-500">{s.extra}</p>}
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {productos.length > 0 && (
                                                <>
                                                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</div>
                                                    {productos.map(s => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => navigateAndClose(s.href)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 text-left"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                {s.image ? (
                                                                    <UploadImage src={s.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Package className="w-5 h-5 text-gray-300" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-base font-semibold text-gray-900 truncate">{s.label}</p>
                                                                <p className="text-base font-bold text-[#e60012]">{s.price != null ? `$${s.price.toLocaleString("es-AR")}` : ""}</p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                            {marketplace.length > 0 && (
                                                <>
                                                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Marketplace</div>
                                                    {marketplace.map(s => (
                                                        <button
                                                            key={s.id}
                                                            type="button"
                                                            onClick={() => navigateAndClose(s.href)}
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50 text-left"
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                                {s.image ? (
                                                                    <UploadImage src={s.image} alt="" width={40} height={40} className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <Tag className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-base font-semibold text-gray-900 truncate">{s.label}</p>
                                                                <p className="text-base font-bold text-[#7C3AED]">{s.price != null ? `$${s.price.toLocaleString("es-AR")}` : ""}</p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                        </button>
                                                    ))}
                                                </>
                                            )}
                                        </>
                                    );
                                })()}
                                {searchQuery.trim().length >= 2 && (
                                    <button
                                        type="button"
                                        onClick={() => navigateAndClose(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`)}
                                        className="w-full px-4 py-4 text-center text-sm font-semibold text-[#e60012] hover:bg-gray-50 transition"
                                    >
                                        Ver todos los resultados
                                    </button>
                                )}
                            </>
                        ) : searchQuery && !searchLoading && showResults ? (
                            <div className="p-8 text-center">
                                <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-base text-gray-500">No se encontraron resultados</p>
                                <p className="text-sm text-gray-400 mt-1">Probá con otra palabra</p>
                            </div>
                        ) : !searchQuery ? (
                            <div className="px-5 pt-6">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Búsquedas populares</p>
                                <div className="flex flex-wrap gap-2">
                                    {["Pizza", "Hamburguesa", "Farmacia", "Bebidas", "Ropa", "Electrónica", "Sushi", "Panadería"].map((term) => (
                                        <button
                                            key={term}
                                            type="button"
                                            onClick={() => handleSearchInputChange(term)}
                                            className="px-3 py-1.5 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-[#e60012]/10 hover:text-[#e60012] transition"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Orders Popup */}
            {showOrderPopup && (
                <div
                    className="fixed inset-0 z-[70] bg-black/50 flex items-start justify-center pt-20"
                    onClick={() => setShowOrderPopup(false)}
                >
                    <div
                        className="w-full max-w-sm mx-4 bg-white rounded-2xl shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 flex items-center justify-between border-b border-gray-100">
                            <h3 className="font-bold text-gray-900">Mis Pedidos</h3>
                            <button onClick={() => setShowOrderPopup(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="p-4">
                            {activeOrder ? (
                                <Link
                                    href={`/mis-pedidos/${activeOrder.id}`}
                                    onClick={() => setShowOrderPopup(false)}
                                    className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition"
                                >
                                    <div>
                                        <p className="font-semibold text-gray-900">#{activeOrder.orderNumber}</p>
                                        <p className="text-sm text-green-600">{getStatusLabel(activeOrder.status)}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </Link>
                            ) : (
                                <div className="text-center py-4">
                                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-gray-500 text-sm">No tenés pedidos en curso</p>
                                </div>
                            )}
                            <Link
                                href="/mis-pedidos"
                                onClick={() => setShowOrderPopup(false)}
                                className="block w-full mt-3 py-2 text-center text-[#e60012] font-medium text-sm hover:underline"
                            >
                                Ver historial completo
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}