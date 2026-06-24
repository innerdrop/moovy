"use client";

// Botón de borrado permanente de un pre-registro en el panel OPS.
// Rama: fix/landing-fija-responsive-desktop
// Confirmación en dos pasos (sin window.confirm nativo, regla OPS #24).

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeleteLeadButton({ id, email }: { id: string; email: string }) {
    const router = useRouter();
    const [confirming, setConfirming] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const remove = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/ops/prelaunch/${id}`, { method: "DELETE" });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data.error || "No se pudo eliminar.");
                setLoading(false);
                return;
            }
            router.refresh();
        } catch {
            setError("Error de conexión.");
            setLoading(false);
        }
    };

    if (confirming) {
        return (
            <div className="flex items-center justify-end gap-2">
                <span className="text-xs text-slate-500">¿Eliminar a {email}?</span>
                <button
                    onClick={remove}
                    disabled={loading}
                    className="rounded-lg bg-[#e60012] px-2.5 py-1 text-xs font-bold text-white hover:bg-[#c2000f] disabled:opacity-50"
                >
                    {loading ? "Eliminando…" : "Sí, eliminar"}
                </button>
                <button
                    onClick={() => setConfirming(false)}
                    disabled={loading}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                >
                    Cancelar
                </button>
                {error && <span className="text-xs font-medium text-red-600">{error}</span>}
            </div>
        );
    }

    return (
        <button
            onClick={() => setConfirming(true)}
            className="rounded-lg px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
            title="Eliminar permanentemente"
        >
            Eliminar
        </button>
    );
}
