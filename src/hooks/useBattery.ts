"use client";

import { useState, useEffect } from "react";

interface BatteryState {
    level: number | null;      // 0-1 (e.g. 0.15 = 15%)
    charging: boolean | null;
    supported: boolean;
}

/**
 * Hook to monitor device battery level using Battery Status API.
 * Returns level (0-1), charging status, and whether the API is supported.
 */
export function useBattery(): BatteryState {
    const [state, setState] = useState<BatteryState>({
        level: null,
        charging: null,
        supported: false,
    });

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!navigator || !("getBattery" in navigator)) return;

            try {
                const battery = await (navigator as any).getBattery();
                if (!mounted) return;

                const update = () => {
                    if (!mounted) return;
                    setState({
                        level: battery.level,
                        charging: battery.charging,
                        supported: true,
                    });
                };

                update();
                battery.addEventListener("levelchange", update);
                battery.addEventListener("chargingchange", update);

                return () => {
                    battery.removeEventListener("levelchange", update);
                    battery.removeEventListener("chargingchange", update);
                };
            } catch {
                // API not available or permission denied
            }
        };

        const cleanup = init();
        return () => {
            mounted = false;
            cleanup?.then((fn) => fn?.());
        };
    }, []);

    return state;
}
