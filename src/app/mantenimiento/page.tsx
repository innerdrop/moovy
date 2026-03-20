"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Instagram, Wrench, RefreshCcw } from "lucide-react";

export default function MantenimientoPage() {
    const [message, setMessage] = useState("Estamos trabajando para mejorar tu experiencia.");

    useEffect(() => {
        fetch("/api/maintenance")
            .then(res => res.json())
            .then(data => {
                if (data.maintenanceMessage) {
                    setMessage(data.maintenanceMessage);
                }
            })
            .catch(() => { });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 max-w-md w-full text-center space-y-6">
                {/* Logo MOOVY */}
                <div className="flex justify-center">
                    <Image
                        src="/logo-moovy.svg"
                        alt="MOOVY"
                        width={120}
                        height={38}
                        priority
                    />
                </div>

                {/* Icon with pulse */}
                <div className="mx-auto w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center animate-pulse">
                    <Wrench className="w-8 h-8 text-amber-500" />
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        En mantenimiento
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {message}
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#e60012] to-amber-500 rounded-full animate-pulse w-2/3" />
                </div>

                {/* Info */}
                <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                    <p className="text-sm text-gray-600 font-medium">Mientras tanto:</p>
                    <ul className="text-sm text-gray-500 space-y-1">
                        <li className="flex items-start gap-2">
                            <span className="text-[#e60012] mt-0.5">•</span>
                            No perdés tu carrito ni tus pedidos
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#e60012] mt-0.5">•</span>
                            Los pedidos en curso siguen activos
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-[#e60012] mt-0.5">•</span>
                            Te notificamos cuando volvamos
                        </li>
                    </ul>
                </div>

                {/* Retry */}
                <a
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e60012] hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Volver a intentar
                </a>

                {/* Social */}
                <div className="flex justify-center">
                    <a
                        href="https://instagram.com/somosmoovy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-gray-600 hover:bg-gray-100 transition-colors text-sm"
                    >
                        <Instagram className="w-4 h-4" />
                        @somosmoovy
                    </a>
                </div>

                {/* Footer */}
                <p className="text-xs text-gray-400">
                    Consultas: <a href="mailto:somosmoovy@gmail.com" className="text-[#e60012] hover:underline">somosmoovy@gmail.com</a>
                </p>
            </div>
        </div>
    );
}
