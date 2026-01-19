"use client";

// Cart Page - Carrito (Simplified - BottomNav from layout)
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/delivery";
import { ShoppingBag, Plus, Minus, Trash2, ArrowRight, Package, ChevronLeft } from "lucide-react";

export default function CarritoPage() {
    const { items, getTotalItems, getTotalPrice, updateQuantity, removeItem, clearCart } = useCartStore();
    const cartCount = getTotalItems();
    const total = getTotalPrice();

    if (items.length === 0) {
        return (
            <>
                {/* Simple Header */}
                <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="font-semibold text-navy">Mi Carrito</h1>
                </header>
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="text-center px-8">
                        <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingBag className="w-12 h-12 text-gray-300" />
                        </div>
                        <h2 className="text-xl font-bold text-navy mb-2">Tu carrito está vacío</h2>
                        <p className="text-gray-500 mb-6 text-sm">Agregá productos para empezar tu pedido</p>
                        <Link href="/productos" className="btn-primary">Ver Productos</Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            {/* Simple Header with clear button */}
            <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </Link>
                    <h1 className="font-semibold text-navy">Mi Carrito ({cartCount})</h1>
                </div>
                <button onClick={() => { if (confirm("¿Vaciar el carrito?")) clearCart(); }} className="text-red-500 text-sm">
                    Vaciar
                </button>
            </header>

            {/* Items with extra padding for checkout bar */}
            <div className="p-4 pb-40 space-y-3">
                {items.map((item) => (
                    <div key={`${item.productId}-${item.variantId || "default"}`} className="bg-white rounded-xl p-4 flex gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.image ? (
                                <Image src={item.image} alt={item.name} width={80} height={80} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-navy truncate">{item.name}</h3>
                            {item.variantName && <p className="text-xs text-gray-500">{item.variantName}</p>}
                            <p className="text-moovy font-bold mt-1">{formatPrice(item.price)}</p>
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => {
                                        if (item.quantity <= 1) removeItem(item.productId, item.variantId);
                                        else updateQuantity(item.productId, item.quantity - 1, item.variantId);
                                    }} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                                        {item.quantity <= 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
                                    </button>
                                    <span className="w-8 text-center font-bold text-navy">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variantId)}
                                        className="w-8 h-8 rounded-full bg-moovy text-white flex items-center justify-center">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="font-bold text-navy">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Fixed Bottom Checkout Bar */}
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-4 safe-area-bottom">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-sm text-gray-500">Total</p>
                        <p className="text-2xl font-bold text-navy">{formatPrice(total)}</p>
                    </div>
                    <Link href="/checkout" className="btn-primary py-3 px-6 flex items-center gap-2">
                        Continuar <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
                <p className="text-xs text-gray-400 text-center">El costo de envío se calcula en el checkout</p>
            </div>
        </>
    );
}
