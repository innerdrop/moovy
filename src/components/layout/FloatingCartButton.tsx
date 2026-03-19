"use client";

// Floating Cart Button - Shows above bottom nav when cart has items
// Dismissable — user can hide it, badge on header still shows count
import { useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/delivery";

export default function FloatingCartButton() {
    const { openCart, getTotalPrice, getTotalItems } = useCartStore();
    const pathname = usePathname();
    const [dismissed, setDismissed] = useState(false);

    const totalItems = getTotalItems();
    const total = getTotalPrice();

    // Pages where we shouldn't show the floating cart
    const isAuthPage = pathname === "/login" || pathname === "/registro";
    const isCheckoutPage = pathname === "/checkout";

    // Don't show if cart is empty, on auth pages, checkout, or dismissed
    if (totalItems === 0 || isAuthPage || isCheckoutPage || dismissed) return null;

    return (
        <div className="fixed bottom-24 left-4 right-4 max-w-lg mx-auto z-[55]" style={{ marginBottom: 'env(safe-area-inset-bottom)' }}>
            <div className="relative">
                {/* Dismiss button */}
                <button
                    onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
                    className="absolute -top-2 -right-1 w-6 h-6 bg-gray-700 text-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-600 transition z-10"
                    aria-label="Ocultar carrito"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                {/* Cart button */}
                <button
                    onClick={() => openCart()}
                    className="w-full bg-[#e60012] text-white rounded-2xl py-4 px-6 shadow-xl shadow-red-500/20 flex items-center justify-between gap-4 active:scale-[0.98] transition-transform"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <ShoppingBag className="w-6 h-6" />
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-white text-[#e60012] text-[10px] rounded-full flex items-center justify-center font-bold">
                                {totalItems}
                            </span>
                        </div>
                        <span className="font-semibold">Ver Carrito</span>
                    </div>

                    <span className="text-lg font-bold">{formatPrice(total)}</span>
                </button>
            </div>
        </div>
    );
}
