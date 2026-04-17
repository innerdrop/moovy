"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toast";
import type { ToastType } from "@/store/toast";

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle; iconColor: string; accent: string }> = {
    success: {
        icon: CheckCircle,
        iconColor: "text-[#e60012]",
        accent: "border-l-[#e60012]",
    },
    error: {
        icon: XCircle,
        iconColor: "text-red-500",
        accent: "border-l-red-500",
    },
    warning: {
        icon: AlertTriangle,
        iconColor: "text-amber-500",
        accent: "border-l-amber-500",
    },
    info: {
        icon: Info,
        iconColor: "text-blue-500",
        accent: "border-l-blue-500",
    },
};

function ToastItem({ id, type, message }: { id: string; type: ToastType; message: string }) {
    const removeToast = useToastStore((s) => s.removeToast);
    const [visible, setVisible] = useState(false);

    const config = TOAST_CONFIG[type];
    const Icon = config.icon;

    useEffect(() => {
        const timer = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(timer);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => removeToast(id), 300);
    };

    return (
        <div
            className={`
                flex items-center gap-3 px-5 py-3.5 rounded-2xl border-l-4
                bg-white shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-sm
                max-w-[340px] w-full
                ${config.accent}
                transition-all duration-300 ease-out
                ${visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-3 opacity-0 scale-95"}
            `}
            role="alert"
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${config.iconColor}`} />
            <p className="text-sm font-semibold text-gray-900 flex-1 leading-snug">{message}</p>
            <button
                onClick={handleClose}
                className="p-1 rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}

export default function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2.5 items-center pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem id={t.id} type={t.type} message={t.message} />
                </div>
            ))}
        </div>
    );
}
