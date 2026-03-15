"use client";

// App Header Component - Professional delivery app style header
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, MapPin, Star, User, Package, X, ChevronRight, Bell, Search, Loader2, Store, CloudRain } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useUserPoints } from "@/hooks/useUserPoints";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import AppSwitcher from "@/components/home/AppSwitcher";

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
    const { points } = useUserPoints();
    const items = useCartStore((state) => state.items);
    const actualCartCount = cartCount || items.length;

    const router = useRouter();
    const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
    const [showOrderPopup, setShowOrderPopup] = useState(false);

    // Search state
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any>(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const debouncedQuery = useDebounce(searchQuery, 300);
    const searchRef = useRef<HTMLDivElement>(null);

    const firstName = userName?.split(" ")[0] || "";

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

    // Search: fetch results on debounced query change
    useEffect(() => {
        if (!debouncedQuery || debouncedQuery.length < 2) {
            setSearchResults(null);
            setShowResults(false);
            return;
        }

        let cancelled = false;
        setSearchLoading(true);

        fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=5`)
            .then((r) => r.ok ? r.json() : null)
            .then((data) => {
                if (!cancelled && data) {
                    setSearchResults(data);
                    setShowResults(true);
                }
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setSearchLoading(false); });

        return () => { cancelled = true; };
    }, [debouncedQuery]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim().length >= 2) {
            router.push(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowResults(false);
            setShowMobileSearch(false);
            setSearchQuery("");
        }
    };

    const closeSearch = () => {
        setShowResults(false);
        setShowMobileSearch(false);
        setSearchQuery("");
        setSearchResults(null);
    };

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
            <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                {/* Red accent line */}
                <div className="h-1 bg-gradient-to-r from-[#e60012] via-[#ff3344] to-[#e60012]" />

                {/* Mobile Header - Single clean row */}
                <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-gray-100">
                    {/* Left: App Switcher + Greeting or Logo */}
                    <div className="flex items-center gap-2">
                        <AppSwitcher />
                        {isLoggedIn && firstName ? (
                            <Link href="/mi-perfil" className="flex items-center gap-1.5">
                                <div className="w-7 h-7 bg-gradient-to-br from-[#e60012] to-red-600 rounded-full flex items-center justify-center text-white font-bold text-[11px]">
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-xs font-semibold text-gray-900 hidden xs:inline">{firstName}</span>
                            </Link>
                        ) : (
                            <Link href="/login" className="text-xs font-medium text-gray-500 hover:text-[#e60012] transition">
                                Ingresar
                            </Link>
                        )}
                    </div>

                    {/* Center: Logo */}
                    <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={70}
                            height={22}
                            className="w-auto h-auto"
                            priority
                        />
                    </Link>

                    {/* Right: Search + Points + Orders + Cart */}
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={() => setShowMobileSearch(true)}
                            className="p-2 text-gray-600 hover:text-[#e60012] transition"
                        >
                            <Search className="w-5 h-5" />
                        </button>

                        {isLoggedIn && points > 0 && (
                            <Link
                                href="/puntos"
                                className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-full text-xs font-bold"
                            >
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {points > 999 ? `${(points / 1000).toFixed(1)}K` : points}
                            </Link>
                        )}

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
                                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-[#e60012] text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm">
                                    {actualCartCount > 99 ? "99+" : actualCartCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Desktop Header */}
                <div className="hidden lg:flex items-center justify-between h-16 px-6 max-w-7xl mx-auto border-b border-gray-100">
                    {/* Left: App Switcher + Logo + User */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <AppSwitcher />
                        <Link href="/" className="flex-shrink-0">
                            <Image
                                src="/logo-moovy.png"
                                alt="Moovy"
                                width={100}
                                height={32}
                                className="w-auto h-auto"
                                priority
                            />
                        </Link>
                        {isLoggedIn && firstName ? (
                            <Link href="/mi-perfil" className="flex items-center gap-2 hover:opacity-80 transition">
                                <div className="w-8 h-8 bg-gradient-to-br from-[#e60012] to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    {firstName.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-semibold text-gray-900">{firstName}</span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                    <MapPin className="w-3.5 h-3.5 text-[#e60012]" />
                                    Ushuaia
                                </div>
                                <Link
                                    href="/login"
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#e60012] hover:text-[#e60012] transition text-sm font-medium"
                                >
                                    <User className="w-4 h-4" />
                                    Ingresar
                                </Link>
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
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => { if (searchResults) setShowResults(true); }}
                                placeholder="Buscar productos, comercios..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 focus:border-[#e60012] transition placeholder:text-gray-400"
                            />
                            {searchLoading && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                            )}
                        </form>

                        {/* Desktop Search Results Dropdown */}
                        {showResults && searchResults && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden z-[60]">
                                {searchResults.results?.length > 0 ? (
                                    <div className="max-h-80 overflow-y-auto">
                                        {searchResults.merchants?.length > 0 && (
                                            <>
                                                <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comercios</div>
                                                {searchResults.merchants.slice(0, 3).map((m: any) => (
                                                    <Link
                                                        key={m.id}
                                                        href={`/tienda/${m.slug}`}
                                                        onClick={closeSearch}
                                                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                                                    >
                                                        {m.logo ? (
                                                            <img src={m.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-xl bg-[#e60012]/10 flex items-center justify-center">
                                                                <Store className="w-5 h-5 text-[#e60012]" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                                                            {m.description && <p className="text-xs text-gray-500 line-clamp-1">{m.description}</p>}
                                                        </div>
                                                    </Link>
                                                ))}
                                            </>
                                        )}
                                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</div>
                                        {searchResults.results.slice(0, 5).map((p: any) => (
                                            <Link
                                                key={p.id}
                                                href={`/productos/${p.slug}`}
                                                onClick={closeSearch}
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                                            >
                                                {p.images?.[0]?.url ? (
                                                    <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-300" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                                                    <p className="text-sm font-bold text-[#e60012]">${p.price?.toLocaleString("es-AR")}</p>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center">
                                        <p className="text-sm text-gray-500">No se encontraron resultados</p>
                                    </div>
                                )}
                                <Link
                                    href={`/buscar?q=${encodeURIComponent(searchQuery.trim())}`}
                                    onClick={closeSearch}
                                    className="block px-4 py-3 text-center text-sm font-semibold text-[#e60012] bg-gray-50 hover:bg-gray-100 transition border-t border-gray-100"
                                >
                                    Ver todos los resultados
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Right */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        {isLoggedIn && points > 0 && (
                            <Link
                                href="/puntos"
                                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-full text-sm font-bold hover:shadow-md transition"
                            >
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                {points.toLocaleString()} pts
                            </Link>
                        )}

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
                            className="relative flex items-center gap-2 bg-[#e60012] hover:bg-[#c4000f] text-white px-4 py-2.5 rounded-full font-medium transition shadow-md hover:shadow-lg"
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
            </header>

            {/* Mobile Search Overlay */}
            {showMobileSearch && (
                <div className="fixed inset-0 z-[60] bg-white lg:hidden">
                    <div className="flex items-center gap-3 h-14 px-4 border-b border-gray-100" style={{ marginTop: 'env(safe-area-inset-top)' }}>
                        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                autoFocus
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar productos, comercios..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#e60012]/30 transition placeholder:text-gray-400"
                            />
                            {searchLoading && (
                                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                            )}
                        </form>
                        <button onClick={closeSearch} className="p-2 text-gray-500 hover:text-gray-700">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mobile Search Results */}
                    <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 56px - env(safe-area-inset-top))' }}>
                        {showResults && searchResults ? (
                            searchResults.results?.length > 0 || searchResults.merchants?.length > 0 ? (
                                <>
                                    {searchResults.merchants?.length > 0 && (
                                        <>
                                            <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Comercios</div>
                                            {searchResults.merchants.slice(0, 3).map((m: any) => (
                                                <Link
                                                    key={m.id}
                                                    href={`/tienda/${m.slug}`}
                                                    onClick={closeSearch}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50"
                                                >
                                                    {m.logo ? (
                                                        <img src={m.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-[#e60012]/10 flex items-center justify-center">
                                                            <Store className="w-5 h-5 text-[#e60012]" />
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{m.name}</p>
                                                        {m.description && <p className="text-xs text-gray-500 line-clamp-1">{m.description}</p>}
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                                                </Link>
                                            ))}
                                        </>
                                    )}
                                    {searchResults.results?.length > 0 && (
                                        <>
                                            <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">Productos</div>
                                            {searchResults.results.slice(0, 6).map((p: any) => (
                                                <Link
                                                    key={p.id}
                                                    href={`/productos/${p.slug}`}
                                                    onClick={closeSearch}
                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-50"
                                                >
                                                    {p.images?.[0]?.url ? (
                                                        <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-xl object-cover" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                                                            <Package className="w-5 h-5 text-gray-300" />
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                                                        <p className="text-sm font-bold text-[#e60012]">${p.price?.toLocaleString("es-AR")}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                                </Link>
                                            ))}
                                        </>
                                    )}
                                    <Link
                                        href={`/buscar?q=${encodeURIComponent(searchQuery.trim())}`}
                                        onClick={closeSearch}
                                        className="block px-4 py-4 text-center text-sm font-semibold text-[#e60012] hover:bg-gray-50 transition"
                                    >
                                        Ver todos los resultados
                                    </Link>
                                </>
                            ) : (
                                <div className="p-8 text-center">
                                    <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">No se encontraron resultados</p>
                                    <p className="text-xs text-gray-400 mt-1">Probá con otra palabra</p>
                                </div>
                            )
                        ) : !searchQuery ? (
                            <div className="p-8 text-center">
                                <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">Buscá productos, comercios y más</p>
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
