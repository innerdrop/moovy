/**
 * ── Pagos pendientes a drivers y merchants ──────────────────────────────────
 *
 * CERO TOLERANCIA A ERRORES — este módulo calcula plata real que Moovy debe
 * transferir. Reglas:
 *
 *   - Un `PayoutItem` dentro de un `PayoutBatch` con `status: "PAID"` consume
 *     los orderIds listados en `ordersIncluded`. Esos orders NO se pueden
 *     volver a incluir en un batch nuevo.
 *   - Un `PayoutBatch` en estado DRAFT o GENERATED todavía NO consumió los
 *     orders (el admin puede cancelar el batch antes de confirmar el pago).
 *   - El monto merchant se toma de `Order.merchantPayout` (campo ya calculado
 *     al crear la orden con la comisión vigente).
 *   - El monto driver lo calcula `computeDriverPayoutForOrder` (src/lib/finance/
 *     driver-payout.ts): snapshot exacto `SubOrder.driverPayoutAmount` (incluye
 *     bonus de zona) si existe; si no, `deliveryFee * riderCommissionPercent%`.
 *     Es la MISMA función que usa el panel "Mis ganancias" del repartidor, así
 *     que el repartidor cobra EXACTAMENTE lo que ve (rama fix/payout-repartidor-
 *     consistente). Reemplaza la vieja aproximación fija de 0.70.
 *
 * Fuentes de verdad:
 *   - Orders DELIVERED (status = "DELIVERED", no soft-deleted)
 *   - Para merchant: `Order.merchantPayout` > 0
 *   - Para driver: `Order.driverId != null && Order.deliveryFee > 0`
 *   - Flag de exclusión: orderId NO presente en PayoutItem de batch PAID
 */

import { prisma } from "@/lib/prisma";
// Rama fix/payout-repartidor-consistente: fuente ÚNICA de verdad del pago al
// repartidor (la misma función la usa el panel "Mis ganancias"), para que el
// repartidor cobre EXACTAMENTE lo que ve. Reemplaza la aproximación DRIVER_SHARE 0.70.
import { computeDriverPayoutForOrder } from "@/lib/finance/driver-payout";

export type RecipientType = "DRIVER" | "MERCHANT";

export interface PendingPayoutSummary {
    recipientType: RecipientType;
    recipientId: string;
    recipientName: string;
    bankAccount: string | null;
    cuit: string | null;
    orderCount: number;
    totalAmount: number;
    orderIds: string[];
}

/**
 * Devuelve el conjunto de orderIds que ya están consumidos en batches PAID.
 * Se usa para excluir a la hora de calcular saldos pendientes frescos.
 */
export async function getAlreadyPaidOrderIds(recipientType: RecipientType): Promise<Set<string>> {
    const items = await prisma.payoutItem.findMany({
        where: {
            recipientType,
            batch: { status: "PAID" },
        },
        select: { ordersIncluded: true },
    });

    const set = new Set<string>();
    for (const it of items) {
        try {
            const arr = JSON.parse(it.ordersIncluded);
            if (Array.isArray(arr)) for (const oid of arr) if (typeof oid === "string") set.add(oid);
        } catch {
            // ordersIncluded corrupto — logeamos y seguimos
            console.warn("[payouts] ordersIncluded no es JSON válido en PayoutItem", it);
        }
    }
    return set;
}

/**
 * También excluimos orderIds que están en batches DRAFT o GENERATED para
 * evitar que dos batches DRAFT simultáneos incluyan el mismo order (double
 * pay race). Así solo el batch que primero pase a PAID "gana" esos orders.
 */
export async function getOrderIdsInOpenBatches(
    recipientType: RecipientType,
    excludeBatchId?: string,
): Promise<Set<string>> {
    const items = await prisma.payoutItem.findMany({
        where: {
            recipientType,
            batch: {
                status: { in: ["DRAFT", "GENERATED"] },
                ...(excludeBatchId ? { id: { not: excludeBatchId } } : {}),
            },
        },
        select: { ordersIncluded: true },
    });

    const set = new Set<string>();
    for (const it of items) {
        try {
            const arr = JSON.parse(it.ordersIncluded);
            if (Array.isArray(arr)) for (const oid of arr) if (typeof oid === "string") set.add(oid);
        } catch {
            console.warn("[payouts] ordersIncluded no es JSON válido", it);
        }
    }
    return set;
}

/**
 * Calcula saldos pendientes para todos los merchants que tienen al menos 1 order
 * DELIVERED con merchantPayout > 0 y no están todavía en un PayoutItem de batch PAID.
 */
export async function getPendingMerchantPayouts(): Promise<PendingPayoutSummary[]> {
    const [paidIds, openIds] = await Promise.all([
        getAlreadyPaidOrderIds("MERCHANT"),
        getOrderIdsInOpenBatches("MERCHANT"),
    ]);
    const excludedIds = new Set([...paidIds, ...openIds]);

    const orders = await prisma.order.findMany({
        where: {
            status: "DELIVERED",
            deletedAt: null,
            merchantId: { not: null },
            merchantPayout: { gt: 0 },
            id: excludedIds.size > 0 ? { notIn: Array.from(excludedIds) } : undefined,
        },
        select: {
            id: true,
            merchantId: true,
            merchantPayout: true,
            merchant: {
                select: {
                    id: true,
                    name: true,
                    businessName: true,
                    bankAccount: true,
                    cuit: true,
                },
            },
        },
    });

    // Agrupamos por merchantId
    const map = new Map<string, PendingPayoutSummary>();
    for (const o of orders) {
        if (!o.merchantId || !o.merchant) continue;
        const key = o.merchantId;
        const current = map.get(key);
        const amount = o.merchantPayout ?? 0;
        if (current) {
            current.totalAmount += amount;
            current.orderCount += 1;
            current.orderIds.push(o.id);
        } else {
            map.set(key, {
                recipientType: "MERCHANT",
                recipientId: o.merchantId,
                // businessName es nullable en schema; caemos a Merchant.name (NOT NULL)
                // y a un placeholder defensivo. PayoutItem.recipientName es NOT NULL.
                recipientName: o.merchant.businessName ?? o.merchant.name ?? "(comercio sin nombre)",
                bankAccount: o.merchant.bankAccount ?? null,
                cuit: o.merchant.cuit ?? null,
                orderCount: 1,
                totalAmount: amount,
                orderIds: [o.id],
            });
        }
    }

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Calcula saldos pendientes para drivers. Mismo patrón que merchants pero
 * sobre `driverId`, usando `computeDriverPayoutForOrder` (la MISMA función que
 * el panel "Mis ganancias") para que el repartidor cobre lo que ve.
 */
export async function getPendingDriverPayouts(): Promise<PendingPayoutSummary[]> {
    const [paidIds, openIds] = await Promise.all([
        getAlreadyPaidOrderIds("DRIVER"),
        getOrderIdsInOpenBatches("DRIVER"),
    ]);
    const excludedIds = new Set([...paidIds, ...openIds]);

    // % del repartidor desde la Biblia (MISMA fuente que el panel "Mis ganancias").
    const settings = await prisma.storeSettings.findUnique({ where: { id: "settings" } });
    const riderPercent = (settings as any)?.riderCommissionPercent ?? 80;

    const orders = await prisma.order.findMany({
        where: {
            status: "DELIVERED",
            deletedAt: null,
            driverId: { not: null },
            deliveryFee: { gt: 0 },
            id: excludedIds.size > 0 ? { notIn: Array.from(excludedIds) } : undefined,
        },
        select: {
            id: true,
            driverId: true,
            deliveryFee: true,
            // SubOrders del driver: computeDriverPayoutForOrder usa driverPayoutAmount
            // (snapshot exacto) si todos lo tienen; si no, fallback envío × riderPercent%.
            subOrders: {
                select: {
                    driverId: true,
                    driverPayoutAmount: true,
                },
            },
            driver: {
                select: {
                    id: true,
                    cuit: true,
                    bankCbu: true,
                    bankAlias: true,
                    user: { select: { id: true, name: true, email: true } },
                },
            },
        },
    });

    const map = new Map<string, PendingPayoutSummary>();
    for (const o of orders) {
        if (!o.driverId || !o.driver) continue;
        const key = o.driverId;

        // fix/payout-repartidor-consistente: función ÚNICA de cálculo (la MISMA que
        // usa el panel "Mis ganancias") → el repartidor cobra exactamente lo que ve.
        // Snapshot exacto (incluye bonus de zona) si existe; si no, envío × riderPercent%.
        const amount = computeDriverPayoutForOrder(o, riderPercent);
        // feat/driver-bank-mp (2026-04-26): Driver ya tiene bankCbu/bankAlias en schema.
        // Preferimos CBU (más preciso); fallback a Alias. Si ambos null, queda null y el
        // endpoint POST de batches rechaza el recipient — el admin sabe que falta el dato
        // y debe pedirle al driver que lo cargue desde su panel (/repartidor/configuracion).
        const driverBank: string | null = o.driver.bankCbu || o.driver.bankAlias || null;
        const current = map.get(key);
        if (current) {
            current.totalAmount += amount;
            current.orderCount += 1;
            current.orderIds.push(o.id);
        } else {
            map.set(key, {
                recipientType: "DRIVER",
                recipientId: o.driverId,
                recipientName: o.driver.user?.name || o.driver.user?.email || "(sin nombre)",
                bankAccount: driverBank,
                cuit: o.driver.cuit ?? null,
                orderCount: 1,
                totalAmount: amount,
                orderIds: [o.id],
            });
        }
    }

    // Truncamos amounts a 2 decimales ARS
    for (const v of map.values()) {
        v.totalAmount = Math.round(v.totalAmount * 100) / 100;
    }

    return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Genera CSV para importar a MP Bulk Transfer / banco.
 * Formato: CUIT;Nombre;CBU/Alias;Monto;Concepto
 */
export function buildPayoutCsv(batch: {
    id: string;
    batchType: string;
    items: Array<{
        recipientName: string;
        cuit: string | null;
        bankAccount: string | null;
        amount: number;
    }>;
}): string {
    const header = "CUIT;Nombre;CBU/Alias;Monto;Concepto";
    const rows = batch.items.map((i) => {
        const cuit = i.cuit?.replace(/[^\d]/g, "") ?? "";
        const name = (i.recipientName || "").replace(/;/g, ",");
        const cbu = (i.bankAccount || "").replace(/;/g, "");
        const amt = i.amount.toFixed(2);
        const concept = `MOOVY_${batch.batchType}_${batch.id.substring(0, 8)}`;
        return `${cuit};${name};${cbu};${amt};${concept}`;
    });
    return [header, ...rows].join("\n");
}
