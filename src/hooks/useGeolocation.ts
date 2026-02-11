"use client";

import { useState, useEffect } from "react";

interface GeolocationState {
    location: {
        latitude: number;
        longitude: number;
    } | null;
    heading: number | null;
    speed: number | null;
    error: string | null;
    loading: boolean;
}

export function useGeolocation() {
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
                enableHighAccuracy: true,
                timeout: 15000,
                // FIX 5: Allow 10s cache to reduce battery drain
                // (was 0 = forced hardware GPS on every update)
                maximumAge: 10000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return state;
}
