"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
    /** Trigger threshold (0-1). Default 0.15 */
    threshold?: number;
    /** Root margin. Default "0px 0px -40px 0px" (triggers slightly before element is fully visible) */
    rootMargin?: string;
    /** Only trigger once. Default true */
    once?: boolean;
}

/**
 * Hook that detects when an element enters the viewport.
 * Returns a ref to attach and a boolean `inView`.
 *
 * Usage:
 *   const { ref, inView } = useInView();
 *   <div ref={ref} className={`reveal ${inView ? "visible" : ""}`}>
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
    options: UseInViewOptions = {}
) {
    const { threshold = 0.15, rootMargin = "0px 0px -40px 0px", once = true } = options;
    const ref = useRef<T>(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // Fallback for browsers without IntersectionObserver
        if (typeof IntersectionObserver === "undefined") {
            setInView(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    if (once) observer.unobserve(el);
                } else if (!once) {
                    setInView(false);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(el);
        return () => observer.unobserve(el);
    }, [threshold, rootMargin, once]);

    return { ref, inView };
}
