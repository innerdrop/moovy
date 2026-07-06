// Zustand Store for Shopping Cart
// fix/carrito-un-solo-comercio (2026-07-06, decisión founder): UN pedido = UN solo
// comercio o vendedor. Al intentar agregar un producto de otro local, el carrito
// BLOQUEA y expone `vendorConflict` para que la UI ofrezca "Vaciar y agregar" /
// "Cancelar" (patrón estándar de apps de delivery). El código multi-vendor
// (SubOrders, batching) queda dormido en el backend — la defensa real está
// también server-side en /api/orders.
import { create } from "zustand";
import { persist } from "zustand/middleware";

const SESSION_STORAGE_KEY = "moovy_cart_session";

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    variantId?: string;
    variantName?: string;
    merchantId?: string;
    merchantName?: string;
    sellerId?: string;
    sellerName?: string;
    type: "product" | "listing";
}

export interface VendorGroup {
    vendorId: string;
    vendorName: string;
    vendorType: "merchant" | "seller";
    items: CartItem[];
    subtotal: number;
}

export interface VendorConflict {
    /** Item que se intentó agregar (queda en espera de la decisión del usuario). */
    pendingItem: Omit<CartItem, "id">;
    /** Nombre del local que ya está en el carrito. */
    currentVendorName: string;
    /** Nombre del local del producto nuevo. */
    newVendorName: string;
}

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    /** No-nulo cuando el usuario intentó mezclar locales (la UI muestra el modal). */
    vendorConflict: VendorConflict | null;

    // Actions
    addItem: (item: Omit<CartItem, "id">) => void;
    removeItem: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
    clearCart: () => void;
    /** "Vaciar y agregar": vacía el carrito y agrega el item pendiente del conflicto. */
    confirmVendorSwitch: () => void;
    /** "Cancelar": descarta el intento y conserva el carrito actual. */
    dismissVendorConflict: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;

    // Multi-vendor
    groupByVendor: () => VendorGroup[];

    // Computed
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

// Helper: Generate and retrieve a session ID to validate persisted cart
function getOrCreateSessionId() {
    if (typeof window === "undefined") return null;
    let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
    }
    return sessionId;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            vendorConflict: null,

            addItem: (item) => {
                const { items } = get();

                // UN pedido = UN local: si el producto viene de otro comercio/vendedor,
                // NO se agrega — se expone el conflicto y la UI decide (vaciar o cancelar).
                const newVendorKey = item.type === "listing" && item.sellerId
                    ? `seller_${item.sellerId}`
                    : `merchant_${item.merchantId || "unknown"}`;

                const existingVendors = new Set(
                    items.map(i =>
                        i.type === "listing" && i.sellerId
                            ? `seller_${i.sellerId}`
                            : `merchant_${i.merchantId || "unknown"}`
                    )
                );

                const isNewVendor = items.length > 0 && !existingVendors.has(newVendorKey);

                if (isNewVendor) {
                    const current = items[0];
                    const currentVendorName =
                        current.type === "listing" && current.sellerId
                            ? current.sellerName || "otro vendedor"
                            : current.merchantName || "otro comercio";
                    const newVendorName =
                        item.type === "listing" && item.sellerId
                            ? item.sellerName || "este vendedor"
                            : item.merchantName || "este comercio";
                    set({ vendorConflict: { pendingItem: item, currentVendorName, newVendorName } });
                    return;
                }

                const existingIndex = items.findIndex(
                    (i) => i.productId === item.productId && i.variantId === item.variantId
                );

                if (existingIndex >= 0) {
                    // Update quantity if item exists
                    const newItems = [...items];
                    newItems[existingIndex].quantity += item.quantity;
                    set({ items: newItems });
                } else {
                    // Add new item with type defaulting to 'product'
                    const newItem: CartItem = {
                        ...item,
                        type: item.type || "product",
                        id: `${item.productId}-${item.variantId || "default"}-${Date.now()}`,
                    };
                    set({ items: [...items, newItem] });
                }
            },

            confirmVendorSwitch: () => {
                const { vendorConflict } = get();
                if (!vendorConflict) return;
                const item = vendorConflict.pendingItem;
                set({
                    items: [{
                        ...item,
                        type: item.type || "product",
                        id: `${item.productId}-${item.variantId || "default"}-${Date.now()}`,
                    }],
                    vendorConflict: null,
                });
            },

            dismissVendorConflict: () => set({ vendorConflict: null }),

            removeItem: (productId, variantId) => {
                const { items } = get();
                const newItems = items.filter(
                    (i) => !(i.productId === productId && i.variantId === variantId)
                );
                set({ items: newItems });
            },

            updateQuantity: (productId, quantity, variantId) => {
                const { items } = get();
                if (quantity <= 0) {
                    get().removeItem(productId, variantId);
                    return;
                }
                set({
                    items: items.map((i) =>
                        i.productId === productId && i.variantId === variantId
                            ? { ...i, quantity }
                            : i
                    ),
                });
            },

            clearCart: () => set({ items: [] }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

            groupByVendor: () => {
                const { items } = get();
                const groups = new Map<string, VendorGroup>();

                for (const item of items) {
                    let vendorId: string;
                    let vendorName: string;
                    let vendorType: "merchant" | "seller";

                    if (item.type === "listing" && item.sellerId) {
                        vendorId = `seller_${item.sellerId}`;
                        vendorName = item.sellerName || "Vendedor";
                        vendorType = "seller";
                    } else {
                        vendorId = `merchant_${item.merchantId || "unknown"}`;
                        vendorName = item.merchantName || "Comercio";
                        vendorType = "merchant";
                    }

                    if (!groups.has(vendorId)) {
                        groups.set(vendorId, {
                            vendorId,
                            vendorName,
                            vendorType,
                            items: [],
                            subtotal: 0,
                        });
                    }

                    const group = groups.get(vendorId)!;
                    group.items.push(item);
                    group.subtotal += item.price * item.quantity;
                }

                return Array.from(groups.values());
            },

            getTotalItems: () => {
                return get().items.reduce((sum, item) => sum + item.quantity, 0);
            },

            getTotalPrice: () => {
                return get().items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                );
            },
        }),
        {
            name: "Moovy-cart",
            partialize: (state) => ({ items: state.items }),
            // Validate cart on hydration: if sessionStorage session ID changed (new tab/window),
            // clear the persisted cart to prevent stale data from appearing
            onRehydrateStorage: () => (state) => {
                if (state && typeof window !== "undefined") {
                    try {
                        // On first load, generate a session ID
                        const currentSession = getOrCreateSessionId();
                        // Check if we have a stored session marker
                        const storedSession = localStorage.getItem("moovy_cart_session_id");

                        // If this is a new session (different tab/window or browser restart),
                        // clear the stale persisted cart items
                        if (currentSession && storedSession !== currentSession) {
                            state.items = [];
                            localStorage.setItem("moovy_cart_session_id", currentSession);
                        } else if (currentSession && !storedSession) {
                            // First time in this session, mark it
                            localStorage.setItem("moovy_cart_session_id", currentSession);
                        }
                    } catch (e) {
                        // Silent fail for storage errors
                        console.error("Cart session validation failed:", e);
                    }
                }
            },
        }
    )
);
