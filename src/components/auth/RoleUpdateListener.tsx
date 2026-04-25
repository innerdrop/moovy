"use client";

/**
 * Listener cliente que escucha el socket event `roles_updated` y refresca el
 * JWT de NextAuth sin requerir logout/login.
 *
 * Antes de este listener: cuando el admin aprobaba un comercio/driver/seller,
 * el JWT del usuario seguía con los roles viejos. El usuario clickeaba "Panel
 * de Comercio" desde mi-perfil y el portal switcher (que lee roles del JWT)
 * lo bouncenaba o le mostraba "no tenés acceso". La única solución era hacer
 * logout y login manual, fricción inaceptable post-aprobación.
 *
 * Cómo funciona:
 *   1. El usuario logueado se conecta al namespace /logistica con su token de
 *      socket-auth. El socket-server lo une automáticamente a la room
 *      `user:<userId>` (ver scripts/socket-server.ts:201).
 *   2. Cuando admin aprueba/rechaza algo, los endpoints disparan
 *      `emitRoleUpdate({ userId, role, action, message, portalUrl })` que emite
 *      `roles_updated` a esa room.
 *   3. Este componente escucha el event, dispara
 *      `await update({ refreshRoles: true })` para que NextAuth reemita el JWT
 *      con los roles derivados de DB (ver src/lib/auth.ts:230) y muestra un
 *      toast con el mensaje y un botón "Ir al panel" si hay portalUrl.
 *
 * Se monta una sola vez en el árbol de Providers.
 */

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { useSocketAuth } from "@/hooks/useSocketAuth";
import { toast } from "@/store/toast";

interface RolesUpdatedPayload {
    role: "MERCHANT" | "DRIVER" | "SELLER";
    action: "APPROVED" | "REJECTED" | "AUTO_ACTIVATED";
    message: string;
    portalUrl: string | null;
    timestamp: string;
}

export default function RoleUpdateListener() {
    const { data: session, update, status } = useSession();
    const router = useRouter();
    const { token: socketToken } = useSocketAuth(status === "authenticated");
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        // Solo conectamos si hay sesión activa Y tenemos token de socket.
        if (status !== "authenticated" || !session?.user?.id || !socketToken) {
            return;
        }

        const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        const isLocalHostEnv =
            envSocketUrl.includes("localhost") || envSocketUrl.includes("127.0.0.1");
        const socketUrl =
            isLocalHostEnv &&
            typeof window !== "undefined" &&
            !window.location.hostname.includes("localhost")
                ? `${window.location.protocol}//${window.location.hostname}:3001`
                : envSocketUrl;

        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            reconnectionAttempts: Infinity,
            auth: { token: socketToken },
        });

        socketRef.current = socket;

        socket.on("roles_updated", async (payload: RolesUpdatedPayload) => {
            try {
                // Toast informativo. El tono varía según la action:
                //   - APPROVED / AUTO_ACTIVATED → success (verde)
                //   - REJECTED → error (rojo)
                if (payload.action === "REJECTED") {
                    toast.error(payload.message, 8000);
                } else {
                    toast.success(payload.message, 8000);
                }

                // Refresh del JWT — clave del fix. NextAuth re-corre el callback
                // con `trigger === "update" && refreshRoles === true` y reemite
                // el token con los roles derivados de DB. Ver src/lib/auth.ts.
                await update({ refreshRoles: true });

                // Para approvals/auto-activación con portalUrl, navegamos al panel
                // después de un delay corto para que el toast quede visible y el
                // JWT alcance a propagarse. router.push usa el JWT actualizado.
                if (
                    payload.portalUrl &&
                    (payload.action === "APPROVED" || payload.action === "AUTO_ACTIVATED")
                ) {
                    setTimeout(() => {
                        router.push(payload.portalUrl as string);
                    }, 1500);
                }
            } catch (err) {
                console.error("[RoleUpdateListener] Failed to handle roles_updated:", err);
            }
        });

        socket.on("connect_error", (err) => {
            // No bloqueamos al usuario por fallo del socket — push email cubre el aviso.
            console.warn("[RoleUpdateListener] socket connect_error:", err.message);
        });

        return () => {
            socket.off("roles_updated");
            socket.disconnect();
            socketRef.current = null;
        };
    }, [status, session?.user?.id, socketToken, update, router]);

    // Componente invisible — solo side effects.
    return null;
}
