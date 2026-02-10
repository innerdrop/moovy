import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/security";

describe("checkRateLimit", () => {
    // Each test uses a unique key to avoid interference
    const baseKey = `test-${Date.now()}`;
    let keyCounter = 0;
    const getKey = () => `${baseKey}-${keyCounter++}`;

    it("allows first request", () => {
        const key = getKey();
        const result = checkRateLimit(key, 5, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });

    it("tracks remaining attempts", () => {
        const key = getKey();
        checkRateLimit(key, 3, 60000); // 1st → remaining 2
        const result = checkRateLimit(key, 3, 60000); // 2nd → remaining 1
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(1);
    });

    it("blocks after max attempts", () => {
        const key = getKey();
        checkRateLimit(key, 2, 60000); // 1st
        checkRateLimit(key, 2, 60000); // 2nd (hits max)
        const result = checkRateLimit(key, 2, 60000); // 3rd attempt
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.resetIn).toBeGreaterThan(0);
    });

    it("resets after resetRateLimit is called", () => {
        const key = getKey();
        checkRateLimit(key, 1, 60000); // 1st
        checkRateLimit(key, 1, 60000); // blocked
        resetRateLimit(key);
        const result = checkRateLimit(key, 1, 60000);
        expect(result.allowed).toBe(true);
    });

    it("allows request after window expires", () => {
        const key = getKey();
        // Use a very short window (1ms)
        checkRateLimit(key, 1, 1);
        // Wait for it to expire
        return new Promise<void>((resolve) => {
            setTimeout(() => {
                const result = checkRateLimit(key, 1, 1);
                expect(result.allowed).toBe(true);
                resolve();
            }, 10);
        });
    });

    it("provides correct resetIn value", () => {
        const key = getKey();
        const windowMs = 15 * 60 * 1000;
        const result = checkRateLimit(key, 5, windowMs);
        expect(result.resetIn).toBeLessThanOrEqual(windowMs);
        expect(result.resetIn).toBeGreaterThan(windowMs - 100); // Allow 100ms tolerance
    });
});
