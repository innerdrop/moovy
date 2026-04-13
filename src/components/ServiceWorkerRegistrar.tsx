"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Registra el Service Worker y muestra un banner sutil cuando hay
 * una versión nueva disponible. El usuario decide cuándo actualizar
 * (como Slack, WhatsApp Web, etc.).
 *
 * Flujo:
 * 1. SW se registra al montar el componente
 * 2. Cada 10 minutos chequea si hay una versión nueva
 * 3. Si detecta un SW nuevo instalado, muestra el banner
 * 4. El usuario hace click en "Actualizar" → envía SKIP_WAITING al SW
 * 5. El nuevo SW toma control y la página se recarga automáticamente
 */
export default function ServiceWorkerRegistrar() {
    const [showUpdateBanner, setShowUpdateBanner] = useState(false);
    const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

    const applyUpdate = useCallback(() => {
        if (waitingWorker) {
            waitingWorker.postMessage({ type: "SKIP_WAITING" });
            setShowUpdateBanner(false);
            // La página se recarga automáticamente cuando el nuevo SW toma control
            // via el controllerchange listener de abajo
        }
    }, [waitingWorker]);

    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        // No registrar SW en desarrollo
        const isDev = process.env.NODE_ENV === "development" ||
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";

        if (isDev) {
            navigator.serviceWorker.getRegistrations().then((regs) => {
                regs.forEach((r) => r.unregister());
            });
            console.log("[PWA] Service Worker disabled in development");
            return;
        }

        let registration: ServiceWorkerRegistration | null = null;

        const registerSW = async () => {
            try {
                registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });

                // Si ya hay un SW waiting (ej: se instaló antes de que el usuario recargara)
                if (registration.waiting) {
                    setWaitingWorker(registration.waiting);
                    setShowUpdateBanner(true);
                }

                // Detectar cuando se instala un nuevo SW
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration!.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        // Solo mostrar banner si hay un controller activo (no es primera instalación)
                        if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                            console.log("[PWA] Nueva versión disponible");
                            setWaitingWorker(newWorker);
                            setShowUpdateBanner(true);
                        }
                    });
                });

                // Chequear actualizaciones cada 10 minutos
                const interval = setInterval(() => {
                    registration?.update();
                }, 10 * 60 * 1000);

                console.log("[PWA] Service Worker registered successfully");

                return () => clearInterval(interval);
            } catch (error) {
                console.error("[PWA] Service Worker registration failed:", error);
            }
        };

        // Cuando el nuevo SW toma control, recargar la página
        const onControllerChange = () => {
            console.log("[PWA] New Service Worker active — reloading");
            window.location.reload();
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        registerSW();

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
        };
    }, []);

    if (!showUpdateBanner) return null;

    // Banner fijo abajo, estilo MOOVY — sutil y no invasivo
    return (
        <div
            style={{
                position: "fixed",
                bottom: 16,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 99999,
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#1a1a1a",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: 12,
                boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                fontSize: 14,
                maxWidth: "calc(100vw - 32px)",
                animation: "slideUp 0.3s ease-out",
            }}
        >
            <style>{`
                @keyframes slideUp {
                    from { opacity: 0; transform: translateX(-50%) translateY(20px); }
                    to { opacity: 1; transform: translateX(-50%) translateY(0); }
                }
            `}</style>
            <span style={{ flex: 1, lineHeight: 1.4 }}>
                Nueva versión disponible
            </span>
            <button
                onClick={applyUpdate}
                style={{
                    background: "#e60012",
                    color: "#fff",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    letterSpacing: "0.02em",
                }}
            >
                Actualizar
            </button>
            <button
                onClick={() => setShowUpdateBanner(false)}
                aria-label="Cerrar"
                style={{
                    background: "transparent",
                    border: "none",
                    color: "#888",
                    fontSize: 18,
                    cursor: "pointer",
                    padding: "0 4px",
                    lineHeight: 1,
                }}
            >
                &times;
            </button>
        </div>
    );
}
