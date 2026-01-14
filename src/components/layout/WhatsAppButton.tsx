"use client";

// WhatsApp Floating Button
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
    phoneNumber?: string;
    message?: string;
}

export default function WhatsAppButton({
    phoneNumber = "",
    message = "¡Hola! Quiero hacer un pedido",
}: WhatsAppButtonProps) {
    const handleClick = () => {
        const cleanNumber = phoneNumber.replace(/\D/g, "");
        const encodedMessage = encodeURIComponent(message);
        const url = cleanNumber
            ? `https://wa.me/${cleanNumber}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;
        window.open(url, "_blank");
    };

    return (
        <button
            onClick={handleClick}
            className="whatsapp-button"
            aria-label="Contactar por WhatsApp"
        >
            <MessageCircle className="w-7 h-7" />
        </button>
    );
}

