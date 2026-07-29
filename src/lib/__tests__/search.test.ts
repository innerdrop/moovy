// Tests del motor de búsqueda — feat/busqueda-inteligente (2026-07-28).
//
// Se testea `prepararTerminos`, que es la parte PURA (sin base de datos): es
// donde viven las decisiones que rompían la búsqueda vieja — acentos, palabras
// sueltas y ruido. Lo que toca Postgres (unaccent/similarity) se prueba a mano
// contra la base, porque testearlo acá exigiría levantar una.
import { describe, it, expect } from "vitest";
import { prepararTerminos } from "@/lib/search";

describe("prepararTerminos", () => {
    it("saca los acentos: nadie los escribe en un buscador", () => {
        expect(prepararTerminos("Café").palabras).toEqual(["cafe"]);
        expect(prepararTerminos("Ferretería").palabras).toEqual(["ferreteria"]);
        expect(prepararTerminos("Almacén").palabras).toEqual(["almacen"]);
    });

    it("normaliza la ñ a n, igual que unaccent() en Postgres", () => {
        // A PROPÓSITO: si el lado JS y el lado SQL normalizaran distinto, las
        // palabras con ñ no se encontrarían nunca. Consistencia > ortografía.
        expect(prepararTerminos("Ñandú").palabras).toEqual(["nandu"]);
        expect(prepararTerminos("muñeca").palabras).toEqual(["muneca"]);
        expect(prepararTerminos("cuñas").palabras).toEqual(["cunas"]);
    });

    it("parte en palabras para que el orden no importe", () => {
        expect(prepararTerminos("beagle cerveza").palabras).toEqual(["beagle", "cerveza"]);
        expect(prepararTerminos("Cerveza Beagle").palabras).toEqual(["cerveza", "beagle"]);
    });

    it("descarta palabras vacías que solo ensucian", () => {
        expect(prepararTerminos("café de la esquina").palabras).toEqual(["cafe", "esquina"]);
        expect(prepararTerminos("tornillos para madera").palabras).toEqual(["tornillos", "madera"]);
    });

    it("separa por guiones y signos: 'coca-cola' son dos palabras", () => {
        expect(prepararTerminos("coca-cola").palabras).toEqual(["coca", "cola"]);
        expect(prepararTerminos('tornillo 3" hexagonal').palabras).toEqual(["tornillo", "hexagonal"]);
    });

    it("mantiene los números útiles del rubro ferretería", () => {
        expect(prepararTerminos("cable 2x25").palabras).toEqual(["cable", "2x25"]);
    });

    it("no devuelve nada con una consulta vacía", () => {
        expect(prepararTerminos("").palabras).toEqual([]);
        expect(prepararTerminos("   ").palabras).toEqual([]);
    });

    it("si TODO eran palabras vacías, igual busca algo (mejor que nada)", () => {
        expect(prepararTerminos("de la").palabras.length).toBeGreaterThan(0);
    });

    it("conserva la consulta original para mostrarla en pantalla", () => {
        expect(prepararTerminos("  Café  ").original).toBe("Café");
    });
});
