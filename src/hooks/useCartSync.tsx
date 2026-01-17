"use client";

// Hook to sync cart with database for logged-in users
import { useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useCartStore, CartItem } from "@/store/cart";

export function useCartSync() {
    const { data: session, status } = useSession();
    const items = useCartStore((state) => state.items);
    const merchantId = useCartStore((state) => state.merchantId);
    const hasLoadedFromServer = useRef(false);
    const lastSavedItems = useRef<string>("");

    // Load cart from server when user logs in
    const loadCartFromServer = useCallback(async () => {
        if (status !== "authenticated" || !session?.user?.id || hasLoadedFromServer.current) {
            return;
        }

        try {
            const res = await fetch("/api/cart");
            if (res.ok) {
                const data = await res.json();
                const serverItems = data.items as CartItem[] || [];

                // Only load if server has items and local is empty, or merge
                const currentItems = useCartStore.getState().items;

                if (serverItems.length > 0 && currentItems.length === 0) {
                    // Server has cart, local is empty - load server cart
                    useCartStore.setState({
                        items: serverItems,
                        merchantId: data.merchantId
                    });
                } else if (serverItems.length > 0 && currentItems.length > 0) {
                    // Both have items - keep local (user's current session), sync later
                    console.log("[CartSync] Both local and server have items, keeping local");
                }
                // If server is empty but local has items, it will be saved on next change

                hasLoadedFromServer.current = true;
            }
        } catch (error) {
            console.error("[CartSync] Error loading cart:", error);
        }
    }, [status, session?.user?.id]);

    // Save cart to server when items change
    const saveCartToServer = useCallback(async () => {
        if (status !== "authenticated" || !session?.user?.id) {
            return;
        }

        const currentItemsJson = JSON.stringify(items);

        // Skip if nothing changed
        if (currentItemsJson === lastSavedItems.current) {
            return;
        }

        lastSavedItems.current = currentItemsJson;

        try {
            await fetch("/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ items, merchantId })
            });
        } catch (error) {
            console.error("[CartSync] Error saving cart:", error);
        }
    }, [status, session?.user?.id, items, merchantId]);

    // Load cart on login
    useEffect(() => {
        if (status === "authenticated") {
            loadCartFromServer();
        } else if (status === "unauthenticated") {
            // Reset flag when logged out so next login loads again
            hasLoadedFromServer.current = false;
        }
    }, [status, loadCartFromServer]);

    // Save cart when items change (debounced)
    useEffect(() => {
        if (status !== "authenticated" || !hasLoadedFromServer.current) {
            return;
        }

        const timeoutId = setTimeout(() => {
            saveCartToServer();
        }, 1000); // Debounce 1 second

        return () => clearTimeout(timeoutId);
    }, [items, merchantId, status, saveCartToServer]);

    return null;
}

// Component wrapper to use the hook
export function CartSyncProvider({ children }: { children: React.ReactNode }) {
    useCartSync();
    return <>{children}</>;
}
