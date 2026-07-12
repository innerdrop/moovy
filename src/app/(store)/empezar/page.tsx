"use client";

// feat/registro-rediseno-core (2026-04-27): Hub central de registro.
//
// Antes había 3 URLs distintas para registrarse (/comercio/registro,
// /repartidor/registro, /vendedor/registro) sin un punto de entrada visible
// al usuario. Esta página unifica la selección con cards que linkean a los
// forms simplificados existentes. NO duplica los forms — solo dirige.
//
// Rediseño 2026-07: vive DENTRO del grupo (store) para heredar el header + bottom
// nav de la app (antes se sentía un sitio web aparte). Hero rojo de marca (sin
// logo, ya lo pone el header), card de comprar como protagonista + grupo
// "sumate a MOOVY" con las tres cuentas de negocio. Branding Moovy, Nunito.
//
// Si el usuario llega con ?type=X y X es válido, se redirige automáticamente
// al form correspondiente (útil para deep links).

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShoppingCart, Store, Truck, Package, ArrowRight, Loader2 } from "lucide-react";

// El comprador es la ruta principal → se muestra como card protagonista.
const BUYER = {
    type: "buyer",
    title: "Comprar en MOOVY",
    description: "Pedí a los comercios de Ushuaia y comprá en el marketplace. Sumás puntos en cada pedido.",
    href: "/registro",
} as const;

// Cuentas de negocio → grupo secundario "sumate a MOOVY".
const BUSINESS_TYPES = [
    {
        type: "merchant",
        title: "Tengo un comercio",
        description: "Sumá tu local y vendé a todo Ushuaia. Cobrás al instante y el primer mes es sin comisión.",
        icon: Store,
        href: "/comercio/registro",
        iconBg: "bg-blue-600",
        accent: "text-blue-600",
    },
    {
        type: "driver",
        title: "Ser repartidor",
        description: "Hacé entregas cuando quieras y cobrá al instante por cada viaje.",
        icon: Truck,
        href: "/repartidor/registro",
        iconBg: "bg-emerald-600",
        accent: "text-emerald-600",
    },
    {
        type: "seller",
        title: "Vender en marketplace",
        description: "Publicá lo que ya no usás y llegá a compradores de todo Ushuaia.",
        icon: Package,
        href: "/vendedor/registro",
        iconBg: "bg-violet-600",
        accent: "text-violet-600",
    },
] as const;

const ALL_TYPES: string[] = [BUYER.type, ...BUSINESS_TYPES.map((t) => t.type)];
const HREF_BY_TYPE: Record<string, string> = {
    [BUYER.type]: BUYER.href,
    ...Object.fromEntries(BUSINESS_TYPES.map((t) => [t.type, t.href])),
};

function EmpezarHubInner() {
    const router = useRouter();
    const params = useSearchParams();
    const typeParam = params.get("type");

    useEffect(() => {
        if (!typeParam) return;
        const href = HREF_BY_TYPE[typeParam];
        if (href) router.replace(href);
    }, [typeParam, router]);

    if (typeParam && ALL_TYPES.includes(typeParam)) {
        return null;
    }

    return (
        <div className="bg-gray-50 min-h-full">
            {/* Hero rojo de marca — el logo ya lo pone el header de la app */}
            <div className="relative overflow-hidden rounded-b-[32px] bg-gradient-to-br from-[#e60012] to-[#ff3547] px-6 pt-8 pb-12 text-center shadow-md shadow-red-500/10">
                <div className="pointer-events-none absolute -right-12 -top-14 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
                <div className="relative mx-auto max-w-3xl">
                    <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">
                        ¿Cómo querés usar MOOVY?
                    </h1>
                    <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                        Elegí cómo arrancás. El registro toma menos de 1 minuto — el resto lo
                        completás después desde tu panel.
                    </p>
                </div>
            </div>

            {/* Contenido */}
            <div className="mx-auto w-full max-w-3xl px-5 pt-7 pb-4">
                {/* Card protagonista — comprar. Blanca con borde + sombra rojos y
                    acentos rojos (ícono + botón): el rojo como detalle, no otro
                    bloque macizo debajo del hero. */}
                <Link
                    href={BUYER.href}
                    className="group relative block overflow-hidden rounded-3xl border-2 border-[#e60012]/20 bg-gradient-to-br from-red-50/60 to-white p-6 shadow-lg shadow-red-500/10 transition active:scale-[0.99] hover:border-[#e60012]/35 hover:shadow-xl"
                >
                    <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[#e60012]/[0.06] blur-2xl" />
                    <div className="relative flex items-start gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#e60012] to-[#ff3547] shadow-md shadow-red-500/30">
                            <ShoppingCart className="h-7 w-7 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xl font-black text-gray-900">{BUYER.title}</h3>
                            <p className="mt-1 text-sm leading-relaxed text-gray-500">{BUYER.description}</p>
                            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#e60012] px-5 py-2.5 text-sm font-black text-white shadow-md shadow-red-500/25 transition-all group-hover:gap-2.5">
                                Crear mi cuenta
                                <ArrowRight className="h-4 w-4" />
                            </span>
                        </div>
                    </div>
                </Link>

                {/* Grupo — sumarse a MOOVY */}
                <p className="mb-3 ml-1 mt-8 text-xs font-black uppercase tracking-[0.2em] text-gray-400">
                    ¿Tenés un negocio? Sumate a MOOVY
                </p>
                <div className="grid gap-4 sm:grid-cols-3">
                    {BUSINESS_TYPES.map((t) => {
                        const Icon = t.icon;
                        return (
                            <Link
                                key={t.type}
                                href={t.href}
                                className="group relative flex flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${t.iconBg} shadow-sm transition-transform group-hover:scale-110`}>
                                    <Icon className="h-6 w-6 text-white" />
                                </div>
                                <h3 className="text-base font-black text-gray-900">{t.title}</h3>
                                <p className="mt-1 flex-1 text-xs leading-snug text-gray-500">{t.description}</p>
                                <span className={`mt-3 inline-flex items-center gap-1 text-sm font-black ${t.accent} transition-all group-hover:gap-2`}>
                                    Empezar
                                    <ArrowRight className="h-4 w-4" />
                                </span>
                            </Link>
                        );
                    })}
                </div>

                {/* Login */}
                <p className="mt-9 text-center text-sm text-gray-500">
                    ¿Ya tenés cuenta?{" "}
                    <Link href="/login" className="font-black text-[#e60012] hover:underline">
                        Iniciá sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}

// Wrapper requerido por Next.js: useSearchParams() necesita Suspense para que el
// build estático no falle con "missing-suspense-with-csr-bailout".
export default function EmpezarHubPage() {
    return (
        <Suspense
            fallback={
                <div className="flex min-h-[60vh] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#e60012]" />
                </div>
            }
        >
            <EmpezarHubInner />
        </Suspense>
    );
}
