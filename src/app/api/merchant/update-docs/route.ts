// API Route: Update merchant documents (AFIP, habilitación, sanitario)
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { applyRateLimit } from "@/lib/rate-limit";

const ALLOWED_FIELDS = ["constanciaAfipUrl", "habilitacionMunicipalUrl", "registroSanitarioUrl"];

export async function PATCH(request: NextRequest) {
    const limited = await applyRateLimit(request, "merchant:update-docs", 10, 60_000);
    if (limited) return limited;

    try {
        const session = await auth();
        if (!session?.user?.id || !hasAnyRole(session, ["MERCHANT", "COMERCIO", "ADMIN"])) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const merchant = await prisma.merchant.findFirst({
            where: { ownerId: session.user.id },
            select: { id: true },
        });

        if (!merchant) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const body = await request.json();

        // Only allow whitelisted document fields
        const updateData: Record<string, string> = {};
        for (const field of ALLOWED_FIELDS) {
            if (body[field] && typeof body[field] === "string") {
                updateData[field] = body[field];
            }
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No se proporcionaron documentos válidos" }, { status: 400 });
        }

        await prisma.merchant.update({
            where: { id: merchant.id },
            data: updateData,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[UpdateDocs] Error:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
