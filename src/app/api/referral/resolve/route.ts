// feat/login-google (atribución de referidos): resuelve un código MOV-XXXX al
// NOMBRE del referidor, para mostrar "Te invitó [Nombre]" en el registro y que la
// persona confirme a quién le da los puntos antes de registrarse.
//
// Devuelve solo el PRIMER nombre (privacidad — no exponemos apellido/email).
// El código de referido no es secreto (es para compartir), pero igual limitamos
// la respuesta al mínimo y rate-limiteamos.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isValidReferralCode } from "@/lib/referral";
import { applyRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    const limited = await applyRateLimit(request, "referral:resolve", 30, 60_000);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const code = (searchParams.get("code") || "").trim().toUpperCase();

    if (!code || !isValidReferralCode(code)) {
        return NextResponse.json({ valid: false });
    }

    try {
        const referrer = await prisma.user.findUnique({
            where: { referralCode: code },
            select: { name: true, firstName: true, deletedAt: true },
        });

        if (!referrer || referrer.deletedAt) {
            return NextResponse.json({ valid: false });
        }

        // Primer nombre para el saludo. Fallback al primer token de `name`.
        const first =
            (referrer.firstName && referrer.firstName.trim()) ||
            (referrer.name ? referrer.name.trim().split(/\s+/)[0] : "") ||
            "un amigo";

        return NextResponse.json({ valid: true, name: first });
    } catch (error) {
        console.error("[referral/resolve] Error:", error);
        return NextResponse.json({ valid: false });
    }
}
