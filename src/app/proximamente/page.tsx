// Página "Próximamente" — cortina pública del candado de lanzamiento.
// Rama: feat/rediseno-registro-comercio-repartidor
//
// La cortina dejó de ser un teaser con un solo formulario y pasó a ser un HUB
// "elegí tu mundo" (ver ./LaunchHub.tsx): frase de marca de Ushuaia + tres caminos
// con personalidad propia (comercio / repartidor / moover). Se sacaron los fuegos
// artificiales y las franjas celeste/blanco del Mundial (terminado). El metadata/OG
// se conserva intacto. El render vive en el client component; esta página server
// solo aporta el <head> y monta el hub.

import type { Metadata } from "next";
import LaunchHub from "./LaunchHub";

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
    return <LaunchHub />;
}
