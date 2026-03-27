import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasAnyRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Mapping de tipo de ad → campo premium en merchant
const TIER_MAP: Record<string, string> = {
    DESTACADO_PLATINO: "platino",
    DESTACADO_DESTACADO: "destacado",
    DESTACADO_PREMIUM: "basic",
};

const updateSchema = z.object({
    action: z.enum(["approve", "activate", "reject", "cancel"]),
    adminNotes: z.string().max(500).optional(),
    rejectionReason: z.string().max(500).optional(),
    // Para activate: período de vigencia
    durationDays: z.number().min(1).max(365).optional(),
    paymentMethod: z.enum(["mercadopago", "transfer", "cash", "free", "promo"]).optional(),
});

// PATCH — Admin aprueba, activa, rechaza o cancela un placement
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const session = await auth();
    if (!session || !hasAnyRole(session, ["ADMIN"])) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json(
            { error: "Datos inválidos", details: parsed.error.flatten() },
            { status: 400 }
        );
    }

    const { action, adminNotes, rejectionReason, durationDays, paymentMethod } = parsed.data;

    const placement = await prisma.adPlacement.findUnique({
        where: { id },
        include: { merchant: { select: { id: true, name: true } } },
    });

    if (!placement) {
        return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 });
    }

    const now = new Date();

    // ===== APROBAR (paso 1: confirmar solicitud, aún sin activar) =====
    if (action === "approve") {
        if (placement.status !== "PENDING") {
            return NextResponse.json(
                { error: `No se puede aprobar una solicitud en estado ${placement.status}` },
                { status: 400 }
            );
        }

        const updated = await prisma.adPlacement.update({
            where: { id },
            data: {
                status: "APPROVED",
                approvedAt: now,
                adminNotes: adminNotes || placement.adminNotes,
            },
        });

        // TODO: Enviar email/push al comercio: "Tu solicitud fue aprobada, coordinemos el pago"
        console.log(`[ad-placement] Aprobado: ${placement.merchant.name} → ${placement.type}`);

        return NextResponse.json({ placement: updated, message: "Solicitud aprobada. Coordiná el pago con el comercio." });
    }

    // ===== ACTIVAR (paso 2: pago recibido, encender el anuncio) =====
    if (action === "activate") {
        if (!["APPROVED", "PENDING"].includes(placement.status)) {
            return NextResponse.json(
                { error: `No se puede activar una solicitud en estado ${placement.status}` },
                { status: 400 }
            );
        }

        const days = durationDays || 30;
        const startsAt = now;
        const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        // Transacción: activar placement + actualizar merchant si es Destacado
        const result = await prisma.$transaction(async (tx) => {
            // 1. Activar el placement
            const updated = await tx.adPlacement.update({
                where: { id },
                data: {
                    status: "ACTIVE",
                    startsAt,
                    endsAt,
                    activatedAt: now,
                    approvedAt: placement.approvedAt || now,
                    paymentStatus: "approved",
                    paymentMethod: paymentMethod || "transfer",
                    adminNotes: adminNotes || placement.adminNotes,
                },
            });

            // 2. Si es tipo DESTACADO, activar premium en el merchant
            const premiumTier = TIER_MAP[placement.type];
            if (premiumTier) {
                await tx.merchant.update({
                    where: { id: placement.merchantId },
                    data: {
                        isPremium: true,
                        premiumTier: premiumTier,
                        premiumUntil: endsAt,
                    },
                });
                console.log(`[ad-placement] Premium activado: ${placement.merchant.name} → ${premiumTier} hasta ${endsAt.toISOString()}`);
            }

            return updated;
        });

        // TODO: Enviar email/push al comercio: "Tu anuncio está activo"
        console.log(`[ad-placement] Activado: ${placement.merchant.name} → ${placement.type} (${days} días)`);

        return NextResponse.json({
            placement: result,
            message: `Anuncio activado por ${days} días. Vence el ${endsAt.toLocaleDateString("es-AR")}.`,
        });
    }

    // ===== RECHAZAR =====
    if (action === "reject") {
        if (placement.status !== "PENDING") {
            return NextResponse.json(
                { error: `No se puede rechazar una solicitud en estado ${placement.status}` },
                { status: 400 }
            );
        }

        const updated = await prisma.adPlacement.update({
            where: { id },
            data: {
                status: "REJECTED",
                rejectionReason: rejectionReason || "Solicitud rechazada por el equipo MOOVY",
                adminNotes: adminNotes || placement.adminNotes,
            },
        });

        // TODO: Enviar email/push al comercio
        return NextResponse.json({ placement: updated, message: "Solicitud rechazada." });
    }

    // ===== CANCELAR (puede ser de cualquier estado) =====
    if (action === "cancel") {
        const updated = await prisma.$transaction(async (tx) => {
            const cancelled = await tx.adPlacement.update({
                where: { id },
                data: {
                    status: "CANCELLED",
                    adminNotes: adminNotes || placement.adminNotes,
                },
            });

            // Si estaba ACTIVE y era DESTACADO, revocar premium
            if (placement.status === "ACTIVE" && TIER_MAP[placement.type]) {
                // Solo revocar si no tiene otro placement activo
                const otherActive = await tx.adPlacement.count({
                    where: {
                        merchantId: placement.merchantId,
                        status: "ACTIVE",
                        id: { not: id },
                        type: { startsWith: "DESTACADO" },
                    },
                });

                if (otherActive === 0) {
                    await tx.merchant.update({
                        where: { id: placement.merchantId },
                        data: {
                            isPremium: false,
                            premiumTier: "basic",
                        },
                    });
                    console.log(`[ad-placement] Premium revocado: ${placement.merchant.name}`);
                }
            }

            return cancelled;
        });

        // TODO: Enviar email/push al comercio
        console.log(`[ad-placement] Cancelado: ${placement.merchant.name} → ${placement.type}`);

        return NextResponse.json({ placement: updated, message: "Solicitud cancelada." });
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 });
}