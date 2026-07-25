/**
 * POST /api/admin/users/[id]/purge
 *
 * BORRADO DEFINITIVO de una cuenta a pedido de su titular (Ley 25.326, derecho
 * de supresión). Distinto del `delete` de al lado, que es un borrado LÓGICO
 * reversible que además deja el email quemado.
 *
 * Es irreversible, así que sigue el patrón de las operaciones que no se pueden
 * deshacer (reglas #8/#26): confirmación textual LITERAL en el body validada con
 * Zod (no alcanza el click), audit log antes del side effect, y una nota
 * obligatoria que registre quién pidió la baja y por qué medio — es lo que le
 * mostramos a la AAIP si algún día pregunta.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireApiAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { purgeUserAccount, AccountPurgeError } from "@/lib/account-purge";
import { logAdminAction, extractRequestInfo } from "@/lib/user-activity";
import logger from "@/lib/logger";

const log = logger.child({ context: "admin/users/purge" });

export const CONFIRMATION_PHRASE = "ELIMINAR DEFINITIVAMENTE";

const bodySchema = z.object({
    // Mismo patrón que el hard-delete de pedidos: `z.literal()` no permite
    // mensaje custom, así que se valida con refine para que el admin lea qué
    // tiene que escribir exactamente.
    confirmation: z.string().refine((val) => val === CONFIRMATION_PHRASE, {
        message: `Escribí exactamente "${CONFIRMATION_PHRASE}" para confirmar`,
    }),
    // Quién pidió la baja y por dónde (email, WhatsApp, en persona). Mínimo real
    // para que la nota sirva de algo en una auditoría.
    reason: z
        .string()
        .trim()
        .min(5, "Contá quién pidió la baja y por qué medio (mínimo 5 caracteres)")
        .max(500),
});

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const admin = await requireApiAdmin();
        if (admin instanceof NextResponse) return admin;

        const { id } = await context.params;

        const raw = await request.json().catch(() => null);
        const parsed = bodySchema.safeParse(raw);
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
                { status: 400 }
            );
        }

        // Un admin no puede borrarse a sí mismo por esta vía: perdería el acceso
        // en el mismo request y dejaría el panel sin quién lo administre.
        if (id === admin.userId) {
            return NextResponse.json(
                { error: "No podés borrar definitivamente tu propia cuenta desde acá" },
                { status: 400 }
            );
        }

        const target = await prisma.user.findUnique({
            where: { id },
            select: { id: true, role: true },
        });
        if (!target) {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }
        if (target.role === "ADMIN") {
            return NextResponse.json(
                {
                    error:
                        "No se puede borrar definitivamente una cuenta de administrador. Quitale el rol primero.",
                },
                { status: 409 }
            );
        }

        const result = await purgeUserAccount(id, {
            source: "ADMIN",
            actorUserId: admin.userId,
            actorEmail: admin.email ?? "unknown",
            reason: parsed.data.reason,
        });

        const { ipAddress, userAgent } = extractRequestInfo(request);
        await logAdminAction({
            adminUserId: admin.userId,
            targetUserId: id,
            action: "ADMIN_USER_PURGED",
            entityType: "User",
            entityId: id,
            details: {
                purgedEmail: result.previousEmail,
                roles: result.roles,
                reason: parsed.data.reason,
                counts: result.counts,
            },
            ipAddress,
            userAgent,
        });

        return NextResponse.json({
            success: true,
            message: `Cuenta borrada definitivamente. La casilla ${result.previousEmail} quedó libre para volver a usarse.`,
            freedEmail: result.previousEmail,
            counts: result.counts,
        });
    } catch (error) {
        if (error instanceof AccountPurgeError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.code === "NOT_FOUND" ? 404 : 409 }
            );
        }
        log.error({ error }, "Error en borrado definitivo");
        return NextResponse.json(
            { error: "Error al borrar la cuenta definitivamente" },
            { status: 500 }
        );
    }
}
