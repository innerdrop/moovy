"use client";

// WhatsApp Floating Support Button
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
    phoneNumber?: string;
    message?: string;
}

export default function WhatsAppButton({
    phoneNumber = "5492901553173",
    message = "Hola! Necesito ayuda con MOOVY",
}: WhatsAppButtonProps) {
    if (!phoneNumber) return null;

    const cleanNumber = phoneNumber.replace(/\D/g, "");
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Soporte por WhatsApp"
            className="fixed bottom-6 right-4 z-40 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg shadow-green-500/30 flex items-center justify-center transition-all hover:scale-110 active:scale-95"
            aria-label="Contactar soporte por WhatsApp"
        >
            <MessageCircle className="w-7 h-7" />
        </a>
    );
}
