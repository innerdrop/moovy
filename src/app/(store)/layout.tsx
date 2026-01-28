"use client";

// Store Layout - Experiencia tipo App para TODOS los usuarios
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CartSidebar from "@/components/layout/CartSidebar";
import FloatingCartButton from "@/components/layout/FloatingCartButton";
import WelcomeSplash from "@/components/home/WelcomeSplash";
import BottomNav from "@/components/layout/BottomNav";
import AppHeader from "@/components/layout/AppHeader";
import PromoPopup from "@/components/store/PromoPopup";
import { useCartStore } from "@/store/cart";

const SPLASH_SHOWN_KEY = "moovy_splash_v4";

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const cartCount = useCartStore((state) => state.getTotalItems());

    // Control if splash should be shown (blocks content until done)
    const [splashDone, setSplashDone] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [promoSettings, setPromoSettings] = useState<any>(null);

    useEffect(() => {
        setMounted(true);

        // Check if splash was already shown
        try {
            if (localStorage.getItem(SPLASH_SHOWN_KEY)) {
                setSplashDone(true);
            }
        } catch {
            setSplashDone(true);
        }

        // Fetch promo settings
        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (!data) return;

                // Check for store (tienda) maintenance
                const isAdmin = (session?.user as any)?.role === "ADMIN";
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

    // Callback when splash finishes
    const handleSplashDone = () => {
        setSplashDone(true);
    };

    const isLoggedIn = status === "authenticated" && session;
    const isLoading = status === "loading";

    // Show nothing while not mounted (prevents hydration issues)
    if (!mounted) {
        return (
            <div className="min-h-screen bg-[#e60012]" />
        );
    }

    // Show splash if not done yet
    if (!splashDone) {
        return <WelcomeSplash onDone={handleSplashDone} />;
    }

    // Loading skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-gray-50">
                <div className="h-14 bg-white border-b animate-pulse" />
                <main className="flex-1 pt-14 pb-20">{children}</main>
                <div className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t animate-pulse" />
            </div>
        );
    }

    // ========== EXPERIENCIA APP UNIFICADA ==========
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Header compacto tipo app */}
            <AppHeader
                isLoggedIn={!!isLoggedIn}
                cartCount={cartCount}
                userName={session?.user?.name || undefined}
            />

            {/* Contenido con padding para header y bottom nav */}
            <main className="flex-1 pt-14 pb-20">
                {children}
            </main>

            {/* Bottom Navigation siempre visible */}
            <BottomNav isLoggedIn={!!isLoggedIn} />

            {/* Floating Cart Button (when cart has items) */}
            <FloatingCartButton />

            {/* Sidebars y Modales */}
            <CartSidebar />

            {/* Promo Popup */}
            {promoSettings && <PromoPopup {...promoSettings} />}
        </div>
    );
}
