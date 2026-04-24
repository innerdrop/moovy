"use client";

// Aplica el tema persistido del driver al montarse el layout.
// Rama fix/driver-settings-pwa (2026-04-24): antes el `applyTheme` solo corría
// al cambiar el toggle en SettingsView. Al recargar la app el tema se perdía
// y volvía al default. Este initializer lo aplica al primer render del layout
// driver para que quede persistido entre sesiones.
//
// No renderea nada visible; es un "effect-only" component.

import { useEffect } from "react";
import { loadRiderPrefs, applyThemeToDom } from "@/hooks/useRiderPrefs";

export default function RiderPrefsInitializer() {
    useEffect(() => {
        const prefs = loadRiderPrefs();
        applyThemeToDom(prefs.theme);
    }, []);

    return null;
}
