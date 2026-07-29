// Motor de búsqueda de la tienda — feat/busqueda-inteligente (2026-07-28).
//
// POR QUÉ EXISTE: había DOS búsquedas escritas por separado (`/api/search`, que
// alimenta la página de resultados, y `/api/search/autocomplete`, que alimenta
// el desplegable del header y del hero). Misma pregunta, dos implementaciones:
// arreglar los acentos en una y no en la otra habría hecho que el desplegable y
// la página dieran resultados distintos para lo mismo. Regla #43: una pregunta
// se responde en UN solo lugar.
//
// QUÉ ARREGLA (los 4 problemas que tenía la búsqueda vieja):
//  1. ACENTOS — `cafe` no encontraba "Café La Nube"; `ferreteria` no encontraba
//     "Ferretería del Sur". Nadie escribe tildes en un buscador.
//  2. PALABRAS SUELTAS — buscaba la frase EXACTA en ese orden: `beagle cerveza`
//     no traía "Cerveza Beagle", `tornillo 3 pulgadas` no traía "Tornillo
//     autoperforante de 3\"".
//  3. RUBRO — `farmacia` solo traía comercios con esa palabra en el NOMBRE; una
//     farmacia llamada "Del Pueblo" no aparecía. Ahora el rubro del comercio y
//     las categorías del producto entran en lo que se busca.
//  4. ERRORES DE TIPEO — `cocacola` daba cero. Ahora, si la búsqueda estricta
//     trae poco, se completan resultados PARECIDOS, marcados aparte (nunca
//     mezclados como si fueran exactos).
//
// CONTEXTO DE NEGOCIO (regla #46): Moovy NO es delivery de comida — vende
// cualquier rubro con local (ferretería, ropa, mercería, construcción…). Por eso
// el rubro es de primera clase y un comercio CERRADO sigue siendo un resultado
// válido: la ferretería que tiene el tornillo exacto sirve aunque abra mañana.
// Lo abierto pesa DENTRO de la relevancia, nunca por encima de ella.
//
// EXTENSIONES DE POSTGRES: usa `unaccent` (acentos) y `pg_trgm` (parecidos). Si
// no están instaladas, la búsqueda NO se rompe: cae al comportamiento viejo y
// deja un aviso ruidoso en el log (nunca un fallo silencioso). Para activarlas:
//     npm run db:extensiones
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/** Palabras que no aportan al match y solo ensucian ("de", "la", "para"…). */
const VACIAS = new Set([
    "de", "del", "la", "el", "los", "las", "un", "una", "unos", "unas",
    "y", "o", "con", "sin", "para", "por", "en", "al", "a",
]);

/** Cuántos resultados estrictos hacen falta para NO ofrecer parecidos. */
const UMBRAL_PARECIDOS = 3;

/** Qué tan parecido tiene que ser para ofrecerlo (0 a 1). */
const SIMILITUD_MINIMA = 0.3;

export type TerminosBusqueda = {
    /** Consulta original, tal como la escribió la persona. */
    original: string;
    /** Palabras útiles, sin tildes, en minúscula. */
    palabras: string[];
};

/**
 * Parte la consulta en palabras buscables: saca tildes, pasa a minúscula,
 * descarta las palabras vacías y los fragmentos de una sola letra.
 *
 * "Cerveza Beagle IPA" → ["cerveza", "beagle", "ipa"]
 * "café de la esquina" → ["cafe", "esquina"]
 */
export function prepararTerminos(consulta: string): TerminosBusqueda {
    const original = consulta.trim();
    const palabras = original
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")  // saca las tildes (y la ñ pasa a n, igual que unaccent en Postgres)
        .toLowerCase()
        .split(/[^a-z0-9]+/i)              // separa por cualquier cosa que no sea letra o número
        .map((p) => p.trim())
        .filter((p) => p.length > 1 && !VACIAS.has(p));

    // Si todo lo que escribió eran palabras vacías o de una letra, se respeta
    // igual: mejor buscar "a" que no buscar nada.
    if (palabras.length === 0 && original.length > 0) {
        const solo = original
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase()
            .replace(/[^a-z0-9]/gi, "");
        if (solo) palabras.push(solo);
    }

    return { original, palabras };
}

// Se avisa UNA sola vez por proceso: si faltan las extensiones no hay que
// llenar el log con el mismo error en cada búsqueda.
let avisoExtensionesDado = false;

function avisarExtensionesFaltantes(error: unknown) {
    if (avisoExtensionesDado) return;
    avisoExtensionesDado = true;
    console.error(
        "[BUSQUEDA] Las extensiones unaccent/pg_trgm no están disponibles en esta base. " +
        "La búsqueda sigue funcionando SIN soporte de acentos ni tolerancia a errores de tipeo. " +
        "Para activarlas: npm run db:extensiones",
        error
    );
}

export type ProductoEncontrado = {
    id: string;
    name: string;
    slug: string;
    price: number;
    stock: number;
    imagen: string | null;
    merchantId: string | null;
    merchantName: string | null;
    merchantSlug: string | null;
    merchantImage: string | null;
    merchantIsOpen: boolean | null;
    merchantCategory: string | null;
    /** true = vino del pase "parecidos", no del match exacto. */
    aproximado?: boolean;
};

export type ComercioEncontrado = {
    id: string;
    name: string;
    slug: string;
    image: string | null;
    isOpen: boolean;
    rating: number | null;
    category: string | null;
    deliveryTimeMin: number;
    deliveryTimeMax: number;
    address: string | null;
    aproximado?: boolean;
};

/**
 * Texto contra el que se busca un PRODUCTO: su nombre, su descripción, el
 * nombre de sus categorías y el nombre y rubro de su comercio. Así "ferretería"
 * encuentra los productos de una ferretería aunque no digan "ferretería".
 */
const TEXTO_PRODUCTO = Prisma.sql`
    unaccent(lower(
        coalesce(p."name", '') || ' ' ||
        coalesce(p."description", '') || ' ' ||
        coalesce(m."name", '') || ' ' ||
        coalesce(m."category", '') || ' ' ||
        coalesce((
            SELECT string_agg(c."name", ' ')
            FROM "ProductCategory" pc
            JOIN "Category" c ON c."id" = pc."categoryId"
            WHERE pc."productId" = p."id"
        ), '')
    ))
`;

/** Texto contra el que se busca un COMERCIO: nombre, descripción y rubro. */
const TEXTO_COMERCIO = Prisma.sql`
    unaccent(lower(
        coalesce(m."name", '') || ' ' ||
        coalesce(m."description", '') || ' ' ||
        coalesce(m."category", '')
    ))
`;

/** Todas las palabras tienen que aparecer (en cualquier orden). */
function condicionTodasLasPalabras(texto: Prisma.Sql, palabras: string[]): Prisma.Sql {
    return Prisma.join(
        palabras.map((palabra) => Prisma.sql`${texto} LIKE ${"%" + palabra + "%"}`),
        " AND "
    );
}

export async function buscarProductos(
    consulta: string,
    limite = 20
): Promise<ProductoEncontrado[]> {
    const { palabras, original } = prepararTerminos(consulta);
    if (palabras.length === 0) return [];

    try {
        // Orden: primero los que matchean en el NOMBRE (más relevante que la
        // descripción), después los de comercios abiertos. Lo abierto NO manda
        // por encima de la relevancia — regla #46: una ferretería cerrada que
        // tiene el tornillo exacto sigue siendo un buen resultado.
        const filas = await prisma.$queryRaw<ProductoEncontrado[]>`
            SELECT
                p."id", p."name", p."slug", p."price", p."stock",
                (SELECT pi."url" FROM "ProductImage" pi WHERE pi."productId" = p."id" LIMIT 1) AS "imagen",
                p."merchantId",
                m."name" AS "merchantName",
                m."slug" AS "merchantSlug",
                m."image" AS "merchantImage",
                m."isOpen" AS "merchantIsOpen",
                m."category" AS "merchantCategory"
            FROM "Product" p
            LEFT JOIN "Merchant" m ON m."id" = p."merchantId"
            WHERE p."isActive" = true
              AND (${condicionTodasLasPalabras(TEXTO_PRODUCTO, palabras)})
            ORDER BY
                (unaccent(lower(p."name")) LIKE ${"%" + palabras[0] + "%"}) DESC,
                m."isOpen" DESC NULLS LAST,
                p."name" ASC
            LIMIT ${limite}
        `;
        return filas;
    } catch (error) {
        avisarExtensionesFaltantes(error);
        return buscarProductosSinExtensiones(original, limite);
    }
}

export async function buscarComercios(
    consulta: string,
    limite = 10
): Promise<ComercioEncontrado[]> {
    const { palabras, original } = prepararTerminos(consulta);
    if (palabras.length === 0) return [];

    try {
        const filas = await prisma.$queryRaw<ComercioEncontrado[]>`
            SELECT
                m."id", m."name", m."slug", m."image", m."isOpen", m."rating",
                m."category", m."deliveryTimeMin", m."deliveryTimeMax", m."address"
            FROM "Merchant" m
            WHERE m."isActive" = true
              AND m."approvalStatus" = 'APPROVED'
              AND (${condicionTodasLasPalabras(TEXTO_COMERCIO, palabras)})
            ORDER BY
                (unaccent(lower(m."name")) LIKE ${"%" + palabras[0] + "%"}) DESC,
                m."isOpen" DESC,
                m."name" ASC
            LIMIT ${limite}
        `;
        return filas;
    } catch (error) {
        avisarExtensionesFaltantes(error);
        return buscarComerciosSinExtensiones(original, limite);
    }
}

// ─── Red de seguridad: sin extensiones, se busca como antes ────────────────
// No es tan bueno (sin acentos, frase completa), pero la app NO se rompe.

async function buscarProductosSinExtensiones(
    consulta: string,
    limite: number
): Promise<ProductoEncontrado[]> {
    const productos = await prisma.product.findMany({
        where: {
            isActive: true,
            OR: [
                { name: { contains: consulta, mode: "insensitive" } },
                { description: { contains: consulta, mode: "insensitive" } },
            ],
        },
        select: {
            id: true, name: true, slug: true, price: true, stock: true, merchantId: true,
            images: { take: 1, select: { url: true } },
            merchant: { select: { name: true, slug: true, image: true, isOpen: true, category: true } },
        },
        orderBy: { name: "asc" },
        take: limite,
    });

    return productos.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: p.price,
        stock: p.stock,
        imagen: p.images[0]?.url ?? null,
        merchantId: p.merchantId,
        merchantName: p.merchant?.name ?? null,
        merchantSlug: p.merchant?.slug ?? null,
        merchantImage: p.merchant?.image ?? null,
        merchantIsOpen: p.merchant?.isOpen ?? null,
        merchantCategory: p.merchant?.category ?? null,
    }));
}

async function buscarComerciosSinExtensiones(
    consulta: string,
    limite: number
): Promise<ComercioEncontrado[]> {
    const comercios = await prisma.merchant.findMany({
        where: {
            isActive: true,
            approvalStatus: "APPROVED",
            OR: [
                { name: { contains: consulta, mode: "insensitive" } },
                { description: { contains: consulta, mode: "insensitive" } },
            ],
        },
        select: {
            id: true, name: true, slug: true, image: true, isOpen: true, rating: true,
            category: true, deliveryTimeMin: true, deliveryTimeMax: true, address: true,
        },
        orderBy: [{ isOpen: "desc" }, { name: "asc" }],
        take: limite,
    });
    return comercios;
}

// ─── Parecidos: tolerancia a errores de tipeo ─────────────────────────────
//
// `cocacola`, `coca-cola`, `destornilador` (con una L de menos). La búsqueda
// estricta da cero. Postgres puede medir cuánto se PARECEN dos textos
// (pg_trgm): si la búsqueda exacta trajo poco, se completan resultados
// parecidos — SEPARADOS y marcados, nunca mezclados como si fueran exactos
// (mostrar un destornillador cuando alguien pidió otra cosa, sin avisar, es
// peor que no mostrar nada).

/**
 * Productos que se PARECEN a la consulta. Se usa solo cuando la búsqueda
 * estricta trajo menos de UMBRAL_PARECIDOS resultados.
 * `yaEncontrados` son los ids que ya salieron, para no repetirlos.
 */
export async function buscarProductosParecidos(
    consulta: string,
    yaEncontrados: string[],
    limite = 6
): Promise<ProductoEncontrado[]> {
    const { palabras } = prepararTerminos(consulta);
    if (palabras.length === 0) return [];
    const frase = palabras.join(" ");

    try {
        const excluidos = yaEncontrados.length > 0 ? yaEncontrados : ["__ninguno__"];
        const filas = await prisma.$queryRaw<ProductoEncontrado[]>`
            SELECT
                p."id", p."name", p."slug", p."price", p."stock",
                (SELECT pi."url" FROM "ProductImage" pi WHERE pi."productId" = p."id" LIMIT 1) AS "imagen",
                p."merchantId",
                m."name" AS "merchantName",
                m."slug" AS "merchantSlug",
                m."image" AS "merchantImage",
                m."isOpen" AS "merchantIsOpen",
                m."category" AS "merchantCategory",
                true AS "aproximado"
            FROM "Product" p
            LEFT JOIN "Merchant" m ON m."id" = p."merchantId"
            WHERE p."isActive" = true
              AND p."id" <> ALL(${excluidos})
              AND similarity(unaccent(lower(p."name")), ${frase}) > ${SIMILITUD_MINIMA}
            ORDER BY similarity(unaccent(lower(p."name")), ${frase}) DESC
            LIMIT ${limite}
        `;
        return filas;
    } catch (error) {
        // Sin pg_trgm no hay parecidos: se devuelve vacío (la búsqueda estricta
        // ya respondió lo suyo). El aviso lo da la función principal.
        avisarExtensionesFaltantes(error);
        return [];
    }
}

/** Comercios que se PARECEN a la consulta. Mismo criterio que los productos. */
export async function buscarComerciosParecidos(
    consulta: string,
    yaEncontrados: string[],
    limite = 4
): Promise<ComercioEncontrado[]> {
    const { palabras } = prepararTerminos(consulta);
    if (palabras.length === 0) return [];
    const frase = palabras.join(" ");

    try {
        const excluidos = yaEncontrados.length > 0 ? yaEncontrados : ["__ninguno__"];
        const filas = await prisma.$queryRaw<ComercioEncontrado[]>`
            SELECT
                m."id", m."name", m."slug", m."image", m."isOpen", m."rating",
                m."category", m."deliveryTimeMin", m."deliveryTimeMax", m."address",
                true AS "aproximado"
            FROM "Merchant" m
            WHERE m."isActive" = true
              AND m."approvalStatus" = 'APPROVED'
              AND m."id" <> ALL(${excluidos})
              AND similarity(unaccent(lower(m."name")), ${frase}) > ${SIMILITUD_MINIMA}
            ORDER BY similarity(unaccent(lower(m."name")), ${frase}) DESC
            LIMIT ${limite}
        `;
        return filas;
    } catch (error) {
        avisarExtensionesFaltantes(error);
        return [];
    }
}

/**
 * Búsqueda COMPLETA: lo exacto y, si trajo poco, lo parecido.
 * Es la que deben usar las APIs — así el desplegable y la página de resultados
 * responden siempre lo mismo.
 */
export async function buscarTodo(
    consulta: string,
    opciones: { limiteProductos?: number; limiteComercios?: number } = {}
): Promise<{
    productos: ProductoEncontrado[];
    comercios: ComercioEncontrado[];
    hayAproximados: boolean;
}> {
    const limiteProductos = opciones.limiteProductos ?? 20;
    const limiteComercios = opciones.limiteComercios ?? 10;

    const [productos, comercios] = await Promise.all([
        buscarProductos(consulta, limiteProductos),
        buscarComercios(consulta, limiteComercios),
    ]);

    // Solo se buscan parecidos si lo exacto no alcanzó: es una consulta extra
    // a la base y no tiene sentido pagarla cuando ya hay buenos resultados.
    if (productos.length + comercios.length >= UMBRAL_PARECIDOS) {
        return { productos, comercios, hayAproximados: false };
    }

    const [productosParecidos, comerciosParecidos] = await Promise.all([
        buscarProductosParecidos(consulta, productos.map((p) => p.id)),
        buscarComerciosParecidos(consulta, comercios.map((c) => c.id)),
    ]);

    return {
        productos: [...productos, ...productosParecidos],
        comercios: [...comercios, ...comerciosParecidos],
        hayAproximados: productosParecidos.length + comerciosParecidos.length > 0,
    };
}

export { UMBRAL_PARECIDOS, SIMILITUD_MINIMA };
