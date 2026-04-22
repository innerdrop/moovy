"use client";

import { useState, useEffect } from "react";

interface GeolocationState {
    location: {
        latitude: number;
        longitude: number;
        accuracy: number | null;
    } | null;
    heading: number | null;
    speed: number | null;
    error: string | null;
    loading: boolean;
}

interface UseGeolocationOptions {
    // ISSUE-025: Modo ahorro de batería. Cuando el driver tiene < 15% de batería
    // sin cargar, pasamos a usar la red celular/wifi en vez del hardware GPS
    // (enableHighAccuracy: false) y permitimos lecturas cacheadas hasta 30s
    // (maximumAge: 30000). El GPS de alta precisión consume ~50mW sostenidos;
    // desactivarlo duplica la autonomía del driver en turno. La precisión baja
    // de ~5m a ~50m — aceptable para mostrar en el mini-mapa y para geofence
    // del PIN (que tiene tolerancia de 100m + gracia de 50m).
    lowPower?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
    const { lowPower = false } = options;
    const [state, setState] = useState<GeolocationState>({
        location: null,
        heading: null,
        speed: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState(s => ({ ...s, error: "Not supported", loading: false }));
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setState({
                    location: {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: pos.coords.accuracy ?? null,
                    },
                    heading: pos.coords.heading,
                    speed: pos.coords.speed,
                    error: null,
                    loading: false,
                });
            },
            (err) => {
                // FIX 5: On POSITION_UNAVAILABLE, keep last known position
                // instead of clearing it. Critical for Ushuaia's intermittent signal.
                if (err.code === err.POSITION_UNAVAILABLE) {
                    setState(s => ({
                        ...s,
                        error: s.location
                            ? "Señal GPS débil — usando última ubicación"
                            : err.message,
                        loading: false,
                        // Keep location if we had one
                    }));
                    return;
                }
                setState(s => ({ ...s, error: err.message, loading: false }));
            },
            {
                // ISSUE-025: en lowPower, deshabilitamos GPS hardware y extendemos
                // la caché a 30s. Esto reduce drásticamente el consumo de batería
                // a costa de precisión (de ~5m a ~50m típicamente).
                enableHighAccuracy: !lowPower,
                timeout: 15000,
                maximumAge: lowPower ? 30000 : 10000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
        // NOTA: re-ejecutamos el effect cuando cambia lowPower para aplicar
        // las nuevas opciones a watchPosition (no hay un setOptions en la API).
    }, [lowPower]);

    return state;
}
