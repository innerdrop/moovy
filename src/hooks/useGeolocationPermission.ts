"use client";

import { useState, useCallback, useEffect } from "react";

interface GeolocationState {
    permission: "granted" | "denied" | "prompt" | "unknown";
    position: GeolocationPosition | null;
    error: string | null;
    loading: boolean;
}

interface UseGeolocationPermissionOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
}

/**
 * Hook to request and manage geolocation permissions
 * Works across all profiles (rider, merchant, customer)
 */
export function useGeolocationPermission(options: UseGeolocationPermissionOptions = {}) {
    const [state, setState] = useState<GeolocationState>({
        permission: "unknown",
        position: null,
        error: null,
        loading: false,
    });

    const {
        enableHighAccuracy = true,
        timeout = 10000,
        maximumAge = 0,
    } = options;

    // Check current permission status on mount
    useEffect(() => {
        if (typeof window === "undefined" || !navigator.permissions) return;

        navigator.permissions.query({ name: "geolocation" as PermissionName })
            .then((result) => {
                setState(prev => ({ ...prev, permission: result.state }));

                result.onchange = () => {
                    setState(prev => ({ ...prev, permission: result.state }));
                };
            })
            .catch(() => {
                // Permissions API not supported, will check on request
            });
    }, []);

    // Request current position
    const requestPosition = useCallback(async (): Promise<GeolocationPosition | null> => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            setState(prev => ({
                ...prev,
                error: "Geolocalización no soportada en este navegador",
            }));
            return null;
        }

        setState(prev => ({ ...prev, loading: true, error: null }));

        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setState({
                        permission: "granted",
                        position,
                        error: null,
                        loading: false,
                    });
                    resolve(position);
                },
                (error) => {
                    let errorMessage = "Error al obtener ubicación";
                    let permission: "denied" | "prompt" = "prompt";

                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Permiso de ubicación denegado. Por favor, habilítalo en la configuración del navegador.";
                            permission = "denied";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Ubicación no disponible. Asegúrate de tener el GPS activado.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Tiempo de espera agotado. Por favor, intenta de nuevo.";
                            break;
                    }

                    setState({
                        permission,
                        position: null,
                        error: errorMessage,
                        loading: false,
                    });
                    resolve(null);
                },
                {
                    enableHighAccuracy,
                    timeout,
                    maximumAge,
                }
            );
        });
    }, [enableHighAccuracy, timeout, maximumAge]);

    // Watch position continuously
    const watchPosition = useCallback((
        onUpdate: (position: GeolocationPosition) => void,
        onError?: (error: string) => void
    ): (() => void) => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            onError?.("Geolocalización no soportada");
            return () => { };
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setState(prev => ({
                    ...prev,
                    permission: "granted",
                    position,
                    error: null,
                }));
                onUpdate(position);
            },
            (error) => {
                let errorMessage = "Error al obtener ubicación";
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = "Permiso denegado";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = "Ubicación no disponible";
                        break;
                    case error.TIMEOUT:
                        errorMessage = "Tiempo agotado";
                        break;
                }
                setState(prev => ({ ...prev, error: errorMessage }));
                onError?.(errorMessage);
            },
            {
                enableHighAccuracy,
                timeout,
                maximumAge,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [enableHighAccuracy, timeout, maximumAge]);

    return {
        ...state,
        requestPosition,
        watchPosition,
        isSupported: typeof window !== "undefined" && !!navigator.geolocation,
    };
}
