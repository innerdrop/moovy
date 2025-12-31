"use client";

// Cart Sidebar Component
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/delivery";

export default function CartSidebar() {
    const items = useCartStore((state) => state.items);
    const isOpen = useCartStore((state) => state.isOpen);
    const closeCart = useCartStore((state) => state.closeCart);
    const removeItem = useCartStore((state) => state.removeItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const getTotalPrice = useCartStore((state) => state.getTotalPrice);
    const clearCart = useCartStore((state) => state.clearCart);

    if (!isOpen) return null;

    const total = getTotalPrice();

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-50"
                onClick={closeCart}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-xl flex flex-col animate-fadeIn">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5 text-turquoise" />
                        Mi Carrito
                    </h2>
                    <button
                        onClick={closeCart}
                        className="p-2 hover:bg-gray-100 rounded-full transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4">
                    {items.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                            <button
                                onClick={closeCart}
                                className="btn-outline"
                            >
                                Seguir comprando
                            </button>
                        </div>
                    ) : (
                        <ul className="space-y-4">
                            {items.map((item) => (
                                <li key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                                    {/* Image placeholder */}
                                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 flex items-center justify-center">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                                        ) : (
                                            <ShoppingBag className="w-6 h-6 text-gray-400" />
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-navy truncate">{item.name}</h3>
                                        {item.variantName && (
                                            <p className="text-xs text-gray-500">{item.variantName}</p>
                                        )}
                                        <p className="text-turquoise font-semibold">{formatPrice(item.price)}</p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                                                className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-turquoise transition"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="font-medium w-8 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                                className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-turquoise transition"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => removeItem(item.productId, item.variantId)}
                                        className="p-2 text-red-500 hover:bg-red-50 rounded-full transition self-start"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="border-t p-4 space-y-4">
                        {/* Clear Cart */}
                        <button
                            onClick={clearCart}
                            className="text-sm text-red-500 hover:underline"
                        >
                            Vaciar carrito
                        </button>

                        {/* Total */}
                        <div className="flex justify-between items-center text-xl font-bold">
                            <span className="text-navy">Total:</span>
                            <span className="text-turquoise">{formatPrice(total)}</span>
                        </div>

                        {/* Checkout Button */}
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            className="btn-primary w-full py-3 text-center block"
                        >
                            Ir a Pagar
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
}
