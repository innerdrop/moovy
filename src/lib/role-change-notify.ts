/**
 * Notifica al cliente del usuario afectado cuando su set de roles cambia
 * (admin aprueba/rechaza su comercio, driver, seller, o un doc dispara
 * auto-activación). Antes el cliente tenía que hacer logout + login para que
 * el JWT se reemita con los roles nuevos — ahora basta con que el frontend
 * dispare `await session.update({ refreshRoles: true })` al recibir este event.
 *
 * Uso típico desde cualquier endpoint admin:
 *
 *   await emitRoleUpdate({
 *       userId: merchant.ownerId,
 *       role: "MERCHANT",
 *       action: "APPROVED",
 *       message: "Tu comercio fue aprobado. Ya podés operar.",
 *       portalUrl: "/comercios",
 *   });
 *
 * El socket event llega solamente a la room `user:<userId>` (el cliente se une
 * a esa room al autenticar — ver scripts/socket-server.ts:201). Si el usuario
 * no tiene ningún tab abierto, el event se pierde, pero el JWT viejo expira
 * en 7 días y el push browser cubrió el aviso inmediato.
 */

import { socketEmit } from "@/lib/socket-emit";

export type RoleScope = "MERCHANT" | "DRIVER" | "SELLER";
export type RoleAction = "APPROVED" | "REJECTED" | "AUTO_ACTIVATED";

interface EmitRoleUpdateInput {
    userId: string;
    role: RoleScope;
    action: RoleAction;
    /** Mensaje listo para mostrar como toast en el cliente. */
    message: string;
    /** Deep-link al portal recién activado (ej: "/comercios", "/repartidor/dashboard"). */
    portalUrl?: string;
}

/**
 * Emite el socket event `roles_updated` a la room privada del usuario.
 * Fire-and-forget: nunca throwea — si el socket-server está caído, el caller
 * sigue normal y el usuario tendrá que loguearse de nuevo (fallback aceptable).
 */
export async function emitRoleUpdate(input: EmitRoleUpdateInput): Promise<void> {
    try {
        await socketEmit({
            event: "roles_updated",
            room: `user:${input.userId}`,
            data: {
                role: input.role,
                action: input.action,
                message: input.message,
                portalUrl: input.portalUrl ?? null,
                timestamp: new Date().toISOString(),
            },
        });
    } catch (err) {
        console.error("[role-change-notify] socket emit failed:", err);
    }
}
