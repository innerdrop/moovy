"use client";

// fix/safe-area-pausa-rapida-y-card (2026-07-26): Pausar/Reanudar la tienda
// SIN ir a Horarios y estado. Es una acción de emergencia ("se me rompió el
// horno, cierro YA") — vive en el panel principal (variant="card") y en
// Pedidos (variant="compact"). Siempre con confirmación (modal Moovy, regla
// #24) para que nadie abra o cierre la tienda sin querer.
//
// Estado que toca: SOLO la pausa manual (merchant.isOpen) — el mismo botón y
// server action de Horarios (toggleMerchantOpen, con sus requisitos de
// apertura). El horario semanal sigue mandando: abierta acá + fuera de
// horario = cerrada para el cliente igual.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Loader2, Power } from "lucide-react";
import { toggleMerchantOpen } from "@/app/comercios/actions";
import { confirm as confirmModal } from "@/store/confirm";
import { toast } from "@/store/toast";

type Props = {
    /** Estado inicial cuando el padre (server) ya lo sabe. */
    initialIsOpen?: boolean;
    /** ¿El horario configurado dice que AHORA debería estar atendiendo?
     *  fix/comercio-pausa-stock-y-ajustes (founder 07-27): si el comercio abre
     *  9:00 y son las 8:30, no hay nada que pausar — la tienda ya está cerrada
     *  por horario. El botón se deshabilita y la tarjeta lo explica. */
    initialWithinSchedule?: boolean;
    /** "Mañana 09:00" — cuándo vuelve a abrir según el horario. */
    initialNextOpenLabel?: string | null;
    /** Página cliente sin datos del merchant: buscarlos solos (/api/merchant/me). */
    selfFetch?: boolean;
    /** "card" = tarjeta de estado (panel principal) · "compact" = fila angosta (Pedidos). */
    variant?: "card" | "compact";
};

export default function StorePauseCard({
    initialIsOpen = true,
    initialWithinSchedule = true,
    initialNextOpenLabel = null,
    selfFetch = false,
    variant = "card",
}: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(initialIsOpen);
    const [withinSchedule, setWithinSchedule] = useState(initialWithinSchedule);
    const [nextOpenLabel, setNextOpenLabel] = useState<string | null>(initialNextOpenLabel);
    const [ready, setReady] = useState(!selfFetch);
    const [approved, setApproved] = useState(!selfFetch);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!selfFetch) return;
        let alive = true;
        fetch("/api/merchant/me")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!alive || !d) return;
                if (typeof d.isOpen === "boolean") setIsOpen(d.isOpen);
                if (typeof d.withinSchedule === "boolean") setWithinSchedule(d.withinSchedule);
                if (typeof d.nextOpenLabel === "string" || d.nextOpenLabel === null) {
                    setNextOpenLabel(d.nextOpenLabel);
                }
                setApproved(d.approvalStatus === "APPROVED");
                setReady(true);
            })
            .catch(() => {
                // Sin datos no mostramos nada — mejor ausente que un botón mentiroso.
            });
        return () => {
            alive = false;
        };
    }, [selfFetch]);

    // Comercio no aprobado: la tienda no puede abrir todavía — no hay qué pausar.
    if (!ready || !approved) return null;

    const handleToggle = async () => {
        const pausing = isOpen;
        const ok = await confirmModal({
            title: pausing ? "¿Pausar la tienda?" : "¿Reanudar la tienda?",
            message: pausing
                ? "Al pausar:\n· Dejás de recibir pedidos nuevos AL INSTANTE.\n· Los clientes ven tu tienda como \"cerrada temporalmente\".\n· Los pedidos que ya tenés en curso SIGUEN — hay que prepararlos y entregarlos.\n· Queda pausada hasta que la reanudes VOS (el horario no la reabre solo)."
                : "Al reanudar:\n· Volvés a recibir pedidos al instante, dentro de tus horarios de atención.\n· Los clientes vuelven a ver tu tienda abierta.",
            confirmLabel: pausing ? "Sí, pausar" : "Sí, reanudar",
            cancelLabel: "Cancelar",
            variant: pausing ? "warning" : "default",
        });
        if (!ok) return;

        setBusy(true);
        const result = await toggleMerchantOpen(!pausing);
        if (result?.success) {
            const next = result.isOpen ?? !isOpen;
            setIsOpen(next);
            toast.success(next ? "Tienda reanudada — volvés a recibir pedidos" : "Tienda pausada");
            router.refresh();
        } else if (result?.error) {
            toast.error(result.error);
        }
        setBusy(false);
    };

    // Fuera de horario y sin pausa manual: no hay nada que pausar. (Si SÍ está
    // pausada manualmente, "Reanudar" sigue disponible: deja la tienda lista
    // para cuando el horario la abra sola.)
    const nothingToPause = isOpen && !withinSchedule;

    const button = (
        <button
            type="button"
            onClick={handleToggle}
            disabled={busy || nothingToPause}
            title={nothingToPause ? "Tu horario dice que ahora está cerrada — no hay pedidos que pausar" : undefined}
            className={`flex items-center gap-2 rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
                variant === "card" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-[13px]"
            } ${
                isOpen
                    ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                    : "bg-green-600 text-white hover:bg-green-700"
            }`}
        >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
            {isOpen ? "Pausar tienda" : "Reanudar tienda"}
        </button>
    );

    if (variant === "compact") {
        return (
            <div
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 ${
                    isOpen ? "bg-white border-gray-100" : "bg-red-50 border-red-200"
                }`}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            !isOpen ? "bg-red-500 animate-pulse" : nothingToPause ? "bg-gray-300" : "bg-green-500"
                        }`}
                    />
                    <span className={`text-sm font-bold truncate ${isOpen ? (nothingToPause ? "text-gray-500" : "text-gray-800") : "text-red-700"}`}>
                        {!isOpen
                            ? "Tienda pausada — no recibís pedidos"
                            : nothingToPause
                                ? `Cerrada por horario${nextOpenLabel ? ` · abre ${nextOpenLabel}` : ""}`
                                : "Tienda abierta"}
                    </span>
                </div>
                {button}
            </div>
        );
    }

    return (
        <div
            className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                !isOpen
                    ? "bg-red-50 border-red-200"
                    : nothingToPause
                        ? "bg-gray-50 border-gray-100"
                        : "bg-white border-gray-100 shadow-sm"
            }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        !isOpen
                            ? "bg-red-100 text-red-600"
                            : nothingToPause
                                ? "bg-gray-200 text-gray-500"
                                : "bg-green-100 text-green-600"
                    }`}
                >
                    {nothingToPause && isOpen ? <Clock className="w-5 h-5" /> : <Power className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                    <p className={`font-bold ${!isOpen ? "text-red-700" : nothingToPause ? "text-gray-600" : "text-gray-900"}`}>
                        {!isOpen ? "Tienda pausada" : nothingToPause ? "Cerrada por horario" : "Tienda abierta"}
                    </p>
                    <p className="text-[13px] text-gray-500 truncate">
                        {!isOpen
                            ? "No estás recibiendo pedidos hasta que la reanudes"
                            : nothingToPause
                                ? `Según tus horarios ahora no atendés${nextOpenLabel ? ` — abrís ${nextOpenLabel}` : ""}. No hay pedidos que pausar.`
                                : "Recibiendo pedidos según tus horarios"}
                    </p>
                </div>
            </div>
            {button}
        </div>
    );
}
