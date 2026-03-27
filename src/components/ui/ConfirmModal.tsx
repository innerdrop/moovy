"use client";

import { useConfirmStore } from "@/store/confirm";
import { AlertTriangle, Shield, HelpCircle } from "lucide-react";
import { useEffect, useRef } from "react";

const VARIANT_STYLES = {
    danger: {
        icon: AlertTriangle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        confirmBtn: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    },
    warning: {
        icon: Shield,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        confirmBtn: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
    },
    default: {
        icon: HelpCircle,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        confirmBtn: "bg-[#e60012] hover:bg-[#cc000f] focus:ring-red-500",
    },
};

export default function ConfirmModal() {
    const { isOpen, title, message, confirmLabel, cancelLabel, variant, onConfirm, onCancel, close } =
        useConfirmStore();
    const cancelRef = useRef<HTMLButtonElement>(null);

    // Focus cancel button on open (safer default)
    useEffect(() => {
        if (isOpen) cancelRef.current?.focus();
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onCancel ? onCancel() : close();
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onCancel, close]);

    if (!isOpen) return null;

    const styles = VARIANT_STYLES[variant];
    const Icon = styles.icon;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
            onClick={() => (onCancel ? onCancel() : close())}
        >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${styles.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-gray-900">{title}</h3>
                        <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{message}</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6 justify-end">
                    <button
                        ref={cancelRef}
                        onClick={() => (onCancel ? onCancel() : close())}
                        className="px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={() => onConfirm?.()}
                        className={`px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.confirmBtn}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
