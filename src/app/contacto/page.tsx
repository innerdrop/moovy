
import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import WhatsAppButton from '@/components/layout/WhatsAppButton';

export const metadata = {
    title: 'Contacto | Polirrubro San Juan',
    description: 'Comunícate con Polirrubro San Juan. Estamos disponibles las 24 horas.',
};

export default function ContactoPage() {
    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4 max-w-6xl">
                <h1 className="text-4xl font-bold text-center text-navy mb-4">Contacto</h1>
                <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
                    Estamos aquí para ayudarte. Si tenés alguna pregunta sobre tu pedido, nuestros productos o nuestro servicio de delivery,
                    no dudes en comunicarte por cualquiera de nuestros canales.
                </p>

                <div className="grid md:grid-cols-2 gap-8 items-start">

                    {/* Info Card */}
                    <div className="bg-white rounded-3xl shadow-lg p-8 transform hover:-translate-y-1 transition-all duration-300">
                        <h2 className="text-2xl font-bold text-turquoise-dark mb-8">Información de Contacto</h2>

                        <div className="space-y-8">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-turquoise/10 rounded-2xl flex items-center justify-center text-turquoise flex-shrink-0">
                                    <Phone className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-navy text-lg">WhatsApp y Teléfono</h3>
                                    <p className="text-gray-500 mb-1">Para pedidos rápidos y consultas:</p>
                                    <a href="https://wa.me/5492901614080" target="_blank" rel="noopener noreferrer" className="text-turquoise font-bold hover:underline block text-xl">
                                        +54 9 2901 61-4080
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-turquoise/10 rounded-2xl flex items-center justify-center text-turquoise flex-shrink-0">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-navy text-lg">Horarios de Atención</h3>
                                    <p className="text-gray-500">Estamos abiertos:</p>
                                    <p className="text-navy font-medium text-lg">Lunes a Lunes, las 24 horas</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">
                                        Abierto Ahora
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-turquoise/10 rounded-2xl flex items-center justify-center text-turquoise flex-shrink-0">
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-navy text-lg">Email</h3>
                                    <p className="text-gray-500 mb-1">Para consultas administrativas:</p>
                                    <a href="mailto:hola@polisanjuan.com" className="text-navy font-medium hover:text-turquoise transition">
                                        hola@polisanjuan.com
                                    </a>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-turquoise/10 rounded-2xl flex items-center justify-center text-turquoise flex-shrink-0">
                                    <MapPin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-navy text-lg">Ubicación</h3>
                                    <p className="text-gray-500">Nuestro local central:</p>
                                    <p className="text-navy font-medium">Gdor. Paz 714, V9410 Ushuaia</p>
                                    <p className="text-gray-400 text-sm">Tierra del Fuego, Argentina</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Map & Form Placeholder */}
                    <div className="space-y-8">
                        {/* Map Placeholder - Replace with actual Google Maps Embed if needed */}
                        <div className="bg-gray-200 rounded-3xl h-[300px] w-full relative overflow-hidden group shadow-lg">
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9415.67917228815!2d-68.30722122245281!3d-54.80666014389104!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xbc4c231790400001%3A0x738367962451515f!2sPolirrubro%20San%20Juan!5e0!3m2!1ses-419!2sar!4v1717366300000!5m2!1ses-419!2sar"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={true}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="absolute inset-0 grayscale group-hover:grayscale-0 transition-all duration-500"
                            ></iframe>
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg font-bold text-navy shadow-sm">
                                📍 Estamos acá
                            </div>
                        </div>

                        {/* Quick Form */}
                        <div className="bg-white rounded-3xl shadow-lg p-8">
                            <h3 className="text-xl font-bold text-navy mb-4">Envianos un mensaje</h3>
                            <form className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="Nombre" className="input bg-gray-50 border-gray-100" />
                                    <input type="text" placeholder="Teléfono" className="input bg-gray-50 border-gray-100" />
                                </div>
                                <input type="email" placeholder="Email" className="input bg-gray-50 border-gray-100" />
                                <textarea placeholder="¿En qué podemos ayudarte?" className="input bg-gray-50 border-gray-100 h-32 resize-none"></textarea>
                                <button type="button" className="btn-primary w-full">
                                    Enviar Mensaje
                                </button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
