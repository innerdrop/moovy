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

        const registerSW = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });

                // Check for updates periodically (every 60 minutes)
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);

                // Listen for SW updates
                registration.addEventListener("updatefound", () => {
                    const newWorker = registration.installing;
                    if (!newWorker) return;

                    newWorker.addEventListener("statechange", () => {
                        if (
                            newWorker.state === "activated" &&
                            navigator.serviceWorker.controller
                        ) {
                            // New SW activated and there was a previous one — reload to get fresh assets
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
