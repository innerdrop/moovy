"use client";

// Fuegos artificiales hiperrealistas en canvas — cortina "Próximamente".
// Rama: fix/cortina-identidad-ushuaia
// Física real: cohetes que suben con estela y brasas, explosión con destello,
// gravedad + arrastre del aire, chispas que titilan, crepitan y caen apagándose.
// · Sin librerías. Paleta celeste/blanco de la cortina (sin colores nuevos).
// · Respeta prefers-reduced-motion (no anima nada).
// · Pausa el loop cuando la pestaña está oculta (no gasta batería).
// · Menos partículas en pantallas chicas (mobile / conexión irregular).

import { useEffect, useRef } from "react";

const COLORS = ["#ffffff", "#6CACE4", "#9DC4E6", "#bfe1f2"];

type Spark = {
    x: number;
    y: number;
    px: number;
    py: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: string;
    twinkle: number;
    crackle: boolean;
};

type Rocket = {
    x: number;
    y: number;
    px: number;
    py: number;
    vx: number;
    vy: number;
};

type Flash = { x: number; y: number; life: number; maxLife: number; radius: number };

export default function Fireworks() {
    const ref = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = ref.current;
        if (!canvas) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let W = 0;
        let H = 0;
        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            W = canvas.clientWidth;
            H = canvas.clientHeight;
            canvas.width = W * dpr;
            canvas.height = H * dpr;
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener("resize", resize);

        const GRAVITY = 330; // px/s²
        const DRAG = 1.6; // arrastre del aire (decaimiento exponencial)

        const small = () => Math.min(W, H) < 640;
        const rand = (a: number, b: number) => a + Math.random() * (b - a);
        const pick = () => COLORS[(Math.random() * COLORS.length) | 0];

        const rockets: Rocket[] = [];
        const sparks: Spark[] = [];
        const flashes: Flash[] = [];

        const launch = () => {
            // Solo en los laterales: el centro queda libre para el branding/logo.
            const x = Math.random() < 0.5 ? rand(W * 0.04, W * 0.2) : rand(W * 0.8, W * 0.96);
            // Altura de explosión aleatoria: entre el 5% y el 50% del alto de la
            // pantalla, para que cada estallido sea distinto al anterior.
            const apex = rand(H * 0.5, H * 0.95);
            rockets.push({
                x,
                y: H + 8,
                px: x,
                py: H + 8,
                vx: rand(-16, 16),
                vy: -Math.sqrt(2 * GRAVITY * apex),
            });
        };

        const addSpark = (s: Spark) => {
            if (sparks.length < 1400) sparks.push(s);
        };

        const explode = (x: number, y: number) => {
            const base = pick();
            const n = small() ? 90 : 150;
            // El radio de la explosión escala con la pantalla: con el arrastre, cada
            // chispa recorre ~velocidad/DRAG px → apuntamos a un radio de ~25-38% del
            // lado menor (explosiones grandes, protagonistas).
            const dim = Math.min(W, H);
            // Radio objetivo ~22-38% del lado menor, variable por estallido: algunas
            // explosiones grandes, otras más chicas — sin invadir el centro.
            const speed = rand(0.35, 0.62) * dim * DRAG * 0.62;
            for (let i = 0; i < n; i++) {
                const ang = (i / n) * Math.PI * 2 + rand(-0.06, 0.06);
                // Distribución no uniforme: mayoría lentas adentro, pocas rápidas afuera.
                const v = speed * (0.35 + 0.65 * Math.pow(Math.random(), 1.6));
                const maxLife = rand(1.7, 3.1);
                addSpark({
                    x,
                    y,
                    px: x,
                    py: y,
                    vx: Math.cos(ang) * v + rand(-12, 12),
                    vy: Math.sin(ang) * v * 0.92 + rand(-12, 12),
                    life: maxLife,
                    maxLife,
                    size: rand(2, 4),
                    color: Math.random() < 0.72 ? base : pick(),
                    twinkle: rand(0, Math.PI * 2),
                    crackle: Math.random() < 0.14,
                });
            }
            flashes.push({ x, y, life: 0.2, maxLife: 0.2, radius: dim * 0.18 });
        };

        const drawLine = (s: { px: number; py: number; x: number; y: number }, w: number, color: string, alpha: number) => {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = color;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(s.px, s.py);
            ctx.lineTo(s.x, s.y);
            ctx.stroke();
        };

        let raf = 0;
        let running = true;
        let last = performance.now();
        let nextLaunch = 0.3; // el primero sale enseguida

        const tick = (now: number) => {
            raf = requestAnimationFrame(tick);
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;

            ctx.clearRect(0, 0, W, H);
            ctx.globalCompositeOperation = "lighter";
            ctx.lineCap = "round";

            // ── Lanzamientos ────────────────────────────────────────────────
            nextLaunch -= dt;
            if (nextLaunch <= 0 && rockets.length < (small() ? 1 : 2)) {
                launch();
                // Cadencia de show profesional: ritmo irregular con respiros, y cada
                // tanto un "doblete" (dos estallidos casi juntos) como acento.
                const roll = Math.random();
                if (roll < 0.18) {
                    nextLaunch = rand(0.5, 0.9); // doblete
                } else if (roll < 0.55) {
                    nextLaunch = rand(2.5, 4);
                } else {
                    nextLaunch = rand(4.5, 7);
                }
            }

            // ── Cohetes (suben desacelerando, explotan cerca del apex) ──────
            for (let i = rockets.length - 1; i >= 0; i--) {
                const r = rockets[i];
                r.px = r.x;
                r.py = r.y;
                r.vy += GRAVITY * dt;
                r.x += r.vx * dt;
                r.y += r.vy * dt;

                // Brasas de la estela: caen y se apagan rápido.
                if (Math.random() < 0.8) {
                    addSpark({
                        x: r.x + rand(-1.5, 1.5),
                        y: r.y + rand(0, 4),
                        px: r.x,
                        py: r.y,
                        vx: rand(-16, 16),
                        vy: rand(15, 60),
                        life: rand(0.2, 0.45),
                        maxLife: 0.45,
                        size: rand(0.7, 1.6),
                        color: Math.random() < 0.5 ? "#ffffff" : "#bfe1f2",
                        twinkle: rand(0, Math.PI * 2),
                        crackle: false,
                    });
                }

                drawLine(r, 2.2, "#ffffff", 0.9);

                if (r.vy > -45) {
                    rockets.splice(i, 1);
                    explode(r.x, r.y);
                }
            }

            // ── Destello de la explosión ────────────────────────────────────
            for (let i = flashes.length - 1; i >= 0; i--) {
                const f = flashes[i];
                f.life -= dt;
                if (f.life <= 0) {
                    flashes.splice(i, 1);
                    continue;
                }
                const a = f.life / f.maxLife;
                const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius);
                g.addColorStop(0, `rgba(255,255,255,${(0.85 * a).toFixed(3)})`);
                g.addColorStop(0.4, `rgba(191,225,242,${(0.35 * a).toFixed(3)})`);
                g.addColorStop(1, "rgba(191,225,242,0)");
                ctx.globalAlpha = 1;
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // ── Chispas (gravedad + arrastre + parpadeo + crepitado) ────────
            const drag = Math.exp(-DRAG * dt);
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.px = s.x;
                s.py = s.y;
                s.vx *= drag;
                s.vy = s.vy * drag + GRAVITY * dt;
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.life -= dt;
                s.twinkle += dt * 24;

                if (s.life <= 0 || s.y > H + 20) {
                    sparks.splice(i, 1);
                    continue;
                }

                // Crepitado: cerca del final, la chispa se parte en micro-chispas.
                if (s.crackle && s.life < s.maxLife * 0.35) {
                    s.crackle = false;
                    for (let k = 0; k < 4; k++) {
                        addSpark({
                            x: s.x,
                            y: s.y,
                            px: s.x,
                            py: s.y,
                            vx: s.vx * 0.3 + rand(-70, 70),
                            vy: s.vy * 0.3 + rand(-70, 70),
                            life: rand(0.15, 0.4),
                            maxLife: 0.4,
                            size: rand(0.6, 1.3),
                            color: "#ffffff",
                            twinkle: rand(0, Math.PI * 2),
                            crackle: false,
                        });
                    }
                }

                const f = s.life / s.maxLife;
                // Fade suave + parpadeo que se acentúa cuando se está apagando.
                const flicker = f < 0.55 ? 0.45 + 0.55 * Math.abs(Math.sin(s.twinkle)) : 1;
                const alpha = Math.pow(f, 1.2) * flicker;
                // Halo suave (pasada gruesa translúcida) + núcleo brillante.
                drawLine(s, s.size * 3.2, s.color, alpha * 0.22);
                drawLine(s, s.size, s.color, alpha);
            }

            ctx.globalAlpha = 1;
        };

        const onVisibility = () => {
            if (document.hidden) {
                if (running) {
                    running = false;
                    cancelAnimationFrame(raf);
                }
            } else if (!running) {
                running = true;
                last = performance.now();
                raf = requestAnimationFrame(tick);
            }
        };
        document.addEventListener("visibilitychange", onVisibility);

        raf = requestAnimationFrame(tick);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", resize);
            document.removeEventListener("visibilitychange", onVisibility);
        };
    }, []);

    return (
        <canvas
            ref={ref}
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
        />
    );
}
