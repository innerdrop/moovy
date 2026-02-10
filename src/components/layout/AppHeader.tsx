"use client";

// App Header Component - Professional delivery app style header
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, MapPin, Star, User, Package, X, ChevronRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useUserPoints } from "@/hooks/useUserPoints";

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

    const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
    const [showOrderPopup, setShowOrderPopup] = useState(false);

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
                            <span className="text-sm font-semibold text-gray-900">Ushuaia</span>
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

                    {/* Right: Points + Orders + Cart */}
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

                {/* Desktop Header */}
                <div className="hidden lg:flex items-center justify-between h-16 px-6 max-w-7xl mx-auto border-b border-gray-100 relative">
                    {/* Left */}
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
                                    <span className="text-sm font-semibold text-gray-900">Ushuaia</span>
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

                    {/* Right */}
                    <div className="flex items-center gap-3 flex-shrink-0 min-w-[200px] justify-end">
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
