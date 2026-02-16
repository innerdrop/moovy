"use client";

import { ChevronLeft } from "lucide-react";

interface SettingsViewProps {
    onBack: () => void;
}

export default function SettingsView({ onBack }: SettingsViewProps) {
    return (
        <div className="absolute inset-0 z-50 bg-gray-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-4 py-6 shadow-md">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition active:scale-95">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-bold">Configuración</h1>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-8 text-center text-gray-500">
                <p>Próximamente: Ajustes de la aplicación</p>
            </div>
        </div>
    );
}
