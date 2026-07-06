/**
 * /nosotros — Página "Quiénes somos" rediseñada.
 * Rama: style/quienes-somos-rediseno
 *
 * Diseño de Sofía Vega via Claude Design. Filosofía visual:
 * "blanco que respira con un hilo de rojo en momentos clave".
 * El rojo aparece SOLO en: CTA primario, % de las stats, faro/luz
 * del hero, borde izquierdo del cierre de historia, dato de contacto,
 * línea 2px sobre el CTA final.
 *
 * Decisión técnica: server component + 2 islas client (StatsCounter,
 * MerchantFAQ) para mantener buen SEO + JSON-LD + metadata estática.
 */

import type { Metadata } from "next";
import Link from "next/link";
import {
    ArrowLeft,
    ArrowRight,
    Mail,
    Instagram,
    MessageCircle,
    Zap,
    Scale,
    MapPin,
} from "lucide-react";
import Footer from "@/components/layout/Footer";
import StatsCounter from "./_components/StatsCounter";
import MerchantFAQ from "./_components/MerchantFAQ";

export const metadata: Metadata = {
    title: "Quiénes Somos — MOOVY",
    description:
        "Nacimos en Ushuaia. Vivimos en Ushuaia. Hicimos MOOVY para Ushuaia. Pagos instantáneos, comisiones justas, soporte humano.",
    keywords: [
        "delivery ushuaia",
        "comercio local",
        "pago instantáneo",
        "plataforma de delivery",
    ],
    openGraph: {
        title: "Quiénes Somos — MOOVY",
        description:
            "Nacimos en Ushuaia. Vivimos en Ushuaia. Hicimos MOOVY para Ushuaia.",
        type: "website",
    },
};

const WA_NUMBER = "5492901553173";
const WA_BASE = `https://wa.me/${WA_NUMBER}`;
const WA_GENERIC = `${WA_BASE}?text=Hola%20Moovy!%20Me%20gustar%C3%ADa%20saber%20m%C3%A1s`;
const WA_MERCHANT = `${WA_BASE}?text=Hola%20Moovy!%20Tengo%20un%20comercio%20en%20Ushuaia`;

export default function QuienesSomosPage() {
    return (
        <div className="min-h-screen bg-white text-[#111827] antialiased">
            {/* JSON-LD Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Organization",
                        name: "MOOVY",
                        description:
                            "Plataforma de delivery con pagos instantáneos para comercios de Ushuaia",
                        url: "https://somosmoovy.com",
                        logo: "https://somosmoovy.com/logo-moovy.png",
                        sameAs: [
                            "https://instagram.com/somosmoovy",
                            "https://wa.me/5492901553173",
                        ],
                        contactPoint: {
                            "@type": "ContactPoint",
                            telephone: "+5492901553173",
                            contactType: "customer service",
                        },
                        areaServed: {
                            "@type": "City",
                            name: "Ushuaia",
                            areaServed: {
                                "@type": "AdministrativeArea",
                                name: "Tierra del Fuego",
                                areaServed: {
                                    "@type": "Country",
                                    name: "Argentina",
                                },
                            },
                        },
                    }),
                }}
            />

            {/* ═══ NAVBAR sticky ═══ */}
            <header className="sticky top-0 z-50 border-b border-[#f3f4f6] bg-white/80 backdrop-blur-md backdrop-saturate-[140%]">
                <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 py-3 md:px-8 md:py-4">
                    <Link
                        href="/"
                        aria-label="Volver al inicio"
                        className="-ml-2 inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-[15px] font-semibold text-[#111827] transition-colors duration-150 hover:text-[#e60012]"
                    >
                        <ArrowLeft className="h-[18px] w-[18px]" strokeWidth={2} />
                        <span>Nosotros</span>
                    </Link>
                    <Link href="/" aria-label="MOOVY — Inicio" className="block">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/logo-moovy.svg"
                            alt="MOOVY"
                            className="block h-[22px] w-auto md:h-[26px]"
                        />
                    </Link>
                </div>
            </header>

            <main>
                {/* ═══ 1. HERO ═══ */}
                <section className="px-5 pt-16 pb-14 md:px-8 md:pt-[120px] md:pb-[100px]">
                    <div className="mx-auto max-w-[1180px]">
                        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[60%_40%] lg:gap-12">
                            <div>
                                <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                                    Nuestra historia
                                </span>
                                <h1 className="mb-3 whitespace-nowrap text-[40px] font-bold leading-[1.05] tracking-[-0.02em] text-[#111827] max-[380px]:text-[36px] md:text-[56px]">
                                    Nacimos en Ushuaia.
                                </h1>
                                <p className="mb-7 text-xl font-medium leading-snug tracking-[-0.01em] text-[#6b7280] md:mb-8 md:text-2xl">
                                    Vivimos en Ushuaia. Hicimos Moovy para Ushuaia.
                                </p>
                                <p className="mb-9 max-w-[580px] text-[17px] leading-relaxed text-[#4b5563] md:text-[18px]">
                                    No somos una app que llegó de afuera. Somos gente de acá —
                                    conocemos cada comercio, cada repartidor, cada cliente de
                                    esta ciudad. Eso nos hace diferentes.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href="/tienda"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-[#e60012] px-6 py-3.5 text-[15px] font-semibold leading-none text-white shadow-[0_8px_16px_-2px_rgba(230,0,18,0.20)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_14px_24px_-4px_rgba(230,0,18,0.32)] md:px-7 md:text-base"
                                    >
                                        Pedir ahora
                                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                                    </Link>
                                    <Link
                                        href="/comercio/registro"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-6 py-3.5 text-[15px] font-semibold leading-none text-[#111827] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#d1d5db] hover:bg-gray-50 md:px-7 md:text-base"
                                    >
                                        Sumá tu comercio
                                    </Link>
                                </div>
                            </div>

                            {/* Ilustración de Sofía: montañas + faro de Ushuaia */}
                            <div className="-order-1 lg:order-none">
                                <UshuaiaIllustration />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ 2. NUESTRA HISTORIA ═══ */}
                <section className="bg-[#fafaf9] px-5 py-[72px] md:px-8 md:py-[120px]">
                    <div className="mx-auto max-w-[720px]">
                        <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                            Por qué existe Moovy
                        </span>
                        <p className="mb-6 text-xl font-medium leading-snug text-[#111827] md:text-[22px]">
                            Sabíamos que los comercios de nuestro barrio merecían algo mejor.
                            Comisiones justas, sin letra chica.
                        </p>
                        <p className="mb-6 text-base leading-relaxed text-[#4b5563] md:text-[17px]">
                            Sabíamos que retener la plata de un comercio por semanas no estaba
                            bien. Un negocio necesita su dinero hoy, no en un mes.
                        </p>
                        <p className="mb-6 text-base leading-relaxed text-[#4b5563] md:text-[17px]">
                            Sabíamos que los negocios chicos que llevan años en Ushuaia merecen
                            las mismas oportunidades de vender online que cualquier cadena
                            grande.
                        </p>
                        <p className="mb-6 text-base leading-relaxed text-[#4b5563] md:text-[17px]">
                            Entonces decidimos hacer algo diferente. Crear una plataforma que
                            no sea de afuera, sino que sea de acá. Que entienda lo que es una
                            ciudad de 80&nbsp;mil habitantes. Que sepa que cuando hace −5&nbsp;°C,
                            el repartidor que está en la calle se merece ganar bien. Que el
                            comercio que abre a las 6 de la mañana no puede esperar un mes para
                            acceder a su dinero.
                        </p>
                        <p className="mt-8 border-l-[3px] border-[#e60012] py-1 pl-5 text-[19px] font-semibold leading-snug text-[#111827] md:text-xl">
                            Por eso Moovy existe. No para revolucionar el mundo — para que
                            nuestro barrio funcione mejor.
                        </p>
                    </div>
                </section>

                {/* ═══ 3. STATS ═══ */}
                <section className="bg-white px-5 py-[72px] md:px-8 md:py-[100px]">
                    <div className="mx-auto max-w-[1180px]">
                        <div className="mb-12 text-center">
                            <span className="inline-block text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                                Números que importan
                            </span>
                        </div>
                        <StatsCounter />
                    </div>
                </section>

                {/* ═══ 4. DIFERENCIADORES ═══ */}
                <section className="bg-[#fafaf9] px-5 py-[72px] md:px-8 md:py-[120px]">
                    <div className="mx-auto max-w-[1180px]">
                        <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                            Qué nos hace diferentes
                        </span>
                        <h2 className="mb-10 text-[30px] font-bold leading-tight tracking-[-0.02em] text-[#111827] md:mb-14 md:text-4xl">
                            Cuatro razones, todas reales.
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
                            <DiffCard
                                icon={<Zap className="h-8 w-8" strokeWidth={1.5} />}
                                title="Pago instantáneo"
                                body="Cobrás al instante. Sin retenciones, sin esperas, sin intermediarios decidiendo cuándo te llega tu plata. Vos vendés, vos cobrás."
                            />
                            <DiffCard
                                icon={<Scale className="h-8 w-8" strokeWidth={1.5} />}
                                title="Comisiones justas"
                                body="10% para comercios (y el primer mes es gratis). 10% para marketplace. 80% del envío para repartidores. Números públicos, sin letra chica."
                            />
                            <DiffCard
                                icon={
                                    <MessageCircle className="h-8 w-8" strokeWidth={1.5} />
                                }
                                title="Soporte humano"
                                body="No somos un chatbot. Cuando nos contactás, hablás con personas de verdad que conocen tu negocio. WhatsApp, llamada, lo que necesites."
                            />
                            <DiffCard
                                icon={<MapPin className="h-8 w-8" strokeWidth={1.5} />}
                                title="100% local"
                                body="Conocemos cada cuadra de Ushuaia. El frío del invierno, el caos del verano, los comercios a los que les cuesta llegar a fin de mes. Por eso entendemos qué necesitás."
                            />
                        </div>
                    </div>
                </section>

                {/* ═══ 5. COMERCIOS (texto + FAQ accordion) ═══ */}
                <section className="bg-white px-5 py-[72px] md:px-8 md:py-[120px]">
                    <div className="mx-auto max-w-[1180px]">
                        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[60%_40%] lg:gap-14">
                            <div>
                                <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                                    Si tenés un comercio en Ushuaia
                                </span>
                                <h2 className="mb-5 text-[32px] font-bold leading-tight tracking-[-0.02em] text-[#111827] md:text-[40px]">
                                    Mereces cobrar al instante.
                                </h2>
                                <p className="mb-8 max-w-[540px] text-[17px] leading-relaxed text-[#4b5563]">
                                    No esperes una semana. No esperes dos. Cada venta que hacés
                                    es dinero tuyo desde ese momento. Con Moovy, así es.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href="/comercio/registro"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-[#e60012] px-6 py-3.5 text-[15px] font-semibold leading-none text-white shadow-[0_8px_16px_-2px_rgba(230,0,18,0.20)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_14px_24px_-4px_rgba(230,0,18,0.32)] md:px-7 md:text-base"
                                    >
                                        Sumá tu comercio
                                        <ArrowRight className="h-4 w-4" strokeWidth={2} />
                                    </Link>
                                    <a
                                        href={WA_MERCHANT}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-6 py-3.5 text-[15px] font-semibold leading-none text-[#111827] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#d1d5db] hover:bg-gray-50 md:px-7 md:text-base"
                                    >
                                        Hablá con nosotros
                                    </a>
                                </div>
                            </div>
                            <MerchantFAQ />
                        </div>
                    </div>
                </section>

                {/* ═══ 6. CONTACTO ═══ */}
                <section className="bg-[#fafaf9] px-5 py-[72px] md:px-8 md:py-[100px]">
                    <div className="mx-auto max-w-[1180px]">
                        <div className="text-center">
                            <span className="mb-5 inline-block text-xs font-semibold uppercase tracking-[0.1em] text-[#6b7280]">
                                Estamos acá para vos
                            </span>
                            <h2 className="mb-10 text-[30px] font-bold leading-tight tracking-[-0.02em] text-[#111827] md:mb-14 md:text-4xl">
                                Contactanos.
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                            <ContactCard
                                icon={
                                    <MessageCircle className="h-7 w-7" strokeWidth={1.5} />
                                }
                                title="WhatsApp"
                                desc="Respuestas rápidas"
                                value="+54 9 2901 553173"
                                href={WA_GENERIC}
                                external
                            />
                            <ContactCard
                                icon={<Mail className="h-7 w-7" strokeWidth={1.5} />}
                                title="Email"
                                desc="Para consultas detalladas"
                                value="somosmoovy@gmail.com"
                                href="mailto:somosmoovy@gmail.com?subject=Consulta%20desde%20Qui%C3%A9nes%20Somos"
                            />
                            <ContactCard
                                icon={<Instagram className="h-7 w-7" strokeWidth={1.5} />}
                                title="Instagram"
                                desc="Noticias y novedades"
                                value="@somosmoovy"
                                href="https://instagram.com/somosmoovy"
                                external
                            />
                        </div>
                    </div>
                </section>

                {/* ═══ 7. CTA FINAL — fondo crema cálido con hilo de rojo arriba ═══ */}
                {/* Decisión visual: el CTA final estaba en #111827 igual que el footer
                   y se sentía pesado (dos bloques oscuros seguidos). Lo movimos a un
                   crema cálido apenas perceptible (#faf7f3) — distinto del #fafaf9 de
                   la sección de contacto arriba para evitar que se fundan visualmente,
                   pero suficientemente neutro para no competir. El footer queda como
                   el único momento oscuro de la página. */}
                <section className="relative bg-[#faf7f3] px-5 py-20 text-center text-[#111827] md:py-[100px]">
                    <div
                        aria-hidden="true"
                        className="absolute left-0 right-0 top-0 h-[3px] bg-[#e60012]"
                    />
                    <div className="mx-auto max-w-[600px]">
                        <h2 className="mb-4 text-[32px] font-bold leading-tight tracking-[-0.02em] md:text-[40px]">
                            Vos podés ser el siguiente.
                        </h2>
                        <p className="mb-8 text-[17px] leading-relaxed text-[#6b7280] md:text-[18px]">
                            Si sos comprador, comercio o repartidor en Ushuaia, acá estamos.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link
                                href="/empezar"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-transparent bg-[#e60012] px-6 py-3.5 text-[15px] font-semibold leading-none text-white shadow-[0_8px_16px_-2px_rgba(230,0,18,0.20)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[0_14px_24px_-4px_rgba(230,0,18,0.32)] md:px-7 md:text-base"
                            >
                                Empezar
                                <ArrowRight className="h-4 w-4" strokeWidth={2} />
                            </Link>
                            <Link
                                href="/comercio/registro"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-6 py-3.5 text-[15px] font-semibold leading-none text-[#111827] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#d1d5db] hover:bg-gray-50 md:px-7 md:text-base"
                            >
                                Sumá tu comercio
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}

// ─── Subcomponentes locales (server components) ────────────────────────────

function DiffCard({
    icon,
    title,
    body,
}: {
    icon: React.ReactNode;
    title: string;
    body: string;
}) {
    return (
        <article className="rounded-2xl border border-[#f1f0ec] bg-white p-7 shadow-[0_1px_0_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_1px_0_rgba(0,0,0,0.02),0_18px_36px_rgba(0,0,0,0.08)] md:p-8">
            <div className="mb-5 text-[#111827]">{icon}</div>
            <h3 className="mb-2 text-[19px] font-bold leading-tight tracking-[-0.01em] text-[#111827] md:text-xl">
                {title}
            </h3>
            <p className="text-[15px] leading-relaxed text-[#6b7280]">{body}</p>
        </article>
    );
}

function ContactCard({
    icon,
    title,
    desc,
    value,
    href,
    external = false,
}: {
    icon: React.ReactNode;
    title: string;
    desc: string;
    value: string;
    href: string;
    external?: boolean;
}) {
    const externalProps = external
        ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
        : {};
    return (
        <a
            href={href}
            {...externalProps}
            className="group flex flex-col gap-2 rounded-2xl border border-[#e5e7eb] bg-white p-7 text-inherit no-underline transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.06)]"
        >
            <div className="mb-2 text-[#111827]">{icon}</div>
            <h3 className="text-[17px] font-semibold text-[#111827]">{title}</h3>
            <p className="mb-2 text-sm leading-snug text-[#6b7280]">{desc}</p>
            <span className="mt-auto inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.01em] text-[#e60012]">
                {value}
                <ArrowRight
                    className="h-4 w-4 transition-transform duration-200 ease-out group-hover:translate-x-[3px]"
                    strokeWidth={2}
                />
            </span>
        </a>
    );
}

// ─── Ilustración del hero: montañas de Ushuaia + faro Les Eclaireurs ───────
// Diseño de Sofía. SVG inline, trazos finos en gris, único acento rojo
// en la luz del faro (el "hilo de rojo" del que habla el design rationale).

function UshuaiaIllustration() {
    return (
        <svg
            viewBox="0 0 480 360"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            className="mx-auto block aspect-[4/3] h-auto w-full max-w-[460px]"
        >
            {/* horizonte */}
            <line x1="0" y1="280" x2="480" y2="280" stroke="#e5e7eb" strokeWidth="1" />

            {/* cordillera lejana */}
            <path
                d="M0 230 L 60 200 L 110 215 L 170 175 L 230 200 L 290 165 L 350 195 L 410 170 L 480 200 L 480 280 L 0 280 Z"
                stroke="#e5e7eb"
                strokeWidth="1.25"
                fill="none"
            />

            {/* picos principales */}
            <path
                d="M-10 250 L 40 215 L 80 235 L 140 165 L 200 220 L 260 130 L 340 200 L 410 145 L 470 210 L 490 250"
                stroke="#d1d5db"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="none"
            />

            {/* nieve sutil en cumbres */}
            <path d="M132 175 L 140 165 L 148 175" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M252 140 L 260 130 L 268 140" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M402 155 L 410 145 L 418 155" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" fill="none" />

            {/* líneas del agua */}
            <line x1="40" y1="296" x2="120" y2="296" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="160" y1="296" x2="240" y2="296" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="280" y1="296" x2="360" y2="296" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="60" y1="312" x2="180" y2="312" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="220" y1="312" x2="300" y2="312" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="340" y1="312" x2="440" y2="312" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="100" y1="328" x2="220" y2="328" stroke="#e5e7eb" strokeWidth="1" />
            <line x1="260" y1="328" x2="380" y2="328" stroke="#e5e7eb" strokeWidth="1" />

            {/* islote del faro */}
            <path d="M340 280 L 420 280" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <path d="M348 280 L 358 272 L 402 272 L 412 280" stroke="#d1d5db" strokeWidth="1.5" strokeLinejoin="round" fill="none" />

            {/* torre del faro */}
            <path d="M372 272 L 372 215 L 388 215 L 388 272" stroke="#d1d5db" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <line x1="372" y1="240" x2="388" y2="240" stroke="#d1d5db" strokeWidth="1.25" />
            <line x1="372" y1="225" x2="388" y2="225" stroke="#d1d5db" strokeWidth="1.25" />

            {/* plataforma superior */}
            <path d="M368 215 L 392 215" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M374 215 L 374 200 L 386 200 L 386 215" stroke="#d1d5db" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            {/* techo */}
            <path d="M370 200 L 380 188 L 390 200" stroke="#d1d5db" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
            <line x1="380" y1="188" x2="380" y2="180" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />

            {/* EL ACENTO ROJO: luz del faro */}
            <circle cx="380" cy="207" r="3" fill="#e60012" />
            <path d="M376 207 L 360 199" stroke="#e60012" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
            <path d="M376 207 L 358 207" stroke="#e60012" strokeWidth="1.5" strokeLinecap="round" opacity="0.55" />
            <path d="M376 207 L 360 215" stroke="#e60012" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />

            {/* barco distante */}
            <path d="M120 282 L 132 282 L 130 286 L 122 286 Z" stroke="#d1d5db" strokeWidth="1.25" fill="none" />
            <line x1="126" y1="282" x2="126" y2="276" stroke="#d1d5db" strokeWidth="1.25" />
        </svg>
    );
}
