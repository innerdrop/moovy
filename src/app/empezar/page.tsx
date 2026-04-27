"use client";

// feat/registro-rediseno-core (2026-04-27): Hub central de registro.
//
// Antes había 3 URLs distintas para registrarse (/comercio/registro,
// /repartidor/registro, /vendedor/registro) sin un punto de entrada visible
// al usuario. Esta página unifica la selección con 4 cards que linkean a los
// forms simplificados existentes. NO duplica los forms — solo dirige.
//
// Si el usuario llega con ?type=X y X es válido, se redirige automáticamente
// al form correspondiente (útil para deep links).

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Store, Truck, Package, ArrowRight } from "lucide-react";

const ACCOUNT_TYPES = [
    {
        type: "buyer",
        title: "Comprar en MOOVY",
        description: "Pedidos a comercios de Ushuaia + marketplace de cosas usadas",
        icon: ShoppingCart,
        href: "/registro",
        color: "from-rose-50 to-red-50",
        iconBg: "bg-red-500",
        accent: "text-red-600",
    },
    {
        type: "merchant",
        title: "Tengo un comercio",
        description: "Vendé tus productos a través de MOOVY",
        icon: Store,
        href: "/comercio/registro",
        color: "from-blue-50 to-indigo-50",
        iconBg: "bg-blue-600",
        accent: "text-blue-600",
    },
    {
        type: "driver",
        title: "Ser repartidor",
        description: "Hacé entregas y cobrá al instante",
        icon: Truck,
        href: "/repartidor/registro",
        color: "from-green-50 to-emerald-50",
        iconBg: "bg-emerald-600",
        accent: "text-emerald-600",
    },
    {
        type: "seller",
        title: "Vender en marketplace",
        description: "Publicá lo que ya no usás. 0 comisión los primeros 30 días.",
        icon: Package,
        href: "/vendedor/registro",
        color: "from-violet-50 to-purple-50",
        iconBg: "bg-violet-600",
        accent: "text-violet-600",
    },
] as const;

export default function RegistroHubPage() {
    const router = useRouter();
    const params = useSearchParams();
    const typeParam = params.get("type");

    useEffect(() => {
        if (!typeParam) return;
        const match = ACCOUNT_TYPES.find((t) => t.type === typeParam);
        if (match) router.replace(match.href);
    }, [typeParam, router]);

    if (typeParam && ACCOUNT_TYPES.some((t) => t.type === typeParam)) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-start p-6 pt-12">
            <Link href="/" className="mb-6">
                <Image
                    src="/logo-moovy.svg"
                    alt="MOOVY"
                    width={140}
                    height={45}
                    priority
                    style={{ height: "auto" }}
                />
            </Link>

            <div className="max-w-3xl w-full text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                    ¿Cómo querés usar MOOVY?
                </h1>
                <p className="text-sm text-gray-600 leading-relaxed">
                    Elegí cómo arrancás. El registro toma menos de 1 minuto. Después en el
                    panel completás el resto.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl w-full">
                {ACCOUNT_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                        <Link
                            key={t.type}
                            href={t.href}
                            className={`group relative bg-gradient-to-br ${t.color} rounded-2xl p-6 border-2 border-white shadow-sm hover:shadow-md hover:border-gray-200 transition-all`}
                        >
                            <div className={`w-14 h-14 rounded-2xl ${t.iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                <Icon className="w-7 h-7 text-white" />
                            </div>
                            <h3 className={`font-bold text-lg ${t.accent} mb-1`}>{t.title}</h3>
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                {t.description}
                            </p>
                            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${t.accent} group-hover:gap-2 transition-all`}>
                                Empezar
                                <ArrowRight className="w-4 h-4" />
                            </span>
                        </Link>
                    );
                })}
            </div>

            <p className="mt-8 text-center text-sm text-gray-500">
                ¿Ya tenés cuenta?{" "}
                <Link href="/login" className="text-red-600 font-medium hover:underline">
                    Iniciá sesión
                </Link>
            </p>
        </div>
    );
}
