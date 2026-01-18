"use client";

import Link from "next/link";
import { ArrowLeft, Star, Gift, Users, Award, TrendingUp, Crown, Zap, ChevronRight, CheckCircle2, ArrowRight, Instagram, ShoppingBag } from "lucide-react";

// Floating Star Component
function FloatingStar({ delay, duration, left, top, size = 4 }: { delay: number, duration: number, left: string, top: string, size?: number }) {
    return (
        <div
            className="absolute animate-float text-amber-400/70 pointer-events-none"
            style={{
                left,
                top,
                animationDelay: `${delay}s`,
                animationDuration: `${duration}s`
            }}
        >
            <Star className={`w-${size} h-${size} fill-amber-400`} style={{ width: size * 4, height: size * 4 }} />
        </div>
    );
}

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
        <div className="min-h-screen bg-white font-sans relative overflow-hidden">
            {/* Background Stars */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <FloatingStar left="5%" top="15%" delay={0} duration={4} size={3} />
                <FloatingStar left="90%" top="10%" delay={1.5} duration={5} size={4} />
                <FloatingStar left="15%" top="45%" delay={2} duration={3.5} size={3} />
                <FloatingStar left="85%" top="35%" delay={0.5} duration={4.5} size={5} />
                <FloatingStar left="10%" top="70%" delay={3} duration={4} size={4} />
                <FloatingStar left="75%" top="65%" delay={1} duration={3} size={3} />
                <FloatingStar left="50%" top="20%" delay={2.5} duration={5} size={3} />
                <FloatingStar left="30%" top="80%" delay={0.8} duration={4} size={4} />
                <FloatingStar left="95%" top="55%" delay={1.8} duration={3.5} size={3} />
                <FloatingStar left="60%" top="75%" delay={3.2} duration={4.5} size={5} />
            </div>

            {/* Header */}
            <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#e60012] transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5" /> Volver
                    </Link>
                    <Link href="/" className="text-2xl font-bold text-[#e60012]"><span style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span><sup className="text-xs font-normal" style={{ fontFamily: "'Poppins', sans-serif" }}>™</sup></Link>
                    <div className="w-20" />
                </div>
            </header>

            {/* Hero */}
            <section className="py-16 md:py-20 text-center relative z-10">
                <div className="container mx-auto px-4">
                    <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-amber-100">
                        <Star className="w-4 h-4 fill-amber-500" /> Programa de Fidelidad
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
                        <span
                            className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500"
                            style={{ fontFamily: "'Junegull', sans-serif" }}
                        >
                            MOOVER
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                        Acumulá puntos con cada compra, subí de nivel y disfrutá de beneficios exclusivos. Más usás MOOVY™, más ganás.
                    </p>

                    <Link
                        href="/registro"
                        className="group inline-flex items-center gap-2 bg-gray-900 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
                    >
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                        Unirme Gratis
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </section>

            {/* How It Works - Simplified */}
            <section className="py-16 bg-gray-50 relative z-10">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                        ¿Cómo <span className="text-amber-500">funciona</span>?
                    </h2>
                    <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
                        En 3 simples pasos comenzás a disfrutar los beneficios.
                    </p>

                    {/* Horizontal Steps */}
                    <div className="max-w-4xl mx-auto">
                        <div className="flex flex-col md:flex-row items-stretch gap-4 md:gap-0">
                            {/* Step 1 */}
                            <div className="flex-1 bg-white rounded-2xl md:rounded-l-2xl md:rounded-r-none p-6 border border-gray-100 relative">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 font-black">1</div>
                                    <h3 className="font-bold text-gray-900 text-lg">Comprá</h3>
                                </div>
                                <p className="text-sm text-gray-500">Hacé tus pedidos en la tienda como siempre. Cada compra suma puntos automáticamente.</p>
                                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                                    <ChevronRight className="w-6 h-6 text-gray-300" />
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="flex-1 bg-white p-6 border-y md:border border-gray-100 relative">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-black">2</div>
                                    <h3 className="font-bold text-gray-900 text-lg">Acumulá</h3>
                                </div>
                                <p className="text-sm text-gray-500">Ganá 1 punto por cada $1 gastado. También sumás puntos invitando amigos.</p>
                                <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                                    <ChevronRight className="w-6 h-6 text-gray-300" />
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="flex-1 bg-white rounded-2xl md:rounded-r-2xl md:rounded-l-none p-6 border border-gray-100">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-black">3</div>
                                    <h3 className="font-bold text-gray-900 text-lg">Canjeá</h3>
                                </div>
                                <p className="text-sm text-gray-500">Usá tus puntos como descuento directo en el checkout. ¡Así de simple!</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Earn Points */}
            <section className="py-16 bg-white relative z-10">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                        Formas de <span className="text-amber-500">ganar</span>
                    </h2>
                    <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
                        Hay muchas maneras de sumar puntos a tu cuenta.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Comprando</h3>
                            <p className="text-gray-500 text-sm mb-3">Ganá 1 punto por cada $1 gastado en cualquier pedido.</p>
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full">+1 punto / $1</span>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Invitando Amigos</h3>
                            <p className="text-gray-500 text-sm mb-3">Cuando tu amigo hace su primera compra, los dos ganan puntos.</p>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">+500 puntos</span>
                        </div>

                        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
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
            <section className="py-16 bg-gray-50 relative z-10">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
                        Niveles <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVER</span>
                    </h2>
                    <p className="text-gray-500 text-center max-w-xl mx-auto mb-12">
                        Subí de nivel y desbloqueá beneficios exclusivos.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
                        {LEVELS.map((level) => (
                            <div key={level.name} className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-lg transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center shadow-md"
                                        style={{ backgroundColor: level.color }}
                                    >
                                        <Crown className="w-5 h-5 text-white drop-shadow" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{level.name}</h3>
                                        <p className="text-xs text-gray-500">
                                            {level.max === Infinity ? `${level.min.toLocaleString()}+` : `${level.min.toLocaleString()} - ${level.max.toLocaleString()}`} pts
                                        </p>
                                    </div>
                                </div>
                                <ul className="space-y-1.5">
                                    {level.benefits.map((benefit, i) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
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
            <section className="py-16 bg-white relative z-10">
                <div className="container mx-auto px-4">
                    <div className="bg-gray-50 rounded-3xl p-8 max-w-3xl mx-auto border border-gray-100">
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 text-center">
                            ¿Cómo <span className="text-amber-500">canjear</span> puntos?
                        </h2>
                        <p className="text-gray-500 text-center mb-8">
                            Usá tus puntos como descuento en cualquier compra.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Mínimo 500 puntos para canjear</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Máximo 15% de descuento por pedido</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Los puntos no vencen</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-gray-100">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm text-gray-700">Se aplican automáticamente al pagar</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 bg-gray-900 text-white relative z-10">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        ¿Listo para <span className="text-amber-400">ganar</span>?
                    </h2>
                    <p className="text-gray-400 mb-8 max-w-md mx-auto">
                        Registrate gratis y comenzá a acumular puntos desde tu primera compra.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/registro" className="inline-flex items-center justify-center gap-2 bg-white text-gray-900 px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:-translate-y-1 transition-all">
                            <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Crear Cuenta
                        </Link>
                        <Link href="/tienda" className="inline-flex items-center justify-center gap-2 border-2 border-white/20 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all">
                            <ShoppingBag className="w-5 h-5" /> Ir a la Tienda
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 bg-gray-950 text-center relative z-10">
                <div className="container mx-auto px-4">
                    <Link href="/" className="text-xl font-bold text-white mb-4 inline-block"><span style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span><sup className="text-xs font-normal" style={{ fontFamily: "'Poppins', sans-serif" }}>™</sup></Link>
                    <p className="text-xs text-gray-500 mb-2">
                        Programa MOOVER sujeto a <Link href="/terminos-moover" className="underline hover:text-gray-400">términos y condiciones</Link>.
                    </p>
                    <p className="text-xs text-gray-600">© {new Date().getFullYear()} <span style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</span><sup style={{ fontFamily: "'Poppins', sans-serif", fontSize: '8px' }}>™</sup>. Todos los derechos reservados.</p>
                </div>
            </footer>

            <style jsx global>{`
                @keyframes float {
                    0% { transform: translateY(0px) rotate(0deg); opacity: 0; }
                    20% { opacity: 0.7; }
                    80% { opacity: 0.7; }
                    100% { transform: translateY(-150px) rotate(45deg); opacity: 0; }
                }
                .animate-float {
                    animation-name: float;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
        </div>
    );
}
