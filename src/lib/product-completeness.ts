// Requisitos para PUBLICAR un producto (foto + descripción ≥10 + precio + tamaño).
//
// Existe porque la misma regla estaba copiada a mano en cuatro lugares
// (toggleProductActive, updateProduct, bulkSetProductsActive y el listado del
// panel) y ya había empezado a divergir: el chequeo del tamaño llegó a unas
// copias sí y a otras no, así que "Mostrar" aceptaba productos que después el
// motor de asignación no podía despachar.
//
// PURO A PROPÓSITO: lo importa ProductsSearchContainer, que es "use client".
// Nada de prisma ni de nada server-side puede entrar en este archivo.

export type ProductoParaEvaluar = {
    description: string | null;
    price: number;
    weightGrams: number | null;
    _count?: { images: number } | null;
    images?: unknown[] | null;   // algunos callers traen el array, otros el _count
};

/** Las fotos vienen como _count (server) o como array ya cargado (cliente). */
function cantidadDeImagenes(p: ProductoParaEvaluar): number {
    return p._count?.images ?? p.images?.length ?? 0;
}

/**
 * Qué le falta al producto para poder publicarse, en el orden en que conviene
 * resolverlo. Los textos son los que el comercio ya viene leyendo en el error
 * de "Mostrar": si se tocan acá, cambian en toda la app a la vez.
 */
export function faltantesDeProducto(p: ProductoParaEvaluar): string[] {
    const faltan: string[] = [];
    if (cantidadDeImagenes(p) === 0) faltan.push("una foto");
    if (!p.description || p.description.trim().length < 10) {
        faltan.push("una descripción (mín. 10 caracteres)");
    }
    if (!p.price || p.price <= 0) faltan.push("un precio");
    if (!p.weightGrams || p.weightGrams <= 0) faltan.push("el tamaño");
    return faltan;
}

export function estaCompleto(p: ProductoParaEvaluar): boolean {
    return faltantesDeProducto(p).length === 0;
}

/**
 * Enumeración en castellano para mostrarle la lista al comercio ("una foto y el
 * tamaño", no "una foto, el tamaño"). Vive acá y no en cada pantalla porque la
 * guía del dashboard y la barra de progreso tienen que decir lo mismo.
 */
export function enumerarFaltantes(faltan: string[]): string {
    if (faltan.length === 0) return "";
    const ultimo = faltan[faltan.length - 1] ?? "";
    const previos = faltan.slice(0, -1).join(", ");
    return previos ? `${previos} y ${ultimo}` : ultimo;
}
