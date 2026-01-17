"use client";

// App Header Component - Professional delivery app style header
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, MapPin, Star, User } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useUserPoints } from "@/hooks/useUserPoints";

interface AppHeaderProps {
    isLoggedIn?: boolean;
    cartCount?: number;
    userName?: string;
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

    const firstName = userName?.split(" ")[0] || "";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            {/* Red accent line */}
            <div className="h-1 bg-gradient-to-r from-[#e60012] via-[#ff3344] to-[#e60012]" />

            {/* Mobile Header - Single clean row */}
            <div className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-gray-100">
                {/* Left: Greeting (logged in) or Location (not logged in) */}
                {isLoggedIn && firstName ? (
                    <Link href="/mi-perfil" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#e60012] to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {firstName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-gray-400 leading-none">Hola,</span>
                            <span className="text-sm font-semibold text-gray-900">{firstName}</span>
                        </div>
                    </Link>
                ) : (
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-[#e60012]/10 rounded-full flex items-center justify-center flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 text-[#e60012]" />
                        </div>
                        <span className="text-sm font-semibold text-gray-900">Ushuaia, TDF</span>
                    </div>
                )}

                {/* Center: Logo */}
                <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
                    <Image
                        src="/logo-moovy.png"
                        alt="Moovy"
                        width={70}
                        height={22}
                        style={{ width: 'auto', height: 'auto' }}
                        priority
                    />
                </Link>

                {/* Right: Points + Cart */}
                <div className="flex items-center gap-0.5">
                    {isLoggedIn && points > 0 && (
                        <Link
                            href="/puntos"
                            className="flex items-center gap-1 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 px-2 py-1 rounded-full text-xs font-bold"
                        >
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            {points > 999 ? `${(points / 1000).toFixed(1)}K` : points}
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

            {/* Desktop Header - Same order as mobile: Name Left, Logo Center, Points+Cart Right */}
            <div className="hidden lg:flex items-center justify-between h-16 px-6 max-w-7xl mx-auto border-b border-gray-100 relative">
                {/* Left: Greeting (logged in) or Location + Login (not logged in) */}
                <div className="flex items-center gap-3 flex-shrink-0 min-w-[200px]">
                    {isLoggedIn && firstName ? (
                        <Link href="/mi-perfil" className="flex items-center gap-3 hover:opacity-80 transition">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#e60012] to-red-600 rounded-full flex items-center justify-center text-white font-bold">
                                {firstName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-400 leading-none">Hola,</span>
                                <span className="text-base font-semibold text-gray-900">{firstName}</span>
                            </div>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-[#e60012]/10 rounded-full flex items-center justify-center">
                                    <MapPin className="w-4 h-4 text-[#e60012]" />
                                </div>
                                <span className="text-sm font-semibold text-gray-900">Ushuaia, TDF</span>
                            </div>
                            <Link
                                href="/login"
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-[#e60012] hover:text-[#e60012] transition text-sm font-medium"
                            >
                                <User className="w-4 h-4" />
                                Ingresar
                            </Link>
                        </div>
                    )}
                </div>

                {/* Center: Logo */}
                <Link href="/" className="absolute left-1/2 transform -translate-x-1/2">
                    <Image
                        src="/logo-moovy.png"
                        alt="Moovy"
                        width={110}
                        height={35}
                        style={{ width: 'auto', height: 'auto' }}
                        priority
                    />
                </Link>

                {/* Right: Points + Cart */}
                <div className="flex items-center gap-3 flex-shrink-0 min-w-[200px] justify-end">
                    {/* Points Badge */}
                    {isLoggedIn && points > 0 && (
                        <Link
                            href="/puntos"
                            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-full text-sm font-bold hover:shadow-md transition"
                        >
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {points.toLocaleString()} pts
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
    );
}
