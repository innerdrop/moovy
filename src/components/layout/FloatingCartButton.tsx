"use client";

// Floating Cart Button - Shows above bottom nav when cart has items
import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/delivery";

export default function FloatingCartButton() {
    const { openCart, getTotalPrice, getTotalItems } = useCartStore();
    const pathname = usePathname();

    const totalItems = getTotalItems();
    const total = getTotalPrice();

    // Pages where we shouldn't show the floating cart
    const isAuthPage = pathname === "/login" || pathname === "/registro";
    const isCheckoutPage = pathname === "/checkout";

    // Don't show if cart is empty, on auth pages, or on checkout
    if (totalItems === 0 || isAuthPage || isCheckoutPage) return null;

    return (
        <button
            onClick={() => openCart()}
            className="fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 bg-[#e60012] text-white rounded-2xl py-4 px-6 shadow-lg flex items-center justify-between gap-4 active:scale-[0.98] transition-transform"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
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
    );
}
