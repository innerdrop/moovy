"use client";

import { useEffect, type RefObject } from "react";

/**
 * Mide el alto VISUAL real de una navegación inferior y lo publica como
 * --moovy-nav-peak en el elemento [data-moovy-zone] que la contiene.
 *
 * rama feat/barras-flotantes-y-copy · acompaña a la regla #47
 *
 * ── Por qué hace falta medir ──────────────────────────────────────────────
 * La caja de la navegación del comprador mide 62px, pero el botón MOOVER
 * sobresale por encima con `-top-3`. Cuánto sobresale exactamente depende del
 * alto de línea real de una etiqueta de 10px con Nunito ya cargada. Cuatro
 * personas calcularon cuatro números distintos desde el código (72, 81, 83,
 * 84) y ninguno coincidió. Ese número no se calcula: se mide.
 *
 * Además cubre gratis dos casos que ninguna constante cubre:
 *  · el tamaño de fuente del sistema Android (desde Chrome 113 funciona como
 *    zoom de página; ~40% de los usuarios Android no está en el valor por
 *    defecto), que agranda la navegación;
 *  · cualquier rediseño futuro de la navegación.
 *
 * ── Las dos trampas que evita ─────────────────────────────────────────────
 * 1. Mide la caja CONTRA SÍ MISMA (bottom - topMin), nunca contra el viewport.
 *    Un `viewportHeight - navTop` se acopla al teclado, al colapso de la barra
 *    de Safari y al pinch-zoom, y devuelve el viewport ENTERO cuando la
 *    navegación está oculta.
 * 2. Cuando la navegación es display:none (lg:hidden en escritorio),
 *    getBoundingClientRect devuelve todo cero. En ese caso BORRA la variable
 *    en vez de escribir un número: así vuelve a mandar el CSS, que ya tiene el
 *    valor correcto para escritorio.
 *
 * Si el JS no corre, no pasa nada: globals.css ya trae un valor por zona.
 */
/**
 * Cuántos píxeles hay que dejar libres abajo para no pisar nada.
 *
 * Devuelve la distancia desde el piso de la pantalla hasta el punto más alto de
 * lo que ya vive ahí: la navegación y, si la pantalla tiene una, la barra de
 * acción. Es para los elementos flotantes que se posicionan con JS y no pueden
 * usar `bottom: var(--moovy-bar-bottom)` directamente — hoy, la burbuja de
 * soporte, que es arrastrable.
 *
 * La cuenta NO se escribe a mano (regla #47): si hay una barra de acción en
 * pantalla se mide la barra real; si no hay, se resuelve el token con una sonda
 * invisible, porque `getPropertyValue` devuelve el `calc(...)` sin resolver.
 */
export function medirEspacioInferior(respiro = 12): number {
    if (typeof document === "undefined") return 116;

    // 1. ¿Hay una barra de acción visible? Entonces el techo es ella.
    const barra = document.querySelector<HTMLElement>("[data-moovy-bar]");
    if (barra) {
        const r = barra.getBoundingClientRect();
        if (r.height > 0 && r.top > 0) {
            return Math.ceil(window.innerHeight - r.top + respiro);
        }
    }

    // 2. Si no hay barra, resolver el token con una sonda.
    const zona = document.querySelector<HTMLElement>("[data-moovy-zone]") ?? document.body;
    const sonda = document.createElement("div");
    sonda.style.cssText =
        "position:absolute;left:0;top:0;width:1px;visibility:hidden;pointer-events:none;" +
        "height:var(--moovy-bar-bottom, 96px)";
    zona.appendChild(sonda);
    const alto = sonda.getBoundingClientRect().height;
    sonda.remove();

    return alto > 0 ? Math.ceil(alto + respiro) : 116;
}

export function useNavPeak(navRef: RefObject<HTMLElement | null>) {
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;

        const zona = nav.closest<HTMLElement>("[data-moovy-zone]");
        if (!zona) {
            if (process.env.NODE_ENV !== "production") {
                console.warn(
                    "[useNavPeak] la navegación no está dentro de ningún [data-moovy-zone]; " +
                    "las barras van a usar el valor por defecto del CSS.",
                );
            }
            return;
        }

        let raf = 0;

        const medir = () => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                const r = nav.getBoundingClientRect();

                // display:none => todo cero. Devolverle el control al CSS.
                if (r.width === 0 && r.height === 0) {
                    zona.style.removeProperty("--moovy-nav-peak");
                    return;
                }

                // El pixel más alto: puede ser un hijo que sobresalga de la caja.
                let topMin = r.top;
                nav.querySelectorAll<HTMLElement>("[data-nav-peak]").forEach((hijo) => {
                    const rh = hijo.getBoundingClientRect();
                    if (rh.width === 0 || rh.height === 0) return;
                    if (rh.top < topMin) topMin = rh.top;
                });

                const peak = Math.ceil(r.bottom - topMin);

                // Guarda de cordura: si el número es absurdo, mejor el default del CSS.
                if (peak <= 0 || peak > 400) {
                    zona.style.removeProperty("--moovy-nav-peak");
                    return;
                }

                zona.style.setProperty("--moovy-nav-peak", `${peak}px`);
            });
        };

        medir();

        const ro = new ResizeObserver(medir);
        ro.observe(nav);
        nav.querySelectorAll<HTMLElement>("[data-nav-peak]").forEach((el) => ro.observe(el));

        window.addEventListener("orientationchange", medir);
        // Las fuentes web cambian las métricas verticales de las etiquetas.
        document.fonts?.ready.then(medir).catch(() => { });

        return () => {
            cancelAnimationFrame(raf);
            ro.disconnect();
            window.removeEventListener("orientationchange", medir);
            zona.style.removeProperty("--moovy-nav-peak");
        };
    }, [navRef]);
}
