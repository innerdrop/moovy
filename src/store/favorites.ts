// Zustand Store for Favorites — optimistic toggle + API sync
import { create } from "zustand";
import { persist } from "zustand/middleware";

type FavoriteType = "merchant" | "product" | "listing";

interface FavoritesStore {
    merchantIds: string[];
    productIds: string[];
    listingIds: string[];
    loaded: boolean;

    loadFavorites: () => Promise<void>;
    toggleFavorite: (type: FavoriteType, itemId: string) => Promise<void>;
    isFavorite: (type: FavoriteType, itemId: string) => boolean;
}

function getKey(type: FavoriteType): "merchantIds" | "productIds" | "listingIds" {
    return `${type}Ids` as "merchantIds" | "productIds" | "listingIds";
}

export const useFavoritesStore = create<FavoritesStore>()(
    persist(
        (set, get) => ({
            merchantIds: [],
            productIds: [],
            listingIds: [],
            loaded: false,

            loadFavorites: async () => {
                try {
                    const res = await fetch("/api/favorites");
                    if (!res.ok) return;
                    const data = await res.json();
                    set({
                        merchantIds: data.ids.merchantIds || [],
                        productIds: data.ids.productIds || [],
                        listingIds: data.ids.listingIds || [],
                        loaded: true,
                    });
                } catch {
                    // Silent fail — keep persisted state
                }
            },

            toggleFavorite: async (type, itemId) => {
                const key = getKey(type);
                const current = get()[key];
                const isFav = current.includes(itemId);

                // Optimistic update
                if (isFav) {
                    set({ [key]: current.filter((id: string) => id !== itemId) });
                } else {
                    set({ [key]: [...current, itemId] });
                }

                try {
                    const res = await fetch("/api/favorites", {
                        method: isFav ? "DELETE" : "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ type, itemId }),
                    });

                    if (!res.ok) {
                        // Revert on failure
                        if (isFav) {
                            set({ [key]: [...get()[key], itemId] });
                        } else {
                            set({ [key]: get()[key].filter((id: string) => id !== itemId) });
                        }
                    }
                } catch {
                    // Revert on network error
                    if (isFav) {
                        set({ [key]: [...get()[key], itemId] });
                    } else {
                        set({ [key]: get()[key].filter((id: string) => id !== itemId) });
                    }
                }
            },

            isFavorite: (type, itemId) => {
                const key = getKey(type);
                return get()[key].includes(itemId);
            },
        }),
        {
            name: "Moovy-favorites",
            partialize: (state) => ({
                merchantIds: state.merchantIds,
                productIds: state.productIds,
                listingIds: state.listingIds,
            }),
        }
    )
);
