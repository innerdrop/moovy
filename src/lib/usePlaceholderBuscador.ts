"use client";

import { useEffect, useState } from "react";

/**
 * Placeholder rotativo del buscador.
 *
 * rama feat/barras-flotantes-y-copy · regla #46 (Moovy NO es una app de comida).
 *
 * El texto gris del buscador es el cartel más leído de toda la app, y decía
 * "¿Qué querés pedir?" — "pedir" suena a delivery de comida. Ahora rota entre
 * rubros bien distintos, y sin explicarle nada al vecino le enseña que en Moovy
 * también hay tornillos, pañales e ibuprofeno. Es el mismo truco que usa Amazon
 * en su buscador.
 *
 * El orden NO es alfabético ni por popularidad: arranca por comida (que es lo
 * que la gente ya espera) y enseguida se va lo más lejos posible, para que el
 * contraste se note aunque el usuario mire la pantalla dos segundos.
 */
export const EJEMPLOS_BUSQUEDA = [
    "pizza",
    "tornillos",
    "pañales",
    "ibuprofeno",
    "cuaderno rayado",
    "pintura blanca",
    "alimento para perro",
    "cerveza",
] as const;

const INTERVALO_MS = 3_500;

/**
 * Devuelve el ejemplo que toca mostrar.
 *
 * Arranca SIEMPRE en el índice 0 para que el servidor y el cliente pinten lo
 * mismo (si no, React avisa de desajuste de hidratación); la rotación empieza
 * recién en el primer efecto del cliente.
 *
 * Respeta "reducir movimiento": si el usuario lo tiene activado, el placeholder
 * se queda quieto. Un texto que cambia solo es movimiento, aunque no se
 * desplace.
 */
export function usePlaceholderBuscador(): string {
    const [i, setI] = useState(0);

    useEffect(() => {
        const prefiereQuieto =
            typeof window !== "undefined" &&
            window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
        if (prefiereQuieto) return;

        const t = setInterval(() => {
            setI((n) => (n + 1) % EJEMPLOS_BUSQUEDA.length);
        }, INTERVALO_MS);

        return () => clearInterval(t);
    }, []);

    return EJEMPLOS_BUSQUEDA[i];
}
