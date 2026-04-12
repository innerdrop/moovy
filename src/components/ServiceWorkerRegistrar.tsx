"use client";

import { useEffect } from "react";

/**
 * Registers the Service Worker globally for all users.
 * This ensures offline caching works even if the user hasn't
 * opted into push notifications.
 * 
 * Also handles SW updates: when a new version is detected,
 * it auto-activates and refreshes the page.
 */
export default function ServiceWorkerRegistrar() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        // Don't register SW in development — Next.js HMR causes the SW to
        // detect false "updates" every ~60-90s, triggering window.location.reload()
        // which wipes form inputs and interrupts the user.
        const isDev = process.env.NODE_ENV === "development" ||
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1";

        if (isDev) {
            // In dev: unregister any existing SW to prevent stale reload loops
            navigator.serviceWorker.getRegistrations().then((regs) => {
                regs.forEach((r) => r.unregister());
            });
            console.log("[PWA] Service Worker disabled in development");
            return;
        }

        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });

                // Check for updates periodically (every 60 minutes)
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);

                // Log when a new SW is found — NO auto-reload.
                // El nuevo SW se instala en background y toma control
                // en la próxima navegación natural del usuario.
                // Antes hacíamos window.location.reload() acá, lo cual
                // generaba un loop de recarga cada ~60s que interrumpía
                // formularios y la experiencia del usuario.
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        if (newWorker.state === "installed") {
                            if (navigator.serviceWorker.controller) {
                                console.log("[PWA] New Service Worker installed. Will activate on next visit.");
                            } else {
                                console.log("[PWA] Service Worker installed for the first time.");
                            }
                        }
                    });
                });

                console.log("[PWA] Service Worker registered successfully");
            } catch (error) {
                console.error("[PWA] Service Worker registration failed:", error);
            }
        };

        registerSW();
    }, []);

    return null;
}
