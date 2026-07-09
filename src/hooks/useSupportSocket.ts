"use client";

// Hook cliente para recibir mensajes de soporte en tiempo real por Socket.io.
// Rama: feat/chat-en-vivo-y-logo-tienda
//
// Copia el patrón de OrderChatPanel/useRealtimeOrders: token vía useSocketAuth,
// conexión al namespace /logistica, y escucha `new_support_message`. Incluye el
// fix de LAN/mobile (si el env apunta a localhost pero no estamos en localhost,
// usa el hostname actual). Es el canal "instantáneo"; el polling de cada pantalla
// queda como red de seguridad (el "mixto").

import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useSocketAuth } from "@/hooks/useSocketAuth";

export interface SupportSocketMessage {
    chatId: string;
    message: unknown;
}

export function useSupportSocket(onMessage: (data: SupportSocketMessage) => void) {
    const { token } = useSocketAuth();
    const cbRef = useRef(onMessage);
    cbRef.current = onMessage;

    useEffect(() => {
        if (!token) return;

        let socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        try {
            if (typeof window !== "undefined") {
                const isLocalEnv = /localhost|127\.0\.0\.1/.test(socketUrl);
                const isLocalHost = /localhost|127\.0\.0\.1/.test(window.location.hostname);
                if (isLocalEnv && !isLocalHost) {
                    socketUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
                }
            }
        } catch {
            // ignore
        }

        const socket: Socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            auth: { token },
        });

        const handler = (data: SupportSocketMessage) => cbRef.current?.(data);
        socket.on("new_support_message", handler);

        return () => {
            socket.off("new_support_message", handler);
            socket.disconnect();
        };
    }, [token]);
}
