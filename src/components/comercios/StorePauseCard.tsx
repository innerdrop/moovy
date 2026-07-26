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
import { Loader2, Power } from "lucide-react";
import { toggleMerchantOpen } from "@/app/comercios/actions";
import { confirm as confirmModal } from "@/store/confirm";
import { toast } from "@/store/toast";

type Props = {
    /** Estado inicial cuando el padre (server) ya lo sabe. */
    initialIsOpen?: boolean;
    /** Página cliente sin datos del merchant: buscarlos solos (/api/merchant/me). */
    selfFetch?: boolean;
    /** "card" = tarjeta de estado (panel principal) · "compact" = fila angosta (Pedidos). */
    variant?: "card" | "compact";
};

export default function StorePauseCard({
    initialIsOpen = true,
    selfFetch = false,
    variant = "card",
}: Props) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(initialIsOpen);
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

    const button = (
        <button
            type="button"
            onClick={handleToggle}
            disabled={busy}
            className={`flex items-center gap-2 rounded-xl font-semibold transition disabled:opacity-60 ${
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
                            isOpen ? "bg-green-500" : "bg-red-500 animate-pulse"
                        }`}
                    />
                    <span className={`text-sm font-bold truncate ${isOpen ? "text-gray-800" : "text-red-700"}`}>
                        {isOpen ? "Tienda abierta" : "Tienda pausada — no recibís pedidos"}
                    </span>
                </div>
                {button}
            </div>
        );
    }

    return (
        <div
            className={`flex items-center justify-between gap-3 rounded-2xl border p-4 ${
                isOpen ? "bg-white border-gray-100 shadow-sm" : "bg-red-50 border-red-200"
            }`}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isOpen ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
                >
                    <Power className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                    <p className={`font-bold ${isOpen ? "text-gray-900" : "text-red-700"}`}>
                        {isOpen ? "Tienda abierta" : "Tienda pausada"}
                    </p>
                    <p className="text-[13px] text-gray-500 truncate">
                        {isOpen
                            ? "Recibiendo pedidos según tus horarios"
                            : "No estás recibiendo pedidos hasta que la reanudes"}
                    </p>
                </div>
            </div>
            {button}
        </div>
    );
}
