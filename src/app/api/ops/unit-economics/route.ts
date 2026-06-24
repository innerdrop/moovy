// Unit Economics — margen de contribución por pedido + break-even
// Rama: feat/dashboard-unit-economics
//
// READ-ONLY sobre el flujo de dinero: lee los snapshots inmutables ya
// persistidos en SubOrder (deliveryFee, driverPayoutAmount, moovyCommission) y
// los financieros del Order (total, discount). NUNCA recalcula el cobro — solo
// reporta (regla canónica FINANZAS: el snapshot cerrado no se toca, necesario
// para cierres AFIP). El cálculo puro vive en lib/finance/unit-economics.
//
// Dos parámetros de REPORTE (no afectan ningún cobro) viven en MoovyConfig
// para no hardcodear (regla #10, anti-fantasma):
//   - unit_economics_fixed_monthly_cost  (gastos fijos $/mes, default 440000)
//   - unit_economics_mp_fee_percent      (fee real MP %, default 3.81)
// El PATCH los edita. Son solo de reporting/break-even, NO entran al cobro.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { aggregateEconomics } from "@/lib/finance/unit-economics";

const FIXED_COST_KEY = "unit_economics_fixed_monthly_cost";
const MP_FEE_KEY = "unit_economics_mp_fee_percent";
const FIXED_COST_DEFAULT = 440000;
const MP_FEE_DEFAULT = 3.81;

/** Lee los 2 parámetros de reporte de MoovyConfig con fallback conservador (regla #15). */
async function loadReportConfig(): Promise<{ fixedMonthlyCost: number; mpFeePercent: number }> {
    const rows = await prisma.moovyConfig.findMany({
        where: { key: { in: [FIXED_COST_KEY, MP_FEE_KEY] } },
        select: { key: true, value: true },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));
    const parse = (key: string, fallback: number) => {
        const raw = map.get(key);
        const n = raw != null ? Number(raw) : NaN;
        return Number.isFinite(n) && n >= 0 ? n : fallback;
    };
    return {
        fixedMonthlyCost: parse(FIXED_COST_KEY, FIXED_COST_DEFAULT),
        mpFeePercent: parse(MP_FEE_KEY, MP_FEE_DEFAULT),
    };
}

export async function GET(request: NextRequest) {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    try {
        const { searchParams } = new URL(request.url);
        const periodRaw = searchParams.get("period") || "30";
        // period: "7" | "30" | "90" | "all"
        const now = new Date();
        let from = new Date(0);
        if (periodRaw !== "all") {
            const days = Number(periodRaw);
            const safeDays = Number.isFinite(days) && days > 0 ? days : 30;
            from = new Date(now.getTime() - safeDays * 24 * 60 * 60 * 1000);
        }

        const { fixedMonthlyCost, mpFeePercent } = await loadReportConfig();

        // Pedidos entregados en el período, con sus SubOrders (snapshots).
        const orders = await prisma.order.findMany({
            where: { status: "DELIVERED", deletedAt: null, createdAt: { gte: from, lte: now } },
            select: {
                id: true,
                orderNumber: true,
                createdAt: true,
                subtotal: true,
                total: true,
                discount: true,
                distanceKm: true,
                isMultiVendor: true,
                subOrders: {
                    select: {
                        deliveryFee: true,
                        moovyCommission: true,
                        driverPayoutAmount: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        // Map Prisma → tipos puros y agregar (lógica testeable en lib/finance/unit-economics).
        const ecoInput = orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            createdAt: o.createdAt,
            subtotal: o.subtotal || 0,
            total: o.total || 0,
            discount: o.discount || 0,
            distanceKm: o.distanceKm,
            isMultiVendor: o.isMultiVendor,
            subOrders: o.subOrders.map((s) => ({
                deliveryFee: s.deliveryFee || 0,
                moovyCommission: s.moovyCommission,
                driverPayoutAmount: s.driverPayoutAmount,
            })),
        }));

        const { summary, breakEven, rows } = aggregateEconomics(ecoInput, {
            mpFeePercent,
            fixedMonthlyCost,
            now,
        });

        return NextResponse.json({
            period: periodRaw,
            config: { fixedMonthlyCost, mpFeePercent },
            summary,
            breakEven,
            // strip tripPayouts del payload (uso interno del cálculo)
            rows: rows.slice(0, 100).map(({ tripPayouts, ...r }) => r),
        });
    } catch (error) {
        console.error("Unit economics error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// PATCH — editar parámetros de reporte (gastos fijos / fee MP). NO afectan cobros.
const patchSchema = z.object({
    fixedMonthlyCost: z.number().min(0).max(1_000_000_000).optional(),
    mpFeePercent: z.number().min(0).max(100).optional(),
});

export async function PATCH(request: NextRequest) {
    const admin = await requireApiAdmin();
    if (admin instanceof NextResponse) return admin;

    try {
        const body = await request.json();
        const parsed = patchSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
        }
        const { fixedMonthlyCost, mpFeePercent } = parsed.data;

        if (fixedMonthlyCost !== undefined) {
            await prisma.moovyConfig.upsert({
                where: { key: FIXED_COST_KEY },
                update: { value: String(fixedMonthlyCost) },
                create: { key: FIXED_COST_KEY, value: String(fixedMonthlyCost), description: "Gastos fijos mensuales (ARS) para el cálculo de break-even en Unit Economics. Solo reporte, no afecta cobros." },
            });
        }
        if (mpFeePercent !== undefined) {
            await prisma.moovyConfig.upsert({
                where: { key: MP_FEE_KEY },
                update: { value: String(mpFeePercent) },
                create: { key: MP_FEE_KEY, value: String(mpFeePercent), description: "Fee real de MercadoPago (%) usado para estimar el costo MP en Unit Economics. Solo reporte, no afecta cobros." },
            });
        }

        const config = await loadReportConfig();
        return NextResponse.json({ ok: true, config });
    } catch (error) {
        console.error("Unit economics PATCH error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
