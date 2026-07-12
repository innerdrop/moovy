"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";

// feat/rediseno-home: "Banda MOOVER" del diseño — franja oscura que invita a crear
// cuenta y sumar puntos. Se muestra SOLO a usuarios no logueados (el CTA es "Crear
// cuenta"); si ya tenés sesión, no aparece. Copy con la regla real: 10 pts / $1.000.

export default function MooverBand() {
    const { status } = useSession();
    if (status === "authenticated") return null;

    return (
        <section
            className="relative overflow-hidden px-5 py-8 lg:py-10"
            style={{ background: "linear-gradient(150deg, #2a0508 0%, #4a080e 60%, #6b0a12 100%)" }}
        >
            <div
                className="absolute -right-16 -top-16 w-56 h-56 rounded-full pointer-events-none"
                style={{ background: "rgba(230,0,18,0.25)", filter: "blur(60px)" }}
            />
            <div className="relative container mx-auto max-w-3xl lg:max-w-4xl">
                <div className="flex items-center gap-4 lg:gap-5">
                    <div
                        className="flex-shrink-0 w-[68px] h-[68px] rounded-[24px] flex items-center justify-center -rotate-6"
                        style={{
                            background: "linear-gradient(135deg, #e60012, #ff5a3c)",
                            boxShadow: "0 10px 24px rgba(230,0,18,0.45)",
                        }}
                    >
                        <Star className="w-8 h-8 text-white" fill="white" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10.5px] font-black uppercase tracking-[0.12em] text-white/55 mb-0.5">
                            Programa MOOVER
                        </p>
                        <h2 className="text-[19px] lg:text-2xl font-black text-white leading-tight mb-1">
                            Cada pedido suma puntos
                        </h2>
                        <p className="text-[12.5px] text-white/70 font-semibold">
                            10 pts por cada $1.000 · canjealos en tu próxima compra
                        </p>
                    </div>
                </div>
                <div className="flex gap-2.5 mt-4">
                    <Link
                        href="/empezar"
                        className="flex-1 text-center bg-white text-[13.5px] font-black py-3 rounded-full transition active:scale-[0.98]"
                        style={{ color: "#7a0810" }}
                    >
                        Crear mi cuenta gratis
                    </Link>
                    <Link
                        href="/puntos"
                        className="text-center text-white text-[13.5px] font-bold py-3 px-4 rounded-full border border-white/25 bg-white/10 transition active:scale-[0.98]"
                    >
                        Cómo funciona
                    </Link>
                </div>
            </div>
        </section>
    );
}
