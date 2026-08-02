import { describe, it, expect } from "vitest";
import { parsePrecio } from "@/lib/import/precio";

describe("parsePrecio", () => {
    it("lee enteros pelados", () => {
        expect(parsePrecio("3978")).toBe(3978);
        expect(parsePrecio("8400")).toBe(8400);
    });

    it("lee el formato argentino con coma decimal", () => {
        expect(parsePrecio("3978,50")).toBe(3978.5);
        expect(parsePrecio("0,20")).toBe(0.2);
        expect(parsePrecio("3.978,50")).toBe(3978.5);
        expect(parsePrecio("1.234.567,89")).toBe(1234567.89);
    });

    it("lee el formato con punto decimal", () => {
        expect(parsePrecio("3978.5")).toBe(3978.5);
        expect(parsePrecio("2.5")).toBe(2.5);
        expect(parsePrecio("1,234,567.89")).toBe(1234567.89);
    });

    // El bug que motivó el módulo: un precio de kiosco escrito con separador de
    // miles y sin decimales entraba a la milésima parte de su valor.
    it("un separador seguido de TRES dígitos es de miles, no decimal", () => {
        expect(parsePrecio("8.400")).toBe(8400);
        expect(parsePrecio("1.500")).toBe(1500);
        expect(parsePrecio("12.500")).toBe(12500);
        expect(parsePrecio("1.234.567")).toBe(1234567);
        expect(parsePrecio("1,500")).toBe(1500);
    });

    it("un separador seguido de una o dos cifras es decimal", () => {
        expect(parsePrecio("8.4")).toBe(8.4);
        expect(parsePrecio("8.40")).toBe(8.4);
        expect(parsePrecio("8,4")).toBe(8.4);
    });

    it("ignora símbolos y espacios alrededor", () => {
        expect(parsePrecio("$ 8.400")).toBe(8400);
        expect(parsePrecio("  $3978,50 ")).toBe(3978.5);
        expect(parsePrecio("AR$ 1.500")).toBe(1500);
    });

    it("devuelve null cuando no hay número", () => {
        expect(parsePrecio("")).toBeNull();
        expect(parsePrecio(null)).toBeNull();
        expect(parsePrecio("   ")).toBeNull();
        expect(parsePrecio("sin precio")).toBeNull();
    });

    it("caso real Pixel Point: los enteros del archivo de Fernando", () => {
        expect(parsePrecio("7500")).toBe(7500);
        expect(parsePrecio("2200")).toBe(2200);
        expect(parsePrecio("22.4")).toBe(22.4);
    });
});
