"use client";

import { useState, useEffect } from "react";

type ColorScheme = "light" | "dark";

/**
 * Hook that detects system color scheme preference (prefers-color-scheme).
 * Returns "dark" or "light" — updates in real-time when user toggles OS theme.
 */
export function useColorScheme(): ColorScheme {
    const [scheme, setScheme] = useState<ColorScheme>("light");

    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        setScheme(mq.matches ? "dark" : "light");

        const handler = (e: MediaQueryListEvent) => {
            setScheme(e.matches ? "dark" : "light");
        };

        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);

    return scheme;
}
