"use client";

import Link from "next/link";
import { ArrowLeft, Compass, Hotel, Map, Mountain, Sparkles, Star, Users, CalendarCheck, Globe } from "lucide-react";

export default function MoovyXPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors font-medium">
                        <ArrowLeft className="w-5 h-5" /> Volver
                    </Link>
                    <Link href="/" className="text-2xl font-bold text-[#e60012]" style={{ fontFamily: "'Junegull', sans-serif" }}>MOOVY</Link>
                    <div className="w-20" />
                </div>
            </header>

            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto">
                    {/* Hero */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-teal-100">
                            <Sparkles className="w-4 h-4" /> Próximamente
                        </div>

                        <h1 className="text-4xl md:text-6xl font-black mb-6">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 via-sky-500 to-emerald-500" style={{ fontFamily: "'Junegull', sans-serif" }}>
                                MOOVY
                            </span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400 ml-2" style={{ fontFamily: "'Junegull', sans-serif" }}>
                                X
                            </span>
                        </h1>

                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            La nueva forma de explorar Ushuaia y el Fin del Mundo.
                            Experiencias turísticas únicas al alcance de tu mano.
                        </p>
                    </div>

                    {/* What's coming - With Images */}
                    <div className="grid md:grid-cols-2 gap-6 mb-16">
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="h-48 overflow-hidden">
                                <img src="/moovyx-excursiones.png" alt="Excursiones en Ushuaia" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Excursiones</h3>
                                <p className="text-gray-600">
                                    Navegación por el Canal Beagle, trekking en glaciares,
                                    avistaje de fauna y mucho más. Todo en un solo lugar.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="h-48 overflow-hidden">
                                <img src="/moovyx-alojamiento.png" alt="Alojamiento en Patagonia" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Alojamiento</h3>
                                <p className="text-gray-600">
                                    Hoteles, cabañas y hospedajes verificados.
                                    Reservá directamente con los mejores precios.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="h-48 overflow-hidden">
                                <img src="/moovyx-experiencias.png" alt="Experiencias únicas" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Experiencias Únicas</h3>
                                <p className="text-gray-600">
                                    Actividades exclusivas del Fin del Mundo:
                                    trineo con huskies, buceo en aguas antárticas, auroras australes.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                            <div className="h-48 overflow-hidden">
                                <img src="/moovyx-puntos.png" alt="Puntos MOOVER" className="w-full h-full object-cover" />
                            </div>
                            <div className="p-6">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Puntos MOOVER</h3>
                                <p className="text-gray-600">
                                    Tus puntos MOOVER también servirán para experiencias turísticas.
                                    Canjeá por descuentos en excursiones.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* For businesses */}
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-8 text-white mb-16">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Globe className="w-7 h-7" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold mb-2">¿Tenés un negocio turístico?</h3>
                                <p className="text-white/80 mb-4">
                                    Si tenés un hotel, agencia de viajes, empresa de excursiones o cualquier
                                    servicio turístico, pre-registrate ahora para ser de los primeros en MOOVY X.
                                </p>
                                <Link
                                    href="/#moovyx"
                                    className="inline-flex items-center gap-2 bg-white text-teal-600 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
                                >
                                    <CalendarCheck className="w-5 h-5" />
                                    Pre-registrarme
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-16">
                        <div className="text-center p-4">
                            <p className="text-3xl font-bold text-teal-600">+50</p>
                            <p className="text-gray-500 text-sm">Empresas interesadas</p>
                        </div>
                        <div className="text-center p-4">
                            <div className="flex items-center justify-center gap-1">
                                <Sparkles className="w-6 h-6 text-amber-500" />
                            </div>
                            <p className="text-gray-500 text-sm">Próximamente</p>
                        </div>
                        <div className="text-center p-4">
                            <p className="text-3xl font-bold text-teal-600">2026</p>
                            <p className="text-gray-500 text-sm">Lanzamiento</p>
                        </div>
                    </div>

                    {/* Back to home */}
                    <div className="text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-gray-600 hover:text-teal-600 transition-colors font-medium"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Volver al inicio
                        </Link>
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
