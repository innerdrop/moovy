// Página de Mantenimiento - Usa el componente MaintenancePage
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Instagram } from "lucide-react";

export default function MantenimientoPage() {
    const [message, setMessage] = useState("Estamos trabajando para mejorar tu experiencia. ¡Gracias por tu paciencia!");

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
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center">
                {/* Logo */}
                <div className="mb-8">
                    <Image
                        src="/logo-moovy.svg"
                        alt="MOOVY"
                        width={280}
                        height={90}
                        className="mx-auto"
                    />
                </div>

                {/* Construction Icon */}
                <div className="text-6xl mb-6 animate-bounce">
                    🚧
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    ¡Volvemos Pronto!
                </h1>

                {/* Custom Message */}
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    {message}
                </p>

                {/* Progress Animation */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-8 overflow-hidden">
                    <div
                        className="h-2 rounded-full bg-gradient-to-r from-[#e60012] to-[#00D4AA] animate-pulse"
                        style={{ width: "60%" }}
                    />
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-4">
                    <a
                        href="https://instagram.com/somosmoovy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                        <Instagram className="w-5 h-5" />
                        <span className="text-sm font-medium">@somosmoovy</span>
                    </a>
                </div>

                {/* Contact Email */}
                <p className="mt-6 text-sm text-gray-500">
                    Consultas: <a href="mailto:somosmoovy@gmail.com" className="text-[#e60012] hover:underline">somosmoovy@gmail.com</a>
                </p>

                {/* Footer */}
                <p className="mt-8 text-sm text-gray-400">
                    © {new Date().getFullYear()} MOOVY™ — Ushuaia, Tierra del Fuego
                </p>
            </div>
        </div>
    );
}
