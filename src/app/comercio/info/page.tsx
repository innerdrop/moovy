import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
    Store,
    CreditCard,
    TrendingUp,
    Shield,
    Clock,
    Users,
    ArrowRight,
    CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
    title: "Sumá tu comercio a MOOVY | Delivery en Ushuaia",
    description:
        "Vendé más con MOOVY. Comisiones desde el 8%, cobrás al instante y llegás a miles de clientes en Ushuaia. Registrate gratis.",
    openGraph: {
        title: "Sumá tu comercio a MOOVY",
        description:
            "Comisiones desde el 8%, cobro instantáneo y soporte local. Registrate gratis.",
    },
};

const benefits = [
    {
        icon: CreditCard,
        title: "Cobrás al instante",
        description:
            "Cada venta se acredita en tu cuenta de inmediato. Sin retenciones, sin esperas.",
    },
    {
        icon: TrendingUp,
        title: "Comisiones desde el 8%",
        description:
            "Las más bajas del mercado. Primer mes gratis para que pruebes sin riesgo.",
    },
    {
        icon: Users,
        title: "Llegás a más clientes",
        description:
            "Miles de personas en Ushuaia van a poder encontrar y pedir de tu comercio desde el celular.",
    },
    {
        icon: Clock,
        title: "Control total de tu negocio",
        description:
            "Configurás tus horarios, tu menú, tus precios. Pausás cuando quieras, sin penalización.",
    },
    {
        icon: Shield,
        title: "Soporte local y humano",
        description:
            "No sos un número. Te acompañamos en cada paso desde Ushuaia. Respuesta en minutos.",
    },
    {
        icon: Store,
        title: "Tu propia vitrina digital",
        description:
            "Perfil con tu marca, fotos, horarios, calificaciones. Todo lo que tus clientes necesitan saber.",
    },
];

const steps = [
    { number: "1", text: "Completás el formulario con los datos de tu negocio" },
    { number: "2", text: "Nuestro equipo revisa y aprueba tu solicitud" },
    { number: "3", text: "Cargás tus productos y empezás a vender" },
];

export default function ComercioInfoPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Hero */}
            <section className="relative bg-gradient-to-br from-[#e60012] to-[#b8000e] text-white overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
                    <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl" />
                </div>
                <div className="relative max-w-4xl mx-auto px-6 py-16 sm:py-24 text-center">
                    <Link href="/" className="inline-block mb-8">
                        <Image
                            src="/logo-moovy-white.svg"
                            alt="MOOVY"
                            width={140}
                            height={40}
                            className="mx-auto"
                            priority
                        />
                    </Link>
                    <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-6">
                        Vendé más con MOOVY
                    </h1>
                    <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Sumá tu comercio a la plataforma de delivery de Ushuaia.
                        Cobrás al instante, controlás todo desde tu celular y
                        llegás a clientes que hoy no te conocen.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/comercio/registro"
                            className="inline-flex items-center justify-center gap-2 bg-white text-[#e60012] font-bold px-8 py-4 rounded-xl text-lg hover:bg-gray-50 transition shadow-lg shadow-black/10"
                        >
                            Registrar mi comercio
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link
                            href="/comisiones"
                            className="inline-flex items-center justify-center gap-2 border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition"
                        >
                            Ver comisiones
                        </Link>
                    </div>
                </div>
            </section>

            {/* Benefits */}
            <section className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-4">
                    Por qué elegir MOOVY
                </h2>
                <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
                    Diseñado para los comercios de Ushuaia. Simple, transparente y justo.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {benefits.map((b) => (
                        <div
                            key={b.title}
                            className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="w-12 h-12 bg-[#e60012]/10 rounded-xl flex items-center justify-center mb-4">
                                <b.icon className="w-6 h-6 text-[#e60012]" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">{b.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{b.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How it works */}
            <section className="bg-gray-50 py-16 sm:py-24">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-12">
                        Cómo funciona
                    </h2>
                    <div className="space-y-8">
                        {steps.map((s) => (
                            <div key={s.number} className="flex items-start gap-5 text-left">
                                <div className="w-10 h-10 bg-[#e60012] text-white rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0">
                                    {s.number}
                                </div>
                                <p className="text-gray-700 text-lg pt-1.5">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* First month free */}
            <section className="max-w-3xl mx-auto px-6 py-16 sm:py-24 text-center">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-3xl p-8 sm:p-12">
                    <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Tu primer mes es gratis
                    </h2>
                    <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                        Comisión 0% durante los primeros 30 días. Probá MOOVY sin costo
                        y decidí si es para vos.
                    </p>
                    <Link
                        href="/comercio/registro"
                        className="inline-flex items-center gap-2 bg-[#e60012] text-white font-bold px-8 py-4 rounded-xl text-lg hover:bg-[#cc000f] transition shadow-lg shadow-red-200"
                    >
                        Empezar ahora
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* FAQ */}
            <section className="bg-gray-50 py-16 sm:py-24">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-12">
                        Preguntas frecuentes
                    </h2>
                    <div className="space-y-6">
                        {[
                            {
                                q: "¿Cuánto cuesta registrarse?",
                                a: "Nada. El registro es gratuito y el primer mes tenés comisión 0%.",
                            },
                            {
                                q: "¿Cuánto tardan en aprobar mi solicitud?",
                                a: "Normalmente dentro de las 24 horas hábiles. Te avisamos por email.",
                            },
                            {
                                q: "¿Qué documentación necesito?",
                                a: "CUIT, constancia de inscripción en AFIP y habilitación municipal. Si vendés alimentos, también el registro sanitario.",
                            },
                            {
                                q: "¿Puedo pausar mi comercio cuando quiera?",
                                a: "Sí, desde tu panel podés pausar y reanudar tu comercio en cualquier momento. Sin penalización.",
                            },
                        ].map((faq) => (
                            <div
                                key={faq.q}
                                className="bg-white rounded-2xl p-6 border border-gray-100"
                            >
                                <h3 className="font-bold text-gray-900 mb-2">{faq.q}</h3>
                                <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer CTA */}
            <section className="text-center py-12 px-6">
                <p className="text-gray-500 text-sm">
                    ¿Tenés dudas?{" "}
                    <Link href="/soporte" className="text-[#e60012] font-medium hover:underline">
                        Contactanos
                    </Link>
                </p>
            </section>
        </div>
    );
}
