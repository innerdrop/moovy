// ─────────────────────────────────────────────────────────────────────────────
// Lectura del "% de reserva de comisión de MP" de la Biblia Financiera.
// Rama: fix/split-mp-reserva-y-operativo
//
// Es el % que el reparto del split aparta para cubrir la comisión que Mercado Pago
// le cobra al comercio (el cobrador). Si MP sube su comisión, se sube este número
// desde OPS, sin deploy. Default conservador 8% (regla #15: defaults conservadores).
//
// Robusto: si la columna todavía no existe en la DB (db push no corrido) o falla la
// query, devuelve 8 — el código sigue funcionando. Cache 1 min para no pegarle a la
// DB en cada pedido.
// ─────────────────────────────────────────────────────────────────────────────

import { prisma } from "@/lib/prisma";

const DEFAULT_MP_RESERVE_PERCENT = 8;
const TTL_MS = 60_000;

let _cache: { value: number; at: number } | null = null;

export async function getMpReservePercent(): Promise<number> {
    if (_cache && Date.now() - _cache.at < TTL_MS) return _cache.value;
    try {
        const settings = await prisma.storeSettings.findUnique({
            where: { id: "settings" },
            select: { mpReservePercent: true } as any,
        });
        const raw = (settings as any)?.mpReservePercent;
        // Acotado [0, 50]; si falta o es inválido, default 8.
        const value =
            typeof raw === "number" && raw >= 0 && raw <= 50 ? raw : DEFAULT_MP_RESERVE_PERCENT;
        _cache = { value, at: Date.now() };
        return value;
    } catch {
        return DEFAULT_MP_RESERVE_PERCENT;
    }
}
