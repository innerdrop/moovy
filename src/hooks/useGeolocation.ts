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
                setState(s => ({ ...s, error: err.message, loading: false }));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    return state;
}
