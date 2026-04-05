// Zustand Store for Shopping Cart - Multi-vendor support
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

interface CartStore {
    items: CartItem[];
    isOpen: boolean;

    // Actions
    addItem: (item: Omit<CartItem, "id">) => void;
    removeItem: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
    clearCart: () => void;
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

            addItem: (item) => {
                const { items } = get();

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

                // No auto-open: feedback is via button state + toast + FloatingCartButton
            },

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
