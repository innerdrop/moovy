import { describe, it, expect } from "vitest";
import { checkRateLimit, resetRateLimit } from "@/lib/security";

describe("checkRateLimit", () => {
    // Each test uses a unique key to avoid interference
    const baseKey = `test-${Date.now()}`;
    let keyCounter = 0;
    const getKey = () => `${baseKey}-${keyCounter++}`;

    it("allows first request", async () => {
        const key = getKey();
        const result = await checkRateLimit(key, 5, 60000);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(4);
    });

    it("tracks remaining attempts", async () => {
        const key = getKey();
        await checkRateLimit(key, 3, 60000); // 1st → remaining 2
        const result = await checkRateLimit(key, 3, 60000); // 2nd → remaining 1
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(1);
    });

    it("blocks after max attempts", async () => {
        const key = getKey();
        await checkRateLimit(key, 2, 60000); // 1st
        await checkRateLimit(key, 2, 60000); // 2nd (hits max)
        const result = await checkRateLimit(key, 2, 60000); // 3rd attempt
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.resetIn).toBeGreaterThan(0);
    });

    it("resets after resetRateLimit is called", async () => {
        const key = getKey();
        await checkRateLimit(key, 1, 60000); // 1st
        await checkRateLimit(key, 1, 60000); // blocked
        await resetRateLimit(key);
        const result = await checkRateLimit(key, 1, 60000);
        expect(result.allowed).toBe(true);
    });

    it("allows request after window expires", async () => {
        const key = getKey();
        // Use a very short window (1ms)
        await checkRateLimit(key, 1, 1);
        // Wait for it to expire
        await new Promise<void>((resolve) => {
            setTimeout(async () => {
                const result = await checkRateLimit(key, 1, 1);
                expect(result.allowed).toBe(true);
                resolve();
            }, 10);
        });
    });

    it("provides correct resetIn value", async () => {
        const key = getKey();
        const windowMs = 15 * 60 * 1000;
        const result = await checkRateLimit(key, 5, windowMs);
        expect(result.resetIn).toBeLessThanOrEqual(windowMs);
        expect(result.resetIn).toBeGreaterThan(windowMs - 100); // Allow 100ms tolerance
    });
});
