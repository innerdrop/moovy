"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toast";
import type { ToastType } from "@/store/toast";

const TOAST_CONFIG: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; text: string }> = {
    success: {
        icon: CheckCircle,
        bg: "bg-green-50",
        border: "border-green-200",
        text: "text-green-800",
    },
    error: {
        icon: XCircle,
        bg: "bg-red-50",
        border: "border-red-200",
        text: "text-red-800",
    },
    warning: {
        icon: AlertTriangle,
        bg: "bg-amber-50",
        border: "border-amber-200",
        text: "text-amber-800",
    },
    info: {
        icon: Info,
        bg: "bg-blue-50",
        border: "border-blue-200",
        text: "text-blue-800",
    },
};

function ToastItem({ id, type, message }: { id: string; type: ToastType; message: string }) {
    const removeToast = useToastStore((s) => s.removeToast);
    const [visible, setVisible] = useState(false);

    const config = TOAST_CONFIG[type];
    const Icon = config.icon;

    useEffect(() => {
        // Trigger enter animation
        const timer = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(timer);
    }, []);

    const handleClose = () => {
        setVisible(false);
        setTimeout(() => removeToast(id), 200);
    };

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full
                ${config.bg} ${config.border}
                transition-all duration-200 ease-out
                ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}
            `}
            role="alert"
        >
            <Icon className={`w-5 h-5 flex-shrink-0 ${config.text}`} />
            <p className={`text-sm font-medium flex-1 ${config.text}`}>{message}</p>
            <button
                onClick={handleClose}
                className={`p-1 rounded-full hover:bg-black/5 transition ${config.text}`}
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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 md:bottom-6 md:right-6 md:left-auto md:translate-x-0 z-[9999] flex flex-col gap-2 items-center md:items-end pointer-events-none">
            {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                    <ToastItem id={t.id} type={t.type} message={t.message} />
                </div>
            ))}
        </div>
    );
}
