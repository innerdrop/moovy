import { describe, it, expect } from "vitest";
import { calculateDistance, estimateTravelTime, formatDistance } from "@/lib/geo";

describe("calculateDistance (Haversine)", () => {
    it("returns 0 for same coordinates", () => {
        const d = calculateDistance(-54.8019, -68.3030, -54.8019, -68.3030);
        expect(d).toBe(0);
    });

    it("calculates known distance between Ushuaia and Buenos Aires (~2370 km)", () => {
        const d = calculateDistance(-54.8019, -68.3030, -34.6037, -58.3816);
        expect(d).toBeGreaterThan(2300);
        expect(d).toBeLessThan(2500);
    });

    it("returns distance in meters when unit is 'm'", () => {
        const km = calculateDistance(-54.8019, -68.3030, -54.8100, -68.3100);
        const m = calculateDistance(-54.8019, -68.3030, -54.8100, -68.3100, "m");
        expect(Math.abs(m - km * 1000)).toBeLessThan(1); // Should match within 1 meter
    });

    it("is symmetric (A→B === B→A)", () => {
        const ab = calculateDistance(-54.8019, -68.3030, -34.6037, -58.3816);
        const ba = calculateDistance(-34.6037, -58.3816, -54.8019, -68.3030);
        expect(ab).toBeCloseTo(ba, 6);
    });

    it("handles equator crossing", () => {
        const d = calculateDistance(1, 0, -1, 0);
        expect(d).toBeGreaterThan(200);
        expect(d).toBeLessThan(250);
    });
});

describe("estimateTravelTime", () => {
    it("returns minimum 2 minutes for very short distance", () => {
        const time = estimateTravelTime(0.01);
        expect(time).toBe(2);
    });

    it("returns maximum 60 minutes for very long distance", () => {
        const time = estimateTravelTime(100);
        expect(time).toBe(60);
    });

    it("calculates reasonable time for 5km by MOTO", () => {
        const time = estimateTravelTime(5, "MOTO");
        expect(time).toBe(12); // 5km / 25km/h = 0.2h = 12 min
    });

    it("BICI is slower than MOTO for same distance", () => {
        const moto = estimateTravelTime(5, "MOTO");
        const bici = estimateTravelTime(5, "BICI");
        expect(bici).toBeGreaterThan(moto);
    });
});

describe("formatDistance", () => {
    it("formats sub-kilometer as meters", () => {
        expect(formatDistance(0.5)).toBe("500m");
        expect(formatDistance(0.123)).toBe("123m");
    });

    it("formats kilometers with one decimal", () => {
        expect(formatDistance(1.5)).toBe("1.5km");
        expect(formatDistance(10.0)).toBe("10.0km");
    });
});
