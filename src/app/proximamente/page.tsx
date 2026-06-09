// Página "Próximamente" — cortina pública del candado de lanzamiento.
// Rama: feat/candado-lanzamiento-preview
//
// El middleware (proxy.ts) hace rewrite a esta página cuando el sitio está
// cerrado (LAUNCH_GATE != "open") y el visitante no tiene la cookie de preview.
// No tiene navegación ni links al resto del sitio: es una cortina, no una página
// más. Estática (sin datos), para que cargue instantánea.

import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
    title: "Moovy — Próximamente",
    description: "Estamos por abrir. Moovy llega pronto a Ushuaia.",
    robots: { index: false, follow: false },
};

export default function ProximamentePage() {
    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a1a] via-[#2a0a0c] to-black text-white px-6 text-center">
            <div className="max-w-md flex flex-col items-center gap-6">
                <Image
                    src="/logo-moovy-white.svg"
                    alt="Moovy"
                    width={280}
                    height={90}
                    priority
                    className="h-12 w-auto"
                />

                <div className="h-1 w-16 rounded-full bg-[#e60012]" />

                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    Estamos por abrir
                </h1>

                <p className="text-base text-white/70 leading-relaxed">
                    Moovy llega pronto a Ushuaia. Estamos dando los últimos retoques
                    para que tu primera experiencia sea perfecta.
                </p>

                <p className="text-sm text-white/40 mt-2">
                    Muy pronto, cada compra y cada entrega. Cada vez.
                </p>
            </div>

            <footer className="absolute bottom-6 text-xs text-white/30">
                © {new Date().getFullYear()} Moovy · Ushuaia, Tierra del Fuego
            </footer>
        </main>
    );
}
