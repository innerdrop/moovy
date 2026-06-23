// ─────────────────────────────────────────────────────────────────────────────
// Cálculo del pago al repartidor por pedido — FUENTE ÚNICA DE VERDAD
// Rama: fix/payout-repartidor-consistente
//
// PROBLEMA QUE RESUELVE:
// Antes, el panel "Mis ganancias" del repartidor calculaba `envío × 80%`, mientras
// que el cálculo del PAGO real (payouts.ts) usaba el snapshot exacto cuando existía
// y un `envío × 0.70` desactualizado cuando no. Resultado: el repartidor podía VER
// un monto y COBRAR otro. Viola la regla canónica "dos sistemas no calculan el mismo
// parámetro con valores distintos".
//
// SOLUCIÓN: esta función es la ÚNICA que calcula cuánto le corresponde al repartidor
// por un pedido. La usan TANTO el panel de ganancias COMO el cálculo de pagos.
//
// Lógica:
//   - Si el pedido tiene SubOrders del repartidor y TODOS tienen el snapshot
//     `driverPayoutAmount` (valor exacto e inmutable del Motor Logístico: 80% del
//     costo del viaje + bonus de zona), se suman esos valores. Es lo más preciso.
//   - Si falta el snapshot (pedidos viejos / sin SubOrder), fallback a
//     `envío × riderPercent%` (el % se lee de la Biblia, default 80).
//
// Nota: con el operativo retirado a 0, el envío (deliveryFee) = costo del viaje,
// así que `envío × 80%` es el fallback correcto (antes el 0.70 asumía un 5% operativo
// embebido que ya no existe).
// ─────────────────────────────────────────────────────────────────────────────

export interface OrderForDriverPayout {
    driverId: string | null;
    deliveryFee: number | null;
    subOrders: Array<{ driverId: string | null; driverPayoutAmount: number | null }>;
}

/**
 * Monto que Moovy le debe transferir al repartidor por ESTE pedido.
 * `riderPercent` viene de la Biblia (StoreSettings.riderCommissionPercent, default 80).
 * Devuelve un entero redondeado (pesos).
 */
export function computeDriverPayoutForOrder(
    order: OrderForDriverPayout,
    riderPercent: number
): number {
    const pct = Number.isFinite(riderPercent) && riderPercent > 0 ? riderPercent : 80;

    // SubOrders asignados a ESTE repartidor (multi-vendor puede tener drivers mixtos).
    const driverSubOrders = order.subOrders.filter((s) => s.driverId === order.driverId);
    const allHaveSnapshot =
        driverSubOrders.length > 0 &&
        driverSubOrders.every(
            (s) => s.driverPayoutAmount !== null && s.driverPayoutAmount !== undefined
        );

    if (allHaveSnapshot) {
        // Valor exacto del Motor Logístico (incluye bonus de zona). Inmutable.
        const sum = driverSubOrders.reduce((acc, s) => acc + (s.driverPayoutAmount ?? 0), 0);
        return Math.round(sum);
    }

    // Fallback: envío × % del repartidor (configurable). Con operativo en 0,
    // envío = costo del viaje, así que esto coincide con el snapshot en zona A.
    return Math.round((order.deliveryFee ?? 0) * (pct / 100));
}
