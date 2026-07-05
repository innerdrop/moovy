// ─────────────────────────────────────────────────────────────────────────────
// Reparto financiero del pago con Mercado Pago (split / marketplace_fee)
// Rama: fix/split-mp-reserva-y-operativo
// Rama: fix/split-mp-cada-parte-paga-lo-suyo (2026-07-03) — Plan Maestro v1
//
// CÓMO FUNCIONA EL SPLIT DE MP:
// El comercio es el que COBRA y Moovy se lleva su parte como `marketplace_fee`.
// MP cobra su comisión (7,6% al instante) UNA sola vez y TODA al comercio,
// sobre el TOTAL de la operación. El marketplace_fee le llega a Moovy intacto.
//
// REGLA CANÓNICA (Plan Maestro v1): "MP 7,6% transparente — cada parte paga lo
// suyo". Como MP no puede cobrarle a Moovy directamente, Moovy se auto-descuenta
// su porción: pide un fee más chico, y esa plata que queda en manos del comercio
// compensa exactamente la parte del costo de MP que corresponde a Moovy.
//
//   marketplace_fee = (comisión + envío − descuento) × (1 − r)
//
// Resultado (algebraicamente exacto para CUALQUIER monto):
//   comercio recibe  (subtotal − comisión) × (1 − r)   → paga SU 7,6% y nada más
//   Moovy recibe     (comisión + envío − desc) × (1 − r) → paga SU 7,6% vía fee reducido
//   Además: el neto del comercio nunca puede dar negativo → el rechazo de MP
//   ("Algo salió mal / CPT01") es imposible por construcción.
//
// Si el comercio configura liberación diferida (MP le cobra menos que r), el
// ahorro es TODO para el comercio; lo de Moovy no cambia. r es CONFIGURABLE
// (Biblia/OPS): el día que MP cambie la tarifa, se ajusta sin deploy.
//
// Reglas: montos redondeados a centavos (Math.round(x*100)/100), nunca negativos.
// Verificación: scripts/verify-split-cada-parte.ts (barrido de montos extremos).
// ─────────────────────────────────────────────────────────────────────────────

const round2 = (n: number): number => Math.round(n * 100) / 100;

export interface MpSplitInput {
    /** Subtotal de productos (lo que es del comercio). */
    subtotal: number;
    /** Costo del viaje que paga el comprador por el envío (SIN operativo, SIN buffer de MP). */
    deliveryFee: number;
    /** Comisión de Moovy sobre el producto, en MONTO (no %). Ya calculada por el caller. */
    commission: number;
    /** % estimado que cobra MP por procesar (configurable en la Biblia). Ej. 8. */
    mpReservePercent: number;
    /**
     * Descuento aplicado (cupón/puntos), en MONTO. Default 0.
     * Regla canónica de la Biblia: "los cupones los absorbe Moovy" — el descuento
     * sale de la parte de Moovy, NO del producto del comercio. Por eso reduce el
     * marketplace_fee, no lo que recibe el comercio.
     */
    discount?: number;
    /**
     * Si true (Paso 2): el comprador paga un buffer para cubrir la comisión de MP
     * y Moovy cobra el envío COMPLETO. Cambia el total del pedido (lo valida el webhook).
     * Si false (Paso 1, default): NO se toca el total; Moovy absorbe la comisión de MP
     * (cobra un poco menos del envío) pero el pago NUNCA rechaza. Más seguro para arrancar.
     */
    grossUp?: boolean;
}

export interface MpSplitResult {
    /** Extra que el comprador paga para cubrir la comisión de MP (se suma al envío; solo en pagos con tarjeta/MP). */
    buyerBuffer: number;
    /** Total que paga el comprador = subtotal + deliveryFee + buyerBuffer. */
    chargedTotal: number;
    /** Monto que MP aparta para Moovy: (comisión + envío − desc) × (1 − r). Es el `marketplace_fee` de la preferencia. */
    marketplaceFee: number;
    /** Lo que le queda al comercio con MP cobrando r: (subtotal − comisión) × (1 − r). */
    expectedMerchantNet: number;
    /** Parte BRUTA de Moovy antes de su porción de MP: comisión + envío − descuento. */
    expectedMoovyGross: number;
    /** Avisos (ej. si se activó el tope y Moovy cobra menos de lo ideal). */
    notes: string[];
}

/**
 * Calcula el reparto del pago con MP para un pedido (split con el comercio como cobrador).
 * Función PURA: mismos inputs → mismos outputs. Es la única fuente de verdad del reparto MP,
 * usada tanto por el endpoint de pedidos como por el script de simulación.
 */
export function computeMpSplit(input: MpSplitInput): MpSplitResult {
    const subtotal = Math.max(0, input.subtotal);
    const deliveryFee = Math.max(0, input.deliveryFee);
    const commission = Math.max(0, input.commission);
    // El descuento se acota a [0, subtotal+envío] para no romper la cuenta.
    const discount = Math.min(Math.max(input.discount ?? 0, 0), subtotal + deliveryFee);
    // Defensivo: la reserva se acota a [0, 50] para no romper la cuenta nunca.
    const r = Math.min(Math.max(input.mpReservePercent, 0), 50) / 100;

    // 1) Gross-up: el comprador cubre la comisión de MP.
    //    Neto de la comisión de MP, queremos que queden (producto + envío − descuento).
    //    El descuento lo absorbe Moovy (regla Biblia), así que reduce lo que paga el
    //    comprador y, más abajo, la parte de Moovy — NUNCA el producto del comercio.
    const netTarget = round2(subtotal + deliveryFee - discount);
    // Paso 2 (grossUp=true): el comprador cubre la comisión de MP → chargedTotal sube.
    // Paso 1 (grossUp=false, default): el total NO se toca; Moovy absorbe la comisión.
    const grossUp = input.grossUp ?? false;
    const chargedTotal = grossUp && r < 1 ? round2(netTarget / (1 - r)) : netTarget;
    const buyerBuffer = round2(chargedTotal - netTarget);

    // 2) Parte BRUTA de Moovy: su comisión + el envío, MENOS el descuento que absorbe.
    const moovyGross = Math.max(0, round2(commission + deliveryFee - discount));

    // 3) Plan Maestro v1 — cada parte paga lo suyo: MP le cobra r sobre el TOTAL
    //    al comercio (que es quien cobra), así que Moovy se auto-descuenta SU
    //    porción pidiendo un fee reducido: parteBrutaMoovy × (1 − r). Con esto el
    //    comercio termina pagando exactamente r sobre SU parte, para cualquier
    //    monto. Nota: si el comercio configura liberación diferida y MP le cobra
    //    menos que r, el ahorro es todo del comercio (lo de Moovy no cambia).
    const idealFee = round2(moovyGross * (1 - r));

    //    Tope de seguridad histórico (CPT01): con la fórmula nueva el neto del
    //    comercio no puede dar negativo, así que el tope es matemáticamente
    //    inalcanzable — queda como defensa en profundidad por si la fórmula
    //    cambia el día de mañana.
    const merchantFloor = round2(Math.max(0, (subtotal - commission)) * (1 - r));
    const maxFee = round2(chargedTotal * (1 - r));
    const marketplaceFee = Math.max(0, round2(Math.min(idealFee, maxFee)));

    const notes: string[] = [];
    if (discount > commission + deliveryFee) {
        notes.push(
            `Descuento ($${discount}) mayor que la parte de Moovy ($${round2(commission + deliveryFee)}): ` +
            `el fee toca piso en $0 y el excedente del cupón recae en el comercio. ` +
            `Revisar la configuración de cupones — no deberían superar comisión + envío.`
        );
    }
    if (marketplaceFee + 0.01 < idealFee) {
        notes.push(
            `Tope de seguridad activado: Moovy recibe $${marketplaceFee} en vez de $${idealFee} ` +
            `para que al comercio no le quede negativo tras la comisión de MP (sino MP rechaza el pago).`
        );
    }

    return {
        buyerBuffer,
        chargedTotal,
        marketplaceFee,
        expectedMerchantNet: merchantFloor,
        expectedMoovyGross: moovyGross,
        notes,
    };
}

/**
 * Simula cómo MP reparte realmente el pago dado un % de comisión REAL.
 * Sirve para el script de simulación: muestra cuánto recibe cada uno y si MP rechazaría.
 * (MP cobra su comisión al COBRADOR -el comercio- sobre el total, y después transfiere
 *  el marketplace_fee a Moovy. Si el neto del comercio queda < 0, MP rechaza.)
 */
export function simulateActualSettlement(
    chargedTotal: number,
    marketplaceFee: number,
    actualMpFeePercent: number
): { mpFee: number; merchantNet: number; moovyNet: number; rejected: boolean } {
    const mpFee = round2((chargedTotal * actualMpFeePercent) / 100);
    const merchantNet = round2(chargedTotal - mpFee - marketplaceFee);
    const moovyNet = round2(marketplaceFee); // Moovy recibe el marketplace_fee (a confirmar con test real)
    return { mpFee, merchantNet, moovyNet, rejected: merchantNet < 0 };
}
