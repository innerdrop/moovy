// GET /api/merchant/setup — estado de armado de la tienda para la barra de
// continuidad del panel (feat/panel-inmediato-comercio).
//
// Existe porque la barra vive en el LAYOUT del panel y Next.js no re-renderiza
// layouts en la navegación client-side: si el estado se calculara server-side
// en el layout, quedaría congelado (ej: cargaste la documentación y la barra
// seguía pidiéndola). La barra (client) pide acá en cada cambio de ruta.
// Única fuente de verdad: computeMerchantSetup (el mismo helper del dashboard).

import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { computeMerchantSetup } from "@/lib/merchant-setup";

export async function GET() {
    const auth = await requireMerchantApi();
    if (auth instanceof NextResponse) return auth;

    const { merchant } = auth;
    if (!merchant) {
        return NextResponse.json({ error: "Sin comercio" }, { status: 403 });
    }

    const setup = await computeMerchantSetup(merchant);
    return NextResponse.json({
        setupMode: setup.setupMode,
        waitingApproval: setup.waitingApproval,
        doneCount: setup.doneCount,
        total: setup.total,
        nextLabel: setup.nextStep?.label ?? null,
        // Ya viene corregido desde el helper: si hay un borrador a medio cargar,
        // apunta a ESE producto y no al alta de uno nuevo.
        nextHref: setup.nextStep?.href ?? null,
        // Para que la barra pueda decir QUÉ le falta y no solo "cargá un producto".
        nextDetalle: setup.nextStep?.detalle ?? null,
    });
}
