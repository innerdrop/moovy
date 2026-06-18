"use client";

// Chip de saldo de puntos MOOVER en el header (feat/puntos-wording-amex-y-acceso, 2026-06-18).
//
// Gesto "estilo Amex": el saldo de puntos siempre a la vista, como una tarjeta
// de recompensas. Linkea a /puntos. Solo se monta para usuarios logueados
// (lo decide AppHeader); además se auto-oculta si el saldo es 0 o no se pudo
// leer, para no mostrar un chip vacío a usuarios nuevos sin puntos.
//
// Un solo fetch al montar — el saldo no cambia dentro de una sesión de navegación
// (se gana al recibir un pedido), así que no hace falta polling.

import { useEffect, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

export default function PointsBalanceChip() {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        fetch("/api/points")
            .then((r) => (r.ok ? r.json() : null))
            .then((d) => {
                if (!cancelled && d && typeof d.balance === "number") {
                    setBalance(d.balance);
                }
            })
            .catch(() => {
                /* silent: el chip simplemente no aparece si falla */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Oculto mientras carga, si falla, o si no tiene puntos todavía.
    if (balance === null || balance <= 0) return null;

    return (
        <Link
            href="/puntos"
            aria-label={`Tenés ${balance.toLocaleString("es-AR")} puntos MOOVER`}
            className="flex items-center gap-1 h-9 px-2.5 rounded-full bg-amber-50 hover:bg-amber-100 text-[#e60012] font-bold text-sm transition active:scale-95"
            title="Mis puntos MOOVER"
        >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span>{balance.toLocaleString("es-AR")}</span>
        </Link>
    );
}
