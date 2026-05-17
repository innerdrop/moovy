"use client";

// feat/feature-flags-ops (2026-05-13): wrapper que esconde una pagina/seccion
// completa si el feature flag esta OFF. Si el flag esta ON, renderiza
// children normal. Si esta OFF, muestra una pantalla "Función no disponible
// todavía" con un boton para volver.
//
// Uso:
//   <FeatureFlagGuard flag="merchant.publicidad" backHref="/comercios">
//     <PaginaDePublicidad />
//   </FeatureFlagGuard>
//
// Durante loading muestra un spinner (no parpadea ni la pantalla bloqueada
// ni el contenido, hasta saber si el flag esta ON u OFF).

import { useFeatureFlag } from "@/hooks/useFeatureFlags";
import { Lock, ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface FeatureFlagGuardProps {
    flag: string;
    children: React.ReactNode;
    /** Href del boton "Volver" cuando el flag esta OFF. Default "/" */
    backHref?: string;
    /** Texto del boton "Volver". Default "Volver al panel" */
    backLabel?: string;
    /** Titulo de la pantalla bloqueada. Default "Función no disponible todavía" */
    title?: string;
    /** Descripcion debajo del titulo. */
    description?: string;
}

export default function FeatureFlagGuard({
    flag,
    children,
    backHref = "/",
    backLabel = "Volver al panel",
    title = "Función no disponible todavía",
    description = "El equipo de Moovy todavía no activó esta función. Te avisaremos cuando esté lista.",
}: FeatureFlagGuardProps) {
    const { flag: isActive, loading } = useFeatureFlag(flag);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        );
    }

    if (!isActive) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="w-6 h-6 text-gray-400" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900 mb-2">{title}</h2>
                    <p className="text-sm text-gray-500 mb-6">{description}</p>
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#e60012] text-white text-sm font-semibold rounded-lg hover:bg-[#cc000f] transition"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {backLabel}
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
