"use client";

// Onboarding Checklist — banner compacto que muestra cuántos pasos faltan para
// activar la tienda. Rediseñado 2026-04-24 (rama fix/merchant-onboarding-polish):
// antes era una lista full con progress bar + 9 items visibles; ahora arranca
// como banner de UNA línea con el primer paso pendiente + botón "Continuar".
// El merchant puede expandir para ver la lista completa si quiere, pero no
// saluda con un muro de información al entrar al dashboard.

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    CheckCircle2,
    Circle,
    ChevronRight,
    ChevronDown,
    ChevronUp,
    X,
    AlertTriangle,
    Lock,
} from "lucide-react";

interface OnboardingStatus {
    merchantId: string;
    merchantName: string;
    approvalStatus: string;
    hasCuit: boolean;
    hasBankAccount: boolean;
    hasConstanciaAfip: boolean;
    hasHabilitacion: boolean;
    hasRegistroSanitario: boolean;
    isFoodBusiness: boolean;
    docsComplete: boolean;
    hasLogo: boolean;
    hasSchedule: boolean;
    hasProducts: boolean;
    productCount: number;
    hasAddress: boolean;
    hasMercadoPago: boolean;
    canOpenStore: boolean;
    isComplete: boolean;
}

interface Step {
    id: string;
    label: string;
    completed: boolean;
    href: string;
    required: boolean;
    section: "docs" | "ops";
}

export default function OnboardingChecklist() {
    const [status, setStatus] = useState<OnboardingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [expanded, setExpanded] = useState(false);

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
    // Auto-hide cuando todos los OBLIGATORIOS están listos (canOpenStore=true).
    // No esperamos isComplete porque ese también incluye recomendados (MP) que
    // son opcionales: el merchant ya está operativo y no necesitamos seguir
    // ocupando pantalla en su dashboard. Si quiere ver el detalle, sigue
    // disponible expandiendo desde otro lugar (futuro: link en config).
    if (status.approvalStatus !== "APPROVED" || status.canOpenStore || dismissed) return null;

    const steps: Step[] = [
        { id: "cuit", label: "CUIT cargado", completed: status.hasCuit, href: "/comercios/configuracion", required: true, section: "docs" },
        { id: "bank", label: "CBU o Alias bancario", completed: status.hasBankAccount, href: "/comercios/configuracion", required: true, section: "docs" },
        { id: "afip", label: "Constancia AFIP", completed: status.hasConstanciaAfip, href: "/comercios/configuracion", required: true, section: "docs" },
        { id: "habilitacion", label: "Habilitación Municipal", completed: status.hasHabilitacion, href: "/comercios/configuracion", required: true, section: "docs" },
        ...(status.isFoodBusiness
            ? [{ id: "sanitario", label: "Registro Sanitario", completed: status.hasRegistroSanitario, href: "/comercios/configuracion", required: true, section: "docs" as const }]
            : []),
        // Logo: ahora OBLIGATORIO (rama fix/comercio-onboarding-completo) — el
        // backend bloquea approveMerchantTransition si Merchant.image es null.
        // Sin logo el comercio se ve roto en home/listado y reduce confianza.
        { id: "logo", label: "Subí tu logo", completed: status.hasLogo, href: "/comercios/mi-comercio", required: true, section: "ops" },
        { id: "schedule", label: "Configurá horarios", completed: status.hasSchedule, href: "/comercios/mi-comercio", required: true, section: "ops" },
        { id: "products", label: `Publicá productos (${status.productCount}/1 mín.)`, completed: status.hasProducts, href: "/comercios/productos/nuevo", required: true, section: "ops" },
        { id: "address", label: "Dirección del comercio", completed: status.hasAddress, href: "/comercios/mi-comercio", required: true, section: "ops" },
        { id: "mp", label: "Vinculá MercadoPago", completed: status.hasMercadoPago, href: "/comercios/configuracion", required: false, section: "ops" },
    ];

    const requiredSteps = steps.filter((s) => s.required);
    const completedRequired = requiredSteps.filter((s) => s.completed).length;
    const missingRequired = requiredSteps.filter((s) => !s.completed);
    const missingCount = missingRequired.length;
    const firstMissing = missingRequired[0];

    return (
        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            {/* Banner compacto — siempre visible */}
            <div className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                    {status.canOpenStore ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                        <Lock className="w-4 h-4 text-amber-600" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                        {status.canOpenStore ? (
                            `Tu tienda está lista para abrir (${completedRequired}/${requiredSteps.length})`
                        ) : (
                            `Te falta${missingCount === 1 ? "" : "n"} ${missingCount} paso${missingCount === 1 ? "" : "s"} para activar tu tienda`
                        )}
                    </p>
                    <p className="text-[11px] text-gray-500 truncate">
                        {firstMissing
                            ? `Próximo: ${firstMissing.label}`
                            : "Completaste todos los requisitos obligatorios"}
                    </p>
                </div>
                {firstMissing && (
                    <Link
                        href={firstMissing.href}
                        className="hidden sm:inline-flex items-center gap-1 bg-[#e60012] text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-[#cc000f] transition flex-shrink-0"
                    >
                        Continuar
                        <ChevronRight className="w-3 h-3" />
                    </Link>
                )}
                <button
                    onClick={() => setExpanded((e) => !e)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition flex-shrink-0"
                    title={expanded ? "Ocultar detalle" : "Ver detalle"}
                    aria-label={expanded ? "Ocultar detalle" : "Ver detalle"}
                >
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => setDismissed(true)}
                    className="p-1.5 text-gray-300 hover:text-gray-500 hover:bg-gray-50 rounded-lg transition flex-shrink-0"
                    title="Ocultar por ahora"
                    aria-label="Ocultar por ahora"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* CTA mobile — el botón "Continuar" queda debajo en pantallas chicas */}
            {firstMissing && (
                <div className="sm:hidden px-4 pb-3">
                    <Link
                        href={firstMissing.href}
                        className="w-full inline-flex items-center justify-center gap-1 bg-[#e60012] text-white text-xs font-semibold py-2 rounded-lg hover:bg-[#cc000f] transition"
                    >
                        Continuar con: {firstMissing.label}
                        <ChevronRight className="w-3 h-3" />
                    </Link>
                </div>
            )}

            {/* Detalle expandible */}
            {expanded && (
                <div className="border-t border-gray-100 bg-gray-50/30">
                    <OnboardingSection
                        title="Documentación"
                        steps={steps.filter((s) => s.section === "docs")}
                    />
                    <OnboardingSection
                        title="Configuración"
                        steps={steps.filter((s) => s.section === "ops")}
                    />
                </div>
            )}
        </div>
    );
}

function OnboardingSection({ title, steps }: { title: string; steps: Step[] }) {
    return (
        <div className="border-b last:border-b-0 border-gray-100">
            <div className="px-4 py-2 bg-white">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
                    {title}
                </p>
            </div>
            {steps.map((step) => (
                <Link
                    key={step.id}
                    href={step.href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${step.completed
                            ? "bg-green-50/40 hover:bg-green-50/60"
                            : "bg-white hover:bg-red-50/30"
                        }`}
                >
                    {step.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : step.required ? (
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    ) : (
                        <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    )}
                    <span
                        className={`flex-1 ${step.completed
                                ? "text-green-700 opacity-70"
                                : "text-gray-700 font-medium"
                            }`}
                    >
                        {step.label}
                    </span>
                    {!step.completed && step.required && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                            Obligatorio
                        </span>
                    )}
                    {!step.completed && !step.required && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                            Recomendado
                        </span>
                    )}
                    {!step.completed && (
                        <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                    )}
                </Link>
            ))}
        </div>
    );
}
