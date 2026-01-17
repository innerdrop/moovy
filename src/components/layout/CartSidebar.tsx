"use client";

// Cart Modal Component - Centered modal instead of fullscreen
import { X, Plus, Minus, Trash2, ShoppingBag, UserPlus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/delivery";

export default function CartSidebar() {
    const { status } = useSession();
    const items = useCartStore((state) => state.items);
    const isOpen = useCartStore((state) => state.isOpen);
    const closeCart = useCartStore((state) => state.closeCart);
    const removeItem = useCartStore((state) => state.removeItem);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const getTotalPrice = useCartStore((state) => state.getTotalPrice);
    const clearCart = useCartStore((state) => state.clearCart);

    if (!isOpen) return null;

    const total = getTotalPrice();
    const isLoggedIn = status === "authenticated";

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-[60]"
                onClick={closeCart}
            />

            {/* Centered Modal */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col pointer-events-auto animate-fadeIn">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                        <h2 className="text-xl font-bold text-navy flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-moovy" />
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
                        {!isLoggedIn ? (
                            // Not logged in - show registration prompt
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-[#e60012]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="w-8 h-8 text-[#e60012]" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    ¡Registrate para comprar!
                                </h3>
                                <p className="text-gray-500 text-sm mb-6">
                                    Para agregar productos y realizar tu primera compra, necesitás crear una cuenta.
                                </p>
                                <div className="space-y-3">
                                    <Link
                                        href="/registro"
                                        onClick={closeCart}
                                        className="block w-full py-3 bg-[#e60012] text-white font-semibold rounded-xl hover:bg-[#c5000f] transition text-center"
                                    >
                                        Crear cuenta gratis
                                    </Link>
                                    <Link
                                        href="/login"
                                        onClick={closeCart}
                                        className="block w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-center"
                                    >
                                        Ya tengo cuenta
                                    </Link>
                                </div>
                                <p className="text-xs text-gray-400 mt-4">
                                    ¡Ganá 250 puntos MOOVER con tu primera compra! 🎉
                                </p>
                            </div>
                        ) : items.length === 0 ? (
                            // Logged in but empty cart
                            <div className="text-center py-12">
                                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 mb-4">Tu carrito está vacío</p>
                                <Link
                                    href="/productos"
                                    onClick={closeCart}
                                    className="btn-outline inline-block"
                                >
                                    Seguir comprando
                                </Link>
                            </div>
                        ) : (
                            // Has items
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
                                            <p className="text-moovy font-semibold">{formatPrice(item.price)}</p>

                                            {/* Quantity Controls */}
                                            <div className="flex items-center gap-2 mt-2">
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variantId)}
                                                    className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-moovy transition"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="font-medium w-8 text-center">{item.quantity}</span>
                                                <button
                                                    onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                                    className="w-7 h-7 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-moovy transition"
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

                    {/* Footer - Only show if logged in and has items */}
                    {isLoggedIn && items.length > 0 && (
                        <div className="border-t p-4 space-y-4 flex-shrink-0">
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
                                <span className="text-moovy">{formatPrice(total)}</span>
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
            </div>
        </>
    );
}
