"use client";

// Hook for driver real-time socket events
// Listens for new order offers, status changes, and cancellations
// Triggers dashboard refresh on relevant events
//
// Feedback UX (rama chore/prelaunch-polish-pwa-sound-email 2026-04-24): al recibir
// una oferta nueva dispara beep + vibración si el driver los tiene activados
// en Configuración. Los helpers leen las prefs de localStorage directo
// para evitar closures stale en el listener del socket.

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { loadRiderPrefs, playAlertBeep, triggerVibration } from "@/hooks/useRiderPrefs";

interface UseDriverSocketOptions {
    /** Driver ID (from DB) */
    driverId: string | null;
    /** Socket auth token from useSocketAuth */
    socketToken: string | null;
    /** Whether socket should be active */
    enabled?: boolean;
    /** Called when dashboard data should be refreshed */
    onRefresh: () => void;
    /** Called with new order offer data for immediate UI update */
    onNewOrder?: (order: any) => void;
    /** Called when an order is cancelled */
    onOrderCancelled?: (data: { orderId: string; orderNumber: string }) => void;
}

export function useDriverSocket({
    driverId,
    socketToken,
    enabled = true,
    onRefresh,
    onNewOrder,
    onOrderCancelled,
}: UseDriverSocketOptions) {
    const socketRef = useRef<Socket | null>(null);
    const connectedRef = useRef(false);

    // Stable refs for callbacks to avoid re-connecting on callback change
    const onRefreshRef = useRef(onRefresh);
    const onNewOrderRef = useRef(onNewOrder);
    const onOrderCancelledRef = useRef(onOrderCancelled);

    useEffect(() => { onRefreshRef.current = onRefresh; }, [onRefresh]);
    useEffect(() => { onNewOrderRef.current = onNewOrder; }, [onNewOrder]);
    useEffect(() => { onOrderCancelledRef.current = onOrderCancelled; }, [onOrderCancelled]);

    useEffect(() => {
        if (!enabled || !driverId || !socketToken) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: Infinity,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 10000,
            auth: { token: socketToken },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[DriverSocket] Connected");
            connectedRef.current = true;
            // Join driver room
            socket.emit("driver_online", driverId);
            // Refresh dashboard on reconnect to catch missed events
            onRefreshRef.current();
        });

        socket.on("disconnect", () => {
            console.log("[DriverSocket] Disconnected");
            connectedRef.current = false;
        });

        socket.on("connect_error", (err) => {
            console.error("[DriverSocket] Connection error:", err.message);
            connectedRef.current = false;
        });

        // ── New order offer assigned to this driver ──
        socket.on("orden_pendiente", (order: any) => {
            console.log("[DriverSocket] New order offer:", order?.orderNumber || order?.id);

            // Feedback inmediato al driver — beep + vibración según prefs de Config.
            // Leemos directo de localStorage para no capturar un valor stale en el closure.
            try {
                const prefs = loadRiderPrefs();
                if (prefs.soundAlerts) playAlertBeep();
                // Patrón: pulso-pausa-pulso — típico de notificación entrante.
                if (prefs.vibration) triggerVibration([200, 100, 200]);
            } catch {
                /* no dejar que un fallo de feedback bloquee el evento crítico */
            }

            onNewOrderRef.current?.(order);
            onRefreshRef.current();
        });

        // ── Order status changed (by merchant, system, or another action) ──
        socket.on("order_status_changed", (data: any) => {
            console.log("[DriverSocket] Order status changed:", data?.orderId, data?.status);
            onRefreshRef.current();
        });

        // ── Order cancelled ──
        socket.on("order_cancelled", (data: any) => {
            console.log("[DriverSocket] Order cancelled:", data?.orderId);
            onOrderCancelledRef.current?.(data);
            onRefreshRef.current();
        });

        // ── Generic dashboard refresh signal ──
        socket.on("driver_dashboard_refresh", () => {
            console.log("[DriverSocket] Dashboard refresh signal");
            onRefreshRef.current();
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            connectedRef.current = false;
        };
    }, [enabled, driverId, socketToken]);

    const isConnected = useCallback(() => connectedRef.current, []);

    return { isConnected };
}
