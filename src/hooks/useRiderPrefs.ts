"use client";

// Hook centralizado para las preferencias del driver.
//
// Rama fix/driver-settings-pwa (2026-04-24): antes, SettingsView.tsx guardaba
// las prefs en localStorage pero nadie las LEÍA desde otros componentes.
// Resultado: el modo claro se aplicaba al click pero se perdía al recargar,
// los toggles de sonido y vibración eran cosméticos (nadie los consumía).
//
// Este hook:
//   - Persiste / lee las prefs en localStorage (key `moovy_rider_prefs`).
//   - Expone `prefs`, `updatePref`.
//   - Expone helpers `playAlertSound()` y `triggerVibration()` que respetan los toggles.
//   - La aplicación del TEMA al DOM se hace desde RiderPrefsInitializer (cliente
//     en el layout driver) porque debe pasar ANTES del primer render para evitar
//     flash de color incorrecto.

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "auto" | "light" | "dark";
export type MapsApp = "google" | "waze";

export interface RiderPreferences {
    theme: ThemeMode;
    mapsApp: MapsApp;
    soundAlerts: boolean;
    vibration: boolean;
    batteryThreshold: number;          // % batería debajo del cual avisar
    autoDisconnectMinutes: number;     // 0 = nunca
}

export const DEFAULT_RIDER_PREFS: RiderPreferences = {
    theme: "auto",
    mapsApp: "google",
    soundAlerts: true,
    vibration: true,
    batteryThreshold: 20,
    autoDisconnectMinutes: 0,
};

export const RIDER_PREFS_STORAGE_KEY = "moovy_rider_prefs";

export function loadRiderPrefs(): RiderPreferences {
    if (typeof window === "undefined") return DEFAULT_RIDER_PREFS;
    try {
        const raw = window.localStorage.getItem(RIDER_PREFS_STORAGE_KEY);
        if (raw) return { ...DEFAULT_RIDER_PREFS, ...JSON.parse(raw) };
    } catch {
        /* fallback al default si el JSON es inválido */
    }
    return DEFAULT_RIDER_PREFS;
}

function saveRiderPrefs(prefs: RiderPreferences) {
    if (typeof window === "undefined") return;
    try {
        window.localStorage.setItem(RIDER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
        /* localStorage puede estar deshabilitado (modo privado Safari) */
    }
}

/**
 * Aplica el tema al DOM. Se usa tanto desde RiderPrefsInitializer (on mount)
 * como desde SettingsView (al cambiar el toggle) para que tome efecto al instante.
 */
export function applyThemeToDom(mode: ThemeMode) {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (mode === "auto") {
        root.removeAttribute("data-theme");
        root.style.colorScheme = "";
    } else {
        root.setAttribute("data-theme", mode);
        root.style.colorScheme = mode;
    }
}

/**
 * Reproduce un beep corto si el toggle de sonido está activo.
 * Usamos Web Audio API en vez de un archivo para evitar el extra roundtrip de red
 * y que funcione aunque el user aún no haya interactuado con la página
 * (en iOS Safari muchas APIs de audio requieren gesto — esto solo funciona
 * si se llama desde un event handler de click o desde un push notification handler,
 * pero no impide que lo intentemos y falle silenciosamente).
 */
export function playAlertBeep() {
    if (typeof window === "undefined") return;
    try {
        const AudioContextClass =
            window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        const ctx = new AudioContextClass();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        oscillator.frequency.value = 880; // A5 — agudo pero no chillón
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.3);
        // Cerrar el contexto después del sonido para liberar recursos
        setTimeout(() => ctx.close().catch(() => { }), 500);
    } catch {
        /* ignorar errores de Audio API en navegadores restrictivos */
    }
}

/**
 * Dispara vibración si el toggle está activo y la API está disponible.
 * En iOS (Safari o Chrome con WebKit) `navigator.vibrate` NO existe —
 * Apple nunca implementó la Vibration API en iOS. Fallará silenciosamente ahí.
 */
export function triggerVibration(pattern: number | number[] = 200) {
    if (typeof window === "undefined") return;
    try {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) {
            navigator.vibrate(pattern);
        }
    } catch {
        /* ignorar */
    }
}

/**
 * Hook principal para leer/actualizar preferencias del driver desde cualquier
 * componente. Después de montar, `prefs` refleja lo persistido.
 *
 * Uso:
 *   const { prefs, updatePref, playSoundIfEnabled, vibrateIfEnabled } = useRiderPrefs();
 *   // al recibir una nueva oferta de pedido:
 *   playSoundIfEnabled();
 *   vibrateIfEnabled([200, 100, 200]);
 */
export function useRiderPrefs() {
    const [prefs, setPrefs] = useState<RiderPreferences>(DEFAULT_RIDER_PREFS);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setPrefs(loadRiderPrefs());
        setLoaded(true);
    }, []);

    const updatePref = useCallback(
        <K extends keyof RiderPreferences>(key: K, value: RiderPreferences[K]) => {
            setPrefs((prev) => {
                const next = { ...prev, [key]: value };
                saveRiderPrefs(next);
                if (key === "theme") applyThemeToDom(value as ThemeMode);
                return next;
            });
        },
        [],
    );

    const playSoundIfEnabled = useCallback(() => {
        // Leemos directo del localStorage por si el caller llama desde un handler
        // async / socket listener donde el prefs del closure puede estar stale.
        const current = loadRiderPrefs();
        if (current.soundAlerts) playAlertBeep();
    }, []);

    const vibrateIfEnabled = useCallback((pattern?: number | number[]) => {
        const current = loadRiderPrefs();
        if (current.vibration) triggerVibration(pattern);
    }, []);

    return {
        prefs,
        loaded,
        updatePref,
        playSoundIfEnabled,
        vibrateIfEnabled,
    };
}
