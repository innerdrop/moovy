// Zustand Store for Shopping Cart
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    variantId?: string;
    variantName?: string;
    merchantId?: string; // Optional for single-merchant stores
}

interface CartStore {
    items: CartItem[];
    merchantId: string | null; // Current merchant in cart
    isOpen: boolean;

    // Actions
    // addItem returns true if added, false if merchant mismatch
    addItem: (item: Omit<CartItem, "id">) => boolean;
    // forceAddItem clears cart and adds item (used after confirmation)
    forceAddItem: (item: Omit<CartItem, "id">) => void;
    removeItem: (productId: string, variantId?: string) => void;
    updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
    clearCart: () => void;
    toggleCart: () => void;
    openCart: () => void;
    closeCart: () => void;

    // Computed
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            merchantId: null,
            isOpen: false,

            addItem: (item) => {
                const { items, merchantId } = get();

                // Check for merchant mismatch
                if (items.length > 0 && merchantId && merchantId !== item.merchantId) {
                    return false; // Conflict detected
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
                    // Add new item
                    const newItem: CartItem = {
                        ...item,
                        id: `${item.productId}-${item.variantId || "default"}-${Date.now()}`,
                    };
                    set({ items: [...items, newItem], merchantId: item.merchantId });
                }

                // Ensure cart is open when adding? Maybe let UI decide
                set({ isOpen: true });
                return true;
            },

            forceAddItem: (item) => {
                set({ items: [], merchantId: null }); // Clear first

                const newItem: CartItem = {
                    ...item,
                    id: `${item.productId}-${item.variantId || "default"}-${Date.now()}`,
                };
                set({ items: [newItem], merchantId: item.merchantId, isOpen: true });
            },

            removeItem: (productId, variantId) => {
                const { items } = get();
                const newItems = items.filter(
                    (i) => !(i.productId === productId && i.variantId === variantId)
                );

                // If cart becomes empty, reset merchantId
                if (newItems.length === 0) {
                    set({ items: [], merchantId: null });
                } else {
                    set({ items: newItems });
                }
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

            clearCart: () => set({ items: [], merchantId: null }),
            toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
            openCart: () => set({ isOpen: true }),
            closeCart: () => set({ isOpen: false }),

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
            partialize: (state) => ({ items: state.items, merchantId: state.merchantId }),
        }
    )
);

