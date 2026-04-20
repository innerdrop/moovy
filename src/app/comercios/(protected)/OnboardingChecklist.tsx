"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, ChevronRight, X, AlertTriangle, Lock } from "lucide-react";

interface OnboardingStatus {
    merchantId: string;
    merchantName: string;
    approvalStatus: string;
    // Documentation
    hasCuit: boolean;
    hasBankAccount: boolean;
    hasConstanciaAfip: boolean;
    hasHabilitacion: boolean;
    hasRegistroSanitario: boolean;
    isFoodBusiness: boolean;
    docsComplete: boolean;
    // Operational
    hasLogo: boolean;
    hasSchedule: boolean;
    hasProducts: boolean;
    productCount: number;
    hasAddress: boolean;
    hasMercadoPago: boolean;
    // Overall
    canOpenStore: boolean;
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

    // Required documentation steps
    const docSteps = [
        { id: "cuit", label: "CUIT cargado", completed: status.hasCuit, href: "/comercios/configuracion", required: true },
        { id: "bank", label: "CBU o Alias bancario", completed: status.hasBankAccount, href: "/comercios/configuracion", required: true },
        { id: "afip", label: "Constancia AFIP", completed: status.hasConstanciaAfip, href: "/comercios/configuracion", required: true },
        { id: "habilitacion", label: "Habilitación Municipal", completed: status.hasHabilitacion, href: "/comercios/configuracion", required: true },
        ...(status.isFoodBusiness ? [{
            id: "sanitario", label: "Registro Sanitario", completed: status.hasRegistroSanitario, href: "/comercios/configuracion", required: true
        }] : []),
    ];

    // Operational steps
    const opSteps = [
        { id: "logo", label: "Subí tu logo", completed: status.hasLogo, href: "/comercios/mi-comercio", required: false },
        { id: "schedule", label: "Configurá horarios", completed: status.hasSchedule, href: "/comercios/mi-comercio", required: true },
        { id: "products", label: `Publicá productos (${status.productCount}/1 mín.)`, completed: status.hasProducts, href: "/comercios/productos/nuevo", required: true },
        { id: "address", label: "Dirección del comercio", completed: status.hasAddress, href: "/comercios/mi-comercio", required: true },
        { id: "mp", label: "Vinculá MercadoPago", completed: status.hasMercadoPago, href: "/comercios/configuracion", required: false },
    ];

    const allSteps = [...docSteps, ...opSteps];
    const requiredSteps = allSteps.filter(s => s.required);
    const completedRequired = requiredSteps.filter(s => s.completed).length;
    // ISSUE-037: un solo contador en toda la vista — el que importa es el de
    // requisitos OBLIGATORIOS, porque es el que gatea si la tienda puede abrir.
    // Los opcionales se ven abajo pero no cuentan en el número principal.
    const progressPercent = requiredSteps.length > 0
        ? (completedRequired / requiredSteps.length) * 100
        : 100;

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header with progress */}
            <div className="px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: "#e60012" }}
                    >
                        {completedRequired}/{requiredSteps.length}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-gray-900">Requisitos obligatorios</p>
                        <p className="text-[11px] text-gray-400">
                            {status.canOpenStore
                                ? "¡Tu tienda está lista para abrir!"
                                : "Completá los requisitos obligatorios para poder abrir tu tienda"
                            }
                        </p>
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

            {/* Store lock warning — ISSUE-037: sin repetir el contador, ya está arriba */}
            {!status.canOpenStore && (
                <div className="mx-4 mb-2 flex items-center gap-2 text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">
                    <Lock className="w-4 h-4 flex-shrink-0" />
                    <p className="text-xs font-medium">
                        Tu tienda permanecerá cerrada hasta que completes los requisitos obligatorios
                    </p>
                </div>
            )}

            {/* Documentation section */}
            <div className="border-t border-gray-50">
                <div className="px-4 py-2 bg-gray-50/50">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Documentación</p>
                </div>
                {docSteps.map((step, i) => (
                    <Link
                        key={step.id}
                        href={step.href}
                        className={`flex items-center gap-3 px-4 py-3 transition ${
                            step.completed
                                ? "bg-green-50/50"
                                : "hover:bg-red-50/50 active:bg-red-50"
                        } ${i < docSteps.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                        {step.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                        )}
                        <span
                            className={`text-sm font-medium flex-1 ${
                                // ISSUE-043: sin line-through (se leía como "eliminado").
                                // Mantenemos verde + opacidad reducida + el ✓ del ícono ya marca el estado.
                                step.completed ? "text-green-700 opacity-70" : "text-gray-700"
                            }`}
                        >
                            {step.label}
                        </span>
                        {!step.completed && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600 mr-1">Obligatorio</span>
                        )}
                        {!step.completed && (
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                    </Link>
                ))}
            </div>

            {/* Operational section */}
            <div className="border-t border-gray-100">
                <div className="px-4 py-2 bg-gray-50/50">
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Configuración</p>
                </div>
                {opSteps.map((step, i) => (
                    <Link
                        key={step.id}
                        href={step.href}
                        className={`flex items-center gap-3 px-4 py-3 transition ${
                            step.completed
                                ? "bg-green-50/50"
                                : "hover:bg-red-50/50 active:bg-red-50"
                        } ${i < opSteps.length - 1 ? "border-b border-gray-50" : ""}`}
                    >
                        {step.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                            <Circle className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span
                            className={`text-sm font-medium flex-1 ${
                                // ISSUE-043: sin line-through (se leía como "eliminado").
                                // Mantenemos verde + opacidad reducida + el ✓ del ícono ya marca el estado.
                                step.completed ? "text-green-700 opacity-70" : "text-gray-700"
                            }`}
                        >
                            {step.label}
                        </span>
                        {!step.completed && step.required && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600 mr-1">Obligatorio</span>
                        )}
                        {!step.completed && !step.required && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 mr-1">Recomendado</span>
                        )}
                        {!step.completed && (
                            <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}
