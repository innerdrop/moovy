// Página "Próximamente" — cortina pública del candado de lanzamiento.
// Rama: fix/landing-fija-responsive-desktop
// Pantalla adaptativa (min-h 100dvh) + responsive:
//   · Si el contenido entra, ocupa exactamente una pantalla y NO hay scroll.
//   · Si la pantalla es muy chica, el contenido crece y SÍ se puede scrollear
//     (el formulario nunca queda oculto/inaccesible).
//   · Mobile: una columna centrada y compacta.
//   · Desktop (lg+): dos columnas (branding a la izquierda, formulario a la derecha).
// Fondo rojo Moovy PLANO + logo oficial intacto + fuegos artificiales (estallidos)
// en celeste/blanco. CSS puro, respeta prefers-reduced-motion. Sin marcas oficiales.

import type { Metadata } from "next";
import Image from "next/image";
import PreLaunchForm from "./PreLaunchForm";

const OG_TITLE = "Moovy está por llegar a Ushuaia";
const OG_DESC = "Sumá tu comercio o anotate para repartir y sé de los primeros en ser parte.";

export const metadata: Metadata = {
    metadataBase: new URL("https://somosmoovy.com"),
    title: "Moovy — Próximamente",
    description: "Moovy llega pronto a Ushuaia. Sumá tu comercio o anotate para repartir.",
    robots: { index: false, follow: false },
    // Tarjeta social: lo que ven WhatsApp/Facebook/etc. al pegar el link.
    // (Facebook ya no permite pre-escribir el texto del posteo; muestra esta tarjeta.)
    openGraph: {
        title: OG_TITLE,
        description: OG_DESC,
        url: "https://somosmoovy.com",
        siteName: "Moovy",
        locale: "es_AR",
        type: "website",
        images: [
            {
                url: "/og-moovy.png",
                width: 1200,
                height: 630,
                alt: "Moovy — Está por llegar a Ushuaia",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: OG_TITLE,
        description: OG_DESC,
        images: ["/og-moovy.png"],
    },
};

// Fuegos artificiales: cada estallido dispara N chispas desde un punto hacia afuera.
const BURSTS = [
    { left: "12%", top: "18%", delay: 0 },
    { left: "85%", top: "15%", delay: 0.9 },
    { left: "50%", top: "11%", delay: 1.8 },
    { left: "22%", top: "54%", delay: 2.5 },
    { left: "80%", top: "50%", delay: 3.2 },
    { left: "40%", top: "82%", delay: 3.9 },
    { left: "66%", top: "84%", delay: 4.6 },
    { left: "8%", top: "76%", delay: 1.4 },
];
const SPARK_COLORS = ["#ffffff", "#6CACE4", "#9DC4E6", "#bfe1f2"]; // solo celeste/blanco
const SPARKS_PER_BURST = 14;
const CYCLE = 5.6; // segundos del ciclo (estallido + pausa)

function Fireworks() {
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
            {BURSTS.flatMap((b, bi) =>
                Array.from({ length: SPARKS_PER_BURST }).map((_, i) => {
                    const ang = (i / SPARKS_PER_BURST) * Math.PI * 2;
                    const dist = 95 + (i % 3) * 32;
                    const dx = Math.cos(ang) * dist;
                    const dy = Math.sin(ang) * dist;
                    const size = 5 + (i % 2) * 3;
                    const style = {
                        left: b.left,
                        top: b.top,
                        width: size,
                        height: size,
                        background: SPARK_COLORS[(bi + i) % SPARK_COLORS.length],
                        animationDelay: `${b.delay}s`,
                        animationDuration: `${CYCLE}s`,
                        "--dx": `${dx.toFixed(0)}px`,
                        "--dy": `${dy.toFixed(0)}px`,
                    } as React.CSSProperties;
                    return <span key={`${bi}-${i}`} className="mvy-spark" style={style} />;
                })
            )}
        </div>
    );
}

export default function ProximamentePage() {
    return (
        <main className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#e60012] text-white">
            <Fireworks />

            <style>{`
                @keyframes mvy-firework {
                    0%, 100% { opacity: 0; transform: translate(0, 0) scale(0.5); }
                    4% { opacity: 1; transform: translate(0, 0) scale(1); }
                    34% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(0.45); }
                }
                .mvy-spark {
                    position: absolute;
                    border-radius: 9999px;
                    animation-name: mvy-firework;
                    animation-timing-function: ease-out;
                    animation-iteration-count: infinite;
                    box-shadow: 0 0 6px rgba(255,255,255,0.5);
                }
                @media (prefers-reduced-motion: reduce) {
                    .mvy-spark { display: none; }
                }
            `}</style>

            {/* Zona central: ocupa todo el alto disponible. */}
            {/* Mobile = 1 columna centrada · Desktop (lg) = 2 columnas (split). */}
            <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-6 py-4 sm:gap-6 sm:py-6 lg:grid lg:grid-cols-2 lg:items-center lg:gap-12 lg:px-12">
                {/* Columna branding */}
                <div className="flex flex-col items-center gap-4 text-center lg:items-start lg:text-left">
                    <Image
                        src="/logo-moovy-white.svg"
                        alt="Moovy"
                        width={280}
                        height={90}
                        priority
                        className="h-12 w-auto drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:h-14 lg:h-20"
                    />

                    <div className="flex h-1 w-20 overflow-hidden rounded-full lg:w-28">
                        <div className="flex-1 bg-[#6CACE4]" />
                        <div className="flex-1 bg-white" />
                        <div className="flex-1 bg-[#6CACE4]" />
                    </div>

                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-5xl">
                        Está por llegar a Ushuaia
                    </h1>

                    <p className="max-w-md text-sm leading-relaxed text-white/85 sm:text-base lg:text-lg">
                        Estamos armando algo nuevo para la ciudad. Si tenés un comercio o
                        querés repartir, sumate ahora y sé de los primeros en ser parte.
                    </p>
                </div>

                {/* Columna formulario */}
                <div className="flex w-full justify-center lg:justify-end">
                    <PreLaunchForm />
                </div>
            </div>

            <footer className="relative z-10 shrink-0 pb-3 text-center text-xs text-white/60">
                © {new Date().getFullYear()} Moovy · Ushuaia, Tierra del Fuego
            </footer>
        </main>
    );
}
