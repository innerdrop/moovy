"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

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
    enabled = true,
}: UseRealtimeOrdersOptions) {
    const socketRef = useRef<Socket | null>(null);
    const callbacksRef = useRef({
        onNewOrder,
        onStatusChange,
        onOrderCancelled,
        onDriverAssigned,
    });

    // Keep callbacks fresh
    useEffect(() => {
        callbacksRef.current = {
            onNewOrder,
            onStatusChange,
            onOrderCancelled,
            onDriverAssigned,
        };
    }, [onNewOrder, onStatusChange, onOrderCancelled, onDriverAssigned]);

    useEffect(() => {
        if (!enabled) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log(`[RealtimeOrders] Connected as ${role}`);

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

        socket.on("disconnect", () => {
            console.log("[RealtimeOrders] Disconnected");
        });

        socket.on("connect_error", (error) => {
            console.warn("[RealtimeOrders] Connection error:", error.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, [enabled, role, merchantId, userId]);

    // Force reconnect function
    const reconnect = useCallback(() => {
        if (socketRef.current) {
            socketRef.current.disconnect();
            socketRef.current.connect();
        }
    }, []);

    return {
        isConnected: socketRef.current?.connected ?? false,
        reconnect,
    };
}

export default useRealtimeOrders;
