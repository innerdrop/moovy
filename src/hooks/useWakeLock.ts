"use client";

import { useEffect, useRef } from "react";

/**
 * Mantiene la pantalla encendida mientras `enabled === true`.
 *
 * Usa la Screen Wake Lock API nativa del browser. El lock se libera
 * automáticamente cuando:
 *  - el hook se desmonta
 *  - el usuario cambia de pestaña (browser libera y el re-acquire se hace al volver)
 *  - enabled pasa a false
 *
 * Caso de uso en MOOVY: evitar que el celular del rider se bloquee durante
 * una entrega activa, porque el rider no está tocando la pantalla pero
 * necesita ver el mapa y el próximo giro de reojo al manejar.
 *
 * Silencioso si el browser no soporta la API (Safari < 16.4, Firefox).
 */
export function useWakeLock(enabled: boolean): void {
    const lockRef = useRef<WakeLockSentinel | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;
        // @ts-ignore — wakeLock en lib dom sólo desde TS 5.1
        const wl: WakeLock | undefined = navigator?.wakeLock;
        if (!wl) return;

        let released = false;

        const acquire = async () => {
            try {
                // @ts-ignore
                const lock = await wl.request("screen");
                if (released) {
                    lock.release().catch(() => {});
                    return;
                }
                lockRef.current = lock;
                lock.addEventListener("release", () => {
                    lockRef.current = null;
                });
            } catch {
                // Permiso denegado o no disponible — no rompemos nada
            }
        };

        const release = () => {
            released = true;
            if (lockRef.current) {
                lockRef.current.release().catch(() => {});
                lockRef.current = null;
            }
        };

        // Re-acquire cuando el usuario vuelve a la pestaña (browsers liberan el lock al blur)
        const onVisibility = () => {
            if (document.visibilityState === "visible" && enabled && !lockRef.current) {
                released = false;
                acquire();
            }
        };

        if (enabled) {
            acquire();
            document.addEventListener("visibilitychange", onVisibility);
        }

        return () => {
            document.removeEventListener("visibilitychange", onVisibility);
            release();
        };
    }, [enabled]);
}

// Type shims para browsers sin definiciones completas
interface WakeLock {
    request(type: "screen"): Promise<WakeLockSentinel>;
}
interface WakeLockSentinel extends EventTarget {
    release(): Promise<void>;
    released: boolean;
    type: "screen";
}
