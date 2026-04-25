/**
 * PATCH /api/admin/merchants/[id]/logo
 *
 * Permite al admin subir o reemplazar el logo del comercio en nombre del merchant.
 * Caso de uso real: el comercio entrega el logo en USB / WhatsApp y vos lo subís
 * desde OPS, sin tener que hacerle login al merchant.
 *
 * El upload del archivo en sí ya pasó por /api/upload (mismo endpoint que usa el
 * merchant). Acá sólo recibimos la URL final + persistimos en Merchant.image.
 *
 * Body: { imageUrl: string | null }
 *   - string no vacío → setea como logo nuevo
 *   - null o "" → borra el logo (deja Merchant.image en null, vuelve a bloquear
 *     la aprobación hasta que se cargue otro)
 *
 * Auditoría: action MERCHANT_LOGO_UPDATED_BY_ADMIN con before/after.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
    imageUrl: z.union([z.string().url().max(1024), z.literal(""), z.null()]),
});

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        if (!hasAnyRole(session, ["ADMIN"])) {
            return NextResponse.json({ error: "Acceso denegado" }, { status: 403 });
        }

        const { id } = await context.params;

        let body: unknown;
        try {
            body = await request.json();
        } catch {
            return NextResponse.json({ error: "Body inválido" }, { status: 400 });
        }

        const parsed = BodySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "imageUrl inválido (debe ser una URL o null/vacío)", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const newUrl = parsed.data.imageUrl?.trim() || null;

        // Tomamos el valor anterior para auditoría.
        const before = await prisma.merchant.findUnique({
            where: { id },
            select: { id: true, name: true, image: true, ownerId: true },
        });
        if (!before) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const updated = await prisma.merchant.update({
            where: { id },
            data: { image: newUrl },
            select: { id: true, name: true, image: true },
        });

        // Audit log — para que quede trazado quién subió el logo, cuándo, y cuál era el anterior.
        await prisma.auditLog.create({
            data: {
                action: "MERCHANT_LOGO_UPDATED_BY_ADMIN",
                entityType: "Merchant",
                entityId: id,
                userId: session.user.id,
                details: JSON.stringify({
                    merchantName: updated.name,
                    merchantOwnerId: before.ownerId,
                    adminEmail: session.user.email ?? "unknown",
                    previousImage: before.image,
                    newImage: updated.image,
                    operation: newUrl ? (before.image ? "REPLACED" : "ADDED") : "REMOVED",
                }),
            },
        });

        return NextResponse.json({
            success: true,
            merchant: { id: updated.id, name: updated.name, image: updated.image },
        });
    } catch (error) {
        console.error("[AdminMerchantLogo] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
