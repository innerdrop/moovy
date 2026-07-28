// API Route: Get current merchant info
import { NextResponse } from "next/server";
import { requireMerchantApi } from "@/lib/merchant-auth";
import { checkMerchantSchedule } from "@/lib/merchant-schedule";

export async function GET() {
    try {
        // Auth contra DB (no contra el JWT cache). Ver src/lib/merchant-auth.ts.
        const authResult = await requireMerchantApi({ allowAdmin: true });
        if (authResult instanceof NextResponse) return authResult;
        const { merchant } = authResult;

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const schedule = checkMerchantSchedule({
            isOpen: merchant.isOpen,
            scheduleJson: merchant.scheduleJson,
        });

        // Respuesta curada (NO devolvemos el row completo: tiene campos cifrados
        // CUIT/CBU/tokens MP — regla AAIP #23).
        return NextResponse.json({
            id: merchant.id,
            name: merchant.name,
            slug: merchant.slug,
            isActive: merchant.isActive,
            // fix/safe-area-pausa-rapida-y-card: StorePauseCard (Pedidos) necesita
            // saber la pausa manual y si el comercio está aprobado. Inocuos.
            isOpen: merchant.isOpen,
            approvalStatus: merchant.approvalStatus,
            // fix/comercio-pausa-stock-y-ajustes: el horario manda. Si el comercio
            // configuró que abre 9:00 y son las 8:30, NO hay nada que pausar —
            // la tienda ya está cerrada por horario. `withinSchedule` deja que la
            // tarjeta explique eso en vez de ofrecer un botón sin sentido.
            withinSchedule: schedule.isWithinSchedule,
            nextOpenLabel: schedule.nextOpenTime
                ? `${schedule.nextOpenDay ?? ""} ${schedule.nextOpenTime}`.trim()
                : null,
        });
    } catch (error) {
        console.error("Error fetching merchant:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
