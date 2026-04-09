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
    const progressPercent = (completedCount / steps.length) * 100;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header with progress */}
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: "#e60012" }}
                    >
                        {completedCount}/{steps.length}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Completá tu perfil</p>
                        <p className="text-[11px] text-gray-400">Para empezar a recibir pedidos</p>
                    </div>
                </div>
                <button
                    onClick={() => setDismissed(true)}
                    className="text-gray-300 hover:text-gray-500 transition p-1"
                    title="Ocultar por ahora"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Progress bar */}
            <div className="px-4 pb-3">
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%`, backgroundColor: "#e60012" }}
                    />
                </div>
            </div>

            {/* Steps list — vertical on mobile, clean and tappable */}
            <div className="border-t border-gray-50">
                {steps.map((step, i) => (
                    <Link
                        key={step.id}
                        href={step.href}
                        className={`flex items-center gap-3 px-4 py-3 transition ${
                            step.completed
                                ? "bg-green-50/50"
                                : "hover:bg-red-50/50 active:bg-red-50"
                        } ${i < steps.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                        {step.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                            <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                            className={`text-sm font-medium flex-1 ${
                                step.completed ? "text-green-700 line-through decoration-green-300" : "text-gray-700"
                            }`}
                        >
                            {step.label}
                        </span>
                        {!step.completed && (
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
  