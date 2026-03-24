import { Store, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PendienteAprobacionPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-amber-500" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Tu comercio está en revisión
                </h1>
                <p className="text-gray-500 mb-6 leading-relaxed">
                    Nuestro equipo está revisando tu solicitud de registro. Te notificaremos
                    por email cuando tu comercio sea aprobado. Este proceso suele tomar
                    entre 24 y 48 horas.
                </p>
                <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                            <Store className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-gray-800">¿Necesitás ayuda?</p>
                            <p className="text-xs text-gray-500">
                                Escribinos a{" "}
                                <a href="mailto:soporte@somosmoovy.com" className="text-blue-600 hover:underline">
                                    soporte@somosmoovy.com
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                </Link>
            </div>
        </div>
    );
}
