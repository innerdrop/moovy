// Página de Mantenimiento - Moovy
"use client";

import { useEffect, useState } from "react";
import { Wrench, Clock } from "lucide-react";

export default function MantenimientoPage() {
    const [message, setMessage] = useState("¡Estamos mejorando para vos!");

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
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="text-center max-w-lg">
                {/* Logo */}
                <div className="mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-moovy/20 rounded-full mb-4">
                        <Wrench className="w-10 h-10 text-moovy animate-pulse" />
                    </div>
                    <h1 className="font-script text-4xl text-moovy mb-2">Moovy</h1>
                </div>

                {/* Message */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700 p-8 mb-6">
                    <h2 className="text-2xl font-bold text-white mb-4">
                        Sitio en Mantenimiento
                    </h2>
                    <p className="text-slate-300 text-lg mb-6">
                        {message}
                    </p>
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                        <Clock className="w-5 h-5" />
                        <span>Volvemos pronto</span>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-slate-500 text-sm">
                    Para consultas: <a href="mailto:info@somosmoovy.com" className="text-moovy hover:underline">info@somosmoovy.com</a>
                </p>
            </div>
        </div>
    );
}
