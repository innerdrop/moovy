"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cliente de /debug/viewport. Todo se mide en el dispositivo real.
 *
 * OJO con dos trampas que ya nos costaron caro en el análisis:
 *
 * 1. NO medir la navegación contra el viewport (viewportHeight - navTop). Ese cálculo se
 *    acopla al teclado, al colapso de la barra de Safari y al pinch-zoom, y devuelve el
 *    viewport entero cuando la navegación está oculta (display:none => getBoundingClientRect
 *    devuelve todo cero). Se mide la caja contra sí misma y, aparte, su distancia al piso.
 *
 * 2. env(safe-area-inset-*) no se puede leer con getComputedStyle sobre una variable: hay que
 *    aplicarlo a un elemento y medir el elemento. Por eso las "sondas".
 */

type Medicion = {
    etiqueta: string;
    valor: string;
    nota?: string;
    alerta?: boolean;
};

const SIN_DATO = "—";

function px(n: number | null | undefined): string {
    if (n === null || n === undefined || Number.isNaN(n)) return SIN_DATO;
    return `${Math.round(n * 10) / 10}px`;
}

export default function ViewportDebugClient() {
    const sondaBottom = useRef<HTMLDivElement>(null);
    const sondaMaxBottom = useRef<HTMLDivElement>(null);
    const sondaTop = useRef<HTMLDivElement>(null);
    const sondaLeft = useRef<HTMLDivElement>(null);
    const sondaRight = useRef<HTMLDivElement>(null);

    const [medidas, setMedidas] = useState<Medicion[]>([]);
    const [claro, setClaro] = useState<number | null>(null);
    const [copiado, setCopiado] = useState(false);
    const [cssCargado, setCssCargado] = useState(true);

    const medir = useCallback(() => {
        const doc = document.documentElement;

        // ── Sondas de safe-area ────────────────────────────────────────────────
        const leerSonda = (el: HTMLDivElement | null, eje: "alto" | "ancho"): number | null => {
            if (!el) return null;
            const r = el.getBoundingClientRect();
            return eje === "alto" ? r.height : r.width;
        };

        const sabBottom = leerSonda(sondaBottom.current, "alto");
        const sabMaxBottom = leerSonda(sondaMaxBottom.current, "alto");
        const sabTop = leerSonda(sondaTop.current, "alto");
        const sabLeft = leerSonda(sondaLeft.current, "ancho");
        const sabRight = leerSonda(sondaRight.current, "ancho");

        // ── La navegación inferior real ────────────────────────────────────────
        // Se busca cualquier <nav> fijo cuyo borde inferior esté cerca del piso.
        const vvAlto = window.visualViewport?.height ?? window.innerHeight;
        let navCaja: number | null = null;
        let navPico: number | null = null;
        let navHastaElPiso: number | null = null;
        let navEncontrada = false;

        const navs = Array.from(document.querySelectorAll("nav"));
        for (const nav of navs) {
            const r = nav.getBoundingClientRect();
            // display:none => todo cero. Se descarta explícitamente.
            if (r.width === 0 && r.height === 0) continue;
            const estilo = window.getComputedStyle(nav);
            if (estilo.position !== "fixed") continue;
            // ¿está apoyada abajo? (tolerancia generosa para la píldora flotante)
            if (window.innerHeight - r.bottom > 120) continue;

            navEncontrada = true;
            navCaja = r.height;

            // El pico: el hijo que más sobresale hacia arriba (el botón MOOVER con -top-3).
            let topMin = r.top;
            nav.querySelectorAll<HTMLElement>("*").forEach((hijo) => {
                const rh = hijo.getBoundingClientRect();
                if (rh.width === 0 || rh.height === 0) return;
                if (rh.top < topMin) topMin = rh.top;
            });

            // Se mide la caja contra SÍ MISMA (bottom - top), nunca contra el viewport.
            navPico = r.bottom - topMin;
            // Y aparte, la distancia del piso del viewport al punto más alto de la nav.
            navHastaElPiso = vvAlto - topMin;
            break;
        }

        setClaro(navHastaElPiso);

        const standalone =
            window.matchMedia("(display-mode: standalone)").matches ||
            // iOS viejo
            (window.navigator as unknown as { standalone?: boolean }).standalone === true;

        const escala = window.visualViewport?.scale ?? 1;
        const anchoCss = doc.clientWidth;
        const altoCss = doc.clientHeight;

        // ── ¿Están vivos los tokens? ──────────────────────────────────────────
        // Esto existe porque ya nos pasó: el servidor de desarrollo se quedó
        // sirviendo un globals.css viejo, las variables no existían, y entonces
        // `bottom: var(--moovy-nav-offset)` quedaba INVÁLIDO → bottom:auto → la
        // píldora aparecía arriba, encima del header, y con el ancho encogido.
        // Sin este cartel, el síntoma parece un bug de layout imposible de
        // entender. Con el cartel, se lee "reiniciá el servidor".
        const zona = document.querySelector<HTMLElement>("[data-moovy-zone]");
        const tokenBar = zona
            ? getComputedStyle(zona).getPropertyValue("--moovy-bar-bottom").trim()
            : "";
        const tokenNav = zona
            ? getComputedStyle(zona).getPropertyValue("--moovy-nav-offset").trim()
            : "";
        const tokensVivos = tokenBar !== "" && tokenNav !== "";
        setCssCargado(tokensVivos);

        const filas: Medicion[] = [
            {
                etiqueta: "🔑 Tokens de las barras",
                valor: tokensVivos ? "OK" : "NO CARGADOS",
                nota: tokensVivos
                    ? `--moovy-bar-bottom: ${tokenBar}`
                    : "El CSS está viejo. Pará el servidor, borrá la carpeta .next y arrancá de nuevo.",
                alerta: !tokensVivos,
            },
            {
                etiqueta: "Zona de la pantalla",
                valor: zona?.dataset.moovyZone ?? "ninguna",
                nota: zona?.dataset.moovyNav === "oculta"
                    ? "La navegación se esconde acá a propósito (pantalla de conversión)"
                    : undefined,
                alerta: !zona,
            },
            {
                etiqueta: "Modo",
                valor: standalone ? "App instalada (standalone)" : "Navegador",
                nota: standalone
                    ? "Este es el modo de tu captura"
                    : "Probá también con la app agregada a la pantalla de inicio",
            },
            {
                etiqueta: "Pantalla (píxeles CSS)",
                valor: `${anchoCss} × ${altoCss}`,
                nota: anchoCss <= 360 ? "Pantalla angosta: el caso más exigente" : undefined,
                alerta: anchoCss <= 360,
            },
            { etiqueta: "Densidad (DPR)", valor: String(window.devicePixelRatio) },
            {
                etiqueta: "Zoom del navegador",
                valor: `${Math.round(escala * 100)}%`,
                nota:
                    Math.abs(escala - 1) > 0.02
                        ? "Ojo: hay zoom activo, los números de abajo están escalados"
                        : undefined,
                alerta: Math.abs(escala - 1) > 0.02,
            },
            {
                etiqueta: "innerHeight vs visualViewport",
                valor: `${window.innerHeight} vs ${Math.round(vvAlto)}`,
                nota:
                    window.innerHeight - vvAlto > 120
                        ? "Diferencia grande: probablemente el teclado esté abierto"
                        : undefined,
            },
            {
                etiqueta: "🔑 safe-area-inset-bottom",
                valor: px(sabBottom),
                nota:
                    sabBottom === 0
                        ? "Vale 0. Normal en Android (y en TODA PWA instalada en Android)."
                        : "El sistema reserva este colchón abajo",
            },
            {
                etiqueta: "safe-area-MAX-inset-bottom",
                valor: px(sabMaxBottom),
                nota: "Chrome 135+. Si es igual al de arriba, no hay 'chin' dinámico.",
            },
            { etiqueta: "safe-area-inset-top", valor: px(sabTop) },
            {
                etiqueta: "safe-area laterales",
                valor: `${px(sabLeft)} / ${px(sabRight)}`,
                nota: "En horizontal con notch estos crecen a 44-47px",
            },
            {
                etiqueta: "🔑 Alto de la caja de la navegación",
                valor: navEncontrada ? px(navCaja) : "No hay navegación en esta pantalla",
                alerta: !navEncontrada,
            },
            {
                etiqueta: "🔑 Alto VISUAL (con lo que sobresale)",
                valor: navEncontrada ? px(navPico) : SIN_DATO,
                nota:
                    navEncontrada && navPico !== null && navCaja !== null && navPico > navCaja + 1
                        ? `El botón central sobresale ${px(navPico - navCaja)} por encima de la píldora`
                        : undefined,
            },
            {
                etiqueta: "🔑 Piso → punto más alto de la nav",
                valor: navEncontrada ? px(navHastaElPiso) : SIN_DATO,
                nota: "ESTE es el número que tienen que respetar las barras de acción",
            },
            {
                etiqueta: "Navegador",
                valor: navigator.userAgent.slice(0, 90),
            },
        ];

        setMedidas(filas);
    }, []);

    useEffect(() => {
        medir();

        const vv = window.visualViewport;
        const alCambiar = () => medir();

        window.addEventListener("resize", alCambiar);
        window.addEventListener("orientationchange", alCambiar);
        vv?.addEventListener("resize", alCambiar);
        vv?.addEventListener("scroll", alCambiar);
        // las fuentes web cambian las métricas verticales de las etiquetas de la nav
        document.fonts?.ready.then(() => medir()).catch(() => { });

        return () => {
            window.removeEventListener("resize", alCambiar);
            window.removeEventListener("orientationchange", alCambiar);
            vv?.removeEventListener("resize", alCambiar);
            vv?.removeEventListener("scroll", alCambiar);
        };
    }, [medir]);

    const copiar = useCallback(() => {
        const texto = medidas.map((m) => `${m.etiqueta}: ${m.valor}`).join("\n");
        navigator.clipboard
            ?.writeText(`MOOVY — diagnóstico de pantalla\n\n${texto}`)
            .then(() => {
                setCopiado(true);
                window.setTimeout(() => setCopiado(false), 2500);
            })
            .catch(() => { });
    }, [medidas]);

    return (
        <div className="px-4 py-5 max-w-lg mx-auto">
            {/* Sondas invisibles: la única forma de leer env() es aplicarlo y medir. */}
            <div aria-hidden className="pointer-events-none invisible absolute left-0 top-0">
                <div ref={sondaBottom} style={{ height: "env(safe-area-inset-bottom, 0px)", width: 1 }} />
                <div
                    ref={sondaMaxBottom}
                    style={{
                        height: "env(safe-area-max-inset-bottom, env(safe-area-inset-bottom, 0px))",
                        width: 1,
                    }}
                />
                <div ref={sondaTop} style={{ height: "env(safe-area-inset-top, 0px)", width: 1 }} />
                <div ref={sondaLeft} style={{ width: "env(safe-area-inset-left, 0px)", height: 1 }} />
                <div ref={sondaRight} style={{ width: "env(safe-area-inset-right, 0px)", height: 1 }} />
            </div>

            <h1 className="text-xl font-extrabold text-gray-900">Diagnóstico de pantalla</h1>

            {!cssCargado && (
                <div className="mt-3 rounded-xl border-2 border-[#e60012] bg-red-50 px-3.5 py-3">
                    <p className="text-[13.5px] font-extrabold text-[#e60012]">
                        El CSS está desactualizado
                    </p>
                    <p className="mt-1 text-[12.5px] text-red-900 leading-snug">
                        Los tokens de las barras no existen en esta página, así que la navegación y
                        las barras se ven en lugares raros (la píldora puede aparecer arriba y
                        angosta). No es un bug del diseño: el servidor de desarrollo está sirviendo
                        una versión vieja del CSS.
                    </p>
                    <p className="mt-2 text-[12.5px] font-bold text-red-900">
                        Pará el servidor, borrá la carpeta <code>.next</code> y arrancalo de nuevo.
                    </p>
                </div>
            )}
            <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">
                Sacale una captura a esto y mandámela. Si podés, hacelo dos veces: una desde el
                navegador y otra con Moovy agregado a la pantalla de inicio.
            </p>

            <button
                type="button"
                onClick={copiar}
                className="mt-3 w-full rounded-xl bg-[#e60012] text-white font-bold py-3 active:bg-[#cc000f] transition-colors"
            >
                {copiado ? "✓ Copiado" : "Copiar todo"}
            </button>

            <div className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden">
                {medidas.map((m) => (
                    <div
                        key={m.etiqueta}
                        className="px-3.5 py-2.5 border-b border-gray-100 last:border-b-0"
                    >
                        <div className="flex items-baseline justify-between gap-3">
                            <span className="text-[13px] text-gray-500 shrink-0">{m.etiqueta}</span>
                            <span
                                className={`text-[14px] font-bold text-right break-all ${m.alerta ? "text-[#e60012]" : "text-gray-900"
                                    }`}
                            >
                                {m.valor}
                            </span>
                        </div>
                        {m.nota && <p className="mt-1 text-[11.5px] text-gray-400 leading-snug">{m.nota}</p>}
                    </div>
                ))}
            </div>

            <h2 className="mt-6 text-base font-extrabold text-gray-900">La prueba de fuego</h2>
            <p className="mt-1 text-sm text-gray-500 leading-relaxed">
                Abajo hay una barra verde de prueba puesta a la altura que calculamos. Tiene que
                quedar <b>por encima</b> del menú, sin tocarlo y sin taparle el botón rojo del
                medio.
            </p>
            <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                <p className="text-[12.5px] text-amber-900 leading-snug">
                    Si la barra verde pisa el menú o el botón rojo, <b>sacale la captura así</b> —
                    ese es exactamente el bug que estamos arreglando.
                </p>
            </div>

            {/* Espacio para que la barra de prueba no tape el texto de arriba. */}
            <div className="h-40" />

            {/* Barra de prueba. Usa el token real, para que esto valide el token y no otra cosa. */}
            <div
                className="fixed left-3 right-3 z-40 rounded-2xl bg-emerald-500 text-white text-center font-bold py-3 shadow-lg"
                style={{ bottom: "var(--moovy-bar-bottom, 84px)" }}
            >
                Barra de prueba
                {claro !== null ? ` · nav hasta ${px(claro)}` : ""}
            </div>
        </div>
    );
}
