"use client";

/**
 * StatsCounter — los 4 números clave de /nosotros con animación count-up
 * cuando entran al viewport. Diseño de Sofía Vega — el % en rojo Moovy
 * y el número entero en negro #111827 para que el rojo solo aparezca
 * en los puntos clave (ver "hilo de rojo" en el design rationale).
 */

import { useEffect, useRef, useState } from "react";

interface Stat {
    target: number;
    suffix: string;        // "k" para 80k, "%" para porcentajes
    pct?: boolean;         // si true, el suffix se renderiza como pct rojo chico
    label: string;
}

const STATS: Stat[] = [
    { target: 80, suffix: "k", label: "Habitantes en Ushuaia" },
    { target: 0, suffix: "%", pct: true, label: "Retención de tu dinero" },
    { target: 10, suffix: "%", pct: true, label: "Comisión a comercios" },
    { target: 80, suffix: "%", pct: true, label: "Para repartidores" },
];

export default function StatsCounter() {
    const gridRef = useRef<HTMLDivElement>(null);
    const [values, setValues] = useState<number[]>(() => STATS.map(() => 0));

    useEffect(() => {
        const grid = gridRef.current;
        if (!grid) return;

        let played = false;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting && !played) {
                        played = true;
                        runCountUp();
                        observer.disconnect();
                    }
                }
            },
            { threshold: 0.3 },
        );

        observer.observe(grid);

        return () => observer.disconnect();

        function runCountUp() {
            const duration = 800;
            const start = performance.now();
            const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

            const tick = (now: number) => {
                const elapsed = now - start;
                const t = Math.min(elapsed / duration, 1);
                const eased = easeOut(t);
                setValues(STATS.map((s) => Math.round(s.target * eased)));
                if (t < 1) {
                    requestAnimationFrame(tick);
                }
            };
            requestAnimationFrame(tick);
        }
    }, []);

    return (
        <div
            ref={gridRef}
            className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-8"
        >
            {STATS.map((stat, i) => (
                <div key={i} className="text-left">
                    <div className="inline-flex items-baseline text-[48px] md:text-[56px] font-bold leading-none tracking-[-0.03em] text-[#111827]">
                        <span>{values[i]}</span>
                        {stat.pct ? (
                            <span className="ml-0.5 text-[28px] md:text-[32px] font-bold leading-none text-[#e60012]">
                                {stat.suffix}
                            </span>
                        ) : (
                            <span>{stat.suffix}</span>
                        )}
                    </div>
                    <p className="mt-3 max-w-[200px] text-sm font-medium leading-snug text-[#6b7280]">
                        {stat.label}
                    </p>
                </div>
            ))}
        </div>
    );
}
