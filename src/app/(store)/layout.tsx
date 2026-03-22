"use client";

// Store Layout - Experiencia tipo App para TODOS los usuarios
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CartSidebar from "@/components/layout/CartSidebar";
import FloatingCartButton from "@/components/layout/FloatingCartButton";
import BottomNav from "@/components/layout/BottomNav";
import AppHeader from "@/components/layout/AppHeader";
import PromoPopup from "@/components/store/PromoPopup";
import ScrollToTop from "@/components/ScrollToTop";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import { hasAnyRole } from "@/lib/auth-utils";
import { useCartStore } from "@/store/cart";
import PullToRefresh from "@/components/ui/PullToRefresh";
import MobileOnlyGuard from "@/components/ui/MobileOnlyGuard";

const SPLASH_SHOWN_KEY = "moovy_splash_v5";

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const cartCount = useCartStore((state) => state.getTotalItems());

    const [mounted, setMounted] = useState(false);
    const [showSplash, setShowSplash] = useState(false);
    const [contentReady, setContentReady] = useState(false);
    const [promoSettings, setPromoSettings] = useState<any>(null);

    useEffect(() => {
        setMounted(true);

        // Quick splash — only first visit ever, 1 second
        try {
            if (!localStorage.getItem(SPLASH_SHOWN_KEY)) {
                setShowSplash(true);
                localStorage.setItem(SPLASH_SHOWN_KEY, "true");
                setTimeout(() => {
                    setShowSplash(false);
                    // Small delay before content reveal for smoothness
                    requestAnimationFrame(() => setContentReady(true));
                }, 1000);
            } else {
                setContentReady(true);
            }
        } catch {
            setContentReady(true);
        }

        // Fetch promo settings
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (!data) return;

                const isAdmin = hasAnyRole(session, ["ADMIN"]);
                if (data.tiendaMaintenance && !isAdmin) {
                    window.location.href = "/mantenimiento";
                    return;
                }

                if (data.promoPopupEnabled) {
                    setPromoSettings({
                        enabled: data.promoPopupEnabled,
                        title: data.promoPopupTitle,
                        message: data.promoPopupMessage,
                        image: data.promoPopupImage,
                        link: data.promoPopupLink,
                        buttonText: data.promoPopupButtonText,
                        dismissable: data.promoPopupDismissable ?? true
                    });
                }
            })
            .catch(err => console.error("Error fetching settings:", err));
    }, [session]);

    const isLoggedIn = status === "authenticated" && session;
    const isLoading = status === "loading";

    // Pre-mount: blank white (no red flash)
    if (!mounted) {
        return <div className="min-h-screen bg-white" />;
    }

    // Quick splash — minimal, fast, branded
    if (showSplash) {
        return (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#e60012]">
                <img
                    src="/moovy-m.png"
                    alt="M"
                    width={64}
                    height={64}
                    className="animate-pulse"
                />
            </div>
        );
    }

    // Loading: show skeleton layout (header + content + bottom nav placeholder)
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                {/* Header skeleton */}
                <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
                    <div className="h-1 bg-gradient-to-r from-[#e60012] via-[#ff1a2e] to-[#e60012]" />
                    <div className="h-14 flex items-center justify-between px-4">
                        <div className="w-16 h-6 bg-gray-100 rounded-full shimmer" />
                        <div className="w-24 h-6 bg-gray-100 rounded-lg shimmer" />
                        <div className="flex gap-2">
                            <div className="w-8 h-8 bg-gray-100 rounded-full shimmer" />
                            <div className="w-8 h-8 bg-gray-100 rounded-full shimmer" />
                        </div>
                    </div>
                </div>
                {/* Content skeleton */}
                <main className="flex-1 pt-14 pb-20">
                    {/* Hero skeleton */}
                    <div className="h-[220px] bg-gradient-to-br from-red-400 to-red-500 shimmer" />
                    {/* Categories skeleton */}
                    <div className="py-5 px-4">
                        <div className="flex gap-4 overflow-hidden">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-100 shimmer" />
                                    <div className="w-12 h-3 bg-gray-100 rounded shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {/* Cards skeleton */}
                    <div className="px-4 grid grid-cols-2 gap-3">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-100">
                                <div className="aspect-video bg-gray-100 shimmer" />
                                <div className="p-3 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded shimmer w-3/4" />
                                    <div className="h-3 bg-gray-100 rounded shimmer w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
                {/* Bottom nav skeleton */}
                <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-gray-100">
                    <div className="flex items-center justify-around h-full px-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="w-8 h-8 bg-gray-100 rounded-full shimmer" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ========== EXPERIENCIA APP UNIFICADA ==========
    return (
        <MobileOnlyGuard mode="warn">
        <div className={`min-h-screen flex flex-col bg-gray-50 overflow-x-hidden ${contentReady ? "app-ready" : ""}`} style={{ fontFamily: "var(--font-manrope), 'Manrope', var(--font-jakarta), 'Plus Jakarta Sans', system-ui, sans-serif" }}>
            {/* Scroll to top on navigation */}
            <ScrollToTop />

            {/* Header compacto tipo app — fijo arriba */}
            <AppHeader
                isLoggedIn={!!isLoggedIn}
                cartCount={cartCount}
                userName={session?.user?.name || undefined}
            />

            {/* Contenido scrollable — solo esta zona se mueve */}
            <main className="flex-1 pt-14 pb-20">
                <PullToRefresh>
                    {children}
                </PullToRefresh>
            </main>

            {/* Bottom Navigation siempre visible — fijo abajo */}
            <BottomNav isLoggedIn={!!isLoggedIn} />

            {/* Floating Cart Button (when cart has items) */}
            <FloatingCartButton />

            {/* Sidebars y Modales */}
            <CartSidebar />

            {/* WhatsApp Support Button */}
            <WhatsAppButton />

            {/* Promo Popup */}
            {promoSettings && <PromoPopup {...promoSettings} />}
        </div>
        </MobileOnlyGuard>
    );
}
