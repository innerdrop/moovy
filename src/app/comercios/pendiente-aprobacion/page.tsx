import { Clock, Mail, ArrowLeft, CheckCircle2, FileText, Shield } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function PendienteAprobacionPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#e60012] via-[#c7000f] to-[#a0000c] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-white/5" />
                <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-white/5" />
                <div className="absolute top-[20%] left-[5%] w-[200px] h-[200px] rounded-full bg-white/3" />
            </div>

            <div className="max-w-md w-full relative z-10">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link href="/">
                        <Image
                            src="/logo-moovy-white.svg"
                            alt="MOOVY"
                            width={140}
                            height={45}
                            className="mx-auto"
                            priority
                        />
                    </Link>
                </div>

                {/* Main card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                    {/* Animated clock icon */}
                    <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5 ring-4 ring-amber-100">
                        <Clock className="w-10 h-10 text-amber-500" />
                    </div>

                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        ¡Ya estamos revisando tu solicitud!
                    </h1>
                    <p className="text-gray-500 mb-6 leading-relaxed text-sm">
                        Nuestro equipo está verificando tu documentación.
                        Te notificaremos por email apenas tu comercio sea aprobado.
                    </p>

                    {/* Timeline steps */}
                    <div className="bg-gray-50 rounded-2xl p-5 mb-6 text-left">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Próximos pasos</p>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Solicitud recibida</p>
                                    <p className="text-xs text-gray-400">Tu registro fue enviado correctamente</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5 animate-pulse">
                                    <FileText className="w-4 h-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">Verificación de documentos</p>
                                    <p className="text-xs text-gray-400">Estamos revisando tu CUIT, habilitación y datos fiscales</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <Shield className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-400">Comercio aprobado</p>
                                    <p className="text-xs text-gray-300">Recibirás un email de confirmación</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Estimated time */}
                    <div className="bg-[#fff5f5] rounded-xl p-4 mb-6 border border-red-100">
                        <div className="flex items-center justify-center gap-2">
                            <Clock className="w-4 h-4 text-[#e60012]" />
                            <span className="text-sm font-semibold text-[#e60012]">Tiempo estimado: 24 a 48 horas</span>
                        </div>
                    </div>

                    {/* Support */}
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4 mb-6">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0">
                            <Mail className="w-5 h-5 text-[#e60012]" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-800">¿Tenés alguna duda?</p>
                            <a href="mailto:soporte@somosmoovy.com" className="text-xs text-[#e60012] font-medium hover:underline">
                                soporte@somosmoovy.com
                            </a>
                        </div>
                    </div>

                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-gray-600 transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio
                    </Link>
                </div>

                {/* Bottom text */}
                <p className="text-center text-white/60 text-xs mt-6">
                    Gracias por confiar en MOOVY para tu negocio
                </p>
            </div>
        </div>
    );
}
