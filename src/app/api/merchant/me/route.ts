// API Route: Get current merchant info
import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";

export async function GET() {
    try {
        // Auth contra DB (no contra el JWT cache). Ver src/lib/merchant-auth.ts.
        const authResult = await requireMerchantApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { merchant } = authResult;

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        // Respuesta curada (NO devolvemos el row completo: tiene campos cifrados
        // CUIT/CBU/tokens MP — regla AAIP #23).
        return NextResponse.json({
            id: merchant.id,
            name: merchant.name,
            slug: merchant.slug,
            isActive: merchant.isActive,
        });
    } catch (error) {
        console.error("Error fetching merchant:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
