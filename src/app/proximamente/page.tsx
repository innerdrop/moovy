// Página "Próximamente" — cortina pública del candado de lanzamiento.
// Rama: fix/landing-fija-responsive-desktop
// Rama: fix/cortina-identidad-ushuaia — copy con identidad local ("Hecha en Ushuaia, para Ushuaia")
// Pantalla adaptativa (min-h 100dvh) + responsive:
//   · Si el contenido entra, ocupa exactamente una pantalla y NO hay scroll.
//   · Si la pantalla es muy chica, el contenido crece y SÍ se puede scrollear
//     (el formulario nunca queda oculto/inaccesible).
//   · Mobile: una columna centrada y compacta.
//   · Desktop (lg+): dos columnas (branding a la izquierda, formulario a la derecha).
// Fondo rojo Moovy PLANO + logo oficial intacto + fuegos artificiales hiperrealistas
// en canvas (celeste/blanco, física real — ver ./Fireworks.tsx). Sin marcas oficiales.

import type { Metadata } from "next";
import Image from "next/image";
import Fireworks from "./Fireworks";
import PreLaunchForm from "./PreLaunchForm";

const OG_TITLE = "Moovy — Hecha en Ushuaia, para Ushuaia";
const OG_DESC = "Nace en el fin del mundo. Sumá tu comercio o anotate para repartir y sé de los primeros en ser parte.";

export const metadata: Metadata = {
    metadataBase: new URL("https://somosmoovy.com"),
    title: "Moovy — Próximamente",
    description: "Moovy: hecha en Ushuaia, para Ushuaia. Sumá tu comercio o anotate para repartir.",
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
                // chore/og-card-hecha-en-ushuaia: ?v=2 fuerza a WhatsApp/Facebook a
                // re-scrapear la imagen nueva (cachean la tarjeta por URL, a veces días).
                url: "/og-moovy.png?v=2",
                width: 1200,
                height: 630,
                alt: "Moovy — Hecha en Ushuaia, para Ushuaia",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: OG_TITLE,
        description: OG_DESC,
        images: ["/og-moovy.png?v=2"],
    },
};

export default function ProximamentePage() {
    return (
        <main className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#e60012] text-white">
            {/* Foto de Ushuaia de fondo con velo rojo Moovy (duotono): se reconoce el
                paisaje pero la identidad sigue siendo roja y el texto legible.
                Foto: Unsplash (licencia libre para uso comercial, sin atribución
                obligatoria). Si el archivo falta, queda el fondo rojo plano. */}
            <div className="absolute inset-0" aria-hidden="true">
                <Image
                    src="/ushuaia-bg.jpg"
                    alt=""
                    fill
                    priority
                    sizes="100vw"
                    className="object-cover"
                />
                {/* Duotono: multiply tiñe la foto de rojo conservando el detalle. */}
                <div className="absolute inset-0 bg-[#e60012] mix-blend-multiply" />
                {/* Velo extra para unificar y garantizar contraste AA del texto. */}
                <div className="absolute inset-0 bg-[#e60012]/45" />
            </div>

            {/* Fuegos artificiales en canvas con física real (ver ./Fireworks.tsx). */}
            <Fireworks />

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
                        Hecha en Ushuaia, para Ushuaia
                    </h1>

                    <p className="max-w-md text-sm leading-relaxed text-white/85 sm:text-base lg:text-lg">
                        Moovy nace acá, en el fin del mundo, pensada para cómo vivimos,
                        compramos y nos movemos en la ciudad. Si tenés un comercio o
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
