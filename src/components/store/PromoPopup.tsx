"use client";

import { useState, useEffect } from "react";
import { X, Gift, ExternalLink } from "lucide-react";
import Link from "next/link";

interface PromoPopupProps {
    enabled: boolean;
    title?: string | null;
    message?: string | null;
    image?: string | null;
    link?: string | null;
    buttonText?: string | null;
    dismissable?: boolean;
}

export default function PromoPopup({
    enabled,
    title,
    message,
    image,
    link,
    buttonText = "Ver más",
    dismissable = true
}: PromoPopupProps) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!enabled) return;

        // Check if already dismissed in this session
        const dismissed = sessionStorage.getItem("promoPopupDismissed");
        if (dismissed) return;

        // Show popup after a small delay
        const timer = setTimeout(() => setVisible(true), 1500);
        return () => clearTimeout(timer);
    }, [enabled]);

    const handleDismiss = () => {
        setVisible(false);
        sessionStorage.setItem("promoPopupDismissed", "true");
    };

    const handleNeverShow = () => {
        setVisible(false);
        localStorage.setItem("promoPopupNeverShow", "true");
        sessionStorage.setItem("promoPopupDismissed", "true");
    };

    if (!visible || !enabled) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-scaleIn">
                {/* Image */}
                {image && (
                    <div className="relative h-48 bg-gradient-to-br from-[#e60012] to-[#ff4444]">
                        <img
                            src={image}
                            alt={title || "Promoción"}
                            className="w-full h-full object-cover"
                        />
                        {dismissable && (
                            <button
                                onClick={handleDismiss}
                                className="absolute top-3 right-3 p-2 bg-black/30 hover:bg-black/50 rounded-full text-white transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="p-6">
                    {!image && dismissable && (
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    )}

                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-[#e60012]/10 rounded-full flex items-center justify-center">
                            <Gift className="w-5 h-5 text-[#e60012]" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {title || "¡Oferta Especial!"}
                        </h2>
                    </div>

                    {message && (
                        <p className="text-gray-600 mb-6">{message}</p>
                    )}

                    <div className="space-y-3">
                        {link ? (
                            <Link
                                href={link}
                                onClick={handleDismiss}
                                className="w-full py-3 bg-[#e60012] text-white rounded-xl font-medium hover:bg-[#c5000f] transition flex items-center justify-center gap-2"
                            >
                                {buttonText}
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        ) : (
                            <button
                                onClick={handleDismiss}
                                className="w-full py-3 bg-[#e60012] text-white rounded-xl font-medium hover:bg-[#c5000f] transition"
                            >
                                {buttonText || "Entendido"}
                            </button>
                        )}

                        {dismissable && (
                            <button
                                onClick={handleNeverShow}
                                className="w-full text-sm text-gray-400 hover:text-gray-600 transition"
                            >
                                No mostrar de nuevo
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
