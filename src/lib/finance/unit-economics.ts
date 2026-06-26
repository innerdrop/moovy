// Unit Economics — cálculo puro del margen de contribución por pedido.
// Rama: feat/dashboard-unit-economics
//
// Funciones PURAS (sin DB, sin side effects) para que sean testeables con
// simulación financiera (regla canónica: features que tocan plata llevan test).
// El route /api/ops/unit-economics mapea Prisma → estos tipos y agrega.
//
// MODELO (todo READ-ONLY sobre snapshots congelados, nunca recalcula cobros):
//   ingreso_moovy   = Σ moovyCommission  +  (Σ deliveryFee − Σ driverPayout)
//   costo_mp        = lo cobra MP al COMERCIO (que es el que cobra). Moovy NO lo paga;
//                     se calcula como referencia pero NO se resta al margen de Moovy.
//   descuento       = order.discount                (cupón, lo absorbe Moovy)
//   margen          = ingreso_moovy − descuento

export const round2 = (n: number) => Math.round(n * 100) / 100;

export interface SubOrderEcoInput {
    deliveryFee: number;
    moovyCommission: number | null;
    driverPayoutAmount: number | null;
}

export interface OrderEcoInput {
    id: string;
    orderNumber: string;
    createdAt: Date;
    subtotal: number;
    total: number;
    discount: number;
    distanceKm: number | null;
    isMultiVendor: boolean;
    subOrders: SubOrderEcoInput[];
}

export interface OrderEcoRow {
    id: string;
    orderNumber: string;
    createdAt: Date;
    isMultiVendor: boolean;
    subtotal: number;
    deliveryFee: number;
    deliveryPct: number;
    moovyCommission: number;
    driverPayout: number;
    mpCost: number;
    discount: number;
    margin: number;
    /** Un payout por SubOrder = un viaje (para el promedio "payout por viaje"). */
    tripPayouts: number[];
}

/**
 * Payout del driver para un SubOrder. Usa el snapshot inmutable; si es null
 * (pedido pre-refactor sin snapshot) cae a un fallback conservador del 80% del
 * fee de ese SubOrder.
 */
export function resolveDriverPayout(s: SubOrderEcoInput): number {
    if (s.driverPayoutAmount != null) return s.driverPayoutAmount;
    return Math.round((s.deliveryFee || 0) * 0.8);
}

/** Economía de un pedido (con sus SubOrders) a partir de snapshots congelados. */
export function computeOrderEconomics(o: OrderEcoInput, mpFeePercent: number): OrderEcoRow {
    const moovyCommission = o.subOrders.reduce((a, s) => a + (s.moovyCommission || 0), 0);
    const deliveryFee = o.subOrders.reduce((a, s) => a + (s.deliveryFee || 0), 0);

    const tripPayouts = o.subOrders.map(resolveDriverPayout);
    const driverPayout = tripPayouts.reduce((a, b) => a + b, 0);

    const deliveryMargin = deliveryFee - driverPayout; // lo que Moovy retiene del envío
    const moovyGross = moovyCommission + deliveryMargin;
    const discount = o.discount || 0;
    // Rama fix/split-mp-grossup-comprador: el que cobra es el comercio, que banca su
    // propia comisión de MP. Moovy cobra su comisión + envío LIMPIOS, sin pagar MP.
    // mpCost queda como REFERENCIA de lo que cobra MP (lo paga el comercio), pero NO se
    // le resta al margen de Moovy.
    const mpCost = round2((mpFeePercent / 100) * (o.total || 0));
    // Moovy NO resta MP (lo banca el comercio). Solo absorbe el descuento (cupón).
    const margin = round2(moovyGross - discount);

    const subtotal = o.subtotal || 0;
    const deliveryPct = subtotal > 0 ? round2((deliveryFee / subtotal) * 100) : 0;

    return {
        id: o.id,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        isMultiVendor: o.isMultiVendor,
        subtotal: round2(subtotal),
        deliveryFee: round2(deliveryFee),
        deliveryPct,
        moovyCommission: round2(moovyCommission),
        driverPayout: round2(driverPayout),
        mpCost,
        discount: round2(discount),
        margin,
        tripPayouts,
    };
}

export interface EconomicsSummary {
    orderCount: number;
    moovyRevenue: number;
    moovyCommissionTotal: number;
    deliveryMarginTotal: number;
    mpCostTotal: number;
    discountTotal: number;
    driverPayoutTotal: number;
    contributionMargin: number;
    avgMarginPerOrder: number;
    avgDeliveryPct: number;
    avgDriverPayout: number;
    avgDistance: number | null;
    negativeMarginCount: number;
    highDeliveryShareCount: number;
}

export interface BreakEven {
    fixedMonthlyCost: number;
    avgMarginPerOrder: number;
    ordersToBreakEven: number | null;
    ordersThisMonth: number;
    breakEvenProgressPct: number;
}

export interface AggregateResult {
    summary: EconomicsSummary;
    breakEven: BreakEven;
    rows: OrderEcoRow[];
}

/**
 * Agrega un conjunto de pedidos entregados en métricas de unit economics.
 * `now` se inyecta para testabilidad (cálculo de "este mes").
 */
export function aggregateEconomics(
    orders: OrderEcoInput[],
    opts: { mpFeePercent: number; fixedMonthlyCost: number; now: Date }
): AggregateResult {
    const { mpFeePercent, fixedMonthlyCost, now } = opts;
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let sumMoovyCommission = 0;
    let sumDeliveryFee = 0;
    let sumDriverPayout = 0;
    let sumMpCost = 0;
    let sumDiscount = 0;
    let sumMargin = 0;
    let sumDeliveryPct = 0;
    let sumDistance = 0;
    let distanceCount = 0;
    let negativeMarginCount = 0;
    let highDeliveryShareCount = 0;
    let ordersThisMonth = 0;
    const allTripPayouts: number[] = [];

    const rows = orders.map((o) => {
        const row = computeOrderEconomics(o, mpFeePercent);
        sumMoovyCommission += row.moovyCommission;
        sumDeliveryFee += row.deliveryFee;
        sumDriverPayout += row.driverPayout;
        sumMpCost += row.mpCost;
        sumDiscount += row.discount;
        sumMargin += row.margin;
        sumDeliveryPct += row.deliveryPct;
        if (row.margin < 0) negativeMarginCount++;
        if (row.subtotal > 0 && row.deliveryFee / row.subtotal > 0.4) highDeliveryShareCount++;
        if (o.distanceKm != null) { sumDistance += o.distanceKm; distanceCount++; }
        if (o.createdAt >= thisMonthStart) ordersThisMonth++;
        for (const p of row.tripPayouts) allTripPayouts.push(p);
        return row;
    });

    const orderCount = rows.length;
    const deliveryMarginTotal = sumDeliveryFee - sumDriverPayout;
    const moovyGrossTotal = sumMoovyCommission + deliveryMarginTotal;
    // Moovy NO resta MP (lo banca el comercio). sumMpCost queda como referencia.
    const contributionMargin = round2(moovyGrossTotal - sumDiscount);
    const avgMarginPerOrder = orderCount > 0 ? round2(contributionMargin / orderCount) : 0;
    const avgDeliveryPct = orderCount > 0 ? round2(sumDeliveryPct / orderCount) : 0;
    const avgDriverPayout = allTripPayouts.length > 0
        ? round2(allTripPayouts.reduce((a, b) => a + b, 0) / allTripPayouts.length)
        : 0;
    const avgDistance = distanceCount > 0 ? round2(sumDistance / distanceCount) : null;

    const ordersToBreakEven = avgMarginPerOrder > 0 ? Math.ceil(fixedMonthlyCost / avgMarginPerOrder) : null;
    const breakEvenProgressPct = ordersToBreakEven && ordersToBreakEven > 0
        ? round2(Math.min(100, (ordersThisMonth / ordersToBreakEven) * 100))
        : 0;

    return {
        summary: {
            orderCount,
            moovyRevenue: round2(moovyGrossTotal),
            moovyCommissionTotal: round2(sumMoovyCommission),
            deliveryMarginTotal: round2(deliveryMarginTotal),
            mpCostTotal: round2(sumMpCost),
            discountTotal: round2(sumDiscount),
            driverPayoutTotal: round2(sumDriverPayout),
            contributionMargin,
            avgMarginPerOrder,
            avgDeliveryPct,
            avgDriverPayout,
            avgDistance,
            negativeMarginCount,
            highDeliveryShareCount,
        },
        breakEven: {
            fixedMonthlyCost,
            avgMarginPerOrder,
            ordersToBreakEven,
            ordersThisMonth,
            breakEvenProgressPct,
        },
        rows,
    };
}
