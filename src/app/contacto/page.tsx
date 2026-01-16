import React from 'react';
import Link from 'next/link';
import { Mail, Phone, Clock, ArrowLeft } from 'lucide-react';

export const metadata = {
    title: 'Contacto | Moovy',
    description: 'Comunícate con Moovy. Tu Antojo Manda!',
};

export default function ContactoPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                {/* Back link */}
                <Link
                    href="/mi-perfil"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-[#e60012] transition mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Mi Perfil
                </Link>

                <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">Contacto</h1>
                <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                    Estamos aquí para ayudarte. Si tenés alguna pregunta sobre tu pedido o nuestros productos,
                    no dudes en comunicarte.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Info Card */}
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-8">Información de Contacto</h2>

                        <div className="space-y-8">
                            {/* WhatsApp */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#e60012]/10 rounded-2xl flex items-center justify-center text-[#e60012] flex-shrink-0">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">WhatsApp</h3>
                                    <p className="text-gray-500 mb-1">Para pedidos y consultas:</p>
                                    <a
                                        href="https://wa.me/5492901553173"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[#e60012] font-bold hover:underline block text-xl"
                                    >
                                        +54 9 2901 55-3173
                                    </a>
                                </div>
                            </div>

                            {/* Email */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#e60012]/10 rounded-2xl flex items-center justify-center text-[#e60012] flex-shrink-0">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Email</h3>
                                    <p className="text-gray-500 mb-1">Para consultas generales:</p>
                                    <a
                                        href="mailto:hola@somosmoovy.com"
                                        className="text-gray-900 font-medium hover:text-[#e60012] transition"
                                    >
                                        hola@somosmoovy.com
                                    </a>
                                </div>
                            </div>

                            {/* Horarios */}
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-[#e60012]/10 rounded-2xl flex items-center justify-center text-[#e60012] flex-shrink-0">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 text-lg">Horarios de Atención</h3>
                                    <p className="text-gray-500">Respondemos mensajes:</p>
                                    <p className="text-gray-900 font-medium text-lg">Lunes a Viernes, 9:00 - 18:00</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className="bg-white rounded-3xl shadow-lg p-8">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Envianos un mensaje</h3>
                        <form className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    className="input bg-gray-50 border-gray-100"
                                />
                                <input
                                    type="text"
                                    placeholder="Teléfono"
                                    className="input bg-gray-50 border-gray-100"
                                />
                            </div>
                            <input
                                type="email"
                                placeholder="Email"
                                className="input bg-gray-50 border-gray-100"
                            />
                            <textarea
                                placeholder="¿En qué podemos ayudarte?"
                                className="input bg-gray-50 border-gray-100 h-32 resize-none"
                            ></textarea>
                            <button type="button" className="btn-primary w-full">
                                Enviar Mensaje
                            </button>
                        </form>
                    </div>
                </div>

                {/* Note about online store */}
                <div className="mt-8 text-center p-6 bg-[#e60012]/5 rounded-2xl">
                    <p className="text-gray-600">
                        🛒 <strong className="font-moovy text-[#e60012]">MOOVY</strong> es una tienda 100% online.
                        Realizá tus pedidos a través de nuestra plataforma o contactanos por WhatsApp.
                    </p>
                </div>
            </div>
        </div>
    );
}

