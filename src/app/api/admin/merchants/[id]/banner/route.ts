/**
 * PATCH /api/admin/merchants/[id]/banner
 *
 * Permite al admin subir, reemplazar o quitar la PORTADA del comercio en su
 * nombre (mismo modelo que /logo: el archivo ya pasó por /api/upload, acá solo
 * persistimos la URL en Merchant.banner). feat/ops-ficha-usuario-operativa.
 *
 * Body: { bannerUrl: string | null }
 *   - string no vacío → setea como portada nueva
 *   - null o "" → la quita (el comercio no puede abrir su tienda sin portada,
 *     regla #38/#40 — la guía del panel se lo vuelve a pedir)
 *
 * Auditoría: action MERCHANT_BANNER_UPDATED_BY_ADMIN con before/after.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const BodySchema = z.object({
    bannerUrl: z.union([z.string().url().max(1024), z.literal(""), z.null()]),
});

export async function PATCH(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

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
                { error: "bannerUrl inválido (debe ser una URL o null/vacío)", details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const newUrl = parsed.data.bannerUrl?.trim() || null;

        const before = await prisma.merchant.findUnique({
            where: { id },
            select: { id: true, name: true, banner: true, ownerId: true },
        });
        if (!before) {
            return NextResponse.json({ error: "Comercio no encontrado" }, { status: 404 });
        }

        const updated = await prisma.merchant.update({
            where: { id },
            data: { banner: newUrl },
            select: { id: true, name: true, banner: true },
        });

        await prisma.auditLog.create({
            data: {
                action: "MERCHANT_BANNER_UPDATED_BY_ADMIN",
                entityType: "Merchant",
                entityId: id,
                userId: admin.userId,
                details: JSON.stringify({
                    merchantName: updated.name,
                    merchantOwnerId: before.ownerId,
                    adminEmail: admin.email ?? "unknown",
                    previousBanner: before.banner,
                    newBanner: updated.banner,
                    operation: newUrl ? (before.banner ? "REPLACED" : "ADDED") : "REMOVED",
                }),
            },
        });

        return NextResponse.json({
            success: true,
            merchant: { id: updated.id, name: updated.name, banner: updated.banner },
        });
    } catch (error) {
        console.error("[AdminMerchantBanner] Error:", error);
        return NextResponse.json(
            { error: "Error interno del servidor" },
            { status: 500 }
        );
    }
}
