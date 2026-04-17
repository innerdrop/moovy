"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useSocketAuth } from "./useSocketAuth";

/**
 * Real-time order updates hook
 * Listens for order events via WebSocket and triggers callbacks
 */

interface OrderData {
    id: string;
    orderNumber?: string;
    status: string;
    merchantId?: string;
    userId?: string;
    [key: string]: any;
}

interface UseRealtimeOrdersOptions {
    /** Role of the current user */
    role: "merchant" | "customer" | "admin" | "driver";
    /** Merchant ID (required for merchant role) */
    merchantId?: string;
    /** User ID (required for customer role) */
    userId?: string;
    /** Called when a new order is received */
    onNewOrder?: (order: OrderData) => void;
    /** Called when an order status changes */
    onStatusChange?: (orderId: string, status: string, order?: OrderData) => void;
    /** Called when an order is cancelled */
    onOrderCancelled?: (orderId: string) => void;
    /** Called when a driver is assigned */
    onDriverAssigned?: (orderId: string, driverId: string) => void;
    /** Called when no driver was found for an order */
    onOrderUnassignable?: (orderId: string, orderNumber: string) => void;
    /** Whether to enable the connection */
    enabled?: boolean;
}

export function useRealtimeOrders({
    role,
    merchantId,
    userId,
    onNewOrder,
    onStatusChange,
    onOrderCancelled,
    onDriverAssigned,
    onOrderUnassignable,
    enabled = true,
}: UseRealtimeOrdersOptions) {
    // Auto-fetch socket auth token
    const { token: socketToken } = useSocketAuth(enabled);
    const socketRef = useRef<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const [disconnectedSince, setDisconnectedSince] = useState<Date | null>(null);
    const callbacksRef = useRef({
        onNewOrder,
        onStatusChange,
        onOrderCancelled,
        onDriverAssigned,
        onOrderUnassignable,
    });

    // Keep callbacks fresh
    useEffect(() => {
        callbacksRef.current = {
            onNewOrder,
            onStatusChange,
            onOrderCancelled,
            onDriverAssigned,
            onOrderUnassignable,
        };
    }, [onNewOrder, onStatusChange, onOrderCancelled, onDriverAssigned, onOrderUnassignable]);

    useEffect(() => {
        if (!enabled || !socketToken) return;

        const envSocketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
        // Handle mobile LAN access (dev server on LAN IP)
        const isLocalHostEnv = envSocketUrl.includes("localhost") || envSocketUrl.includes("127.0.0.1");
        const socketUrl = (isLocalHostEnv && typeof window !== 'undefined' && !window.location.hostname.includes("localhost"))
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

        socket.on("connect", () => {
            console.log(`[RealtimeOrders] Connected as ${role}`);
            setConnected(true);
            setDisconnectedSince(null);

            // Join appropriate room based on role
            switch (role) {
                case "merchant":
                    if (merchantId) {
                        socket.emit("join_merchant_room", merchantId);
                    }
                    break;
                case "customer":
                    if (userId) {
                        socket.emit("join_customer_room", userId);
                    }
                    break;
                case "admin":
                    socket.emit("join_admin_orders");
                    break;
                case "driver":
                    // Drivers use existing driver_online event
                    break;
            }
        });

        // Listen for new orders
        socket.on("new_order", (order: OrderData) => {
            console.log("[RealtimeOrders] New order received:", order.orderNumber || order.id);
            callbacksRef.current.onNewOrder?.(order);
        });

        // Listen for status changes
        socket.on("order_status_changed", (data: { orderId: string; status: string; order?: OrderData }) => {
            console.log(`[RealtimeOrders] Order ${data.orderId} status changed to ${data.status}`);
            callbacksRef.current.onStatusChange?.(data.orderId, data.status, data.order);
        });

        // Listen for cancellations
        socket.on("order_cancelled", (data: { orderId: string }) => {
            console.log(`[RealtimeOrders] Order ${data.orderId} cancelled`);
            callbacksRef.current.onOrderCancelled?.(data.orderId);
        });

        // Listen for driver assignments
        socket.on("driver_assigned", (data: { orderId: string; driverId: string }) => {
            console.log(`[RealtimeOrders] Driver ${data.driverId} assigned to order ${data.orderId}`);
            callbacksRef.current.onDriverAssigned?.(data.orderId, data.driverId);
        });

        // Listen for unassignable orders (no driver found)
        socket.on("order_unassignable", (data: { orderId: string; orderNumber: string }) => {
            console.log(`[RealtimeOrders] Order ${data.orderNumber} is unassignable`);
            callbacksRef.current.onOrderUnassignable?.(data.orderId, data.orderNumber);
        });

        socket.on("disconnect", (reason) => {
            console.log("[RealtimeOrders] Disconnected:", reason);
            setConnected(false);
            setDisconnectedSince(new Date());
        });

        socket.on("connect_error", (error) => {
            console.warn("[RealtimeOrders] Connection error:", error.message);
            setConnected(false);
            setDisconnectedSince((prev) => prev || new Date());
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            setConnected(false);
        };
    }, [enabled, role, merchantId, userId, socketToken]);

    // Force reconnect function
    const reconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current.connect();
        }
    }, []);

    return {
        isConnected: connected,
        disconnectedSince,
        reconnect,
    };
}

export default useRealtimeOrders;