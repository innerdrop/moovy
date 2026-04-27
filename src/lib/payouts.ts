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
 *   - El monto driver se aproxima como `Order.deliveryFee * DRIVER_SHARE`
 *     (0.70) — aproximación conservadora que contempla el 5% operativo del
 *     delivery fee visible + el 80% del costo real del viaje (ver Biblia v3).
 *
 * Esta aproximación del driver NO es exacta porque el schema no guarda el
 * `riderEarnings` real de cada orden. Es el mismo trade-off usado hoy para
 * mostrar "Mis ganancias" en el portal del driver — queda pendiente para una
 * iteración futura agregar `Order.driverPayout` al schema y hacerlo exacto.
 *
 * Fuentes de verdad:
 *   - Orders DELIVERED (status = "DELIVERED", no soft-deleted)
 *   - Para merchant: `Order.merchantPayout` > 0
 *   - Para driver: `Order.driverId != null && Order.deliveryFee > 0`
 *   - Flag de exclusión: orderId NO presente en PayoutItem de batch PAID
 */

import { prisma } from "@/lib/prisma";

// Aproximación del share del driver sobre el deliveryFee visible.
// 80% del costo real del viaje; el costo real es ~87.5% del visible
// (resto es 5% operativo + buffer). 0.80 * 0.875 ≈ 0.70.
export const DRIVER_SHARE = 0.70;

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
 * sobre `driverId` y con la aproximación `deliveryFee * DRIVER_SHARE`.
 */
export async function getPendingDriverPayouts(): Promise<PendingPayoutSummary[]> {
    const [paidIds, openIds] = await Promise.all([
        getAlreadyPaidOrderIds("DRIVER"),
        getOrderIdsInOpenBatches("DRIVER"),
    ]);
    const excludedIds = new Set([...paidIds, ...openIds]);

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
        const amount = (o.deliveryFee ?? 0) * DRIVER_SHARE;
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
