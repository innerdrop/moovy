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

                // Listen for SW updates — only reload if user is not interacting
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        if (
                            newWorker.state === "activated" &&
                            navigator.serviceWorker.controller
                        ) {
                            // Check if user has focus on an input — don't interrupt them
                            const activeEl = document.activeElement;
                            const isTyping = activeEl instanceof HTMLInputElement ||
                                activeEl instanceof HTMLTextAreaElement ||
                                activeEl instanceof HTMLSelectElement ||
                                activeEl?.getAttribute("contenteditable") === "true";

                            if (isTyping) {
                                console.log("[PWA] New SW ready, deferring reload (user is typing)");
                                // Defer reload until user blurs the input
                                const handler = () => {
                                    window.location.reload();
                                };
                                activeEl.addEventListener("blur", handler, { once: true });
                                return;
                            }

                            console.log("[PWA] New Service Worker activated, reloading...");
                            window.location.reload();
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
