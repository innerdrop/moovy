// Página "Próximamente" — cortina pública del candado de lanzamiento.
// Rama: feat/candado-lanzamiento-preview
//
// El middleware (proxy.ts) hace rewrite a esta página cuando el sitio está
// cerrado (LAUNCH_GATE != "open") y el visitante no tiene la cookie de preview.
// No tiene navegación ni links al resto del sitio: es una cortina, no una página
// más. Estática (sin datos), para que cargue instantánea.

import type { Metadata } from "next";
import Image from "next/image";
import PreLaunchForm from "./PreLaunchForm";

export const metadata: Metadata = {
    title: "Moovy — Próximamente",
    description: "Moovy llega pronto a Ushuaia. Sumá tu comercio o anotate para repartir.",
    robots: { index: false, follow: false },
};

export default function ProximamentePage() {
    return (
        <main className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-b from-[#1a1a1a] via-[#2a0a0c] to-black text-white px-6 py-16 text-center">
            <div className="max-w-md flex flex-col items-center gap-5">
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
                    Moovy está por llegar a Ushuaia 🚀
                </h1>

                <p className="text-base text-white/70 leading-relaxed">
                    Estamos armando algo nuevo para la ciudad. Si tenés un comercio o
                    querés repartir, sumate ahora y sé de los primeros en ser parte.
                </p>

                <PreLaunchForm />
            </div>

            <footer className="mt-12 text-xs text-white/30">
                © {new Date().getFullYear()} Moovy · Ushuaia, Tierra del Fuego
            </footer>
        </main>
    );
}
