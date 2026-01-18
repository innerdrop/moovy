"use client";

import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Clock, Send, Instagram, MessageCircle } from "lucide-react";

export default function ContactoPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-[#e60012] transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5" /> Volver
                    </Link>
                    <Link href="/" className="text-2xl font-bold text-[#e60012]" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</Link>
                    <div className="w-20" />
                </div>
            </header>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Title */}
                    <div className="text-center mb-12">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contactanos</h1>
                        <p className="text-gray-600 text-lg">¿Tenés alguna pregunta o sugerencia? ¡Nos encantaría escucharte!</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Contact Info */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Información de Contacto</h2>

                                <div className="space-y-5">
                                    <a href="https://wa.me/5492901553173" target="_blank" rel="noopener noreferrer"
                                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <MessageCircle className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">WhatsApp</p>
                                            <p className="text-gray-600">+54 9 2901 55-3173</p>
                                        </div>
                                    </a>

                                    <a href="mailto:somosmoovy@gmail.com"
                                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5 text-[#e60012]" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Email</p>
                                            <p className="text-gray-600">somosmoovy@gmail.com</p>
                                        </div>
                                    </a>

                                    <a href="https://instagram.com/somosmoovy" target="_blank" rel="noopener noreferrer"
                                        className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Instagram className="w-5 h-5 text-pink-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Instagram</p>
                                            <p className="text-gray-600">@somosmoovy</p>
                                        </div>
                                    </a>

                                    <div className="flex items-start gap-4 p-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Ubicación</p>
                                            <p className="text-gray-600">Ushuaia, Tierra del Fuego</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4 p-3">
                                        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">Horario de atención</p>
                                            <p className="text-gray-600">Lunes a Viernes: 9:00 - 21:00</p>
                                            <p className="text-gray-600">Sábados: 10:00 - 18:00</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Contacto Rápido</h2>

                                <div className="space-y-4">
                                    <a
                                        href="https://wa.me/5492901553173?text=Hola!%20Quiero%20consultar%20sobre%20MOOVY"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full py-4 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors"
                                    >
                                        <MessageCircle className="w-5 h-5" />
                                        Escribinos por WhatsApp
                                    </a>

                                    <a
                                        href="mailto:somosmoovy@gmail.com?subject=Consulta%20MOOVY"
                                        className="flex items-center justify-center gap-3 w-full py-4 bg-[#e60012] hover:bg-[#cc000f] text-white font-semibold rounded-xl transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                        Enviar Email
                                    </a>

                                    <a
                                        href="https://instagram.com/somosmoovy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:opacity-90 text-white font-semibold rounded-xl transition-colors"
                                    >
                                        <Instagram className="w-5 h-5" />
                                        Seguinos en Instagram
                                    </a>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-[#e60012] to-[#ff4444] rounded-2xl p-6 text-white">
                                <h3 className="font-bold text-lg mb-2">¿Querés ser parte de MOOVY?</h3>
                                <p className="text-white/80 text-sm mb-4">
                                    Si tenés un comercio o querés ser repartidor, también podés contactarnos.
                                </p>
                                <div className="flex gap-3">
                                    <Link href="/socios/registro" className="flex-1 py-2 bg-white text-[#e60012] font-semibold rounded-lg text-center text-sm">
                                        Soy Comercio
                                    </Link>
                                    <Link href="/riders/registro" className="flex-1 py-2 bg-white/20 text-white font-semibold rounded-lg text-center text-sm">
                                        Soy Repartidor
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="py-6 bg-gray-100 text-center text-sm text-gray-500">
                <p>© {new Date().getFullYear()} MOOVY™. Ushuaia, Tierra del Fuego.</p>
            </footer>
        </div>
    );
}
