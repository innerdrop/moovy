import Link from "next/link";
import { ChevronRight, Store, Bike, Tag } from "lucide-react";

// feat/rediseno-home: "Crecemos juntos" como lista de filas (glyph + título + desc +
// chevron) + fila de medios de pago. NOTA: no se muestra "Efectivo" — el efectivo
// está apagado para el lanzamiento (electrónico-only), mostrarlo sería una promesa falsa.

const cards = [
    {
        title: "Registrá tu comercio",
        desc: "Cobrás al instante · las comisiones más bajas",
        href: "/comercio/registro",
        icon: Store,
        bg: "linear-gradient(135deg, #e60012, #cc000f)",
    },
    {
        title: "Sé repartidor MOOVY",
        desc: "Manejás tus tiempos, cobrás por cada viaje",
        href: "/repartidor/registro",
        icon: Bike,
        bg: "linear-gradient(135deg, #b5000e, #a3000c)",
    },
    {
        title: "Vendé tus cosas",
        desc: "Publicá gratis en el marketplace de Ushuaia",
        href: "/vendedor/registro",
        icon: Tag,
        bg: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
    },
];

export default function SupplySideCTA() {
    return (
        <section className="py-8 lg:py-10 px-4 md:px-6 lg:px-8">
            <div className="container mx-auto max-w-3xl lg:max-w-4xl">
                <h2 className="text-xl font-black text-gray-900 mb-3.5">Crecemos juntos</h2>

                <div className="flex flex-col gap-2.5">
                    {cards.map((c) => {
                        const Icon = c.icon;
                        return (
                            <Link
                                key={c.href}
                                href={c.href}
                                className="flex items-center gap-3.5 bg-white rounded-[18px] px-4 py-3.5 shadow-[0_3px_12px_rgba(30,10,5,0.06)] transition active:scale-[0.99] hover:shadow-md"
                            >
                                <div
                                    className="flex-shrink-0 w-11 h-11 rounded-[14px] flex items-center justify-center"
                                    style={{ background: c.bg }}
                                >
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-gray-900">{c.title}</h4>
                                    <p className="text-xs text-gray-400 font-semibold mt-0.5">{c.desc}</p>
                                </div>
                                <ChevronRight className="w-[18px] h-[18px] text-gray-300 flex-shrink-0" />
                            </Link>
                        );
                    })}
                </div>

                {/* Medios de pago — solo MercadoPago */}
                <div className="flex items-center justify-center gap-3 mt-5">
                    <span className="text-[11.5px] font-bold text-gray-400">Pagás seguro con</span>
                    <img src="/Mercado_Pago.svg.png" alt="MercadoPago" className="h-5 w-auto object-contain opacity-90" />
                </div>
            </div>
        </section>
    );
}
