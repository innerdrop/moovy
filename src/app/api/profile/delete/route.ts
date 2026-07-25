// POST /api/profile/delete — el titular ejerce su derecho de supresión.
//
// Requisito de Google Play y, sobre todo, derecho de la persona (Ley 25.326).
//
// fix/borrado-definitivo-cuenta (2026-07-25): este endpoint estaba ROTO de tres
// maneras distintas y nunca llegó a borrar una cuenta:
//   1. La pantalla mandaba el POST sin cuerpo → `request.json()` explotaba → 500.
//   2. Exigía `confirmEmail`, que la pantalla nunca mandó (pide tipear "ELIMINAR").
//   3. Hacía `address.deleteMany`, imposible para alguien con pedidos: la relación
//      `Order.addressId` es obligatoria y la foreign key lo rechaza.
// Ahora delega en `purgeUserAccount` (misma lógica que usa el equipo desde OPS)
// y acepta la confirmación que la pantalla realmente pide.
import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAudit } from "@/lib/audit";
import { logUserActivity, extractRequestInfo, ACTIVITY_ACTIONS } from "@/lib/user-activity";
import { purgeUserAccount, AccountPurgeError } from "@/lib/account-purge";

/** Palabra que el titular tipea en la pantalla para confirmar. */
export const SELF_DELETE_PHRASE = "ELIMINAR";

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({} as Record<string, unknown>));
        const confirmation = typeof body?.confirmation === "string" ? body.confirmation.trim() : "";
        const confirmEmail = typeof body?.confirmEmail === "string" ? body.confirmEmail.trim() : "";

        // Se acepta la palabra tipeada (lo que pide la pantalla) o el email
        // confirmado (compatibilidad con clientes viejos, ej: la app).
        const confirmed =
            confirmation.toUpperCase() === SELF_DELETE_PHRASE ||
            (!!confirmEmail && confirmEmail.toLowerCase() === (session.user.email ?? "").toLowerCase());

        if (!confirmed) {
            return NextResponse.json(
                { error: `Escribí "${SELF_DELETE_PHRASE}" para confirmar la eliminación` },
                { status: 400 }
            );
        }

        const userId = session.user.id;

        await logAudit({
            action: "ACCOUNT_DELETION_REQUESTED",
            entityType: "user",
            entityId: userId,
            userId,
            details: {
                email: session.user.email,
                timestamp: new Date().toISOString(),
            },
        });

        // Datos para los avisos: hay que leerlos ANTES del borrado, porque
        // después el email queda anonimizado y el nombre desaparece.
        const before = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, firstName: true },
        });

        const result = await purgeUserAccount(userId, {
            source: "SELF",
            actorUserId: userId,
            actorEmail: session.user.email ?? "unknown",
            reason: "Solicitud del titular desde su perfil",
        });

        const { ipAddress, userAgent } = extractRequestInfo(request);
        logUserActivity({
            userId,
            action: ACTIVITY_ACTIONS.ACCOUNT_PURGED,
            entityType: "User",
            entityId: userId,
            ipAddress,
            userAgent,
        }).catch((err) => console.error("[Delete] Failed to log account deletion activity:", err));

        // Avisos fire-and-forget (regla #32): que un email falle no puede
        // deshacer un borrado que ya ocurrió.
        (async () => {
            const when = new Date().toLocaleDateString("es-AR");
            const displayName = before?.firstName || before?.name || "";
            try {
                const { sendAccountDeletionRequestEmail, sendOwnerDataDeletionRequestEmail } =
                    await import("@/lib/email-p0");
                if (before?.email) {
                    await sendAccountDeletionRequestEmail({
                        email: before.email,
                        userName: displayName,
                        deletionDate: when,
                    });
                }
                await sendOwnerDataDeletionRequestEmail({
                    userName: displayName || "(sin nombre)",
                    userEmail: before?.email ?? result.previousEmail,
                    userId,
                    requestDate: when,
                    roles: result.roles,
                });
            } catch (err) {
                console.error("[Delete] Failed to send deletion emails:", err);
            }
        })();

        return NextResponse.json({
            success: true,
            message: "Tu cuenta y tus datos personales fueron eliminados.",
        });
    } catch (error) {
        if (error instanceof AccountPurgeError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error("Error deleting account:", error);
        return NextResponse.json(
            { error: "Error al eliminar la cuenta" },
            { status: 500 }
        );
    }
}
