"use client";

import { useInView } from "@/hooks/useInView";

interface AnimateInProps {
    children: React.ReactNode;
    className?: string;
    /** Animation type. Default "reveal" */
    animation?: "reveal" | "reveal-scale" | "reveal-left" | "reveal-right";
    /** Extra delay in ms */
    delay?: number;
    /** Enable staggered children (adds "stagger" class to parent) */
    stagger?: boolean;
}

/**
 * Wrapper that animates children into view on scroll.
 * Uses IntersectionObserver for performance.
 */
export default function AnimateIn({
    children,
    className = "",
    animation = "reveal",
    delay = 0,
    stagger = false,
}: AnimateInProps) {
    const { ref, inView } = useInView<HTMLDivElement>();

    return (
        <div
            ref={ref}
            className={`${animation} ${inView ? "visible" : ""} ${stagger ? "stagger" : ""} ${className}`}
            style={delay > 0 ? { transitionDelay: `${delay}ms` } : undefined}
        >
            {children}
        </div>
    );
}
