// Logout centralizado del comprador.
// Fix s2-2a-05: el carrito (Zustand persist, key "Moovy-cart" en localStorage)
// sobrevivia al cierre de sesion y reaparecia al volver / al loguear otra cuenta.
// Cualquier logout del comprador debe pasar por aca para limpiar el carrito
// ANTES de cerrar la sesion.

import { signOut } from "next-auth/react";
import { useCartStore } from "@/store/cart";

export async function logoutAndClearCart(callbackUrl = "/"): Promise<void> {
    try {
        useCartStore.getState().clearCart();
    } catch {
        // no-op: si el store no esta disponible por algun motivo, igual cerramos sesion.
    }
    await signOut({ callbackUrl });
}
