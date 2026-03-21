"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight, Sparkles } from "lucide-react";

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

    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const response = await fetch("/api/merchant/onboarding");
                if (!response.ok) {
                    throw new Error("Failed to fetch onboarding status");
                }
                const data = await response.json();
                setStatus(data);
            } catch (err) {
                console.error("Error fetching onboarding status:", err);
                setError(err instanceof Error ? err.message : "Error al cargar estado");
            } finally {
                setLoading(false);
            }
        };

        fetchStatus();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="animate-pulse space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-1/2" />
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                        <div className="h-4 bg-gray-200 rounded w-full" />
                    </div>
                </div>
            </div>
        );
    }

    if (error || !status) {
        return null;
    }

    // Only show if merchant is not approved or onboarding is not complete
    if (status.approvalStatus !== "APPROVED" || status.isComplete) {
        return null;
    }

    const steps = [
        {
            id: "logo",
            title: "Sube tu logo",
            description: "La imagen de tu comercio es lo primero que ven los clientes",
            completed: status.hasLogo,
            href: "/comercios/configuracion",
            icon: "📸",
        },
        {
            id: "schedule",
            title: "Configura horarios",
            description: "Define cuándo está abierto tu comercio",
            completed: status.hasSchedule,
            href: "/comercios/configuracion",
            icon: "🕐",
        },
        {
            id: "products",
            title: "Agrega productos",
            description: `${status.productCount}/3 productos mínimos`,
            completed: status.hasProducts,
            href: "/comercios/productos/nuevo",
            icon: "📦",
        },
        {
            id: "delivery",
            title: "Configura entregas",
            description: "Radio de cobertura y monto mínimo",
            completed: status.hasDeliverySettings,
            href: "/comercios/configuracion",
            icon: "🚗",
        },
    ];

    const completedCount = steps.filter((s) => s.completed).length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 shadow-sm border border-red-100">
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6" style={{ color: "#e60012" }} />
                </div>
                <div className="flex-1">
                    <h2 className="text-lg font-bold text-gray-900">Completa tu perfil</h2>
                    <p className="text-sm text-gray-600">
                        Finaliza estos pasos para activar completamente tu comercio
                    </p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Progreso</span>
                    <span className="text-sm font-bold" style={{ color: "#e60012" }}>
                        {completedCount}/{steps.length}
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%`, backgroundColor: "#e60012" }}
                    />
                </div>
            </div>

            {/* Steps List */}
            <div className="space-y-3">
                {steps.map((step, index) => (
                    <Link
                        key={step.id}
                        href={step.href}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                            step.completed
                                ? "bg-white border-green-200 hover:border-green-300"
                                : "bg-white border-gray-200 hover:border-red-300 hover:bg-red-50"
                        }`}
                    >
                        {/* Icon */}
                        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                            {step.completed ? (
                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                            ) : (
                                <Circle className="w-6 h-6 text-gray-300" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xl">{step.icon}</span>
                                <p
                                    className={`font-semibold ${
                                        step.completed ? "text-green-700" : "text-gray-900"
                                    }`}
                                >
                                    {step.title}
                                </p>
                                {step.completed && (
                                    <span className="text-xs font-bold px-2 py-1 bg-green-100 text-green-700 rounded-full ml-auto">
                                        Hecho
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">{step.description}</p>
                        </div>

                        {/* Arrow */}
                        {!step.completed && (
                            <div className="flex-shrink-0">
                                <ChevronRight className="w-5 h-5 text-gray-300" />
                            </div>
                        )}
                    </Link>
                ))}
            </div>

            {/* Tip */}
            <div className="mt-6 p-4 bg-white rounded-xl border border-amber-200 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                    <p className="font-semibold text-gray-900 mb-1">💡 Consejo</p>
                    <p className="text-gray-600">
                        Un perfil completo atrae más clientes. Los compradores ven tu logo, horarios y catálogo antes de ordenar.
                    </p>
                </div>
            </div>
        </div>
    );
}
