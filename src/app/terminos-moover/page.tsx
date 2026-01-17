import Link from "next/link";
import { ArrowLeft, Shield, Users, Gift, Star, AlertCircle, Award, Coins } from "lucide-react";

export default function TerminosMooverPage() {
    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#e60012] to-red-700 text-white px-4 py-8">
                <Link href="/puntos" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4">
                    <ArrowLeft className="w-5 h-5" />
                    Volver a MOOVER
                </Link>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Shield className="w-7 h-7" />
                    Términos del Programa MOOVER
                </h1>
                <p className="text-white/80 mt-2">Última actualización: Enero 2026</p>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6">
                {/* Intro */}
                <section className="bg-white rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500" />
                        ¿Qué es MOOVER?
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        MOOVER es el programa de fidelidad de Moovy que te permite acumular puntos
                        por tus compras, referir amigos y canjear descuentos. Al participar en el
                        programa, aceptás estos términos y condiciones.
                    </p>
                </section>

                {/* Value of Points */}
                <section className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Coins className="w-5 h-5 text-green-600" />
                        Valor de los Puntos
                    </h2>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-green-600">100 pts</p>
                            <p className="text-sm text-gray-500">= $1.50 de descuento</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center">
                            <p className="text-2xl font-bold text-green-600">1,000 pts</p>
                            <p className="text-sm text-gray-500">= $15 de descuento</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600">
                        Podés usar tus puntos en el checkout para obtener descuentos de hasta el 15% de tu compra. Mínimo 500 puntos para canjear.
                    </p>
                </section>

                {/* Earning Points */}
                <section className="bg-white rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#e60012]" />
                        Cómo Ganar Puntos
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">Por cada $1 de compra</span>
                            <span className="font-bold text-[#e60012]">+1 punto</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <div>
                                <span className="text-sm text-gray-700">Bono de bienvenida</span>
                                <p className="text-xs text-amber-600">Se activa con tu 1ra compra de $5,000+</p>
                            </div>
                            <span className="font-bold text-[#e60012]">+250 puntos</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <div>
                                <span className="text-sm text-gray-700">Por referir un amigo</span>
                                <p className="text-xs text-purple-600">Cuando tu amigo compra $8,000+</p>
                            </div>
                            <span className="font-bold text-[#e60012]">+500 puntos</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="text-sm text-gray-700">Tu amigo referido recibe</span>
                            <span className="font-bold text-[#e60012]">+250 puntos</span>
                        </div>
                    </div>
                </section>

                {/* Referrals */}
                <section className="bg-white rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-600" />
                        Sistema de Referidos
                    </h2>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>Cada usuario tiene un código de referido único e intransferible.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>El nuevo usuario debe ingresar el código durante el registro.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>Vos ganás <strong>1,000 puntos</strong> y tu amigo gana <strong>500 puntos</strong>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-purple-600 font-bold">•</span>
                            <span>Un usuario solo puede ser referido una vez.</span>
                        </li>
                    </ul>
                </section>

                {/* Gift Points */}
                <section className="bg-white rounded-xl p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Gift className="w-5 h-5 text-green-600" />
                        Regalo de Puntos
                    </h2>
                    <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span>Podés regalar puntos a cualquier usuario registrado en Moovy.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span>El mínimo para regalar es de 100 puntos por transferencia.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span>Podés regalar hasta el 50% de tu balance actual.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-600 font-bold">•</span>
                            <span>Las transferencias son instantáneas e irreversibles.</span>
                        </li>
                    </ul>
                </section>

                {/* Important */}
                <section className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h2 className="text-lg font-bold text-amber-800 mb-3 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Información Importante
                    </h2>
                    <ul className="space-y-2 text-sm text-amber-700">
                        <li>• Los puntos no tienen valor monetario fuera del programa.</li>
                        <li>• Los puntos se acreditan cuando el pedido es entregado.</li>
                        <li>• El contador de "puntos del mes" por referidos se reinicia el 1° de cada mes.</li>
                        <li>• Moovy se reserva el derecho de modificar estos términos.</li>
                        <li>• El uso fraudulento resultará en la cancelación de la cuenta.</li>
                        <li>• Los puntos pueden tener fecha de vencimiento según política vigente.</li>
                    </ul>
                </section>

                {/* Contact */}
                <section className="text-center py-6">
                    <p className="text-sm text-gray-500">
                        ¿Tenés dudas? Escribinos a{" "}
                        <a href="mailto:somosmoovy@gmail.com" className="text-[#e60012] hover:underline">
                            somosmoovy@gmail.com
                        </a>
                    </p>
                </section>
            </div>
        </div>
    );
}
