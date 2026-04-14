"use client";

import { useEffect, useState } from "react";

/**
 * Estado de conectividad del browser.
 *
 * Escucha eventos `online` / `offline` de window + arranca con
 * `navigator.onLine`. SSR-safe (retorna true al renderizar en server).
 *
 * Caso de uso en MOOVY: en zonas de Ushuaia con señal intermitente, el
 * rider ve un banner "Sin señal" inmediatamente cuando pierde conexión.
 */
export function useOnline(): boolean {
    const [online, setOnline] = useState<boolean>(() => {
        if (typeof navigator === "undefined") return true;
        return navigator.onLine;
    });

    useEffect(() => {
        const handleOnline = () => setOnline(true);
        const handleOffline = () => setOnline(false);
        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);
        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return online;
}
