"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Gift, Sparkles, Timer } from "lucide-react";
import Link from "next/link";

const PROMO_DISMISSED_KEY = "moovy_promo_dismissed";

export default function PromotionalPopup() {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        // Check if already dismissed
        const wasDismissed = localStorage.getItem(PROMO_DISMISSED_KEY);
        if (wasDismissed) {
            return; // Don't show if already dismissed
        }

        const timer = setTimeout(() => {
            setShouldRender(true);
            requestAnimationFrame(() => {
                setIsVisible(true);
            });
        }, 56000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        // Save to localStorage so it never shows again
        localStorage.setItem(PROMO_DISMISSED_KEY, "true");

        setIsVisible(false);
        document.body.classList.remove('popup-blur-active');
        setTimeout(() => {
            setShouldRender(false);
        }, 500);
    };

    useEffect(() => {
        if (isVisible) {
            document.body.classList.add('popup-blur-active');
        }
        return () => {
            document.body.classList.remove('popup-blur-active');
        };
    }, [isVisible]);

    if (!shouldRender) return null;

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className={`fixed top-0 left-0 right-0 bottom-0 w-full h-full z-[9999] flex items-center justify-center p-4 transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ position: 'fixed', minHeight: '100dvh' }}>
            {/* Backdrop */}
            <div
                className={`fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-black/25 backdrop-blur-[3px] z-[9998] transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                style={{ position: 'fixed', minHeight: '100dvh' }}
                onClick={handleClose}
            />

            {/* Popup Card */}
            <div className={`relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-500 z-[9999] ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/20 hover:bg-black/5 rounded-full text-white hover:text-gray-200 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header - Solid Moovy Red */}
                <div className="h-32 bg-[#e60012] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>
                    </div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-lg mb-1">
                            <Gift className="w-10 h-10 text-white" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e60012]/10 text-[#e60012] text-xs font-bold uppercase tracking-wider mb-4">
                        <Timer className="w-3 h-3" />
                        Oferta especial
                    </div>

                    <h2 className="text-3xl font-bold text-gray-900 mb-2">
                        ¡Tu Primera Compra!
                    </h2>

                    <p className="text-gray-600 mb-6">
                        Registrate ahora y recibí un cupón exclusivo de bienvenida.
                    </p>

                    {/* Offer Box */}
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-16 h-16 bg-[#e60012]/10 rounded-full blur-xl"></div>
                        <div className="flex items-center justify-center gap-4">
                            <div className="text-center">
                                <span className="block text-3xl font-bold text-[#e60012]">15%</span>
                                <span className="text-xs text-gray-500 uppercase font-bold">OFF</span>
                            </div>
                            <div className="w-px h-10 bg-gray-200"></div>
                            <div className="text-center">
                                <span className="block text-xl font-bold text-gray-900">Envío</span>
                                <span className="text-xs text-gray-500 uppercase font-bold">Gratis</span>
                            </div>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                        href="/registro"
                        className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 group"
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

