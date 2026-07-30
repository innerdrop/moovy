import type { Metadata } from "next";
import ViewportDebugClient from "./ViewportDebugClient";

export const metadata: Metadata = {
    title: "Diagnóstico de pantalla · Moovy",
    robots: { index: false, follow: false },
};

/**
 * /debug/viewport — rama feat/barras-flotantes-y-copy
 *
 * Por qué existe esta página:
 * el emulador de Chrome DevTools NO simula env(safe-area-inset-*) — siempre devuelve 0
 * (bug de Chromium 40718410, abierto). Y en las PWA instaladas en Android el valor real
 * es 0 aunque en iPhone sea 34px. O sea: los números que necesitamos para posicionar las
 * barras inferiores NO se pueden averiguar desde una computadora.
 *
 * Esta página se abre en teléfonos reales y muestra los valores medidos, con un botón
 * para copiarlos y mandarlos por WhatsApp.
 *
 * Vive dentro del grupo (store) A PROPOSITO: así se renderiza el BottomNav real y se puede
 * medir su pico visual (el botón MOOVER sobresale por encima de la píldora con -top-3, y
 * ese voladizo es justamente el número que nadie pudo calcular bien desde el código).
 *
 * Queda detrás de la cortina LAUNCH_GATE como todo el sitio: el link se comparte con
 * ?preview=<TOKEN>.
 */
export default function ViewportDebugPage() {
    return <ViewportDebugClient />;
}
