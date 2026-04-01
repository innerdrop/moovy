"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight, X } from "lucide-react";

interface OnboardingStatus {
    merchantId: string;
    merchantName: string;
    approvalStatus: string;
    hasLogo: boolean;
    hasSchedule: boolean;
    hasProducts: boolean;
    productCount: number;
    hasDeliverySettings: boolean;
    isComplete: boolean;
}

export default function OnboardingChecklist() {
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch("/api/merchant/onboarding");
                if (!response.ok) throw new Error("Failed to fetch");
                const data = await response.json();
                setStatus(data);
            } catch (err) {
                console.error("Error fetching onboarding status:", err);
                setError(err instanceof Error ? err.message : "Error");
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    if (loading) return null;
    if (error || !status) return null;
    if (status.approvalStatus !== "APPROVED" || status.isComplete || dismissed) return null;

    const steps = [
        { id: "logo", label: "Subí tu logo", completed: status.hasLogo, href: "/comercios/mi-comercio" },
        { id: "schedule", label: "Configurá horarios", completed: status.hasSchedule, href: "/comercios/mi-comercio" },
        { id: "products", label: `Agregá productos (${status.productCount}/3)`, completed: status.hasProducts, href: "/comercios/productos/nuevo" },
        { id: "delivery", label: "Configurá entregas", completed: status.hasDeliverySettings, href: "/comercios/configuracion" },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const pending = steps.filter((s) => !s.completed);

    return (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl px-4 py-3 border border-red-100 flex items-center gap-3 flex-wrap">
            {/* Progress */}
            <div className="flex items-center gap-2 flex-shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: "#e60012" }}>
                    {completedCount}/{steps.length}
                </div>
                <span className="text-sm font-semibold text-gray-800">Completá tu perfil:</span>
            </div>

            {/* Pending items as compact chips */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
                {pending.map((step) => (
                    <Link
                        key={step.id}
                        href={step.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-full text-xs font-medium text-gray-700 border border-gray-200 hover:border-red-300 hover:bg-red-50 transition shadow-sm"
                    >
                        <Circle className="w-3 h-3 text-gray-300" />
                        {step.label}
                        <ChevronRight className="w-3 h-3 text-gray-300" />
                    </Link>
                ))}

                {/* Show completed as small checkmarks */}
                {steps.filter(s => s.completed).map((step) => (
                    <span key={step.id} className="inline-flex items-center gap-1 px-2 py-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {step.label.split(" (")[0]}
                    </span>
                ))}
            </div>

            {/* Dismiss */}
            <button
                onClick={() => setDismissed(true)}
                className="text-gray-400 hover:text-gray-600 transition flex-shrink-0 p-1"
                title="Ocultar por ahora"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
