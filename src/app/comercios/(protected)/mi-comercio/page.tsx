import Link from "next/link";
import { Store, Building2, Clock, Truck, FileText, ChevronRight, CreditCard } from "lucide-react";

// Hub de Mi Comercio — reorg del panel comercio.
// Rama: feat/bloquear-publicidad
//
// Reemplaza al viejo "Ajustes": un solo lugar para toda la configuración del
// comercio, presentado como tarjetas grandes. Cada una lleva a una sub-página que
// hace UNA sola cosa, así el comercio siempre sabe dónde está.

const CARDS = [
    {
        href: "/comercios/mi-comercio/perfil",
        icon: Building2,
        title: "Perfil",
        desc: "Portada, logo, descripción y redes sociales",
        color: "bg-blue-50 text-blue-600",
    },
    {
        href: "/comercios/mi-comercio/horarios",
        icon: Clock,
        title: "Horarios y estado",
        desc: "Días y horarios de atención · abrir o pausar la tienda",
        color: "bg-amber-50 text-amber-600",
    },
    {
        href: "/comercios/mi-comercio/entregas",
        icon: Truck,
        title: "Entregas y pedidos",
        desc: "Radio de entrega, pedido mínimo, retiro en local, tiempo de preparación",
        color: "bg-emerald-50 text-emerald-600",
    },
    {
        href: "/comercios/mi-comercio/mercadopago",
        icon: CreditCard,
        title: "MercadoPago",
        desc: "Vinculá tu cuenta de cobro y mirá tu comisión",
        color: "bg-sky-50 text-sky-600",
    },
    {
        href: "/comercios/mi-comercio/documentacion",
        icon: FileText,
        title: "Documentación",
        desc: "CUIT, CBU y habilitaciones para operar",
        color: "bg-violet-50 text-violet-600",
    },
];

export default function MiComercioHubPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Store className="w-6 h-6" style={{ color: "#e60012" }} />
                    Mi Comercio
                </h1>
                <p className="text-gray-500">Todo lo de tu comercio en un solo lugar. Elegí qué querés configurar.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CARDS.map((c) => (
                    <Link
                        key={c.href}
                        href={c.href}
                        className="group flex items-start gap-4 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-blue-100 transition"
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${c.color}`}>
                            <c.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                                <h2 className="font-bold text-gray-900">{c.title}</h2>
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5 leading-snug">{c.desc}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
