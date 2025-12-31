"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Gift, Sparkles, Timer } from "lucide-react";
import Link from "next/link";

export default function PromotionalPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Show popup after Splash Screen finishes (6 seconds total - 2 more than before)
        const timer = setTimeout(() => {
            setShouldRender(true);
            // Small delay to allow render before animating in
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        }, 6000); // 6 seconds delay (2 seconds more than before)

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        // Remove blur from body when closing
        document.body.classList.remove('popup-blur-active');
        setTimeout(() => {
            setShouldRender(false);
        }, 500); // Wait for exit animation
    };

    // Add blur effect to body when popup is visible
    useEffect(() => {
        if (isVisible) {
            document.body.classList.add('popup-blur-active');
        }
        return () => {
            document.body.classList.remove('popup-blur-active');
        };
    }, [isVisible]);

    if (!shouldRender) return null;

    // Use Portal to render popup at body level, avoiding z-index conflicts
    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={`fixed top-0 left-0 right-0 bottom-0 w-full h-full z-[9999] flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ position: 'fixed', minHeight: '100dvh' }}>
            {/* Backdrop with blur effect - covers entire screen including header */}
            <div
                className={`fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black/25 backdrop-blur-[3px] z-[9998] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ position: 'fixed', minHeight: '100dvh' }}
                onClick={handleClose}
            />

            {/* Popup Card - sin borde celeste */}
            <div className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 z-[9999] ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-black/5 rounded-full text-gray-500 hover:text-gray-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header Image / Gradient */}
                <div className="h-32 bg-gradient-to-r from-turquoise via-cyan-500 to-blue-600 relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full mix-blend-overlay blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full mix-blend-overlay blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center animate-bounce-slow">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-lg mb-1">
                            <Gift className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-orange-600 text-xs font-bold uppercase tracking-wider mb-4">
                        <Timer className="w-3 h-3" /> Solo hasta el 10 de Enero
                    </div>

                    <h2 className="text-3xl font-bold text-navy mb-2">
                        ¡Tu Primera Compra!
                    </h2>

                    <p className="text-gray-600 mb-6">
                        Registrate ahora y recibí un cupón exclusivo de bienvenida.
                    </p>

                    {/* Offer Box */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-turquoise/10 rounded-full blur-xl"></div>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-turquoise">15%</span>
                                <span className="text-xs text-gray-500 uppercase font-bold">OFF</span>
                            </div>
                            <div className="w-px h-10 bg-gray-200"></div>
                            <div className="text-center">
                                <span className="block text-xl font-bold text-navy">Envío</span>
                                <span className="text-xs text-gray-500 uppercase font-bold">Gratis</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href="/register"
                        className="btn-primary w-full py-4 text-lg shadow-xl shadow-turquoise/20 hover:shadow-turquoise/40 flex items-center justify-center gap-2 group"
                        onClick={handleClose}
                    >
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Quiero mi Descuento
                    </Link>

                    <button
                        onClick={handleClose}
                        className="mt-4 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        No gracias, prefiero pagar precio full
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
