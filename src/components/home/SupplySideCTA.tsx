import Link from "next/link";
import { ArrowRight, Store, Bike, Tag } from "lucide-react";

const cards = [
    {
        title: "Registrá tu comercio",
        desc: "Sumá tu local y llegá a nuevos clientes con delivery propio",
        href: "/comercio/registro",
        icon: Store,
        gradient: "from-[#e60012] to-[#cc000f]",
        iconBg: "bg-white/20",
        glow: "shadow-red-500/30",
    },
    {
        title: "Sé repartidor MOOVY",
        desc: "Generá ingresos con libertad, cuando vos quieras",
        href: "/repartidor/registro",
        icon: Bike,
        gradient: "from-[#b5000e] to-[#a3000c]",
        iconBg: "bg-white/20",
        glow: "shadow-red-600/30",
    },
    {
        title: "Vendé tus cosas",
        desc: "Publicá gratis en el marketplace de Ushuaia",
        href: "/vendedor/registro",
        icon: Tag,
        gradient: "from-[#8B5CF6] to-[#6D28D9]",
        iconBg: "bg-white/20",
        glow: "shadow-violet-400/30",
    },
];

export default function SupplySideCTA() {
    return (
        <section className="py-8 lg:py-12 xl:py-14 px-4 md:px-6 lg:px-8">
            <h2 className="text-xl lg:text-2xl xl:text-3xl font-extrabold text-gray-900 text-center mb-1">
                Crecemos juntos
            </h2>
            <p className="text-sm lg:text-base text-gray-500 text-center mb-5 lg:mb-8">
                Sumate al ecosistema MOOVY en Ushuaia
            </p>

            <div
                className="flex gap-3 overflow-x-auto scrollbar-hide md:grid md:grid-cols-3 md:gap-4 lg:max-w-6xl mx-auto"
                style={{ scrollbarWidth: "none" }}
            >
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className={`
                                flex-shrink-0 w-[170px] md:w-auto rounded-2xl p-4 md:p-5 text-white
                                bg-gradient-to-br ${card.gradient}
                                shadow-lg ${card.glow}
                                transition-all duration-300 ease-out
                                hover:scale-[1.03] hover:shadow-xl hover:shadow-red-500/25
                                active:scale-[0.97]
                                group relative overflow-hidden
                            `}
                        >
                            {/* Decorative glow circle */}
                            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors duration-500" />
                            <div className="absolute -bottom-8 -left-8 w-20 h-20 rounded-full bg-white/5 group-hover:bg-white/10 transition-colors duration-500" />

                            <div className="relative z-10">
                                <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <h4 className="text-sm font-bold mb-1">{card.title}</h4>
                                <p className="text-[11px] text-white/70 leading-relaxed mb-3">{card.desc}</p>
                                <span className="inline-flex items-center gap-1 text-xs font-bold bg-white/15 border border-white/20 text-white px-3 py-1.5 rounded-lg group-hover:bg-white/25 transition-colors duration-300">
                                    Empezar
                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform duration-300" />
                                </span>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
