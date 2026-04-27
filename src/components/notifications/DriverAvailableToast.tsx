"use client";

// fix/merchant-flow-pedidos (2026-04-26): Toast in-app cuando hay drivers disponibles.
//
// Escucha el evento socket `driver_available` en el room `customer:${userId}` que
// el helper `notifyAvailabilitySubscribers` emite junto con el push del SO. El push
// cubre cuando la app está cerrada/background; este componente cubre cuando la app
// está abierta y el push del SO no aparece como notificación visible.
//
// Self-mounted desde el layout del store. No requiere props ni configuración.

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { io, Socket } from "socket.io-client";
import { useRouter } from "next/navigation";
import { useSocketAuth } from "@/hooks/useSocketAuth";
import { toast } from "@/store/toast";

export default function DriverAvailableToast() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const isAuth = status === "authenticated";
    const userId = session?.user?.id;
    const { token: socketToken } = useSocketAuth(isAuth && !!userId);

    useEffect(() => {
        if (!isAuth || !userId || !socketToken) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "https://somosmoovy.com";
        const socket: Socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            auth: { token: socketToken },
        });

        socket.on("connect", () => {
            socket.emit("join_room", `customer:${userId}`);
        });

        const handler = () => {
            toast.success("Ya hay repartidor en tu zona — entrá al checkout para completar tu pedido");
            // Auto-redirect optional: si el user está en home/store, lo llevamos. Si está
            // en checkout ya, no hace falta. Por ahora solo toast — menos invasivo.
        };

        socket.on("driver_available", handler);

        return () => {
            socket.off("driver_available", handler);
            socket.disconnect();
        };
    }, [isAuth, userId, socketToken, router]);

    return null;
}
