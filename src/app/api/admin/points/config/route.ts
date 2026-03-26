/**
 * DEPRECATED: Este endpoint es un legacy duplicate.
 * La configuración de puntos se maneja desde /api/admin/points-config/
 * con validación completa, o desde /api/admin/ops-config/ (Biblia Financiera).
 *
 * Este archivo se mantiene como proxy para no romper consumidores existentes.
 * Consolidado: 2026-03-26
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { getPointsConfig, updatePointsConfig } from "@/lib/points";

// GET - Proxy to canonical endpoint
export async function GET(request: Request) {
    try {
        const session = await auth();
        const isAdmin = hasAnyRole(session, ["ADMIN"]);

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const config = await getPointsConfig();
        return NextResponse.json(config);
    } catch (error) {
        console.error("[DEPRECATED] Error fetching points config:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}

// POST - Proxy to canonical PUT endpoint at /api/admin/points-config
export async function POST(request: Request) {
    try {
        const session = await auth();
        const isAdmin = hasAnyRole(session, ["ADMIN"]);

        if (!isAdmin) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }

        const body = await request.json();

        // Apply same validation as canonical endpoint
        const cleanData = {
            pointsPerDollar: Number(body.pointsPerDollar),
            minPurchaseForPoints: Number(body.minPurchaseForPoints),
            pointsValue: Number(body.pointsValue),
            minPointsToRedeem: Number(body.minPointsToRedeem),
            maxDiscountPercent: Number(body.maxDiscountPercent),
            signupBonus: Number(body.signupBonus),
            referralBonus: Number(body.referralBonus),
            reviewBonus: Number(body.reviewBonus),
        };

        const updatedConfig = await updatePointsConfig(cleanData);
        return NextResponse.json(updatedConfig);
    } catch (error) {
        console.error("[DEPRECATED] Error updating points config:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
