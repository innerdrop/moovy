// ─────────────────────────────────────────────────────────────────────────────
// Reparto financiero del pago con Mercado Pago (split / marketplace_fee)
// Rama: fix/split-mp-reserva-y-operativo
//
// PROBLEMA QUE RESUELVE:
// En el split de MP, el comercio es el que COBRA y Moovy se lleva su parte como
// `marketplace_fee`. MP descuenta SU comisión PRIMERO (del comercio) y recién
// después saca el marketplace_fee. Si Moovy se llevaba "comisión + envío completo",
// cuando el envío era grande frente al producto NO quedaba plata para la comisión
// de MP → al comercio le daba negativo → MP rechazaba ("Algo salió mal / CPT01").
//
// SOLUCIÓN (toda la matemática vive acá, en una función pura y testeable):
//   1. El comprador cubre la comisión de MP: al envío se le suma un "buffer"
//      (gross-up) para que, después de que MP cobre lo suyo, queden intactos el
//      producto del comercio y el envío de Moovy.
//   2. Tope de seguridad: el marketplace_fee nunca deja al comercio sin su producto
//      → MP nunca rechaza (si pasara, Moovy cobra un poco menos: es el amortiguador).
//   3. El % de comisión de MP es CONFIGURABLE (Biblia/OPS): el día que MP suba,
//      se ajusta sin deploy.
//
// Reglas: montos redondeados a centavos (Math.round(x*100)/100), nunca negativos.
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
    /** Monto que MP aparta para Moovy (su comisión + el envío). Es el `marketplace_fee` de la preferencia. */
    marketplaceFee: number;
    /** Lo que DEBERÍA quedarle al comercio si MP cobra ~la reserva: subtotal - comisión. */
    expectedMerchantNet: number;
    /** Lo que DEBERÍA recibir Moovy: comisión + envío. */
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

    // 2) Parte ideal de Moovy: su comisión + el envío, MENOS el descuento que absorbe.
    const idealMoovyFee = Math.max(0, round2(commission + deliveryFee - discount));

    // 3) Moovy cobra SU parte completa (comisión + envío). El comercio es el que
    //    cobra, así que banca su propia comisión de MP según cómo configure su cuenta
    //    (al instante o a X días) — eso escapa de Moovy. ÚNICO tope: que al comercio no
    //    le quede negativo después de la comisión de MP (sino MP rechaza el pago). Usamos
    //    la reserva `r` como estimación máxima de esa comisión. En pedidos normales el
    //    tope no se activa: Moovy se lleva su comisión + envío enteros.
    const merchantFloor = round2(subtotal - commission); // informativo (ver expectedMerchantNet)
    const maxFee = round2(chargedTotal * (1 - r));
    const marketplaceFee = Math.max(0, round2(Math.min(idealMoovyFee, maxFee)));

    const notes: string[] = [];
    if (marketplaceFee + 0.01 < idealMoovyFee) {
        notes.push(
            `Tope de seguridad activado: Moovy recibe $${marketplaceFee} en vez de $${idealMoovyFee} ` +
            `para que al comercio no le quede negativo tras la comisión de MP (sino MP rechaza el pago). ` +
            `Pasa solo cuando el envío es enorme frente al producto.`
        );
    }

    return {
        buyerBuffer,
        chargedTotal,
        marketplaceFee,
        expectedMerchantNet: merchantFloor,
        expectedMoovyGross: idealMoovyFee,
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
