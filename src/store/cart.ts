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

    // Computed
    getTotalItems: () => number;
    getTotalPrice: () => number;
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
                    // Add new item
                    const newItem: CartItem = {
                        ...item,
                        id: `${item.productId}-${item.variantId || "default"}-${Date.now()}`,
                    };
                    set({ items: [...items, newItem] });
                }
            },

            removeItem: (productId, variantId) => {
                const { items } = get();
                set({
                    items: items.filter(
                        (i) => !(i.productId === productId && i.variantId === variantId)
                    ),
                });
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
            name: "polirrubro-cart",
            partialize: (state) => ({ items: state.items }),
        }
    )
);
