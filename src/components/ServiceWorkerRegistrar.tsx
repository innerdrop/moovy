"use client";

import { useEffect, useState, useCallback, useRef } from "react";

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
    // Overlay "Actualizando Moovy…": la activacion del SW no emite progreso
    // real, asi que la barra avanza SIMULADA (easing hacia 90%) y salta a 100%
    // cuando el SW nuevo toma control DE VERDAD (controllerchange). Patron
    // nprogress/YouTube: percepcion de progreso, cierre real.
    const [updating, setUpdating] = useState(false);
    const [progress, setProgress] = useState(0);
    const progressTimer = useRef<number | null>(null);

    const applyUpdate = useCallback(() => {
        if (!waitingWorker) return;
        setShowUpdateBanner(false);
        setUpdating(true);
        setProgress(8);
        if (progressTimer.current) window.clearInterval(progressTimer.current);
        progressTimer.current = window.setInterval(() => {
            setProgress((p) => (p < 90 ? p + Math.max(0.6, (90 - p) * 0.09) : p));
        }, 120);
        waitingWorker.postMessage({ type: "SKIP_WAITING" });
        // La pagina se recarga cuando el nuevo SW toma control (controllerchange).
        // Red de seguridad: si no toma control en 8s, recargamos igual — nunca
        // un overlay colgado.
        window.setTimeout(() => {
            window.location.reload();
        }, 8000);
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
                    // El chequeo de actualización NUNCA usa el caché HTTP para
                    // sw.js ni sus importScripts (sw-version.js) — clave para
                    // que iOS Safari detecte versiones nuevas al toque.
                    updateViaCache: "none",
                });

                // Chequear actualización YA, en cada apertura (el intervalo de
                // 10 min casi nunca corría en mobile: sesiones cortas).
                registration.update().catch(() => { /* offline, no importa */ });

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

                // ...y cada vez que la app vuelve a primer plano (el caso real
                // en mobile: el usuario cambia de app y vuelve).
                const onVisible = () => {
                    if (document.visibilityState === "visible") {
                        registration?.update().catch(() => { /* offline */ });
                    }
                };
                document.addEventListener("visibilitychange", onVisible);

                console.log("[PWA] Service Worker registered successfully");

                return () => clearInterval(interval);
            } catch (error) {
                console.error("[PWA] Service Worker registration failed:", error);
            }
        };

        // Cuando el nuevo SW toma control, recargar la página
        const onControllerChange = () => {
            console.log("[PWA] New Service Worker active — reloading");
            // El 100% de la barra es REAL: el SW nuevo ya tomo control. Un
            // respiro de 250ms para que el ojo registre el cierre, y recarga.
            setProgress(100);
            window.setTimeout(() => window.location.reload(), 250);
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

        registerSW();

        return () => {
            navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
            if (progressTimer.current) window.clearInterval(progressTimer.current);
        };
    }, []);

    // Overlay de actualizacion: estrella MOOVER girando + barra de progreso.
    if (updating) {
        return (
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 999999,
                    background: "rgba(255,255,255,0.94)",
                    backdropFilter: "blur(6px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 18,
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                }}
            >
                <style>{`@keyframes moovySpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                <div
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg,#ff4d2e,#e60012)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 10px 30px rgba(230,0,18,0.35)",
                        animation: "moovySpin 1.6s linear infinite",
                    }}
                >
                    <svg viewBox="0 0 24 24" width="30" height="30" style={{ fill: "#fff" }}>
                        <path d="M12 2.8l2.7 5.6 6.2.8-4.5 4.2 1.1 6.1L12 16.6l-5.5 2.9 1.1-6.1-4.5-4.2 6.2-.8z" />
                    </svg>
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: "#17181c", margin: 0 }}>
                    Actualizando Moovy…
                </p>
                <div style={{ width: 220, height: 6, borderRadius: 999, background: "#eceef2", overflow: "hidden" }}>
                    <div
                        style={{
                            width: `${Math.min(progress, 100)}%`,
                            height: "100%",
                            borderRadius: 999,
                            background: "linear-gradient(90deg,#ff4d2e,#e60012)",
                            transition: "width 0.25s ease",
                        }}
                    />
                </div>
            </div>
        );
    }

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
