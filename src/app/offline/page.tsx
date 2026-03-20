"use client";

import { WifiOff, RefreshCcw } from "lucide-react";
import Image from "next/image";

export default function OfflinePage() {
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

                {/* Icon */}
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <WifiOff className="w-8 h-8 text-gray-400" />
                </div>

                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Sin conexión
                    </h1>
                    <p className="text-gray-500 mt-2">
                        Parece que no tenés conexión a internet. Verificá tu Wi-Fi o datos móviles e intentá de nuevo.
                    </p>
                </div>

                {/* Retry */}
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#e60012] hover:bg-red-700 text-white font-semibold rounded-xl transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" />
                    Reintentar
                </button>

                {/* Tip */}
                <p className="text-xs text-gray-400">
                    Consejo: Podés seguir navegando las páginas que ya visitaste mientras recuperás la conexión.
                </p>
            </div>
        </div>
    );
}
