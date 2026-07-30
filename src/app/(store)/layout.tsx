"use client";

// Store Layout - Experiencia tipo App para TODOS los usuarios
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import CartSidebar from "@/components/layout/CartSidebar";
// FloatingCartButton removed — cart badge in header is sufficient
import BottomNav from "@/components/layout/BottomNav";
import AppHeader from "@/components/layout/AppHeader";
import VendorSwitchModal from "@/components/store/VendorSwitchModal";
import PromoPopup from "@/components/store/PromoPopup";
import ScrollToTop from "@/components/ScrollToTop";
import { ChatWidget } from "@/components/support/ChatWidget";
import BuyerOnboardingTour from "@/components/onboarding/BuyerOnboardingTour";
import PWAInstallPrompt from "@/components/onboarding/PWAInstallPrompt";
import CookieBanner from "@/components/legal/CookieBanner";
import DriverAvailableToast from "@/components/notifications/DriverAvailableToast";
import { useCartStore } from "@/store/cart";
import PullToRefresh from "@/components/ui/PullToRefresh";
// MobileOnlyGuard removed — desktop now has full responsive layout

export default function StoreLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const pathname = usePathname();
    // El home es la única página con footer oscuro; ahí la reserva para la barra
    // flotante la da el propio footer (oscuro), no un padding blanco del main.
    const isHome = pathname === "/";
    const cartCount = useCartStore((state) => state.getTotalItems());

    // rama feat/barras-flotantes-y-copy — patrón Rappi / PedidosYa.
    //
    // En las pantallas de conversión la píldora de navegación DESAPARECE. No es
    // un capricho: es lo que hacen las dos apps de delivery que operan en
    // Argentina, y borra el problema de raíz en vez de administrarlo. Cuando no
    // hay nada abajo que esquivar, la barra de acción se apoya en el piso y no
    // hay ningún offset que calcular.
    //
    // Además, en un teléfono de 360×720 (Moto E, Redmi de entrada) recupera
    // ~100px de pantalla útil justo donde el vecino decide si compra.
    //
    // CONDICIÓN que se cumple en las tres: cada una tiene su propia salida
    // visible (flecha ← o "Seguir comprando"). En la app instalada no hay botón
    // "atrás" del navegador — si escondemos la navegación sin dejar salida, el
    // usuario queda encerrado.
    //
    // OJO con /productos: el LISTADO conserva la navegación (el usuario sigue
    // paseando); solo el DETALLE (/productos/<slug>) la esconde.
    const esPantallaDeConversion =
        pathname === "/carrito" ||
        pathname.startsWith("/checkout") ||
        /^\/productos\/[^/]+$/.test(pathname);

    // Pantallas que traen su PROPIA barra de acción fija. Ahí el colchón lo pone
    // la página con .moovy-pad-bar (que ya contempla nav + barra); si además lo
    // pusiera el <main>, se sumarían dos colchones y quedaría un hueco enorme.
    const tieneBarraPropia =
        esPantallaDeConversion || /^\/mis-pedidos\/[^/]+$/.test(pathname);

    const [mounted, setMounted] = useState(false);
    // fix/ux-post-aprobacion-y-splash (2026-04-27): showSplash eliminado.
    // Antes mostraba 1s un fondo rojo + PNG que muchas veces no cargaba (img sin
    // logo). Genera fricción visual. Reemplazado por el skeleton del isLoading.
    const [contentReady, setContentReady] = useState(true);
    const [promoSettings, setPromoSettings] = useState<any>(null);
    const [supportChatEnabled, setSupportChatEnabled] = useState(true); // default optimista — si falla fetch, igual se muestra

    // Mount — runs exactly once
    useEffect(() => {
        setMounted(true);
        // El candado de lanzamiento + preview ahora se maneja server-side en
        // proxy.ts (rama feat/candado-lanzamiento-preview). Aca no hay logica de preview.
    }, []); // empty deps = runs once on mount, NOT on session change

    // Fetch settings + promo + maintenance check — runs once when session is resolved
    const settingsFetched = useRef(false);

    useEffect(() => {
        if (status === "loading" || settingsFetched.current) return;
        settingsFetched.current = true;

        fetch("/api/settings")
            .then(res => res.json())
            .then(data => {
                if (!data) return;

                // Modo mantenimiento (toggle de OPS) removido: la visibilidad del
                // sitio ahora la controla el candado de lanzamiento en proxy.ts.

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

                // Feature flag: globo de chat de soporte (controlado desde OPS)
                // default true cuando el campo no existe para que no rompa despliegues sin db push
                if (typeof data.supportChatEnabled === "boolean") {
                    setSupportChatEnabled(data.supportChatEnabled);
                }
            })
            .catch(err => console.error("Error fetching settings:", err));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    const isLoggedIn = status === "authenticated" && session;
    const isLoading = status === "loading";

    // Pre-mount: blank white (no red flash)
    if (!mounted) {
        return <div className="min-h-screen bg-white" />;
    }

    // Loading: show skeleton layout (header + content + bottom nav placeholder)
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col bg-white">
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
                {/* Bottom nav skeleton — hidden on desktop.
                    Copia la geometría de la píldora real (flotante, 62px, con su
                    offset de safe-area): antes era una barra pegada al piso de
                    64px y la navegación "saltaba" al terminar de cargar. */}
                <div
                    className="fixed left-1/2 -translate-x-1/2 w-[calc(100%-24px)] max-w-[388px] h-[62px] rounded-full bg-white border border-[#f0ece9] lg:hidden"
                    style={{ bottom: "max(12px, env(safe-area-inset-bottom, 0px))" }}
                >
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
        <div
            // data-moovy-zone: acá viven los tokens de la barra inferior del
            // comprador (globals.css). Tiene que envolver a la navegación Y a las
            // barras de acción — si no, useNavPeak escribe la medición en un
            // elemento que no contiene a las barras y la medición no llega.
            data-moovy-zone="comprador"
            data-moovy-nav={esPantallaDeConversion ? "oculta" : undefined}
            className={`min-h-screen flex flex-col bg-white overflow-x-clip lg:overflow-x-hidden ${contentReady ? "app-ready" : ""}`}
            style={{ fontFamily: "var(--font-nunito), 'Nunito', system-ui, sans-serif" }}
        >
            {/* Scroll to top on navigation */}
            <ScrollToTop />

            {/* Header compacto tipo app — fijo arriba */}
            <AppHeader
                isLoggedIn={!!isLoggedIn}
                cartCount={cartCount}
                userName={session?.user?.name || undefined}
            />

            {/* Contenido scrollable — solo esta zona se mueve */}
            {/* El colchón inferior sale de --moovy-content-pad, no de un pb-28
                escrito a mano: así sigue siendo correcto si la navegación crece
                (fuente del sistema grande en Android) o si desaparece. */}
            <main className={`flex-1 pt-14 lg:pt-[6.75rem] ${isHome || tieneBarraPropia ? "pb-0" : "moovy-pad-nav"} lg:pb-0`}>
                {/* La dirección de entrega ahora se elige desde el pill "Ushuaia" del
                    header (LocationAddressButton). La vieja barra blanca "Entregar en"
                    se removió — partía la tarjeta roja del home. */}
                <PullToRefresh>
                    {children}
                </PullToRefresh>
            </main>

            {/* Modal "un pedido = un solo local" (fix/carrito-un-solo-comercio):
                aparece cuando se intenta mezclar comercios en el carrito. */}
            <VendorSwitchModal />

            {/* Bottom Navigation — se esconde en las pantallas de conversión
                (ver esPantallaDeConversion arriba). */}
            {!esPantallaDeConversion && <BottomNav isLoggedIn={!!isLoggedIn} />}

            {/* FloatingCartButton removed — the cart badge in header already indicates items */}

            {/* Sidebars y Modales */}
            <CartSidebar />

            {/* Live Chat Support Widget — toggleable desde OPS > Ajustes */}
            {supportChatEnabled && <ChatWidget />}

            {/* Promo Popup */}
            {promoSettings && <PromoPopup {...promoSettings} />}

            {/* ISSUE-021: Tour buyer primera vez — self-gated por onboardingCompletedAt */}
            <BuyerOnboardingTour />

            {/* Tutorial de instalación PWA (Rama fix/driver-settings-pwa 2026-04-24).
                Self-gated: skip si ya está instalada o cerró el prompt antes. */}
            <PWAInstallPrompt />

            {/* Ley 25.326 + AAIP: banner de consentimiento de cookies — self-gated por localStorage */}
            <CookieBanner />

            {/* fix/merchant-flow-pedidos: toast in-app cuando hay drivers disponibles
                (complementa el push del SO — cubre cuando la app está abierta) */}
            <DriverAvailableToast />
        </div>
    );
}
        