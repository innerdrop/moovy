"use client";

// Barra de continuidad del armado (feat/panel-inmediato-comercio): mientras la
// tienda no está lista, TODAS las páginas del panel muestran una barrita con el
// SIGUIENTE paso, linkeando directo a él. Es CLIENT y consulta /api/merchant/setup
// en cada cambio de ruta: el layout de Next no se re-renderiza al navegar, así
// que un cálculo server-side quedaría congelado (bug real: la barra seguía
// pidiendo documentación ya cargada). En el dashboard no se muestra (ahí vive
// la tarjeta-guía completa).

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

interface SetupState {
    setupMode: boolean;
    waitingApproval: boolean;
    doneCount: number;
    total: number;
    nextLabel: string | null;
    nextHref: string | null;
}

export default function SetupProgressBanner() {
    const pathname = usePathname();
    const [state, setState] = useState<SetupState | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/merchant/setup")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => { if (!cancelled && d) setState(d); })
            .catch(() => { /* silencioso: la barra es asistencia, no bloqueo */ });
        return () => { cancelled = true; };
    }, [pathname]);

    // El dashboard tiene la guía completa; y sin datos (o tienda lista) no hay barra.
    if (pathname === "/comercios" || !state || !state.setupMode) return null;

    if (state.waitingApproval) {
        return (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-2.5">
                <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white">✓</span>
                <p className="text-[13.5px] leading-snug text-emerald-800">
                    <b className="font-bold">¡Todo listo!</b> Estamos revisando tus documentos — en las próximas 24-48 hs hábiles tu tienda queda habilitada.
                </p>
            </div>
        );
    }

    if (!state.nextLabel || !state.nextHref) return null;

    return (
        <Link
            href={state.nextHref}
            className="mb-4 flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-2.5 shadow-sm transition hover:border-red-200 hover:shadow"
        >
            <span className="flex h-6 min-w-6 flex-shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-black text-white" style={{ backgroundColor: "#e60012" }}>
                {state.doneCount}/{state.total}
            </span>
            <p className="min-w-0 flex-1 truncate text-[13.5px] text-gray-600">
                Seguí armando tu tienda · <b className="font-bold text-gray-900">Siguiente: {state.nextLabel}</b>
            </p>
            <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
        </Link>
    );
}
