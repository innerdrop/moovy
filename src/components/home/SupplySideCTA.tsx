import Link from "next/link";
import { ArrowRight } from "lucide-react";

const cards = [
    {
        title: "Registrá tu comercio",
        desc: "Sumá tu local y llegá a nuevos clientes con delivery propio",
        href: "/comercio/registro",
        emoji: "🏪",
    },
    {
        title: "Sé repartidor MOOVY",
        desc: "Generá ingresos con libertad, cuando vos quieras",
        href: "/repartidor/registro",
        emoji: "🚴",
    },
    {
        title: "Vendé tus cosas",
        desc: "Publicá gratis en el marketplace de Ushuaia",
        href: "/vendedor/registro",
        emoji: "🏷️",
    },
];

export default function SupplySideCTA() {
    return (
        <section className="py-8 px-4">
            <h2 className="text-xl font-extrabold text-gray-900 text-center mb-1">
                Crecemos juntos
            </h2>
            <p className="text-sm text-gray-500 text-center mb-5">
                Sumate al ecosistema MOOVY en Ushuaia
            </p>

            <div className="flex gap-3 overflow-x-auto scrollbar-hide md:grid md:grid-cols-3 md:gap-4 max-w-4xl mx-auto" style={{ scrollbarWidth: "none" }}>
                {cards.map((card) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="flex-shrink-0 w-[160px] md:w-auto bg-gray-900 rounded-2xl p-4 md:p-5 text-white group hover:bg-gray-800 transition-colors"
                    >
                        <div className="text-2xl mb-3">{card.emoji}</div>
                        <h4 className="text-sm font-bold mb-1">{card.title}</h4>
                        <p className="text-[11px] text-white/60 leading-relaxed mb-3">{card.desc}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-lg group-hover:bg-white/25 transition-colors">
                            Empezar
                            <ArrowRight className="w-3 h-3" />
                        </span>
                    </Link>
                ))}
            </div>
        </section>
    );
}
