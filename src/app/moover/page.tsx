"use client";

import Link from "next/link";
import { ArrowLeft, Star, Gift, Users, Award, TrendingUp, Percent, Crown, Zap, ChevronRight, CheckCircle2, ArrowRight } from "lucide-react";

// Level data
const LEVELS = [
    { name: "Bronce", min: 0, max: 499, color: "#CD7F32", benefits: ["1 punto por cada $1 gastado", "Acceso al catálogo completo"] },
    { name: "Plata", min: 500, max: 1499, color: "#C0C0C0", benefits: ["Todo lo de Bronce", "Envío gratis en pedidos +$5000", "Acceso anticipado a ofertas"] },
    { name: "Oro", min: 1500, max: 4999, color: "#FFD700", benefits: ["Todo lo de Plata", "2x puntos en días especiales", "Soporte prioritario"] },
    { name: "Platino", min: 5000, max: 9999, color: "#E5E4E2", benefits: ["Todo lo de Oro", "Descuentos exclusivos", "Regalos de cumpleaños"] },
    { name: "Diamante", min: 10000, max: Infinity, color: "#B9F2FF", benefits: ["Todos los beneficios", "Acceso VIP a eventos", "Gestor de cuenta personal"] },
];

export default function MooverPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-orange-50 font-sans">

            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#e60012] transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5" /> Volver
                    </Link>
                    <Link href="/" className="text-2xl font-bold text-[#e60012]" style={{ fontFamily: "'Junegull', sans-serif" }}>
                        MOOVY
                    </Link>
                    <div className="w-20" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 md:py-24 text-center relative overflow-hidden">
                <div className="absolute top-10 left-10 w-64 h-64 bg-amber-200/30 rounded-full blur-3xl" />
                <div className="absolute bottom-10 right-10 w-64 h-64 bg-orange-200/30 rounded-full blur-3xl" />

                <div className="container mx-auto px-4 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 px-5 py-2 rounded-full text-sm font-bold mb-6 border border-amber-200">
                        <Star className="w-4 h-4" /> Programa de Fidelidad
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500">MOOVER</span>
                    </h1>

                    <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        El programa de recompensas de MOOVY. Acumulá puntos, subí de nivel y disfrutá de beneficios exclusivos con cada compra.
                    </p>

                    <Link href="/registro" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:-translate-y-1 transition-all">
                        Unirme Gratis <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                        ¿Cómo <span className="text-amber-500">funciona</span>?
                    </h2>
                    <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
                        Es muy simple. Usá MOOVY, acumulá puntos y canjeá beneficios.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center border border-amber-100">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-amber-500 font-black text-xl">1</div>
                            <h3 className="font-bold text-gray-900 mb-2">Registrate</h3>
                            <p className="text-sm text-gray-500">Creá tu cuenta gratis en MOOVY.</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center border border-amber-100">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-orange-500 font-black text-xl">2</div>
                            <h3 className="font-bold text-gray-900 mb-2">Comprá</h3>
                            <p className="text-sm text-gray-500">Hacé pedidos en la tienda.</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center border border-amber-100">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-yellow-500 font-black text-xl">3</div>
                            <h3 className="font-bold text-gray-900 mb-2">Acumulá</h3>
                            <p className="text-sm text-gray-500">Ganá 1 punto por cada $1.</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 text-center border border-amber-100">
                            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-red-500 font-black text-xl">4</div>
                            <h3 className="font-bold text-gray-900 mb-2">Canjeá</h3>
                            <p className="text-sm text-gray-500">Usá tus puntos como descuento.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Earn Points */}
            <section className="py-16 bg-gray-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                        Formas de <span className="text-amber-500">ganar</span> puntos
                    </h2>
                    <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
                        Hay muchas maneras de sumar puntos a tu cuenta.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Comprando</h3>
                            <p className="text-gray-500 text-sm mb-3">Ganá 1 punto por cada $1 gastado en cualquier pedido.</p>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">+1 punto / $1</span>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Invitando Amigos</h3>
                            <p className="text-gray-500 text-sm mb-3">Cuando tu amigo hace su primera compra, los dos ganan puntos.</p>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">+500 puntos</span>
                        </div>

                        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                                <Gift className="w-6 h-6 text-purple-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Bono de Bienvenida</h3>
                            <p className="text-gray-500 text-sm mb-3">Al registrarte y hacer tu primera compra, recibís puntos extra.</p>
                            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">+250 puntos</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Levels */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                        Niveles <span className="text-amber-500">MOOVER</span>
                    </h2>
                    <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
                        Subí de nivel y desbloqueá beneficios exclusivos.
                    </p>

                    <div className="space-y-4 max-w-3xl mx-auto">
                        {LEVELS.map((level, index) => (
                            <div key={level.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:border-amber-200 transition-colors">
                                <div className="flex items-center gap-4 mb-4">
                                    <div
                                        className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
                                        style={{ backgroundColor: level.color }}
                                    >
                                        <Crown className="w-6 h-6 text-white drop-shadow" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 text-lg">{level.name}</h3>
                                        <p className="text-sm text-gray-500">
                                            {level.max === Infinity ? `${level.min.toLocaleString()}+ puntos` : `${level.min.toLocaleString()} - ${level.max.toLocaleString()} puntos`}
                                        </p>
                                    </div>
                                </div>
                                <ul className="space-y-2">
                                    {level.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Redeem Points */}
            <section className="py-16 bg-gradient-to-br from-amber-50 to-orange-50">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                        ¿Cómo <span className="text-amber-500">canjear</span> puntos?
                    </h2>
                    <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
                        Usá tus puntos como descuento en cualquier compra.
                    </p>

                    <div className="bg-white rounded-3xl p-8 max-w-2xl mx-auto shadow-xl border border-amber-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center">
                                <Gift className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-xl">Canjeá fácil</h3>
                                <p className="text-gray-500">Usá tus puntos directamente en el checkout.</p>
                            </div>
                        </div>

                        <ul className="space-y-3 text-sm text-gray-600">
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Mínimo 500 puntos para canjear
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Máximo 15% de descuento por pedido
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Los puntos no vencen
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                Se aplican automáticamente al pagar
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gray-900 text-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        ¿Listo para empezar a <span className="text-amber-400">ganar</span>?
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        Registrate gratis y comenzá a acumular puntos desde tu primera compra.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/registro" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:-translate-y-1 transition-all">
                            Crear Cuenta <Zap className="w-5 h-5" />
                        </Link>
                        <Link href="/tienda" className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                            Ir a la Tienda <ChevronRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer mini */}
            <footer className="py-6 bg-gray-950 text-center">
                <p className="text-xs text-gray-500">© {new Date().getFullYear()} MOOVY. Programa MOOVER sujeto a términos y condiciones.</p>
            </footer>
        </div>
    );
}
