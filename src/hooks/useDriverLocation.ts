"use client";

// Hook for driver location tracking with Socket.io integration
// Sends location updates to server when driver moves >10 meters

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { calculateDistance } from "@/lib/geo";

interface LocationState {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
    error: string | null;
    isTracking: boolean;
}

interface UseDriverLocationOptions {
    driverId: string;
    currentOrderId?: string | null;
    enabled?: boolean;
    updateThresholdMeters?: number;
    /** Socket auth token from useSocketAuth hook */
    socketToken?: string | null;
}

export function useDriverLocation({
    driverId,
    currentOrderId,
    enabled = true,
    // FIX 6: Reduced from 50m to 15m for Ushuaia's short streets
    updateThresholdMeters = 15,
    socketToken,
}: UseDriverLocationOptions) {
    const [location, setLocation] = useState<LocationState>({
        latitude: null,
        longitude: null,
        accuracy: null,
        heading: null,
        speed: null,
        error: null,
        isTracking: false,
    });

    const [connected, setConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const lastSentRef = useRef<{ lat: number; lng: number } | null>(null);

    // Send location update to server
    const sendLocationUpdate = useCallback(
        async (lat: number, lng: number, heading?: number, speed?: number) => {
            // Check if moved enough from last sent position
            if (lastSentRef.current) {
                const distance = calculateDistance(
                    lastSentRef.current.lat,
                    lastSentRef.current.lng,
                    lat,
                    lng,
                    "m"
                );
                if (distance < updateThresholdMeters) {
                    return; // Didn't move enough
                }
            }

            lastSentRef.current = { lat, lng };

            // Send to REST API for database persistence
            try {
                await fetch("/api/driver/location", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ latitude: lat, longitude: lng }),
                });
            } catch (err) {
                console.error("[Location] Failed to update API:", err);
            }

            // Send to Socket.io for real-time broadcasting
            if (socketRef.current?.connected) {
                socketRef.current.emit("actualizar_posicion", {
                    driverId,
                    lat,
                    lng,
                    heading,
                    speed,
                    orderId: currentOrderId,
                });
            }
        },
        [driverId, currentOrderId, updateThresholdMeters]
    );

    // Start geolocation tracking
    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setLocation((prev) => ({
                ...prev,
                error: "Geolocalización no soportada en este navegador",
            }));
            return;
        }

        // Check for secure context (HTTPS)
        if (!window.isSecureContext && window.location.hostname !== "localhost") {
            setLocation((prev) => ({
                ...prev,
                error: "GPS Bloqueado: Se requiere una conexión segura (HTTPS) para compartir la ubicación.",
            }));
            return;
        }

        setLocation((prev) => ({ ...prev, isTracking: true, error: null }));

        watchIdRef.current = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude, accuracy, heading, speed } = position.coords;

                setLocation({
                    latitude,
                    longitude,
                    accuracy,
                    heading,
                    speed,
                    error: null,
                    isTracking: true,
                });

                // Send update (will be throttled by distance check)
                sendLocationUpdate(
                    latitude,
                    longitude,
                    heading ?? undefined,
                    speed ?? undefined
                );
            },
            (error) => {
                let errorMessage = "Error de ubicación desconocido";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permiso de ubicación denegado";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        // FIX 5: Maintain last known position on signal loss
                        // Critical for Ushuaia's intermittent connectivity
                        setLocation((prev) => ({
                            ...prev,
                            error: prev.latitude
                                ? "Señal GPS débil — usando última ubicación"
                                : "Ubicación no disponible",
                            // Keep isTracking true and retain last coordinates
                        }));
                        return;
                    case error.TIMEOUT:
                        errorMessage = "Tiempo de espera agotado";
                        break;
                }
                setLocation((prev) => ({ ...prev, error: errorMessage, isTracking: false }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                // FIX 5: Allow 10s cache to reduce battery drain
                maximumAge: 10000,
            }
        );
    }, [sendLocationUpdate]);

    // Stop geolocation tracking
    const stopTracking = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        setLocation((prev) => ({ ...prev, isTracking: false }));
    }, []);

    // Connect to Socket.io
    useEffect(() => {
        if (!enabled || !driverId || !socketToken) return;

        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

        const socket = io(`${socketUrl}/logistica`, {
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            auth: { token: socketToken },
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[Driver] Connected to socket server (authenticated)");
            setConnected(true);
            socket.emit("driver_online", driverId);
        });

        socket.on("connect_error", (error) => {
            console.error("[Driver] Socket auth error:", error.message);
            setConnected(false);
        });

        socket.on("disconnect", () => {
            console.log("[Driver] Disconnected from socket server");
            setConnected(false);
        });

        // Listen for new order offers
        socket.on("orden_pendiente", (order) => {
            console.log("[Driver] New order offer:", order);
            // This can trigger a notification or update UI state
        });

        return () => {
            socket.disconnect();
        };
    }, [enabled, driverId, socketToken]);

    // Start/stop tracking when currentOrderId changes
    useEffect(() => {
        if (enabled && currentOrderId && socketRef.current?.connected) {
            socketRef.current.emit("start_delivery", {
                orderId: currentOrderId,
                driverId,
            });
        }
    }, [enabled, currentOrderId, driverId]);

    // Auto-start tracking when enabled
    useEffect(() => {
        if (enabled) {
            startTracking();
        } else {
            stopTracking();
        }

        return () => {
            stopTracking();
        };
    }, [enabled, startTracking, stopTracking]);

    return {
        ...location,
        connected,
        startTracking,
        stopTracking,
    };
}
