"use client";

// App Header Component - Header unificado tipo app para todos los usuarios
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, MapPin, Star, ChevronLeft } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useUserPoints } from "@/hooks/useUserPoints";

interface AppHeaderProps {
    isLoggedIn?: boolean;
    cartCount?: number;
    userName?: string;
    title?: string;
    showBack?: boolean;
    backHref?: string;
    rightAction?: React.ReactNode;
}

export default function AppHeader({
    isLoggedIn = false,
    cartCount = 0,
    userName,
    title,
    showBack = false,
    backHref = "/",
    rightAction,
}: AppHeaderProps) {
    const openCart = useCartStore((state) => state.openCart);
    const { points } = useUserPoints();

    // Get first name for greeting
    const firstName = userName?.split(" ")[0] || "";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto border-b border-gray-100">
                {/* Left: Back button or Logo/Greeting */}
                {showBack ? (
                    <Link href={backHref} className="flex items-center gap-1 text-gray-600 min-w-[60px]">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm">Volver</span>
                    </Link>
                ) : isLoggedIn && firstName ? (
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#e60012] to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {firstName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 leading-none">Hola,</span>
                            <span className="font-semibold text-gray-900 text-sm leading-tight">{firstName}</span>
                        </div>
                    </Link>
                ) : (
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={90}
                            height={28}
                            style={{ width: 'auto', height: 'auto' }}
                            priority
                        />
                    </Link>
                )}

                {/* Center: Title if provided, else logo for logged users */}
                {title ? (
                    <h1 className="font-bold text-gray-900 text-lg truncate max-w-[150px]">
                        {title}
                    </h1>
                ) : isLoggedIn && firstName ? (
                    <Link href="/" className="flex items-center">
                        <Image
                            src="/logo-moovy.png"
                            alt="Moovy"
                            width={70}
                            height={22}
                            style={{ width: 'auto', height: 'auto' }}
                        />
                    </Link>
                ) : (
                    <button className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full">
                        <MapPin className="w-4 h-4 text-[#e60012]" />
                        <span className="font-medium truncate max-w-[120px]">Ushuaia</span>
                    </button>
                )}

                {/* Right: Custom action or default cart/points */}
                {rightAction ? (
                    <div className="min-w-[60px] flex justify-end">{rightAction}</div>
                ) : (
                    <div className="flex items-center gap-1">
                        {/* Points Badge - Only for logged in users */}
                        {isLoggedIn && (
                            <Link
                                href="/puntos"
                                className="flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 px-2.5 py-1 rounded-full text-xs font-bold"
                            >
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                {points > 999 ? `${(points / 1000).toFixed(1)}K` : points}
                            </Link>
                        )}

                        {/* Cart Button */}
                        <button
                            onClick={() => openCart()}
                            className="relative p-2 -mr-2 text-gray-600 hover:text-[#e60012] transition"
                        >
                            <ShoppingBag className="w-6 h-6" />
                            {cartCount > 0 && (
                                <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-[#e60012] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                    {cartCount > 99 ? "99+" : cartCount}
                                </span>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
}
