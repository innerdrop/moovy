"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Hotel, Map, Mountain, Sparkles, Star, Users, CalendarCheck, Globe, X, Loader2, CheckCircle2, Mail, User } from "lucide-react";

export default function MoovyXPage() {
    const [showModal, setShowModal] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/moovyx/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email }),
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const data = await response.json();
                setError(data.error || "Error al enviar. Intentá de nuevo.");
            }
        } catch {
            setError("Error de conexión. Intentá de nuevo.");
        } finally {
            setIsLoading(false);
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setSuccess(false);
        setName("");
        setEmail("");
        setError("");
    };

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
                                <button
                                    onClick={() => setShowModal(true)}
                                    className="inline-flex items-center gap-2 bg-white text-teal-600 font-semibold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
                                >
                                    <CalendarCheck className="w-5 h-5" />
                                    Pre-registrarme
                                </button>
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-fade-in">
                        {success ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-teal-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</h3>
                                <p className="text-gray-600 mb-6">
                                    Te enviamos un email con más información. Revisá tu bandeja de entrada.
                                </p>
                                <button
                                    onClick={closeModal}
                                    className="w-full py-3 bg-teal-600 text-white font-semibold rounded-xl hover:bg-teal-700 transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                                    <h3 className="text-xl font-bold text-gray-900">Pre-registro MOOVY X</h3>
                                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                    <p className="text-gray-600 text-sm mb-4">
                                        Dejanos tus datos y te avisaremos cuando puedas registrar tu negocio turístico.
                                    </p>

                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                <User className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                placeholder="Tu nombre o empresa"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                                                <Mail className="w-5 h-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                placeholder="tu@email.com"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-3 bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Enviando...
                                            </>
                                        ) : (
                                            <>
                                                <CalendarCheck className="w-5 h-5" />
                                                Registrarme
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
