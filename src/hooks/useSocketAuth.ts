"use client";

// Hook to manage Socket.IO authentication token
// Fetches a short-lived signed token from /api/auth/socket-token
// All socket connections should use this to authenticate

import { useState, useEffect, useCallback, useRef } from "react";

interface UseSocketAuthReturn {
    token: string | null;
    isLoading: boolean;
    error: string | null;
    refreshToken: () => Promise<string | null>;
}

export function useSocketAuth(enabled: boolean = true): UseSocketAuthReturn {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fetchedRef = useRef(false);

    const fetchToken = useCallback(async (): Promise<string | null> => {
        try {
            setIsLoading(true);
            setError(null);

            const res = await fetch("/api/auth/socket-token");

            if (!res.ok) {
                // User is not authenticated — this is expected for public pages
                if (res.status === 401) {
                    setError("not-authenticated");
                    return null;
                }
                throw new Error(`Token fetch failed: ${res.status}`);
            }

            const data = await res.json();
            setToken(data.token);
            return data.token;
        } catch (err: any) {
            console.error("[SocketAuth] Error fetching token:", err.message);
            setError(err.message);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Fetch token on mount
    useEffect(() => {
        if (enabled && !fetchedRef.current) {
            fetchedRef.current = true;
            fetchToken();
        }
    }, [enabled, fetchToken]);

    // Refresh token every 50 minutes (tokens expire in 60 min)
    useEffect(() => {
        if (!enabled || !token) return;

        const interval = setInterval(() => {
            fetchToken();
        }, 50 * 60 * 1000);

        return () => clearInterval(interval);
    }, [enabled, token, fetchToken]);

    return {
        token,
        isLoading,
        error,
        refreshToken: fetchToken,
    };
}
