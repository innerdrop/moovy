import { describe, it, expect } from "vitest";
import {
    claveDeCodigo,
    esCodigoRotoPorExcel,
    datosDeActualizacion,
    planificarImport,
    type FilaImport,
    type ProductoExistente,
} from "@/lib/import/plan";

function fila(over: Partial<FilaImport> = {}): FilaImport {
    return {
        name: "Coca Cola 2.5L",
        description: null,
        price: 8400,
        basePrice: 7500,
        markupPercent: 12,
        barcode: "7790895005794",
        stock: null,
        ...over,
    };
}

describe("claveDeCodigo", () => {
    it("ignora espacios y guiones", () => {
        expect(claveDeCodigo("779 0895-005794")).toBe("7790895005794");
    });

    it("empareja UPC-12 con su EAN-13 (el cero que Excel se come)", () => {
        expect(claveDeCodigo("0790895000129")).toBe(claveDeCodigo("790895000129"));
    });

    it("respeta los códigos internos con letras, en mayúsculas", () => {
        expect(claveDeCodigo("ab-12")).toBe("AB12");
        expect(claveDeCodigo("0A1")).toBe("0A1");
    });

    it("un código vacío no es una clave", () => {
        expect(claveDeCodigo("")).toBeNull();
        expect(claveDeCodigo("   ")).toBeNull();
        expect(claveDeCodigo(null)).toBeNull();
    });
});

describe("esCodigoRotoPorExcel", () => {
    it("detecta la notación científica", () => {
        expect(esCodigoRotoPorExcel("7.79089E+12")).toBe(true);
        expect(esCodigoRotoPorExcel("7,79089E12")).toBe(true);
    });

    it("no confunde un código legítimo", () => {
        expect(esCodigoRotoPorExcel("7790895005794")).toBe(false);
        expect(esCodigoRotoPorExcel("SALCHI PATY VIENA X6")).toBe(false);
    });
});

describe("datosDeActualizacion — un campo vacío nunca pisa un campo lleno", () => {
    it("NO toca el stock cuando el archivo no trae la columna", () => {
        const datos = datosDeActualizacion(fila({ stock: null }));
        expect(datos).not.toHaveProperty("stock");
    });

    it("escribe el stock cuando sí viene, incluso en cero", () => {
        expect(datosDeActualizacion(fila({ stock: 0 })).stock).toBe(0);
        expect(datosDeActualizacion(fila({ stock: 12 })).stock).toBe(12);
    });

    it("NO toca la descripción cuando viene vacía", () => {
        expect(datosDeActualizacion(fila({ description: null }))).not.toHaveProperty("description");
        expect(datosDeActualizacion(fila({ description: "   " }))).not.toHaveProperty("description");
    });

    it("siempre actualiza el precio y su metadata", () => {
        const datos = datosDeActualizacion(fila());
        expect(datos.price).toBe(8400);
        expect(datos.basePrice).toBe(7500);
        expect(datos.markupPercent).toBe(12);
    });
});

describe("planificarImport", () => {
    const P = (over: Partial<ProductoExistente>): ProductoExistente => ({
        id: "x", name: "Producto", barcode: null, price: 1000, stock: 5, ...over,
    });
    const existentes: ProductoExistente[] = [
        P({ id: "p1", name: "Coca Cola 2.5L", barcode: "7790895005794", price: 7000, stock: 9 }),
        P({ id: "p2", name: "Sprite 2.25L", barcode: "0790895000129" }),
        P({ id: "p3", name: "Queso cremoso x kg", barcode: "101" }),
    ];

    it("actualiza lo que empareja y crea lo que no", () => {
        const plan = planificarImport(
            [fila(), fila({ name: "Producto nuevo", barcode: "7790000000001" })],
            existentes,
        );
        expect(plan.aActualizar.map((a) => a.id)).toEqual(["p1"]);
        expect(plan.aCrear.map((a) => a.fila.name)).toEqual(["Producto nuevo"]);
        expect(plan.omitidas).toHaveLength(0);
    });

    it("empareja aunque Excel se haya comido el cero de la izquierda", () => {
        const plan = planificarImport([fila({ barcode: "790895000129" })], existentes);
        expect(plan.aActualizar.map((a) => a.id)).toEqual(["p2"]);
        expect(plan.aCrear).toHaveLength(0);
    });

    it("empareja los códigos internos del comercio", () => {
        const plan = planificarImport([fila({ barcode: "101" })], existentes);
        expect(plan.aActualizar.map((a) => a.id)).toEqual(["p3"]);
    });

    it("omite el código repetido en vez de crear un producto fantasma", () => {
        const plan = planificarImport(
            [fila({ name: "Primera" }), fila({ name: "Segunda" })],
            existentes,
        );
        expect(plan.aActualizar).toHaveLength(1);
        expect(plan.aCrear).toHaveLength(0);
        expect(plan.omitidas).toHaveLength(1);
        expect(plan.omitidas[0].motivo).toBe("codigo-repetido-en-el-archivo");
        expect(plan.omitidas[0].fila.name).toBe("Segunda");
    });

    it("omite el código que rompió Excel y explica por qué", () => {
        const plan = planificarImport([fila({ barcode: "7.79089E+12" })], existentes);
        expect(plan.aCrear).toHaveLength(0);
        expect(plan.aActualizar).toHaveLength(0);
        expect(plan.omitidas[0].motivo).toBe("codigo-roto-por-excel");
        expect(plan.omitidas[0].detalle).toContain("notación científica");
    });

    it("crea, sin agrupar, las filas sin código", () => {
        const plan = planificarImport(
            [fila({ name: "A", barcode: null }), fila({ name: "B", barcode: null })],
            existentes,
        );
        expect(plan.aCrear.map((a) => a.fila.name)).toEqual(["A", "B"]);
        expect(plan.omitidas).toHaveLength(0);
    });

    it("avisa cuando el producto que empareja está eliminado por moderación", () => {
        const plan = planificarImport([fila()], [
            P({ id: "p1", name: "Coca", barcode: "7790895005794", deletedAt: new Date("2026-01-01") }),
        ]);
        expect(plan.aActualizar[0].estaEliminado).toBe(true);
    });

    it("caso real Pixel Point: 1 emparejado con precio nuevo y stock intacto", () => {
        const plan = planificarImport(
            [fila({ price: 8400, basePrice: 7500, markupPercent: 12, stock: null })],
            existentes,
        );
        const [act] = plan.aActualizar;
        expect(act.datos.price).toBe(8400);
        expect(act.datos).not.toHaveProperty("stock");
        expect(act.datos).not.toHaveProperty("description");
    });
});

describe("planificarImport — sugerencia por nombre y elección manual", () => {
    const P = (over: Partial<ProductoExistente>): ProductoExistente => ({
        id: "x", name: "Producto", barcode: null, price: 1000, stock: 5, ...over,
    });

    it("sugiere el producto sin código que se llama igual, pero no lo empareja solo", () => {
        const existentes = [P({ id: "p9", name: "Pre pizza", barcode: null, price: 3360 })];
        const plan = planificarImport([fila({ name: "PRE  PIZZA", barcode: "7790000000009" })], existentes);
        expect(plan.aActualizar).toHaveLength(0);
        expect(plan.aCrear).toHaveLength(1);
        expect(plan.aCrear[0].sugerencia).toEqual({ id: "p9", name: "Pre pizza", price: 3360 });
    });

    it("no sugiere nada cuando el nombre está repetido en el catálogo", () => {
        const existentes = [
            P({ id: "a", name: "Galletitas Cofler Block", barcode: "111" }),
            P({ id: "b", name: "Galletitas Cofler Block", barcode: "222" }),
        ];
        const plan = planificarImport([fila({ name: "GALLETITAS COFLER BLOCK", barcode: "999" })], existentes);
        expect(plan.aCrear[0].sugerencia).toBeUndefined();
    });

    it("matchId manda sobre el código y queda marcado como elección manual", () => {
        const existentes = [
            P({ id: "p1", name: "Coca", barcode: "7790895005794", price: 7000 }),
            P({ id: "p2", name: "Otra cosa", barcode: "555" }),
        ];
        const plan = planificarImport([fila({ matchId: "p2" })], existentes);
        expect(plan.aActualizar[0].id).toBe("p2");
        expect(plan.aActualizar[0].via).toBe("eleccion-manual");
    });

    it("marca qué campos cambian de verdad", () => {
        const existentes = [P({ id: "p1", name: "Coca", barcode: "7790895005794", price: 8400, stock: 9 })];
        const igual = planificarImport([fila({ price: 8400, stock: null })], existentes);
        expect(igual.aActualizar[0].cambios).toEqual([]);
        const cambia = planificarImport([fila({ price: 9900, stock: 4 })], existentes);
        expect(cambia.aActualizar[0].cambios).toEqual(["precio", "stock"]);
        expect(cambia.aActualizar[0].antes).toEqual({ name: "Coca", price: 8400, stock: 9 });
    });

    it("lista los productos del comercio que no vinieron en el archivo", () => {
        const existentes = [
            P({ id: "p1", name: "Coca", barcode: "7790895005794" }),
            P({ id: "p2", name: "Fernet", barcode: "888" }),
            P({ id: "p3", name: "Borrado", barcode: "777", deletedAt: new Date("2026-01-01") }),
        ];
        const plan = planificarImport([fila()], existentes);
        expect(plan.ausentes.map((p) => p.id)).toEqual(["p2"]);
    });
});
