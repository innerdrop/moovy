"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Smartphone, Monitor, X } from "lucide-react";

interface MobileOnlyGuardProps {
    children: React.ReactNode;
    /** "block" = pantalla completa, no deja usar. "warn" = banner dismissable */
    mode: "block" | "warn";
    /** Nombre del portal para mostrar en el mensaje */
    portalName?: string;
}

function useIsDesktop() {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const check = () => {
            // Detect desktop: screen wider than 1024px AND no touch (or coarse pointer)
            const isWide = window.innerWidth >= 1024;
            const hasNoTouch = !("ontouchstart" in window) && !navigator.maxTouchPoints;
            setIsDesktop(isWide && hasNoTouch);
        };

        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    return isDesktop;
}

export default function MobileOnlyGuard({ children, mode, portalName }: MobileOnlyGuardProps) {
    const isDesktop = useIsDesktop();
    const [dismissed, setDismissed] = useState(false);

    // Don't block on server or mobile
    if (!isDesktop) return <>{children}</>;

    // Block mode: full screen overlay
    if (mode === "block") {
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

                    {/* Phone icon */}
                    <div className="mx-auto w-20 h-20 bg-red-50 rounded-full flex items-center justify-center">
                        <Smartphone className="w-10 h-10 text-[#e60012]" />
                    </div>

                    {/* Title */}
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Usá tu celular
                        </h1>
                        <p className="text-gray-500 mt-2">
                            {portalName
                                ? `El portal de ${portalName} está diseñado para dispositivos móviles.`
                                : "Esta sección está diseñada para dispositivos móviles."}
                        </p>
                    </div>

                    {/* Visual comparison */}
                    <div className="flex items-center justify-center gap-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                <Monitor className="w-6 h-6 text-gray-300" />
                            </div>
                            <span className="text-xs text-gray-400 line-through">Desktop</span>
                        </div>
                        <div className="text-gray-300 text-2xl">&rarr;</div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center">
                                <Smartphone className="w-6 h-6 text-green-500" />
                            </div>
                            <span className="text-xs text-green-600 font-medium">Mobile</span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                        <p>Escaneá el QR o ingresá desde el navegador de tu celular:</p>
                        <p className="font-mono text-[#e60012] font-bold mt-2 text-base">somosmoovy.com</p>
                    </div>
                </div>
            </div>
        );
    }

    // Warn mode: dismissable banner + children
    if (dismissed) return <>{children}</>;

    return (
        <>
            {/* Warning banner */}
            <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-[#e60012] to-red-600 text-white px-4 py-3 shadow-lg">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <Smartphone className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">
                            MOOVY está optimizada para celulares. Para la mejor experiencia, ingresá desde tu dispositivo móvil.
                        </p>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="p-1 hover:bg-white/20 rounded-lg transition flex-shrink-0"
                        aria-label="Cerrar aviso"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {/* Spacer for banner */}
            <div className="h-12" />
            {children}
        </>
    );
}
