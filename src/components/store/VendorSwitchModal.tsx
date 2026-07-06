"use client";

// Modal "un pedido = un solo local" (fix/carrito-un-solo-comercio).
// Se muestra cuando el usuario intenta agregar al carrito un producto de un
// comercio/vendedor distinto al que ya tiene. Ofrece la decisión explícita:
// vaciar el carrito y empezar con el local nuevo, o conservar lo que tenía.
// Regla #24: modal con diseño Moovy, nunca window.confirm.
// Montado en el layout de (store), lee el conflicto directo del cart store.

import { useCartStore } from "@/store/cart";
import { ShoppingBag } from "lucide-react";

export default function VendorSwitchModal() {
    const vendorConflict = useCartStore((s) => s.vendorConflict);
    const confirmVendorSwitch = useCartStore((s) => s.confirmVendorSwitch);
    const dismissVendorConflict = useCartStore((s) => s.dismissVendorConflict);

    if (!vendorConflict) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 px-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vendor-switch-title"
            onClick={dismissVendorConflict}
        >
            <div
                className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                    <ShoppingBag className="h-7 w-7 text-[#e60012]" />
                </div>

                <h2 id="vendor-switch-title" className="mb-2 text-center text-lg font-bold text-gray-900">
                    Tu carrito es de {vendorConflict.currentVendorName}
                </h2>
                <p className="mb-6 text-center text-sm leading-relaxed text-gray-500">
                    Los pedidos son de un solo local, así te llega todo junto y con un
                    solo envío. Para comprar en {vendorConflict.newVendorName}, vaciá
                    el carrito primero.
                </p>

                <div className="space-y-2">
                    <button
                        onClick={confirmVendorSwitch}
                        className="w-full rounded-2xl bg-[#e60012] py-3.5 text-sm font-bold text-white transition hover:bg-[#cc000f] active:scale-[0.98]"
                    >
                        Vaciar y agregar este producto
                    </button>
                    <button
                        onClick={dismissVendorConflict}
                        className="w-full rounded-2xl bg-gray-50 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 active:scale-[0.98]"
                    >
                        Conservar mi carrito
                    </button>
                </div>
            </div>
        </div>
    );
}
